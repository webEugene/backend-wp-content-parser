import { IsEmail, IsNotEmpty, IsString, Length } from 'class-validator';

export class AuthRegisterDto {
  @IsString({ message: 'Should be string' })
  @Length(2, 20, { message: 'Username should be between 2-20 characters' })
  @IsNotEmpty()
  readonly username: string;

  @IsEmail(undefined, { each: true, message: 'Email is incorrect' })
  readonly email: string;

  @IsNotEmpty()
  readonly password: string;
  //
  // @IsUUID()
  // @IsNotEmpty()
  // readonly plan_id: string;
}
