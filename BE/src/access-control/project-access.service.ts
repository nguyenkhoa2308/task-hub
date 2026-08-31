import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Project } from '../projects/schemas/project.schema';
import { Workspace } from '../workspaces/schemas/workspace.schema';

@Injectable()
export class ProjectAccessService {
  constructor(
    @InjectModel(Project.name) private readonly projectModel: Model<Project>,
    @InjectModel(Workspace.name) private readonly workspaceModel: Model<Workspace>,
  ) {}

  async assertCanReadProject(projectId: string, userId: string) {
    const project = await this.projectModel.findById(projectId);
    if (!project) throw new NotFoundException('Dự án không tồn tại');
    if (project.deletedAt) throw new NotFoundException('Dự án không tồn tại');

    const workspace = await this.workspaceModel.findById(project.workspace);
    if (!workspace) throw new NotFoundException('Workspace không tồn tại');
    if (workspace.deletedAt) throw new NotFoundException('Workspace không tồn tại');

    const workspaceMember = workspace.members.find(
      (member: any) =>
        (member.user?._id?.toString() || member.user?.toString()) === userId.toString()
        && member.status !== 'pending',
    );
    if (!workspaceMember) {
      throw new ForbiddenException('Bạn không có quyền truy cập workspace này');
    }

    const isProjectMember = project.members.some(
      (member: any) =>
        (member.user?._id?.toString() || member.user?.toString()) === userId.toString(),
    );
    const isWorkspaceAdmin = ['owner', 'admin'].includes(workspaceMember.role);
    const canRead = project.isPrivate
      ? isProjectMember
      : isProjectMember || isWorkspaceAdmin;

    if (!canRead) {
      throw new ForbiddenException('Bạn không có quyền truy cập dự án này');
    }

    return project;
  }
}
