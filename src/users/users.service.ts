import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { AuthRegisterDto } from '../auth/dto/auth-register.dto';
import { InjectModel } from '@nestjs/mongoose';
import { User } from '../schemas/user.schema';
import { Model } from 'mongoose';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
  ) {}

  async createUser(userDto: AuthRegisterDto): Promise<User> {
    try {
      const newUser = new this.userModel(userDto);
      return await newUser.save();
    } catch (error) {
      if (error.code === 11000) {
        throw new ConflictException('User with this email already exists');
      }
      throw new InternalServerErrorException();
    }
  }

  async findUserByEmail(email: string): Promise<User | null> {
    return this.userModel.findOne({ email: this.normalizeEmail(email) }).exec();
  }

  async findUserByEmailWithPassword(email: string): Promise<User | null> {
    return this.userModel
      .findOne({ email: this.normalizeEmail(email) })
      .select('+password')
      .exec();
  }

  // Схема зберігає email з lowercase + trim, тож і шукати треба так само.
  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }
}
