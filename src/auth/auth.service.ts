import {
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthLoginDto } from './dto/auth-login.dto';
import * as bcrypt from 'bcryptjs';
import { AuthRegisterDto } from './dto/auth-register.dto';
import { UserService } from '../user/user.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
  ) {}

  async login(loginDto: AuthLoginDto): Promise<any> {
    const user = await this.validateUser(loginDto);
    return this.generateToken(user);
  }

  async registration(registerDto: AuthRegisterDto): Promise<any> {
    const checkUser = await this.userService.findUserByEmail(registerDto.email);

    if (checkUser) {
      throw new HttpException('exist_user', HttpStatus.CONFLICT);
    }

    const hashPassword = await bcrypt.hash(registerDto.password, 5);
    const user = await this.userService.createUser({
      ...registerDto,
      password: hashPassword,
    });

    return this.generateToken(user);
  }

  private async validateUser(userDto: AuthLoginDto): Promise<any> {
    const hasUser = await this.userService.findUserByEmail(userDto.email);

    if (hasUser === null) {
      throw new UnauthorizedException({ message: 'inc_mail' });
    }

    const passwordEqual = await bcrypt.compare(
      userDto.password,
      hasUser?.password,
    );

    if (!passwordEqual) {
      throw new UnauthorizedException({ message: 'inc_pass' });
    }

    return hasUser;
  }

  private async generateToken(user): Promise<any> {
    const payload = {
      email: user.email,
      id: user.id,
      // roles: user.roles,
    };

    return {
      userInfo: {
        id: user.id,
        username: user.username,
        // roles: user.roles,
        // type_tariff: 0,
      },
      access_token: this.jwtService.sign(payload),
    };
  }
}
