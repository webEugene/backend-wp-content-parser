import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthLoginDto } from './dto/auth-login.dto';
import { AuthRegisterDto } from './dto/auth-register.dto';

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
}
