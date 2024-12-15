import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { launch } from 'puppeteer';
import { Server } from 'socket.io';
import { PrismaService } from 'src/prisma/prisma.service';
import { delay, formatTime } from './utils';

@WebSocketGateway({
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: true,
  },
})
@Injectable()
export class ScraperService {
  @WebSocketServer()
  private server: Server;

  constructor(private prisma: PrismaService) {}

  async scrapeCollectionByUrl(userId: string, playlistUrl: string) {
    let newCollection;
    try {
      newCollection = await this.prisma.collection.create({
        data: {
          name: 'Untitled Collection',
          playlistUrl: playlistUrl,
          userId: userId,
        },
      });
      console.log('New collection created with ID:', newCollection.id);

      const scrapeResult = await this.scrapeWithCaptchaHandling(playlistUrl);

      if (scrapeResult.success) {
        const collectionTitle = scrapeResult.title;

        await this.prisma.collection.update({
          where: { id: newCollection.id },
          data: {
            name: collectionTitle,
          },
        });

        for (const video of scrapeResult.data) {
          await this.prisma.video.create({
            data: {
              videoUrl: video.url,
              thumbnailUrl: video.thumbnail,
              collection: {
                connect: { id: newCollection.id },
              },
              hashtags: {
                create: video.hashtags.map((hashtag) => ({
                  hashtag: {
                    connectOrCreate: {
                      where: { hashtag: hashtag },
                      create: { hashtag: hashtag },
                    },
                  },
                })),
              },
            },
          });
        }
        return {
          success: true,
          collectionId: newCollection.id,
        };
      }

      throw new BadRequestException('Failed to scrape collection');
    } catch (error) {
      console.error('Error during scraping process:', error);
      // Rm collection
      await this.prisma.collection.delete({
        where: { id: newCollection.id },
      });
      throw new BadRequestException(
        'Failed to scrape collection: ' + error.message,
      );
    }
  }

  private transformVideosWithHashtags(videos: any[]) {
    return videos.map((video) => {
      const hashtags = video.hashtags.map((h) => h.hashtag.hashtag);
      return {
        ...video,
        hashtags,
      };
    });
  }

  async getCollections(userId: string) {
    return this.prisma.collection.findMany({
      where: { userId: userId },
    });
  }

  async getCollectionById(userId: string, id: string) {
    return this.prisma.collection.findUnique({
      where: { id: id, userId: userId },
    });
  }

  async getVideosByCollectionId(
    userId: string,
    id: string,
    hashtags: string[] | undefined,
  ) {
    const collection = await this.prisma.collection.findUnique({
      where: { id: id, userId: userId },
      include: {
        videos: {
          include: {
            hashtags: {
              select: {
                hashtag: true,
              },
            },
          },
        },
      },
    });

    if (!collection) {
      throw new NotFoundException('Collection not found');
    }

    const videos = collection.videos;

    const videosWithHashtags = this.transformVideosWithHashtags(
      collection.videos,
    );

    if (hashtags?.some((hashtag) => hashtag !== undefined)) {
      const filteredVideos = videosWithHashtags.filter((video) => {
        return hashtags.some((hashtag) => video.hashtags.includes(hashtag));
      });

      return {
        total: filteredVideos.length,
        videos: filteredVideos,
      };
    }

    return {
      total: videosWithHashtags.length,
      videos: videosWithHashtags,
    };
  }

  async getHashtagsByCollectionId(userId: string, id: string) {
    const collection = await this.prisma.collection.findUnique({
      where: { id: id, userId: userId },
      include: {
        videos: {
          select: {
            hashtags: {
              select: {
                hashtag: true,
              },
            },
          },
        },
      },
    });

    if (!collection) {
      throw new NotFoundException('Collection not found');
    }

    if (collection?.videos) {
      const allHashtags = new Set<string>();

      collection.videos.forEach((video) => {
        video.hashtags.forEach((hashtag) => {
          allHashtags.add(hashtag.hashtag.hashtag);
        });
      });

      return Array.from(allHashtags);
    }

    return [];
  }

