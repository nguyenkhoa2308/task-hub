import { Injectable, OnModuleInit, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from './schemas/user.schema';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

@Injectable()
export class UsersService implements OnModuleInit {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private readonly cloudinaryService: CloudinaryService,
  ) { }

  async onModuleInit() {
    try {
      const usersWithoutAvatar = await this.userModel.find({
        $or: [{ profileImage: { $exists: false } }, { profileImage: null }, { profileImage: '' }],
      });
      for (const user of usersWithoutAvatar) {
        const avatar = `https://api.dicebear.com/10.x/clay/svg?seed=${encodeURIComponent(user.name || user.email)}`;
        await this.userModel.findByIdAndUpdate(user._id, { profileImage: avatar });
      }
    } catch (e) {
      // Ignore initial connection errors if DB is starting up
    }
  }

  async findByEmail(email: string) {
    return this.userModel.findOne({ email }).select('+password').exec();
  }

  async findById(id: string) {
    return this.userModel.findById(id).exec();
  }

  async findByIdWithRefreshToken(id: string) {
    return this.userModel.findById(id).select('+refreshToken').exec();
  }

  async findByEmailAndVerifyOtp(email: string, otp: string) {
    return this.userModel
      .findOne({ email, emailVerifyOtp: otp })
      .select('+emailVerifyOtp +emailVerifyOtpExpires')
      .exec();
  }

  async create(data: { name: string; email: string; password: string }) {
    const defaultAvatar = `https://api.dicebear.com/10.x/clay/svg?seed=${encodeURIComponent(data.name || data.email)}`;
    const user = new this.userModel({
      ...data,
      profileImage: defaultAvatar,
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

  async updateProfile(userId: string, data: { name?: string; profileImage?: string }) {
    const currentUser = await this.userModel.findById(userId);
    if (!currentUser) throw new BadRequestException('Không tìm thấy người dùng');
    const replacingCloudinaryAvatar = Boolean(
      data.profileImage
      && data.profileImage !== currentUser.profileImage
      && currentUser.profileImagePublicId,
    );
    const update: any = replacingCloudinaryAvatar
      ? { $set: data, $unset: { profileImagePublicId: 1 } }
      : { $set: data };
    const user = await this.userModel.findByIdAndUpdate(userId, update, { returnDocument: 'after' });
    if (!user) {
      throw new BadRequestException('Không tìm thấy người dùng');
    }
    if (replacingCloudinaryAvatar && currentUser.profileImagePublicId) {
      this.cloudinaryService.deleteAsset(currentUser.profileImagePublicId, 'image', 'upload').catch(() => undefined);
    }
    return user;
  }

  async uploadAvatar(userId: string, file: any) {
    if (!file?.buffer || !file.mimetype?.startsWith('image/')) {
      throw new BadRequestException('Vui lòng chọn một tệp ảnh hợp lệ');
    }
    if (['image/svg+xml', 'image/gif'].includes(file.mimetype)) {
      throw new BadRequestException('Định dạng ảnh này không được hỗ trợ');
    }

    const currentUser = await this.userModel.findById(userId);
    if (!currentUser) throw new BadRequestException('Không tìm thấy người dùng');
    const uploaded = await this.cloudinaryService.uploadBuffer(file.buffer, {
      folder: 'task-hub/avatars',
      resource_type: 'image',
      type: 'upload',
      transformation: [{ width: 512, height: 512, crop: 'fill', gravity: 'auto' }],
      format: 'webp',
    });

    const oldPublicId = currentUser.profileImagePublicId;
    currentUser.profileImage = uploaded.secure_url;
    currentUser.profileImagePublicId = uploaded.public_id;
    await currentUser.save();
    if (oldPublicId && oldPublicId !== uploaded.public_id) {
      this.cloudinaryService.deleteAsset(oldPublicId, 'image', 'upload').catch(() => undefined);
    }
    return currentUser;
  }
}

