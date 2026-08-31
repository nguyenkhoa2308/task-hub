import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Workspace } from '../workspaces/schemas/workspace.schema';
import { Project } from '../projects/schemas/project.schema';
import { Task } from '../tasks/schemas/task.schema';
import { ProjectAccessService } from '../access-control/project-access.service';

@Injectable()
export class ReportsService {
  constructor(
    @InjectModel(Workspace.name) private readonly workspaceModel: Model<Workspace>,
    @InjectModel(Project.name) private readonly projectModel: Model<Project>,
    @InjectModel(Task.name) private readonly taskModel: Model<Task>,
    private readonly projectAccessService: ProjectAccessService,
  ) {}

  async exportWorkspace(workspaceId: string, userId: string) {
    const workspace = await this.workspaceModel.findOne({ _id: workspaceId, deletedAt: null });
    if (!workspace) throw new NotFoundException('Workspace không tồn tại');
    const membership = workspace.members.find((member: any) => member.user.toString() === userId && member.status !== 'pending');
    if (!membership) throw new ForbiddenException('Bạn không có quyền xuất báo cáo workspace này');
    const projects = await this.projectModel.find({ workspace: workspaceId, deletedAt: null, isArchived: false }).select('_id title isPrivate members');
    const isAdmin = ['owner', 'admin'].includes(membership.role);
    const visibleProjects = projects.filter((project) => {
      const belongs = project.members.some((member: any) => member.user.toString() === userId);
      return project.isPrivate ? belongs : (belongs || isAdmin);
    });
    const csv = await this.buildTaskCsv(visibleProjects.map((project) => project._id), workspace.name);
    return { filename: `${this.safeFilename(workspace.name)}-report.csv`, csv };
  }

  async exportProject(projectId: string, userId: string) {
    const project = await this.projectAccessService.assertCanReadProject(projectId, userId);
    const workspace = await this.workspaceModel.findById(project.workspace).select('name');
    const csv = await this.buildTaskCsv([project._id], workspace?.name || 'Workspace');
    return { filename: `${this.safeFilename(project.title)}-report.csv`, csv };
  }

  private async buildTaskCsv(projectIds: any[], workspaceName: string) {
    const tasks = await this.taskModel.find({ project: { $in: projectIds }, deletedAt: null })
      .populate('project', 'title')
      .populate('assignees', 'name email')
      .sort({ project: 1, dueDate: 1, createdAt: 1 })
      .limit(10000)
      .lean();
    const headers = ['Workspace', 'Dự án', 'Công việc', 'Trạng thái', 'Ưu tiên', 'Ngày bắt đầu', 'Hạn chót', 'Người phụ trách', 'Subtask hoàn thành', 'Tổng subtask'];
    const rows = tasks.map((task: any) => [
      workspaceName,
      task.project?.title || '',
      task.title,
      task.status,
      task.priority,
      this.date(task.startDate),
      this.date(task.dueDate),
      (task.assignees || []).map((user: any) => user.name || user.email).join('; '),
      (task.subtasks || []).filter((subtask: any) => subtask.completed).length,
      (task.subtasks || []).length,
    ]);
    return [headers, ...rows].map((row) => row.map((value) => this.escape(value)).join(',')).join('\r\n');
  }

  private escape(value: unknown) {
    const text = String(value ?? '');
    return `"${text.replace(/"/g, '""')}"`;
  }

  private date(value?: Date) {
    return value ? new Date(value).toISOString().slice(0, 10) : '';
  }

  private safeFilename(value: string) {
    return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9_-]+/g, '-').replace(/^-|-$/g, '').toLowerCase() || 'report';
  }
}
