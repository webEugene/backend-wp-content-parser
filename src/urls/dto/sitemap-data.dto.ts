import { IsNotEmpty, IsObject, IsOptional, IsString } from 'class-validator';
import { IClassNames } from '../../common/interfaces/IClassNames';

export class SitemapDataDto {
  @IsNotEmpty()
  @IsString()
  readonly url: string;

  @IsOptional()
  @IsObject()
  readonly classNames: IClassNames;
}
