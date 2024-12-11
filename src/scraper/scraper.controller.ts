import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import { ScrapeCollectionDto } from './dto/scrape-collection.dto';
import { ScraperService } from './scraper.service';

@Controller('scraper')
export class ScraperController {
  constructor(private scraperService: ScraperService) {}

  @Post()
  scrapeCollectionByUrl(@Body() { email, playlistUrl }: ScrapeCollectionDto) {
    return this.scraperService.scrapeCollectionByUrl(playlistUrl);
  }

  @Get(':id/videos')
  async getVideosByCollectionId(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('hashtags') hashtags: string[] | undefined,
  ) {
    const normalizedHashtags = Array.isArray(hashtags) ? hashtags : [hashtags];

    return this.scraperService.getVideosByCollectionId(id, normalizedHashtags);
  }

  @Get(':id/hashtags')
  getHashtagsByCollectionId(@Param('id', ParseUUIDPipe) id: string) {
    return this.scraperService.getHashtagsByCollectionId(id);
  }
}
