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
import { UsersService } from '../users/users.service';
import { User } from '../schemas/user.schema';

type AuthTokenResponse = {
  userInfo: { id: string; email: string; plan_id: number };
  access_token: string;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
  ) {}

  async login(loginDto: AuthLoginDto): Promise<AuthTokenResponse> {
    const user = await this.validateUser(loginDto);
    return this.generateToken(user);
  }

  async registration(registerDto: AuthRegisterDto): Promise<AuthTokenResponse> {
    const existingUser = await this.usersService.findUserByEmail(
      registerDto.email,
    );

    if (existingUser) {
      throw new HttpException('exist_user', HttpStatus.CONFLICT);
    }

    const hashPassword = await bcrypt.hash(registerDto.password, 10);

    const user = await this.usersService.createUser({
      ...registerDto,
      password: hashPassword,
    });

    return this.generateToken(user);
  }

  private async validateUser(userDto: AuthLoginDto): Promise<User> {
    const user = await this.usersService.findUserByEmail(userDto.email);

    if (user === null) {
      throw new UnauthorizedException({ message: 'inc_email' });
    }

    const passwordEqual = await bcrypt.compare(userDto.password, user.password);

    if (!passwordEqual) {
      throw new UnauthorizedException({ message: 'inc_pass' });
    }

    return user;

    // const user = await this.usersService.findUserByEmailWithPassword(
    //   userDto.email,
    // );
    //
    // if (!user) {
    //   throw new UnauthorizedException({ message: 'inc_email' });
    // }
    //
    // const isPasswordValid = await bcrypt.compare(
    //   userDto.password,
    //   user.password,
    // );
    //
    // if (!isPasswordValid) {
    //   throw new UnauthorizedException({ message: 'inc_pass' });
    // }
    //
    // return user;
  }

  private generateToken(user: User): AuthTokenResponse {
    const payload = {
      id: user.id,
      email: user.email,
      plan_id: user.plan_id,
    };

    return {
      userInfo: payload,
      access_token: this.jwtService.sign(payload),
    };
  }
}
