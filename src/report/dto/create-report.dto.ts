import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateReportDto {
  @IsNotEmpty()
  @IsString()
  readonly pageName: string;

  @IsOptional()
  @IsEmail({}, { message: 'Invalid email address' })
  readonly email: string;

  @IsNotEmpty()
  @IsString()
  readonly report: string;
}
