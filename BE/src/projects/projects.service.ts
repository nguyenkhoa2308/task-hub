import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { Project } from './schemas/project.schema';
import { Workspace } from '../workspaces/schemas/workspace.schema';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectModel(Project.name) private readonly projectModel: Model<Project>,
    @InjectModel(Workspace.name) private readonly workspaceModel: Model<Workspace>,
  ) {}

  async createProject(createProjectDto: CreateProjectDto, targetWorkspaceId: string, userId: string) {
    const workspaceId = targetWorkspaceId || createProjectDto.workspaceId;
    if (!workspaceId) {
      throw new BadRequestException('Workspace ID là bắt buộc');
    }

    const workspace = await this.workspaceModel.findById(workspaceId);
    if (!workspace) {
      throw new NotFoundException('Workspace không tồn tại');
    }

    const projectTitle = createProjectDto.title || createProjectDto.name;
    if (!projectTitle) {
      throw new BadRequestException('Tên dự án không được để trống');
    }

    let parsedTags: string[] = [];
    if (typeof createProjectDto.tags === 'string') {
      parsedTags = createProjectDto.tags.split(',').map((t: string) => t.trim()).filter(Boolean);
    } else if (Array.isArray(createProjectDto.tags)) {
      parsedTags = createProjectDto.tags;
    }

    const project = await this.projectModel.create({
      title: projectTitle,
      description: createProjectDto.description,
      workspace: workspaceId,
      status: createProjectDto.status || 'PLANNING',
      startDate: createProjectDto.startDate ? new Date(createProjectDto.startDate) : undefined,
      dueDate: createProjectDto.dueDate ? new Date(createProjectDto.dueDate) : undefined,
      members: createProjectDto.members?.length
        ? createProjectDto.members
        : [
            {
              user: userId,
              role: 'manager',
            },
          ],
      tags: parsedTags,
      createdBy: userId,
    });

    // Thêm reference của project vào workspace
    await this.workspaceModel.findByIdAndUpdate(workspaceId, {
      $push: { projects: project._id },
    });

    return project;
  }

  async getProjectsByWorkspace(workspaceId: string, userId: string) {
    const workspace = await this.workspaceModel.findById(workspaceId);
    if (!workspace) {
      throw new NotFoundException('Workspace không tồn tại');
    }

    const projects = await this.projectModel
      .find({ workspace: workspaceId })
      .sort({ createdAt: -1 });

    return projects;
  }

  async getProjectById(projectId: string, userId: string) {
    const project = await this.projectModel
      .findById(projectId)
      .populate('members.user', 'name email profileImage')
      .populate('createdBy', 'name email profileImage')
      .populate('workspace', 'name color');

    if (!project) {
      throw new NotFoundException('Không tìm thấy dự án');
    }

    return project;
  }

  async updateProject(projectId: string, updateProjectDto: UpdateProjectDto, userId: string) {
    const project = await this.projectModel.findByIdAndUpdate(projectId, updateProjectDto, {
      returnDocument: 'after',
    });

    if (!project) {
      throw new NotFoundException('Không tìm thấy dự án để cập nhật');
    }

    return project;
  }

  async deleteProject(projectId: string, userId: string) {
    const project = await this.projectModel.findByIdAndDelete(projectId);
    if (!project) {
      throw new NotFoundException('Không tìm thấy dự án để xóa');
    }

    // Xóa reference của project khỏi workspace
    await this.workspaceModel.findByIdAndUpdate(project.workspace, {
      $pull: { projects: project._id },
    });

    return { message: 'Đã xóa dự án thành công' };
  }
}
