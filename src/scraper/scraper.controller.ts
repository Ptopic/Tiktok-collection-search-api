import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Request,
} from '@nestjs/common';
import { JwtAuth } from 'src/auth/decorators/jwt-auth.decorator';
import { ScrapeCollectionDto } from './dto/scrape-collection.dto';
import { ScraperService } from './scraper.service';

@Controller('scraper')
export class ScraperController {
  constructor(private scraperService: ScraperService) {}

  @Post()
  @JwtAuth()
  async scrapeCollectionByUrl(
    @Request() req,
    @Body() { playlistUrl }: ScrapeCollectionDto,
  ) {
    try {
      const collection = await this.scraperService.scrapeCollectionByUrl(
        req.user.sub,
        playlistUrl,
      );

      if (!collection) {
        throw new NotFoundException('Failed to scrape collection');
      }

      return collection;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Get('my-collections')
  @JwtAuth()
  getCollections(@Request() req) {
    return this.scraperService.getCollections(req.user.sub);
  }

  @Get(':id')
  @JwtAuth()
  getCollectionById(@Request() req, @Param('id', ParseUUIDPipe) id: string) {
    const collection = this.scraperService.getCollectionById(req.user.sub, id);

    if (!collection) {
      throw new NotFoundException('Collection not found');
    }

    return collection;
  }

  @Get(':id/videos')
  @JwtAuth()
  async getVideosByCollectionId(
    @Request() req,
    @Param('id', ParseUUIDPipe) id: string,
    @Query('hashtags') hashtags: string[] | undefined,
  ) {
    const normalizedHashtags = Array.isArray(hashtags) ? hashtags : [hashtags];

    return this.scraperService.getVideosByCollectionId(
      req.user.sub,
      id,
      normalizedHashtags,
    );
  }

  @Get(':id/hashtags')
  @JwtAuth()
  getHashtagsByCollectionId(
    @Request() req,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.scraperService.getHashtagsByCollectionId(req.user.sub, id);
  }

  @Delete(':id')
  @JwtAuth()
  deleteCollection(@Request() req, @Param('id', ParseUUIDPipe) id: string) {
    return this.scraperService.deleteCollection(req.user.sub, id);
  }
}
