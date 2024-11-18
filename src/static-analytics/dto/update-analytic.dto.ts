import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateAnalyticDto {
  @IsNotEmpty()
  @IsString()
  readonly hostname: string;

  @IsOptional()
  @IsNumber()
  readonly tries: number;
}
