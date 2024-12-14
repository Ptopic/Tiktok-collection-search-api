import { IsNotEmpty, IsString } from 'class-validator';

export class ScrapeCollectionDto {
  @IsString()
  @IsNotEmpty()
  playlistUrl: string;
}