  private async scrapeWithCaptchaHandling(playlistUrl: string) {
    try {
      const browser = await launch({
        headless: true,
      });

      const page = await browser.newPage();
      await page.setViewport({ width: 1200, height: 6000 });

      const allTikTokVideos = [];
      const allHashtags = new Set();
      let paginationCursor = null;
      let paginationActive = true;

      await page.setRequestInterception(true);
      page.on('request', (request) => request.continue());

      page.on('response', async (response) => {
        const url = response.url();
        if (url.includes('https://www.tiktok.com/api/collection/item_list')) {
          try {
            const json = await response.json();

            json?.itemList?.forEach((item) => {
              if (item?.video) {
                const videoId = item?.id;
                const userName = item?.author?.uniqueId;
                const videoUrl = `https://www.tiktok.com/@${userName}/video/${videoId}`;

                const description = item?.desc || '';
                let hashtags = description.match(/#\w+/g);

                if (hashtags) {
                  hashtags = [
                    ...new Set(
                      hashtags.map((hashtag) => hashtag.toLowerCase()),
                    ),
                  ];
                } else {
                  hashtags = [];
                }

                hashtags.forEach((hashtag) => allHashtags.add(hashtag));

                const thumbnailUrl = item?.video?.cover;

                const videoObject = {
                  url: videoUrl,
                  hashtags: hashtags,
                  thumbnail: thumbnailUrl || null,
                };

                allTikTokVideos.push(videoObject);
              }
            });

            paginationCursor = json?.cursor;
            if (!paginationCursor || json?.hasMore === false) {
              paginationActive = false;
            }
          } catch (error) {
            console.error('Error parsing JSON:', error);
            throw error;
          }
        }
      });

      await page.goto(playlistUrl, {
        waitUntil: 'networkidle2',
      });

      const collectionTitle = await page.$eval(
        'div[class*="css-10ibnu7-DivShareTitleContainer"] h1',
        (element) => element.textContent?.trim() || '',
      );

      let totalVideos = 0;

      try {
        totalVideos = await page.$eval('h2', (element) => {
          const text = element.innerText;
          const match = text.match(/(\d+) videos/);
          return match ? parseInt(match[1], 10) : 0;
        });
      } catch (error) {
        console.error('Error getting total videos:', error);
        throw error;
      }

      const scrollPage = async () => {
        const scrollDelay = 2000;
        let itemsBeforeScroll = allTikTokVideos.length;
        let lastProgress = 0;
        const startTime = Date.now();

        while (paginationActive) {
          await page.evaluate(() => {
            window.scrollBy(0, window.innerHeight);
          });

          await delay(scrollDelay);

          if (allTikTokVideos.length > itemsBeforeScroll) {
            const progress = (
              (allTikTokVideos.length / totalVideos) *
              100
            ).toFixed(2);
            const elapsedTime = formatTime(Date.now() - startTime);

            if (Number(progress) !== lastProgress) {
              console.log(
                `Progress: Collected ${allTikTokVideos.length} items (${progress}% of total) - Elapsed Time: ${elapsedTime}`,
              );
              this.server.emit('scraping-progress', {
                finished: false,
                progress: Number(progress),
                elapsedTime,
              });
              lastProgress = Number(progress);
            }

            itemsBeforeScroll = allTikTokVideos.length;
          }

          if (!paginationCursor || !paginationActive) {
            break;
          }
        }
      };

      await scrollPage();
      await browser.close();

      console.log(
        `Progress: Collected ${allTikTokVideos.length} items (100% of total)`,
      );
      this.server.emit('scraping-progress', {
        finished: true,
        progress: 100,
      });

      return {
        success: true,
        title: collectionTitle,
        data: allTikTokVideos,
        total: allTikTokVideos.length,
        allHashtags: Array.from(allHashtags),
      };
    } catch (error) {
      console.error('Error during scraping:', error.message);
      return {
        success: false,
        message: error.message,
      };
    }
  }

  async deleteCollection(userId: string, id: string) {
    return this.prisma.collection.delete({
      where: { id: id, userId: userId },
    });
  }
}
