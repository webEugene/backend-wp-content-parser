import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthLoginDto } from './dto/auth-login.dto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(private jwtService: JwtService) {}

  async login(loginDto: AuthLoginDto): Promise<any> {
    const user = await this.validateUser(loginDto);
    return this.generateToken(user);
  }

  private async validateUser(userDto: AuthLoginDto): Promise<any> {
    // const user = await this.userService.getUserByEmail(userDto.email);
    const user = null;
    if (user === null) {
      throw new UnauthorizedException({ message: 'inc_mail' });
    }

    const passwordEqual = await bcrypt.compare(userDto.password, user?.password);

    if (!passwordEqual) {
      throw new UnauthorizedException({ message: 'inc_pass' });
    }

    return user;
  }

  private async generateToken(user): Promise<any> {
    const payload = {
      email: user.email,
      id: user.id,
      roles: user.roles,
    };

    return {
      userInfo: {
        id: user.id,
        name: user.name,
        surname: user.surname,
        roles: user.roles,
        type_tariff: 0,
      },
      access_token: this.jwtService.sign(payload),
    };
  }
}
