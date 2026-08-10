import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';

@Schema({ _id: false })
export class WorkspaceMember {
    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
    user!: mongoose.Types.ObjectId;

    @Prop({ type: String, enum: ['owner', 'member', 'admin', 'viewer'], default: 'member' })
    role!: 'owner' | 'member' | 'admin' | 'viewer';

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
}

export const WorkspaceSchema = SchemaFactory.createForClass(Workspace);