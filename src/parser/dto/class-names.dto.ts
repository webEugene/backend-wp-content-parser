import { IsOptional, IsString } from 'class-validator';

export class ClassNamesDto {
  @IsOptional()
  @IsString()
  readonly homeTitle: string;

  @IsOptional()
  @IsString()
  readonly homeContent: string;

  @IsOptional()
  @IsString()
  readonly pageTitle: string;

  @IsOptional()
  @IsString()
  readonly pageContent: string;

  @IsOptional()
  @IsString()
  readonly singleTitle: string;

  @IsOptional()
  @IsString()
  readonly singleContent: string;

  @IsOptional()
  @IsString()
  readonly archiveTitle: string;

  @IsOptional()
  @IsString()
  readonly archiveContent: string;

  @IsOptional()
  @IsString()
  readonly defaultTitle: string;

  @IsOptional()
  @IsString()
  readonly defaultContent: string;
}
