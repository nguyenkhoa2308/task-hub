import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';

@Schema({ _id: false })
export class CommentMention {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  user?: mongoose.Types.ObjectId;

  @Prop({ type: Number })
  offset?: number;

  @Prop({ type: Number })
  length?: number;
}
export const CommentMentionSchema = SchemaFactory.createForClass(CommentMention);

@Schema({ _id: false })
export class CommentReaction {
  @Prop({ type: String })
  emoji?: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  user?: mongoose.Types.ObjectId;
}
export const CommentReactionSchema = SchemaFactory.createForClass(CommentReaction);

@Schema({ _id: false })
export class CommentAttachment {
  @Prop({ type: String })
  fileName?: string;

  @Prop({ type: String })
  fileUrl?: string;

  @Prop({ type: String })
  fileType?: string;

  @Prop({ type: Number })
  fileSize?: number;
}
export const CommentAttachmentSchema = SchemaFactory.createForClass(CommentAttachment);

@Schema({ timestamps: true })
export class Comment extends Document {
  @Prop({ required: true, trim: true })
  text!: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Task', required: true })
  task!: mongoose.Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  author!: mongoose.Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Comment', default: null })
  parentComment?: mongoose.Types.ObjectId | null;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Comment', default: null })
  replyToComment?: mongoose.Types.ObjectId | null;

  @Prop({ type: [CommentMentionSchema], default: [] })
  mentions!: CommentMention[];

  @Prop({ type: [CommentReactionSchema], default: [] })
  reactions!: CommentReaction[];

  @Prop({ type: [CommentAttachmentSchema], default: [] })
  attachments!: CommentAttachment[];

  @Prop({ type: Boolean, default: false })
  isEdited!: boolean;
}

export const CommentSchema = SchemaFactory.createForClass(Comment);

CommentSchema.index({ task: 1, createdAt: -1 });
CommentSchema.index({ parentComment: 1, createdAt: 1 });
