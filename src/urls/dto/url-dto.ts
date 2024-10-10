import { IsNotEmpty, IsString } from 'class-validator';

export class UrlDto {
  @IsNotEmpty()
  @IsString()
  readonly url: string;
}
