import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';

@Schema({ _id: true })
export class Subtask {
  @Prop({ required: true, trim: true })
  title!: string;

  @Prop({ type: Boolean, default: false })
  completed!: boolean;

  @Prop({ type: Date, default: Date.now })
  createdAt!: Date;
}

export const SubtaskSchema = SchemaFactory.createForClass(Subtask);

@Schema({ _id: true })
export class Attachment {
  @Prop({ required: true })
  fileName!: string;

  @Prop({ required: true })
  fileUrl!: string;

  @Prop()
  storageKey?: string;

  @Prop()
  cloudinaryPublicId?: string;

  @Prop()
  cloudinaryFormat?: string;

  @Prop({ enum: ['image', 'video', 'raw'] })
  cloudinaryResourceType?: 'image' | 'video' | 'raw';

  @Prop()
  cloudinaryDeliveryType?: string;

  @Prop()
  fileType?: string;

  @Prop({ type: Number })
  fileSize?: number;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  uploadedBy?: mongoose.Types.ObjectId;

  @Prop({ type: Date, default: Date.now })
  uploadedAt!: Date;
}

export const AttachmentSchema = SchemaFactory.createForClass(Attachment);

@Schema({ timestamps: true })
export class Task extends Document {
  @Prop({ required: true, trim: true })
  title!: string;

  @Prop({ trim: true })
  description?: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true })
  project!: mongoose.Types.ObjectId;

  @Prop({
    type: String,
    enum: ['To Do', 'In Progress', 'Review', 'Done', 'TO_DO', 'IN_PROGRESS', 'REVIEW', 'DONE'],
    default: 'To Do',
  })
  status!: string;

  @Prop({
    type: String,
    enum: ['Low', 'Medium', 'High', 'LOW', 'MEDIUM', 'HIGH'],
    default: 'Medium',
  })
  priority!: string;

  @Prop({ type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], default: [] })
  assignees!: mongoose.Types.ObjectId[];

  @Prop({ type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], default: [] })
  watchers!: mongoose.Types.ObjectId[];

  @Prop({ type: Date })
  startDate?: Date;

  @Prop({ type: Date })
  dueDate?: Date;

  @Prop({ type: Date })
  completedAt?: Date;

  @Prop({ type: Number, min: 0 })
  estimatedHours?: number;

  @Prop({ type: Number, min: 0 })
  actualHours?: number;

  @Prop({ type: [String], default: [] })
  tags!: string[];

  @Prop({ type: [SubtaskSchema], default: [] })
  subtasks!: Subtask[];

  @Prop({ type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }], default: [] })
  comments!: mongoose.Types.ObjectId[];

  @Prop({ type: [AttachmentSchema], default: [] })
  attachments!: Attachment[];

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  createdBy!: mongoose.Types.ObjectId;

  @Prop({ type: Boolean, default: false })
  isArchived!: boolean;

  @Prop({ type: Date, default: null })
  archivedAt?: Date | null;

  @Prop({ type: Date, default: null })
  deletedAt?: Date | null;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null })
  deletedBy?: mongoose.Types.ObjectId | null;
}

export const TaskSchema = SchemaFactory.createForClass(Task);

TaskSchema.index({ project: 1, isArchived: 1, deletedAt: 1, createdAt: -1 });
TaskSchema.index({ assignees: 1, isArchived: 1, deletedAt: 1, createdAt: -1 });
TaskSchema.index({ createdBy: 1, isArchived: 1, deletedAt: 1, createdAt: -1 });
TaskSchema.index({ deletedBy: 1, deletedAt: -1 });
TaskSchema.index({ deletedAt: 1, _id: 1 }, { name: 'task_trash_cleanup' });
TaskSchema.index({ isArchived: 1, deletedAt: 1, status: 1, dueDate: 1 });
