import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { ScraperController } from './scraper.controller';
import { ScraperService } from './scraper.service';

@Module({
  imports: [PrismaModule],
  controllers: [ScraperController],
  providers: [ScraperService],
})
export class ScraperModule {}
