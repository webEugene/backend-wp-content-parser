import { IsNotEmpty, IsString } from 'class-validator';

export class UrlHostDto {
  @IsNotEmpty()
  @IsString()
  readonly url: string;

  @IsNotEmpty()
  @IsString()
  readonly host: string;
}
