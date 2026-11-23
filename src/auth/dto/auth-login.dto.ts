import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';

export class AuthLoginDto {
  @IsNotEmpty({ message: 'email is required' })
  @IsEmail({}, { message: 'email is incorrect' })
  readonly email: string;

  @IsNotEmpty({ message: 'password is required' })
  @MinLength(6, { message: 'password must be at least 6 characters' })
  readonly password: string;
}
