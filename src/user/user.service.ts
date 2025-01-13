import { Injectable } from '@nestjs/common';
import { AuthRegisterDto } from '../auth/dto/auth-register.dto';
import { InjectModel } from '@nestjs/mongoose';
import { User } from '../schemas/user.schema';
import { Model } from 'mongoose';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
  ) {}

  async createUser(userDto: AuthRegisterDto): Promise<User> {
    const newUser = new this.userModel(userDto);
    await this.addRole(newUser.email, 'user');
    return newUser.save();
  }

  // Find user by email
  async findUserByEmail(email: string): Promise<User | null> {
    return this.userModel.findOne({ email }).exec();
  }

  // Add a role to a user
  async addRole(email: string, role): Promise<User | null> {
    return this.userModel
      .findOneAndUpdate(
        { email },
        { $addToSet: { roles: role } }, // Prevent duplicate roles
        { new: true },
      )
      .exec();
  }
}
