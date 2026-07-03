import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from './schemas/user.schema';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) { }

  async findByEmail(email: string) {
    return this.userModel.findOne({ email }).select('+password').exec();
  }

  async findById(id: string) {
    return this.userModel.findById(id).exec();
  }

  async findByVerifyToken(token: string) {
    return this.userModel
      .findOne({ emailVerifyToken: token })
      .select('+emailVerifyToken +emailVerifyExpires')
      .exec();
  }

  async create(data: { name: string; email: string; password: string }) {
    const user = new this.userModel({
      ...data,
      expireAt: new Date(),
    });
    return user.save();
  }

  async saveVerifyToken(
    userId: string,
    token: string,
    expires: Date,
  ): Promise<void> {
    await this.userModel.findByIdAndUpdate(userId, {
      emailVerifyToken: token,
      emailVerifyExpires: expires,
    });
  }

  async markEmailVerified(userId: string): Promise<void> {
    await this.userModel.findByIdAndUpdate(userId, {
      isEmailVerified: true,
      emailVerifyToken: null,
      emailVerifyExpires: null,
      $unset: { expireAt: 1 },
    });
  }

  async updateRefreshToken(userId: string, refreshToken: string | null) {
    const hashed = refreshToken ? await bcrypt.hash(refreshToken, 10) : null;
    return this.userModel.findByIdAndUpdate(userId, { refreshToken: hashed });
  }
}

