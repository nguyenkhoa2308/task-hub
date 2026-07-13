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

  async findByEmailAndVerifyOtp(email: string, otp: string) {
    return this.userModel
      .findOne({ email, emailVerifyOtp: otp })
      .select('+emailVerifyOtp +emailVerifyOtpExpires')
      .exec();
  }

  async create(data: { name: string; email: string; password: string }) {
    const user = new this.userModel({
      ...data,
      expireAt: new Date(),
    });
    return user.save();
  }

  async saveVerifyOtp(
    userId: string,
    otp: string,
    expires: Date,
  ): Promise<void> {
    await this.userModel.findByIdAndUpdate(userId, {
      emailVerifyOtp: otp,
      emailVerifyOtpExpires: expires,
    });
  }

  async markEmailVerified(userId: string): Promise<void> {
    await this.userModel.findByIdAndUpdate(userId, {
      isEmailVerified: true,
      $unset: { 
        expireAt: 1,
        emailVerifyOtp: 1,
        emailVerifyOtpExpires: 1
      },
    });
  }

  async updateRefreshToken(userId: string, refreshToken: string | null) {
    const hashed = refreshToken ? await bcrypt.hash(refreshToken, 10) : null;
    return this.userModel.findByIdAndUpdate(userId, { refreshToken: hashed });
  }

  async savePasswordResetOtp(
    userId: string,
    otp: string,
    expires: Date,
  ): Promise<void> {
    await this.userModel.findByIdAndUpdate(userId, {
      passwordResetOtp: otp,
      passwordResetOtpExpires: expires,
    });
  }

  async findByEmailAndResetOtp(email: string, otp: string) {
    return this.userModel
      .findOne({ email, passwordResetOtp: otp })
      .select('+passwordResetOtp +passwordResetOtpExpires')
      .exec();
  }

  async clearPasswordResetOtp(userId: string): Promise<void> {
    await this.userModel.findByIdAndUpdate(userId, {
      $unset: {
        passwordResetOtp: 1,
        passwordResetOtpExpires: 1,
      },
    });
  }

  async updatePassword(userId: string, hashedPassword: string): Promise<void> {
    await this.userModel.findByIdAndUpdate(userId, {
      password: hashedPassword,
    });
  }
}

