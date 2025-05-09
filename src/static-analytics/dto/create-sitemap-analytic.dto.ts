import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateSitemapAnalyticDto {
  @IsNotEmpty()
  @IsString()
  readonly website: string;

  @IsOptional()
  @IsNumber()
  readonly tries: number;

  @IsNotEmpty()
  @IsString()
  readonly host: string;

  @IsNotEmpty()
  @IsBoolean()
  readonly status: boolean;
}
