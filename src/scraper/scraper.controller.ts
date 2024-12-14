import {
  Body,
  Controller,
  Get,
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
  scrapeCollectionByUrl(
    @Request() req,
    @Body() { playlistUrl }: ScrapeCollectionDto,
  ) {
    return this.scraperService.scrapeCollectionByUrl(req.user.sub, playlistUrl);
  }

  @Get(':id/videos')
  @JwtAuth()
  async getVideosByCollectionId(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('hashtags') hashtags: string[] | undefined,
  ) {
    const normalizedHashtags = Array.isArray(hashtags) ? hashtags : [hashtags];

    return this.scraperService.getVideosByCollectionId(id, normalizedHashtags);
  }

  @Get(':id/hashtags')
  @JwtAuth()
  getHashtagsByCollectionId(@Param('id', ParseUUIDPipe) id: string) {
    return this.scraperService.getHashtagsByCollectionId(id);
  }
}
