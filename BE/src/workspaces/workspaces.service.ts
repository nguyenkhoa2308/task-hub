import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';
import { Workspace } from './schemas/workspace.schema';

@Injectable()
export class WorkspacesService {
  constructor(
    @InjectModel(Workspace.name) private readonly workspaceModel: Model<Workspace>,
  ) { }

  async createWorkSpace(createWorkspaceDto: CreateWorkspaceDto, userId: string) {
    const { name, description, color } = createWorkspaceDto;

    const workspace = await this.workspaceModel.create({
      name,
      description,
      color,
      owner: userId,
      members: [
        {
          user: userId,
          role: "owner",
          joinedAt: new Date()
        },
      ],
    })

    return workspace;
  }

  async getWorkspaces(userId: string) {
    const workspaces = await this.workspaceModel.find({ members: { $elemMatch: { user: userId } } }).sort({ createdAt: -1 });
    return workspaces;
  }

  async getWorkspaceById(workspaceId: string) {
    const workspace = await this.workspaceModel
      .findById(workspaceId)
      .populate('members.user', 'name email profileImage')
      .populate('projects');
    if (!workspace) {
      throw new NotFoundException("Không tìm thấy workspace")
    }
    return workspace;
  }

  async updateWorkspace(workspaceId: string, updateWorkspaceDto: UpdateWorkspaceDto) {
    const workspace = await this.workspaceModel.findByIdAndUpdate(workspaceId, updateWorkspaceDto, { returnDocument: 'after' });
    return workspace;
  }

  async deleteWorkspace(workspaceId: string) {
    const workspace = await this.workspaceModel.findByIdAndDelete(workspaceId);
    return workspace;
  }

  async joinWorkspace(workspaceId: string, userId: string) {
    const workspace = await this.workspaceModel.findById(workspaceId);
    if (!workspace) {
      throw new NotFoundException("Workspace không tồn tại");
    }

    const isMember = workspace.members.some(
      (m: any) => m.user.toString() === userId.toString()
    );

    if (isMember) {
      return { message: "Bạn đã là thành viên của workspace này", workspace };
    }

    workspace.members.push({
      user: userId as any,
      role: 'member',
      joinedAt: new Date(),
    });

    await workspace.save();
    return { message: "Tham gia workspace thành công", workspace };
  }
}
