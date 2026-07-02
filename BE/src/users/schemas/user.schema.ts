import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, trim: true })
  name!: string;

  @Prop({ required: true, unique: true, trim: true, lowercase: true })
  email!: string;

  @Prop({ required: true, select: false })
  password!: string;

  @Prop()
  profileImage?: string;

  @Prop({ default: false })
  isEmailVerified?: boolean;

  @Prop()
  lastLogin?: Date;

  @Prop({ default: false })
  is2FAEnabled?: boolean;

  @Prop({ select: false })
  twoFAOtp?: string;

  @Prop({ select: false })
  twoFAOtpExpiries?: Date;

  @Prop({ select: false })
  refreshToken?: string;

  @Prop({ select: false })
  emailVerifyToken?: string;

  @Prop({ select: false })
  emailVerifyExpires?: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
