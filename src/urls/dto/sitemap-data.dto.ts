import { IsNotEmpty, IsObject, IsOptional, IsString } from 'class-validator';

export class SitemapDataDto {
  @IsNotEmpty()
  @IsString()
  readonly url: string;

  @IsOptional()
  @IsObject()
  readonly classNames: object;
}
