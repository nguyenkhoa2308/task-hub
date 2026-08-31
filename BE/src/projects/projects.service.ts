import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { Project } from './schemas/project.schema';
import { Workspace } from '../workspaces/schemas/workspace.schema';
import { ActivitiesService } from '../activities/activities.service';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectModel(Project.name) private readonly projectModel: Model<Project>,
    @InjectModel(Workspace.name) private readonly workspaceModel: Model<Workspace>,
    private readonly activitiesService: ActivitiesService,
  ) {}

  async createProject(createProjectDto: CreateProjectDto, targetWorkspaceId: string, userId: string) {
    const workspaceId = targetWorkspaceId || createProjectDto.workspaceId;
    if (!workspaceId) {
      throw new BadRequestException('Workspace ID là bắt buộc');
    }

    const workspace = await this.workspaceModel.findOne({ _id: workspaceId, deletedAt: null });
    if (!workspace) {
      throw new NotFoundException('Workspace không tồn tại');
    }

    const creatorMembership = workspace.members.find(
      (member: any) => member.user.toString() === userId.toString() && member.status !== 'pending',
    );
    if (!creatorMembership || creatorMembership.role === 'viewer'
      || (creatorMembership.role === 'member' && workspace.allowMembersCreateProjects === false)) {
      throw new ForbiddenException('Bạn không có quyền tạo dự án trong workspace này');
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
    const initialMembers = this.validateProjectMembers(
      createProjectDto.members || [],
      workspace,
    ).filter((member: any) => member.user.toString() !== userId.toString());
    initialMembers.push({ user: userId, role: 'manager' });

    const project = await this.projectModel.create({
      title: projectTitle,
      description: createProjectDto.description,
      workspace: workspaceId,
      status: createProjectDto.status || 'PLANNING',
      startDate: createProjectDto.startDate ? new Date(createProjectDto.startDate) : undefined,
      dueDate: createProjectDto.dueDate ? new Date(createProjectDto.dueDate) : undefined,
      isPrivate: createProjectDto.isPrivate ?? workspace.defaultProjectPrivate ?? false,
      members: initialMembers,
      tags: parsedTags,
      createdBy: userId,
    });

    // Bù trừ nếu workspace bị xoá/thay đổi giữa lúc kiểm tra và lúc liên kết.
    try {
      const linkedWorkspace = await this.workspaceModel.findByIdAndUpdate(workspaceId, {
        $push: { projects: project._id },
      });
      if (!linkedWorkspace) {
        throw new NotFoundException("Workspace không tồn tại");
      }
    } catch (error) {
      await this.projectModel.deleteOne({ _id: project._id }).catch(() => undefined);
      throw error;
    }

    await this.activitiesService.logActivity({
      user: userId,
      action: 'created_project',
      resourceType: 'Project',
      resourceId: project._id.toString(),
      details: { title: project.title, status: project.status },
    }).catch(() => undefined);

    return project;
  }

  async getProjectsByWorkspace(workspaceId: string, userId: string) {
    const workspace = await this.workspaceModel.findOne({ _id: workspaceId, deletedAt: null });
    if (!workspace) {
      throw new NotFoundException('Workspace không tồn tại');
    }

    const wsMember = workspace.members.find(
      (m: any) => (m.user?._id?.toString() || m.user?.toString()) === userId.toString()
        && m.status !== 'pending',
    );
    if (!wsMember) {
      throw new ForbiddenException('Bạn không có quyền truy cập workspace này');
    }
    const isWsAdminOrOwner = wsMember && ['owner', 'admin'].includes(wsMember.role);

    let query: any = { workspace: workspaceId, isArchived: { $ne: true }, deletedAt: null };

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

  async getArchivedProjects(userId: string, page = 1, limit = 12) {
    const safePage = Math.max(1, Number(page) || 1);
    const safeLimit = Math.min(100, Math.max(1, Number(limit) || 12));
    const workspaces = await this.workspaceModel.find({
      members: { $elemMatch: { user: userId, status: { $ne: 'pending' } } },
    }).select('_id name color members');

    const workspaceIds = workspaces.map((workspace) => workspace._id);
    if (workspaceIds.length === 0) {
      return { data: [], pagination: { page: safePage, limit: safeLimit, total: 0, totalPages: 0 } };
    }
    const adminWorkspaceIds = workspaces
      .filter((workspace) => workspace.members.some(
        (member: any) => member.user.toString() === userId.toString()
          && member.status !== 'pending'
          && ['owner', 'admin'].includes(member.role),
      ))
      .map((workspace) => workspace._id);

    const query = {
      workspace: { $in: workspaceIds },
      isArchived: true,
      deletedAt: null,
      $or: [
        { 'members.user': userId },
        { isPrivate: { $ne: true }, workspace: { $in: adminWorkspaceIds } },
      ],
    };
    const [data, total] = await Promise.all([
      this.projectModel.find(query)
        .populate('workspace', 'name color')
        .populate('members.user', 'name email profileImage')
        .populate({
          path: 'tasks',
          match: { deletedAt: null },
          select: 'title status priority dueDate subtasks',
        })
        .sort({ archivedAt: -1, updatedAt: -1 })
        .skip((safePage - 1) * safeLimit)
        .limit(safeLimit),
      this.projectModel.countDocuments(query),
    ]);
    return {
      data,
      pagination: { page: safePage, limit: safeLimit, total, totalPages: Math.ceil(total / safeLimit) },
    };
  }

  async getDeletedProjects(userId: string, page = 1, limit = 12) {
    const safePage = Math.max(1, Number(page) || 1);
    const safeLimit = Math.min(100, Math.max(1, Number(limit) || 12));
    const workspaces = await this.workspaceModel.find({
      members: { $elemMatch: { user: userId, status: { $ne: 'pending' } } },
    }).select('_id members');
    const manageableWorkspaceIds = workspaces
      .filter((workspace) => workspace.members.some(
        (member: any) => member.user.toString() === userId.toString()
          && member.status !== 'pending'
          && ['owner', 'admin'].includes(member.role),
      ))
      .map((workspace) => workspace._id);

    const query = {
      deletedAt: { $ne: null },
      deletedViaWorkspace: { $ne: true },
      $or: [
        { workspace: { $in: manageableWorkspaceIds } },
        { members: { $elemMatch: { user: userId, role: 'manager' } } },
      ],
    };
    const [projects, total] = await Promise.all([
      this.projectModel.find(query)
        .populate('workspace', 'name color')
        .sort({ deletedAt: -1 })
        .skip((safePage - 1) * safeLimit)
        .limit(safeLimit)
        .lean(),
      this.projectModel.countDocuments(query),
    ]);
    const retentionMs = 30 * 24 * 60 * 60 * 1000;
    const data = projects.map((project: any) => ({
      ...project,
      expiresAt: project.deletedAt
        ? new Date(new Date(project.deletedAt).getTime() + retentionMs)
        : null,
    }));
    return {
      data,
      pagination: { page: safePage, limit: safeLimit, total, totalPages: Math.ceil(total / safeLimit) },
    };
  }

  async getProjectById(projectId: string, userId: string) {
    const project = await this.projectModel
      .findOne({ _id: projectId, deletedAt: null })
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
    const project = await this.projectModel.findOne({ _id: projectId, deletedAt: null });
    if (!project) {
      throw new NotFoundException('Không tìm thấy dự án để cập nhật');
    }
    const changedFields = Object.entries(updateProjectDto)
      .filter(([, value]) => value !== undefined)
      .map(([key]) => key);
    const isOnlyUnarchive = project.isArchived
      && changedFields.length === 1
      && changedFields[0] === 'isArchived'
      && updateProjectDto.isArchived === false;
    if (project.isArchived && !isOnlyUnarchive) {
      throw new BadRequestException('Dự án đã lưu trữ. Hãy đưa dự án trở lại trước khi chỉnh sửa.');
    }

    // Kiểm tra quyền chỉnh sửa project settings / members:
    // Phải là Manager của dự án hoặc Owner/Admin Workspace
    const isProjectManager = project.members.some(
      (m: any) => (m.user?._id?.toString() || m.user?.toString()) === userId.toString() && m.role === 'manager',
    );
    const workspace = await this.workspaceModel.findById(project.workspace);
    if (workspace?.deletedAt) throw new NotFoundException('Workspace không tồn tại');
    const wsMember = workspace?.members.find(
      (m: any) => (m.user?._id?.toString() || m.user?.toString()) === userId.toString(),
    );
    const isWsAdminOrOwner = wsMember && ['owner', 'admin'].includes(wsMember.role);

    if (!isProjectManager && !isWsAdminOrOwner) {
      throw new ForbiddenException('Bạn không có quyền chỉnh sửa dự án này');
    }

    const updatePayload: any = { ...updateProjectDto };
    if (updateProjectDto.members) {
      updatePayload.members = this.validateProjectMembers(updateProjectDto.members, workspace!);
    }
    if (typeof updateProjectDto.isArchived === 'boolean') {
      updatePayload.archivedAt = updateProjectDto.isArchived ? new Date() : null;
    }

    const updated = await this.projectModel.findByIdAndUpdate(projectId, updatePayload, {
      returnDocument: 'after',
    })
      .populate('members.user', 'name email profileImage')
      .populate('createdBy', 'name email profileImage')
      .populate('workspace', 'name color');

    if (updated && updateProjectDto.status && updateProjectDto.status !== project.status) {
      await this.activitiesService.logActivity({
        user: userId,
        action: updateProjectDto.status === 'COMPLETED' ? 'completed_project' : 'updated_project',
        resourceType: 'Project',
        resourceId: projectId,
        details: {
          description: 'Đã chuyển trạng thái dự án',
          fromStatus: project.status,
          toStatus: updateProjectDto.status,
        },
      });
    }

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
    if (workspace?.deletedAt) throw new NotFoundException('Workspace không tồn tại');
    const wsMember = workspace?.members.find(
      (m: any) => (m.user?._id?.toString() || m.user?.toString()) === userId.toString(),
    );
    const isWsAdminOrOwner = wsMember && ['owner', 'admin'].includes(wsMember.role);

    if (!isProjectManager && !isWsAdminOrOwner) {
      throw new ForbiddenException('Bạn không có quyền xóa dự án này');
    }

    project.deletedAt = new Date();
    await project.save();
    return { message: 'Đã chuyển dự án vào thùng rác' };
  }

  async restoreProject(projectId: string, userId: string) {
    const project = await this.projectModel.findOne({ _id: projectId, deletedAt: { $ne: null } });
    if (!project) throw new NotFoundException('Không tìm thấy dự án trong thùng rác');
    if (project.deletedViaWorkspace) {
      throw new BadRequestException('Hãy khôi phục workspace trước khi khôi phục dự án');
    }

    const isProjectManager = project.members.some(
      (member: any) => member.user.toString() === userId.toString() && member.role === 'manager',
    );
    const workspace = await this.workspaceModel.findById(project.workspace);
    if (!workspace || workspace.deletedAt) {
      throw new BadRequestException('Hãy khôi phục workspace trước khi khôi phục dự án');
    }
    const workspaceMember = workspace?.members.find(
      (member: any) => member.user.toString() === userId.toString() && member.status !== 'pending',
    );
    if (!isProjectManager && !['owner', 'admin'].includes(workspaceMember?.role || '')) {
      throw new ForbiddenException('Bạn không có quyền khôi phục dự án này');
    }

    project.deletedAt = null;
    await project.save();
    return project;
  }

  private validateProjectMembers(members: any[], workspace: Workspace) {
    const allowedRoles = new Set(['manager', 'contributor', 'viewer']);
    const activeWorkspaceMemberIds = new Set(
      workspace.members
        .filter((member: any) => member.status !== 'pending')
        .map((member: any) => member.user.toString()),
    );
    const seen = new Set<string>();

    return members.map((member: any) => {
      const memberId = member.user?._id?.toString() || member.user?.toString();
      if (!memberId || !activeWorkspaceMemberIds.has(memberId)) {
        throw new BadRequestException('Thành viên dự án phải thuộc workspace');
      }
      if (!allowedRoles.has(member.role)) {
        throw new BadRequestException('Vai trò thành viên dự án không hợp lệ');
      }
      if (seen.has(memberId)) {
        throw new BadRequestException('Danh sách dự án có thành viên bị trùng');
      }
      seen.add(memberId);
      return { user: memberId, role: member.role };
    });
  }
}
