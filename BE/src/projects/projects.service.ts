import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
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

    // Đảm bảo người tạo luôn có tên trong members với role 'manager'
    const initialMembers = createProjectDto.members?.length
      ? [...createProjectDto.members]
      : [];
    const isCreatorMember = initialMembers.some(
      (m: any) => (m.user?._id?.toString() || m.user?.toString()) === userId.toString(),
    );
    if (!isCreatorMember) {
      initialMembers.push({ user: userId, role: 'manager' });
    }

    const project = await this.projectModel.create({
      title: projectTitle,
      description: createProjectDto.description,
      workspace: workspaceId,
      status: createProjectDto.status || 'PLANNING',
      startDate: createProjectDto.startDate ? new Date(createProjectDto.startDate) : undefined,
      dueDate: createProjectDto.dueDate ? new Date(createProjectDto.dueDate) : undefined,
      isPrivate: createProjectDto.isPrivate || false,
      members: initialMembers,
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

    const wsMember = workspace.members.find(
      (m: any) => (m.user?._id?.toString() || m.user?.toString()) === userId.toString(),
    );
    const isWsAdminOrOwner = wsMember && ['owner', 'admin'].includes(wsMember.role);

    let query: any = { workspace: workspaceId };

    if (isWsAdminOrOwner) {
      // Owner/Admin Workspace thấy: Tất cả dự án Public + Dự án Private mà họ là thành viên
      query.$or = [
        { isPrivate: { $ne: true } },
        { isPrivate: true, 'members.user': userId },
      ];
    } else {
      // Member thường của Workspace: Chỉ thấy những dự án mà họ là thành viên
      query['members.user'] = userId;
    }

    const projects = await this.projectModel
      .find(query)
      .populate('members.user', 'name email profileImage')
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

    // Check quyền truy cập
    const isMember = project.members.some(
      (m: any) => (m.user?._id?.toString() || m.user?.toString()) === userId.toString(),
    );

    if (project.isPrivate) {
      // Dự án Riêng tư: Bắt buộc phải là thành viên dự án
      if (!isMember) {
        throw new ForbiddenException('Dự án này là riêng tư, bạn không có quyền truy cập');
      }
    } else {
      // Dự án Công khai: Phải là thành viên dự án HOẶC là Owner/Admin Workspace
      const workspace = await this.workspaceModel.findById(project.workspace);
      const wsMember = workspace?.members.find(
        (m: any) => (m.user?._id?.toString() || m.user?.toString()) === userId.toString(),
      );
      const isWsAdminOrOwner = wsMember && ['owner', 'admin'].includes(wsMember.role);

      if (!isMember && !isWsAdminOrOwner) {
        throw new ForbiddenException('Bạn chưa được thêm vào dự án này');
      }
    }

    return project;
  }

  async updateProject(projectId: string, updateProjectDto: UpdateProjectDto, userId: string) {
    const project = await this.projectModel.findById(projectId);
    if (!project) {
      throw new NotFoundException('Không tìm thấy dự án để cập nhật');
    }

    // Kiểm tra quyền chỉnh sửa project settings / members:
    // Phải là Manager của dự án hoặc Owner/Admin Workspace
    const isProjectManager = project.members.some(
      (m: any) => (m.user?._id?.toString() || m.user?.toString()) === userId.toString() && m.role === 'manager',
    );
    const workspace = await this.workspaceModel.findById(project.workspace);
    const wsMember = workspace?.members.find(
      (m: any) => (m.user?._id?.toString() || m.user?.toString()) === userId.toString(),
    );
    const isWsAdminOrOwner = wsMember && ['owner', 'admin'].includes(wsMember.role);

    if (!isProjectManager && !isWsAdminOrOwner) {
      throw new ForbiddenException('Bạn không có quyền chỉnh sửa dự án này');
    }

    const updated = await this.projectModel.findByIdAndUpdate(projectId, updateProjectDto, {
      returnDocument: 'after',
    })
      .populate('members.user', 'name email profileImage')
      .populate('createdBy', 'name email profileImage')
      .populate('workspace', 'name color');

    return updated;
  }

  async deleteProject(projectId: string, userId: string) {
    const project = await this.projectModel.findById(projectId);
    if (!project) {
      throw new NotFoundException('Không tìm thấy dự án để xóa');
    }

    const isProjectManager = project.members.some(
      (m: any) => (m.user?._id?.toString() || m.user?.toString()) === userId.toString() && m.role === 'manager',
    );
    const workspace = await this.workspaceModel.findById(project.workspace);
    const wsMember = workspace?.members.find(
      (m: any) => (m.user?._id?.toString() || m.user?.toString()) === userId.toString(),
    );
    const isWsAdminOrOwner = wsMember && ['owner', 'admin'].includes(wsMember.role);

    if (!isProjectManager && !isWsAdminOrOwner) {
      throw new ForbiddenException('Bạn không có quyền xóa dự án này');
    }

    await this.projectModel.findByIdAndDelete(projectId);

    // Xóa reference của project khỏi workspace
    await this.workspaceModel.findByIdAndUpdate(project.workspace, {
      $pull: { projects: project._id },
    });

    return { message: 'Đã xóa dự án thành công' };
  }
}
