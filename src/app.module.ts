import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ScraperModule } from './scraper/scraper.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [ScraperModule, AuthModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
