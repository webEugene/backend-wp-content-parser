import { IsNotEmpty } from 'class-validator';

export class ResetPasswordDto {
  @IsNotEmpty()
  readonly password: string;

  @IsNotEmpty()
  readonly token: string;
}
