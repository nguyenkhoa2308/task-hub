import { ForbiddenException, Injectable, Logger, NotFoundException, OnModuleInit } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Task } from '../tasks/schemas/task.schema';
import { Project } from '../projects/schemas/project.schema';
import { Workspace } from '../workspaces/schemas/workspace.schema';
import { Comment } from '../comments/schemas/comment.schema';
import { Activity } from '../activities/schemas/activity.schema';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

@Injectable()
export class CleanupService implements OnModuleInit {
  private readonly logger = new Logger(CleanupService.name);
  private readonly retentionMs = 30 * 24 * 60 * 60 * 1000;

  constructor(
    @InjectModel(Task.name) private readonly taskModel: Model<Task>,
    @InjectModel(Project.name) private readonly projectModel: Model<Project>,
    @InjectModel(Workspace.name) private readonly workspaceModel: Model<Workspace>,
    @InjectModel(Comment.name) private readonly commentModel: Model<Comment>,
    @InjectModel(Activity.name) private readonly activityModel: Model<Activity>,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  async onModuleInit() {
    // TTL xóa thẳng document nên không thể dọn Cloudinary; job bên dưới thay thế nó.
    try {
      if (await this.taskModel.collection.indexExists('deletedAt_1')) {
        await this.taskModel.collection.dropIndex('deletedAt_1');
        this.logger.log('Đã gỡ TTL index cũ của task');
      }
    } catch (error: any) {
      this.logger.warn(`Không thể kiểm tra TTL index cũ: ${error?.message || error}`);
    }
  }

  @Cron('0 30 2 * * *', { timeZone: 'Asia/Ho_Chi_Minh' })
  async purgeExpiredTrash() {
    const cutoff = new Date(Date.now() - this.retentionMs);
    const workspaces = await this.workspaceModel
      .find({ deletedAt: { $lte: cutoff } })
      .limit(50);
    for (const workspace of workspaces) {
      try {
        await this.purgeWorkspace(workspace);
      } catch (error: any) {
        this.logger.error(`Không thể purge workspace ${workspace._id}: ${error?.message || error}`);
      }
    }

    const projects = await this.projectModel.find({ deletedAt: { $lte: cutoff } }).limit(100);
    for (const project of projects) {
      try {
        await this.purgeProject(project);
      } catch (error: any) {
        this.logger.error(`Không thể purge project ${project._id}: ${error?.message || error}`);
      }
    }

    const tasks = await this.taskModel.find({ deletedAt: { $lte: cutoff } }).limit(200);
    for (const task of tasks) {
      try {
        await this.purgeTask(task);
      } catch (error: any) {
        this.logger.error(`Không thể purge task ${task._id}: ${error?.message || error}`);
      }
    }
  }

  async permanentlyDelete(kind: 'tasks' | 'projects' | 'workspaces', ids: string[], userId: string) {
    let deleted = 0;
    for (const id of [...new Set(ids)]) {
      if (kind === 'tasks') {
        const task = await this.taskModel.findOne({ _id: id, deletedAt: { $ne: null } });
        if (!task) throw new NotFoundException('Không tìm thấy công việc trong thùng rác');
        const ownsTask = task.deletedBy?.toString() === userId || task.createdBy?.toString() === userId;
        if (!ownsTask) throw new ForbiddenException('Bạn không có quyền xóa vĩnh viễn công việc này');
        await this.purgeTask(task);
      } else if (kind === 'projects') {
        const project = await this.projectModel.findOne({ _id: id, deletedAt: { $ne: null }, deletedViaWorkspace: { $ne: true } });
        if (!project) throw new NotFoundException('Không tìm thấy dự án trong thùng rác');
        const workspace = await this.workspaceModel.findById(project.workspace).select('members owner');
        const member = workspace?.members.find((item: any) => item.user.toString() === userId);
        const canDelete = workspace?.owner?.toString() === userId
          || ['owner', 'admin'].includes(member?.role || '')
          || project.members.some((item: any) => item.user.toString() === userId && item.role === 'manager');
        if (!canDelete) throw new ForbiddenException('Bạn không có quyền xóa vĩnh viễn dự án này');
        await this.purgeProject(project);
      } else {
        const workspace = await this.workspaceModel.findOne({ _id: id, deletedAt: { $ne: null } });
        if (!workspace) throw new NotFoundException('Không tìm thấy workspace trong thùng rác');
        if (workspace.owner.toString() !== userId) throw new ForbiddenException('Chỉ owner có thể xóa vĩnh viễn workspace');
        await this.purgeWorkspace(workspace);
      }
      deleted += 1;
    }
    return { success: true, deleted };
  }

  async emptyUserTrash(userId: string) {
    let deleted = 0;
    const workspaces = await this.workspaceModel.find({ owner: userId, deletedAt: { $ne: null } });
    for (const workspace of workspaces) { await this.purgeWorkspace(workspace); deleted += 1; }

    const manageableWorkspaces = await this.workspaceModel.find({
      members: { $elemMatch: { user: userId, role: { $in: ['owner', 'admin'] }, status: { $ne: 'pending' } } },
    }).select('_id');
    const projects = await this.projectModel.find({
      deletedAt: { $ne: null },
      deletedViaWorkspace: { $ne: true },
      $or: [
        { workspace: { $in: manageableWorkspaces.map((workspace) => workspace._id) } },
        { members: { $elemMatch: { user: userId, role: 'manager' } } },
      ],
    });
    for (const project of projects) { await this.purgeProject(project); deleted += 1; }

    const tasks = await this.taskModel.find({
      deletedAt: { $ne: null },
      $or: [{ deletedBy: userId }, { createdBy: userId }],
    });
    for (const task of tasks) { await this.purgeTask(task); deleted += 1; }
    return { success: true, deleted };
  }

  async purgeWorkspace(workspace: Workspace) {
    const projects = await this.projectModel.find({ workspace: workspace._id });
    for (const project of projects) await this.purgeProject(project);

    await this.activityModel.deleteMany({
      resourceType: 'Workspace',
      resourceId: workspace._id,
    });
    await this.workspaceModel.deleteOne({ _id: workspace._id });
  }

  async purgeProject(project: Project) {
    const tasks = await this.taskModel.find({ project: project._id });
    for (const task of tasks) await this.purgeTask(task);

    await this.activityModel.deleteMany({ resourceType: 'Project', resourceId: project._id });
    await this.workspaceModel.updateOne(
      { _id: project.workspace },
      { $pull: { projects: project._id } },
    );
    await this.projectModel.deleteOne({ _id: project._id });
  }

  async purgeTask(task: Task) {
    for (const attachment of task.attachments || []) {
      if (attachment.cloudinaryPublicId && attachment.cloudinaryResourceType) {
        await this.cloudinaryService.deleteAsset(
          attachment.cloudinaryPublicId,
          attachment.cloudinaryResourceType,
          attachment.cloudinaryDeliveryType || 'authenticated',
        );
      }
    }

    await Promise.all([
      this.commentModel.deleteMany({ task: task._id }),
      this.activityModel.deleteMany({ resourceType: 'Task', resourceId: task._id }),
      this.projectModel.updateOne({ _id: task.project }, { $pull: { tasks: task._id } }),
    ]);
    await this.taskModel.deleteOne({ _id: task._id });
  }
}
