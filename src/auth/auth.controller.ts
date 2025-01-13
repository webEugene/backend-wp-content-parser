import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthLoginDto } from './dto/auth-login.dto';
import { AuthRegisterDto } from './dto/auth-register.dto';
import { ForgetPasswordDto } from './dto/forget-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('/login')
  async login(@Body() loginDto: AuthLoginDto): Promise<any> {
    return await this.authService.login(loginDto);
  }

  @Post('/register')
  async registration(@Body() adminDto: AuthRegisterDto): Promise<any> {
    return await this.authService.registration(adminDto);
  }

  // @Post('/forgot-password')
  // async forgetPassword(@Body() email: ForgetPasswordDto): Promise<any> {
  //   return await this.authService.forgetPassword(email);
  // }
  //
  // @Post('/reset-password')
  // async resetPassword(@Body() resetDto: ResetPasswordDto): Promise<any> {
  //   return await this.authService.resetPassword(resetDto);
  // }
}
