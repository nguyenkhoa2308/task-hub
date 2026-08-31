import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';

@Schema({ _id: false })
export class WorkspaceMember {
    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
    user!: mongoose.Types.ObjectId;

    @Prop({ type: String, enum: ['owner', 'member', 'admin', 'viewer'], default: 'member' })
    role!: 'owner' | 'member' | 'admin' | 'viewer';

    @Prop({ type: String, enum: ['active', 'pending'], default: 'active' })
    status!: 'active' | 'pending';

    @Prop({ type: Date, default: Date.now })
    joinedAt!: Date;
}

const WorkspaceMemberSchema = SchemaFactory.createForClass(WorkspaceMember);

@Schema({ timestamps: true })
export class Workspace extends Document {
    @Prop({ required: true, trim: true })
    name!: string;

    @Prop({ trim: true })
    description?: string;

    @Prop({ trim: true, default: "#FF5733" })
    color!: string;

    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
    owner!: mongoose.Types.ObjectId;

    @Prop({ type: [WorkspaceMemberSchema], default: [] })
    members!: WorkspaceMember[];

    @Prop({ type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Project' }], default: [] })
    projects!: mongoose.Types.ObjectId[];

    @Prop({ type: Boolean, default: true })
    allowMembersCreateProjects!: boolean;

    @Prop({ type: Boolean, default: false })
    allowMembersInvite!: boolean;

    @Prop({ type: Boolean, default: false })
    defaultProjectPrivate!: boolean;

    @Prop({ type: Date, default: null })
    deletedAt?: Date | null;

    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null })
    deletedBy?: mongoose.Types.ObjectId | null;
}

export const WorkspaceSchema = SchemaFactory.createForClass(Workspace);

WorkspaceSchema.index({ 'members.user': 1, deletedAt: 1, updatedAt: -1 });
WorkspaceSchema.index({ deletedAt: 1, _id: 1 }, { name: 'workspace_trash_cleanup' });
