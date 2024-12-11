import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class ScrapeCollectionDto {
  @IsString()
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  playlistUrl: string;
}
