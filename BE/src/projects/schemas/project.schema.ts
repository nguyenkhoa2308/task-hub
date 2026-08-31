import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';

@Schema({ _id: false })
export class ProjectMember {
    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
    user!: mongoose.Types.ObjectId;

    @Prop({ type: String, enum: ['manager', 'contributor', 'viewer'], default: 'contributor' })
    role!: 'manager' | 'contributor' | 'viewer';
}

const ProjectMemberSchema = SchemaFactory.createForClass(ProjectMember);

@Schema({ timestamps: true })
export class Project extends Document {
    @Prop({ required: true, trim: true })
    title!: string;

    @Prop({ trim: true })
    description?: string;

    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Workspace', required: true })
    workspace!: mongoose.Types.ObjectId;

    @Prop({
      type: String,
      enum: ['PLANNING', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CANCELLED'],
      default: 'PLANNING',
    })
    status!: string;

    @Prop({ type: Date })
    startDate?: Date;

    @Prop({ type: Date })
    dueDate?: Date;

    @Prop({ type: Number, min: 0, max: 100, default: 0 })
    progress!: number;

    @Prop({ type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Task' }], default: [] })
    tasks!: mongoose.Types.ObjectId[];

    @Prop({ type: [ProjectMemberSchema], default: [] })
    members!: ProjectMember[];

    @Prop({ type: [String], default: [] })
    tags!: string[];

    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
    createdBy!: mongoose.Types.ObjectId;

    @Prop({ type: Boolean, default: false })
    isArchived!: boolean;

    @Prop({ type: Date, default: null })
    archivedAt?: Date | null;

    @Prop({ type: Date, default: null })
    deletedAt?: Date | null;

    @Prop({ type: Boolean, default: false })
    deletedViaWorkspace!: boolean;

    @Prop({ type: Boolean, default: false })
    isPrivate!: boolean;
}

export const ProjectSchema = SchemaFactory.createForClass(Project);

ProjectSchema.index({ workspace: 1, isArchived: 1, deletedAt: 1, updatedAt: -1 });
ProjectSchema.index({ 'members.user': 1, deletedAt: 1 });
ProjectSchema.index({ deletedAt: 1, _id: 1 }, { name: 'project_trash_cleanup' });
