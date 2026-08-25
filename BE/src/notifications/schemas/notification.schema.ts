import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';

export type NotificationType =
  | 'TASK_ASSIGNED'
  | 'NEW_COMMENT'
  | 'TASK_DUE_SOON'
  | 'WORKSPACE_INVITE'
  | 'TASK_UPDATED';

@Schema({ timestamps: true })
export class Notification extends Document {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  recipient!: mongoose.Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  sender!: mongoose.Types.ObjectId;

  @Prop({ required: true, trim: true })
  type!: string;

  @Prop({ required: true, trim: true })
  title!: string;

  @Prop({ required: true, trim: true })
  message!: string;

  @Prop({ trim: true })
  link?: string;

  @Prop({ type: Boolean, default: false })
  isRead!: boolean;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);
