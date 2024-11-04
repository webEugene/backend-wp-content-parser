import { IsOptional, IsString } from 'class-validator';

export class ClassNamesDto {
  @IsOptional()
  @IsString()
  readonly homeHeading: string;

  @IsOptional()
  @IsString()
  readonly homeContent: string;

  @IsOptional()
  @IsString()
  readonly pageHeading: string;

  @IsOptional()
  @IsString()
  readonly pageContent: string;

  @IsOptional()
  @IsString()
  readonly singleHeading: string;

  @IsOptional()
  @IsString()
  readonly singleContent: string;

  @IsOptional()
  @IsString()
  readonly archiveHeading: string;

  @IsOptional()
  @IsString()
  readonly archiveContent: string;
}
