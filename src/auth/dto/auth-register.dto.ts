import { IsEmail, IsNotEmpty, IsString, IsUUID, Length } from 'class-validator';

export class AuthRegisterDto {
  @IsString({ message: 'Should be string' })
  @Length(2, 20, { message: 'Name should be between 2-20 characters' })
  @IsNotEmpty()
  readonly name: string;

  @IsString({ message: 'Should be string' })
  @Length(2, 20, { message: 'Name should be between 2-20 characters' })
  @IsNotEmpty()
  readonly surname: string;

  @IsEmail(undefined, { each: true, message: 'email is incorrect' })
  readonly email: string;

  @IsNotEmpty()
  readonly password: string;

  @IsUUID()
  @IsNotEmpty()
  readonly plan_id: string;
}
