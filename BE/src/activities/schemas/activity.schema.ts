import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';

export type ActivityLogAction =
  | 'created_task'
  | 'updated_task'
  | 'created_subtask'
  | 'updated_subtask'
  | 'completed_task'
  | 'created_project'
  | 'updated_project'
  | 'completed_project'
  | 'created_workspace'
  | 'updated_workspace'
  | 'added_comment'
  | 'replied_comment'
  | 'deleted_comment'
  | 'added_member'
  | 'removed_member'
  | 'joined_workspace'
  | 'transferred_workspace_ownership'
  | 'added_attachment';

export type ResourceType = 'Task' | 'Project' | 'Workspace' | 'Comment' | 'User';

@Schema({ timestamps: true })
export class Activity extends Document {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  user!: mongoose.Types.ObjectId;

  @Prop({
    required: true,
    enum: [
      'created_task',
      'updated_task',
      'created_subtask',
      'updated_subtask',
      'completed_task',
      'created_project',
      'updated_project',
      'completed_project',
      'created_workspace',
      'updated_workspace',
      'added_comment',
      'replied_comment',
      'deleted_comment',
      'added_member',
      'removed_member',
      'joined_workspace',
      'transferred_workspace_ownership',
      'added_attachment',
    ],
  })
  action!: string;

  @Prop({
    required: true,
    enum: ['Task', 'Project', 'Workspace', 'Comment', 'User'],
  })
  resourceType!: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, required: true })
  resourceId!: mongoose.Types.ObjectId;

  @Prop({ type: Object })
  details?: Record<string, any>;
}

export const ActivitySchema = SchemaFactory.createForClass(Activity);

ActivitySchema.index({ resourceType: 1, resourceId: 1, createdAt: -1 });
