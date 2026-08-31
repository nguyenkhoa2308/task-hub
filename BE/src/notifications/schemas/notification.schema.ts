import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';

export type NotificationType =
  | 'TASK_ASSIGNED'
  | 'NEW_COMMENT'
  | 'COMMENT_MENTION'
  | 'COMMENT_REPLY'
  | 'TASK_DUE_SOON'
  | 'TASK_OVERDUE'
  | 'WORKSPACE_INVITE'
  | 'TASK_UPDATED';

@Schema({ timestamps: true })
export class Notification extends Document {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  recipient!: mongoose.Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null })
  sender?: mongoose.Types.ObjectId | null;

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

  @Prop({ trim: true })
  dedupeKey?: string;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);

NotificationSchema.index({ recipient: 1, createdAt: -1 });
NotificationSchema.index({ recipient: 1, isRead: 1 });
NotificationSchema.index({ dedupeKey: 1 }, { unique: true, sparse: true });
