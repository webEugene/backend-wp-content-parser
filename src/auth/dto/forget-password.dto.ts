import { IsEmail } from 'class-validator';

export class ForgetPasswordDto {
  @IsEmail(undefined, { each: true, message: 'email is incorrect' })
  readonly email: string;
}
