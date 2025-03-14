import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class UpdateAnalyticDto {
  @IsNotEmpty()
  @IsString()
  readonly website: string;

  @IsOptional()
  @IsNumber()
  readonly tries: number;

  @IsOptional()
  @IsString()
  readonly host: string;

  @IsOptional()
  @IsBoolean()
  readonly wpDetect: boolean;
}
