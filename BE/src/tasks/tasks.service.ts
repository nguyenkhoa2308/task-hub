import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { catchError, EMPTY, from, map, mergeMap, Observable, Subject } from 'rxjs';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { Task } from './schemas/task.schema';
import { Project } from '../projects/schemas/project.schema';
import { Workspace } from '../workspaces/schemas/workspace.schema';

import { ActivitiesService } from '../activities/activities.service';
import { NotificationsService } from '../notifications/notifications.service';
import { ProjectAccessService } from '../access-control/project-access.service';
import { extname } from 'node:path';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

@Injectable()
export class TasksService {
  private readonly taskSubject = new Subject<{ projectId: string; action: string; task: any }>();

  constructor(
    @InjectModel(Task.name) private readonly taskModel: Model<Task>,
    @InjectModel(Project.name) private readonly projectModel: Model<Project>,
    @InjectModel(Workspace.name) private readonly workspaceModel: Model<Workspace>,
    private readonly activitiesService: ActivitiesService,
    private readonly notificationsService: NotificationsService,
    private readonly projectAccessService: ProjectAccessService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  private assertProjectAcceptsTaskChanges(project: Project) {
    const lockedStatuses = new Set(['ON_HOLD', 'COMPLETED', 'CANCELLED']);
    if (!lockedStatuses.has(project.status)) return;
    const labels: Record<string, string> = {
      ON_HOLD: 'tạm dừng', COMPLETED: 'hoàn thành', CANCELLED: 'đã hủy',
    };
    throw new BadRequestException(
      'Dự án đang ở trạng thái ' + labels[project.status] + '. Hãy mở lại dự án trước khi thay đổi công việc.',
    );
  }

  private async validateTaskAssignees(project: Project, assignees?: string[]) {
    if (!assignees) return;
    const uniqueAssigneeIds = [...new Set(assignees.filter(Boolean))];
    if (uniqueAssigneeIds.some((id) => !Types.ObjectId.isValid(id))) {
      throw new BadRequestException('Danh sách người thực hiện không hợp lệ');
    }

    const workspace = await this.workspaceModel.findOne({
      _id: project.workspace,
      deletedAt: null,
    });
    if (!workspace) throw new NotFoundException('Workspace không tồn tại');

    const activeWorkspaceMemberIds = new Set(
      workspace.members
        .filter((member: any) => member.status !== 'pending')
        .map((member: any) => (member.user?._id || member.user).toString()),
    );
    const eligibleProjectMemberIds = new Set(
      project.members
        .filter((member: any) => member.role !== 'viewer')
        .map((member: any) => (member.user?._id || member.user).toString()),
    );
    const invalidAssignees = uniqueAssigneeIds.filter(
      (id) => !activeWorkspaceMemberIds.has(id) || !eligibleProjectMemberIds.has(id),
    );
    if (invalidAssignees.length > 0) {
      throw new BadRequestException(
        'Chỉ có thể giao việc cho thành viên Manager hoặc Contributor của dự án',
      );
    }
  }

  getTasksEventStream(userId: string): Observable<{ projectId: string; action: string; task: any }> {
    return this.taskSubject.pipe(
      mergeMap((event) =>
        from(
          this.projectAccessService.assertCanReadProject(event.projectId, userId),
        ).pipe(
          map(() => event),
          // Một event không có quyền chỉ bị bỏ qua; kết nối SSE vẫn tiếp tục sống.
          catchError(() => EMPTY),
        ),
      ),
    );
  }

  async checkTaskEditPermission(
    projectId: string,
    userId: string,
    task?: any,
    allowArchivedTaskRestore = false,
  ) {
    if (!userId) return;

    const project = await this.projectModel.findById(projectId);
    if (!project) {
      throw new NotFoundException('Dự án không tồn tại');
    }
    if (project.deletedAt) {
      throw new NotFoundException('Dự án đang ở trong thùng rác');
    }
    if (project.isArchived) {
      throw new BadRequestException('Dự án đã lưu trữ. Hãy đưa dự án trở lại trước khi thay đổi công việc.');
    }
    if (task?.isArchived && !allowArchivedTaskRestore) {
      throw new BadRequestException('Công việc đã lưu trữ. Hãy đưa công việc trở lại trước khi chỉnh sửa.');
    }
    this.assertProjectAcceptsTaskChanges(project);

    const workspace = await this.workspaceModel.findById(project.workspace);
    const wsMember = workspace?.members.find(
      (m: any) =>
        (m.user?._id?.toString() || m.user?.toString()) === userId.toString()
        && m.status !== 'pending',
    );
    if (!wsMember) {
      throw new ForbiddenException('Bạn không có quyền chỉnh sửa công việc trong dự án này');
    }

    const isWsAdminOrOwner = ['owner', 'admin'].includes(wsMember.role);
    if (isWsAdminOrOwner) return;

    const projectMember = project.members.find(
      (m: any) => (m.user?._id?.toString() || m.user?.toString()) === userId.toString(),
    );
    if (!projectMember) {
      throw new ForbiddenException('Bạn chưa được thêm vào dự án này');
    }
    if (projectMember.role === 'viewer') {
      throw new ForbiddenException('Tài khoản của bạn chỉ có quyền xem trong dự án này');
    }
  }

  async createTask(createTaskDto: CreateTaskDto, userId: string) {
    const { projectId, title, description, status, priority, assignees, startDate, dueDate, tags } = createTaskDto;

    if (!projectId) {
      throw new BadRequestException('Project ID là bắt buộc');
    }
    if (startDate && dueDate && new Date(startDate) > new Date(dueDate)) {
      throw new BadRequestException('Ngày bắt đầu không thể sau hạn hoàn thành');
    }

    await this.checkTaskEditPermission(projectId, userId);

    const project = await this.projectModel.findById(projectId);
    if (!project) {
      throw new NotFoundException('Dự án không tồn tại');
    }
    await this.validateTaskAssignees(project, assignees);

    let parsedTags: string[] = [];
    if (typeof tags === 'string') {
      parsedTags = tags.split(',').map((t: string) => t.trim()).filter(Boolean);
    } else if (Array.isArray(tags)) {
      parsedTags = tags;
    }

    // Tự động thêm Người tạo và Assignees vào Watchers (chuẩn Jira / Linear)
    const initialWatchers = new Set<string>();
    if (userId) initialWatchers.add(userId);
    if (Array.isArray(assignees)) {
      assignees.forEach((aId: string) => {
        if (aId) initialWatchers.add(aId);
      });
    }

    const task = await this.taskModel.create({
      title,
      description,
      project: projectId,
      status: status || 'To Do',
      priority: priority || 'Medium',
      assignees: [...new Set(assignees || [])],
      watchers: Array.from(initialWatchers),
      startDate: startDate ? new Date(startDate) : undefined,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      tags: parsedTags,
      createdBy: userId,
    });

    // Giữ task, danh sách task của project và tiến độ nhất quán với nhau.
    try {
      const linkedProject = await this.projectModel.findByIdAndUpdate(projectId, {
        $push: { tasks: task._id },
      });
      if (!linkedProject) {
        throw new NotFoundException("Dự án không tồn tại");
      }

      await this.updateProjectProgress(projectId, userId);
    } catch (error) {
      await this.projectModel.updateOne(
        { _id: projectId },
        { $pull: { tasks: task._id } },
      ).catch(() => undefined);
      await this.taskModel.deleteOne({ _id: task._id }).catch(() => undefined);
      throw error;
    }

    // Ghi nhật ký khởi tạo công việc
    await this.activitiesService.logActivity({
      user: userId,
      action: 'created_task',
      resourceType: 'Task',
      resourceId: task._id.toString(),
      details: { title: task.title, description: 'đã khởi tạo công việc này' },
    }).catch(() => undefined);

    // Gửi thông báo cho những người được phân công
    if (Array.isArray(assignees) && assignees.length > 0) {
      try {
        for (const assigneeId of assignees) {
          const aId = typeof assigneeId === 'string' ? assigneeId : (assigneeId as any)._id?.toString();
          if (aId && aId !== userId) {
            await this.notificationsService.createNotification({
              recipient: aId,
              sender: userId,
              type: 'TASK_ASSIGNED',
              title: 'Phân công công việc mới',
              message: `đã giao công việc "${title}" cho bạn`,
              link: `/workspaces/${project.workspace || ''}?taskId=${task._id}`,
            });
          }
        }
      } catch (e) {
        // Ignore notification errors
      }
    }

    const populated = await this.taskModel
      .findById(task._id)
      .populate('assignees', 'name email profileImage')
      .populate('createdBy', 'name email profileImage')
      .populate('watchers', 'name email profileImage');

    if (populated) {
      this.taskSubject.next({
        projectId: projectId.toString(),
        action: 'create',
        task: populated,
      });
    }

    return populated;
  }

  async uploadAttachment(taskId: string, userId: string, file: any) {
    if (!file?.buffer || !file.originalname) {
      throw new BadRequestException('Vui lòng chọn một tệp để tải lên');
    }
    const blockedMimeTypes = new Set([
      'text/html', 'image/svg+xml', 'application/javascript', 'text/javascript',
      'application/x-msdownload', 'application/x-sh', 'application/x-bat',
    ]);
    if (blockedMimeTypes.has(file.mimetype)) {
      throw new BadRequestException('Loại tệp này không được phép tải lên');
    }

    const task = await this.taskModel.findOne({ _id: taskId, deletedAt: null });
    if (!task) throw new NotFoundException('Không tìm thấy công việc');
    await this.checkTaskEditPermission(task.project.toString(), userId, task);

    const extension = extname(file.originalname).toLowerCase().replace(/[^.a-z0-9]/g, '');
    const uploaded = await this.cloudinaryService.uploadBuffer(file.buffer, {
      folder: 'task-hub/tasks',
      resource_type: 'auto',
      type: 'authenticated',
      use_filename: true,
      unique_filename: true,
      filename_override: file.originalname,
    });

    const attachmentId = new Types.ObjectId();
    task.attachments.push({
      _id: attachmentId,
      fileName: file.originalname,
      fileUrl: `/tasks/${taskId}/attachments/${attachmentId.toString()}/download`,
      cloudinaryPublicId: uploaded.public_id,
      cloudinaryFormat: uploaded.format || extension.replace('.', '') || 'bin',
      cloudinaryResourceType: uploaded.resource_type === 'video'
        ? 'video'
        : uploaded.resource_type === 'raw' ? 'raw' : 'image',
      cloudinaryDeliveryType: uploaded.type || 'authenticated',
      fileType: file.mimetype || 'application/octet-stream',
      fileSize: uploaded.bytes || file.size,
      uploadedBy: userId,
      uploadedAt: new Date(),
    } as any);
    try {
      await task.save();
    } catch (error) {
      await this.cloudinaryService.deleteAsset(
        uploaded.public_id,
        uploaded.resource_type === 'video' ? 'video' : uploaded.resource_type === 'raw' ? 'raw' : 'image',
        uploaded.type || 'authenticated',
      ).catch(() => undefined);
      throw error;
    }
    const saved = task.attachments[task.attachments.length - 1] as any;
    return saved;
  }

  async getAttachmentDownloadUrl(taskId: string, attachmentId: string, userId: string) {
    const task = await this.taskModel.findOne({ _id: taskId, deletedAt: null });
    if (!task) throw new NotFoundException('Không tìm thấy công việc');
    await this.projectAccessService.assertCanReadProject(task.project.toString(), userId);
    const attachment = task.attachments.find((item: any) => item._id.toString() === attachmentId);
    if (!attachment?.cloudinaryPublicId || !attachment.cloudinaryResourceType) {
      throw new NotFoundException('Không tìm thấy tệp đính kèm');
    }
    return this.cloudinaryService.createPrivateDownloadUrl(
      attachment.cloudinaryPublicId,
      attachment.cloudinaryFormat || 'bin',
      attachment.cloudinaryResourceType,
    );
  }

  private async updateProjectProgress(projectId: string, actorId?: string) {
    const totalTasks = await this.taskModel.countDocuments({ project: projectId, isArchived: false, deletedAt: null });
    const project = await this.projectModel.findById(projectId).select('status');
    if (!project) return 0;
    if (totalTasks === 0) {
      await this.projectModel.findByIdAndUpdate(projectId, { progress: 0 });
      return 0;
    }

    const completedTasks = await this.taskModel.countDocuments({
      project: projectId,
      isArchived: false,
      deletedAt: null,
      status: { $in: ['Done', 'DONE', 'Completed', 'COMPLETED', 'Hoàn thành'] },
    });

    const progressPercent = Math.round((completedTasks / totalTasks) * 100);
    let nextStatus = project.status;
    if (project.status === 'PLANNING') {
      const startedTasks = await this.taskModel.countDocuments({
        project: projectId, isArchived: false, deletedAt: null,
        status: { $nin: ['To Do', 'TO_DO'] },
      });
      if (startedTasks > 0) nextStatus = 'IN_PROGRESS';
    }
    await this.projectModel.findByIdAndUpdate(projectId, { progress: progressPercent, status: nextStatus });
    if (actorId && nextStatus !== project.status) {
      await this.activitiesService.logActivity({
        user: actorId,
        action: 'updated_project',
        resourceType: 'Project',
        resourceId: projectId,
        details: {
          description: 'Dự án tự động bắt đầu khi công việc đầu tiên được thực hiện',
          fromStatus: project.status,
          toStatus: nextStatus,
          automatic: true,
        },
      });
    }
    return progressPercent;
  }

  private getTaskAggregationSort(sortBy?: string, projectView = false) {
    const doneStatuses = ['Done', 'DONE', 'Completed', 'COMPLETED', 'Hoàn thành'];
    const now = new Date();
    const dueSoon = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    const normalizedSort = sortBy || 'deadline_priority';

    if (normalizedSort === 'newest') return { stages: [], sort: { createdAt: -1 } };
    if (normalizedSort === 'oldest') return { stages: [], sort: { createdAt: 1 } };
    if (normalizedSort === 'dueDate_asc') return { stages: [], sort: { dueDate: 1, createdAt: -1 } };
    if (normalizedSort === 'dueDate_desc') return { stages: [], sort: { dueDate: -1, createdAt: -1 } };
    if (projectView && normalizedSort === 'title_az') {
      return { stages: [], sort: { title: 1, createdAt: -1 } };
    }

    const stages: any[] = [{
      $addFields: {
        _doneRank: { $cond: [{ $in: ['$status', doneStatuses] }, 1, 0] },
        _priorityRank: {
          $switch: {
            branches: [
              { case: { $in: ['$priority', ['High', 'HIGH']] }, then: 3 },
              { case: { $in: ['$priority', ['Medium', 'MEDIUM']] }, then: 2 },
              { case: { $in: ['$priority', ['Low', 'LOW']] }, then: 1 },
            ],
            default: 0,
          },
        },
        _dueSort: { $ifNull: ['$dueDate', new Date('9999-12-31T23:59:59.999Z')] },
      },
    }];

    if (normalizedSort === 'priority' || normalizedSort === 'priority_only') {
      return { stages, sort: { _doneRank: 1, _priorityRank: -1, createdAt: -1 } };
    }
    if (projectView && normalizedSort === 'deadline_only') {
      return { stages, sort: { _doneRank: 1, _dueSort: 1, createdAt: -1 } };
    }

    stages.push({
      $addFields: {
        _deadlineBucket: {
          $switch: {
            branches: [
              { case: { $eq: ['$_doneRank', 1] }, then: 3 },
              { case: { $eq: [{ $type: '$dueDate' }, 'missing'] }, then: 2 },
              { case: { $eq: ['$dueDate', null] }, then: 2 },
              { case: { $lt: ['$dueDate', now] }, then: 0 },
              { case: { $lte: ['$dueDate', dueSoon] }, then: 1 },
            ],
            default: 2,
          },
        },
      },
    });
    return {
      stages,
      sort: { _deadlineBucket: 1, _priorityRank: -1, _dueSort: 1, createdAt: -1 },
    };
  }

  private async getPaginatedTasks(
    query: any,
    page: number,
    limit: number,
    sortBy?: string,
    projectView = false,
    populateProject = false,
  ) {
    const { stages, sort } = this.getTaskAggregationSort(sortBy, projectView);
    const [rows, total] = await Promise.all([
      this.taskModel.aggregate([
        { $match: query },
        ...stages,
        { $sort: sort as any },
        { $skip: (page - 1) * limit },
        { $limit: limit },
        { $project: { _id: 1 } },
      ]),
      this.taskModel.countDocuments(query),
    ]);
    const ids = rows.map((row: any) => row._id);
    if (ids.length === 0) {
      return { data: [], pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
    }

    let taskQuery = this.taskModel
      .find({ _id: { $in: ids } })
      .populate('assignees', 'name email profileImage')
      .populate('createdBy', 'name email profileImage')
      .populate('watchers', 'name email profileImage');
    if (populateProject) {
      taskQuery = taskQuery.populate({
        path: 'project',
        select: 'title name workspace deletedAt',
        populate: { path: 'workspace', select: 'name color' },
      });
    }
    const tasks = await taskQuery;
    const order = new Map(ids.map((id: any, index: number) => [id.toString(), index]));
    tasks.sort((a: any, b: any) =>
      (order.get(a._id.toString()) ?? 0) - (order.get(b._id.toString()) ?? 0));
    return {
      data: tasks,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getMyTasks(
    userId: string,
    filters: {
      status?: string;
      priority?: string;
      workspaceId?: string;
      search?: string;
      sortBy?: string;
      isArchived?: boolean;
      page?: number;
      limit?: number;
    } = {},
  ) {
    const userObjectId = new Types.ObjectId(userId);
    const query: any = {
      $or: [{ assignees: userObjectId }, { createdBy: userObjectId }],
      deletedAt: null,
    };

    // Filter isArchived
    if (filters.isArchived !== undefined) {
      query.isArchived = filters.isArchived;
    } else {
      query.isArchived = false;
    }

    // Filter status
    if (filters.status) {
      query.status = filters.status;
    }

    // Filter priority
    if (filters.priority) {
      query.priority = filters.priority;
    }

    // Filter search text
    if (filters.search) {
      const escapedSearch = filters.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const searchRegex = new RegExp(escapedSearch, 'i');
      query.$and = query.$and || [];
      query.$and.push({
        $or: [{ title: searchRegex }, { description: searchRegex }],
      });
    }

    const candidateProjectIds = await this.taskModel.distinct('project', query);
    const projectQuery: any = {
      _id: { $in: candidateProjectIds },
      isArchived: false,
      deletedAt: null,
    };
    if (filters.workspaceId && filters.workspaceId !== 'all') {
      if (!Types.ObjectId.isValid(filters.workspaceId)) {
        throw new BadRequestException('Workspace ID không hợp lệ');
      }
      projectQuery.workspace = new Types.ObjectId(filters.workspaceId);
    }
    const activeProjectIds = await this.projectModel.distinct('_id', projectQuery);
    query.project = { $in: activeProjectIds };

    const page = Math.max(1, Number(filters.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(filters.limit) || 25));
    return this.getPaginatedTasks(query, page, limit, filters.sortBy, false, true);
  }
  async getTasksByProject(
    projectId: string,
    userId: string,
    options: { sortBy?: string; status?: string; page?: number; limit?: number } = {},
  ) {
    await this.projectAccessService.assertCanReadProject(projectId, userId);

    const query: any = {
      project: new Types.ObjectId(projectId),
      isArchived: false,
      deletedAt: null,
    };
    if (options.status) query.status = options.status;

    const page = Math.max(1, Number(options.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(options.limit) || 25));
    return this.getPaginatedTasks(query, page, limit, options.sortBy, true, false);
  }
  async getTaskById(taskId: string, userId: string) {
    const task = await this.taskModel
      .findOne({ _id: taskId, deletedAt: null })
      .populate('assignees', 'name email profileImage')
      .populate('createdBy', 'name email profileImage')
      .populate('watchers', 'name email profileImage')
      .populate('project', 'title name');

    if (!task) {
      throw new NotFoundException('Không tìm thấy công việc');
    }

    const projectId = (task.project as any)._id?.toString()
      || (task.project as any).toString();
    await this.projectAccessService.assertCanReadProject(projectId, userId);

    return task;
  }

  async updateTask(taskId: string, updateTaskDto: UpdateTaskDto, userId?: string) {
    const existingTask = await this.taskModel.findOne({ _id: taskId, deletedAt: null });
    if (!existingTask) {
      throw new NotFoundException('Không tìm thấy công việc để cập nhật');
    }

    const changedFields = Object.entries(updateTaskDto)
      .filter(([, value]) => value !== undefined)
      .map(([key]) => key);
    const isOnlyUnarchive = existingTask.isArchived
      && changedFields.length === 1
      && changedFields[0] === 'isArchived'
      && updateTaskDto.isArchived === false;

    if (userId && existingTask.project) {
      await this.checkTaskEditPermission(
        existingTask.project.toString(),
        userId,
        existingTask,
        isOnlyUnarchive,
      );
    }

    const project = await this.projectModel.findById(existingTask.project);
    if (!project) throw new NotFoundException('Dự án không tồn tại');
    this.assertProjectAcceptsTaskChanges(project);
    await this.validateTaskAssignees(project, updateTaskDto.assignees);

    const updateData: any = { ...updateTaskDto };
    if (Array.isArray(updateTaskDto.assignees)) {
      updateData.assignees = [...new Set(updateTaskDto.assignees)];
    }
    let removedCloudinaryAttachments: any[] = [];

    if (typeof updateTaskDto.isArchived === 'boolean') {
      updateData.archivedAt = updateTaskDto.isArchived ? new Date() : null;
    }

    // Tự động ghi nhận ngày hoàn thành khi chuyển trạng thái sang Done / DONE
    if (updateTaskDto.status === 'Done' || updateTaskDto.status === 'DONE') {
      updateData.completedAt = new Date();
    }

    if ('dueDate' in updateTaskDto) {
      if (updateTaskDto.dueDate) {
        const parsedDate = new Date(updateTaskDto.dueDate);
        updateData.dueDate = isNaN(parsedDate.getTime()) ? null : parsedDate;
      } else {
        updateData.dueDate = null;
      }
    }

    if ('startDate' in updateTaskDto) {
      if (updateTaskDto.startDate) {
        const parsedDate = new Date(updateTaskDto.startDate);
        updateData.startDate = isNaN(parsedDate.getTime()) ? null : parsedDate;
      } else {
        updateData.startDate = null;
      }
    }

    const effectiveStartDate = 'startDate' in updateTaskDto ? updateData.startDate : existingTask.startDate;
    const effectiveDueDate = 'dueDate' in updateTaskDto ? updateData.dueDate : existingTask.dueDate;
    if (effectiveStartDate && effectiveDueDate && effectiveStartDate > effectiveDueDate) {
      throw new BadRequestException('Ngày bắt đầu không thể sau hạn hoàn thành');
    }

    if (Array.isArray(updateTaskDto.attachments)) {
      const retainedIds = new Set(
        updateTaskDto.attachments
          .map((item: any) => item._id?.toString() || item.id?.toString())
          .filter(Boolean),
      );
      removedCloudinaryAttachments = existingTask.attachments.filter(
        (item: any) => item.cloudinaryPublicId && !retainedIds.has(item._id.toString()),
      );
      updateData.attachments = updateTaskDto.attachments.map((incoming: any) => {
        const incomingId = incoming._id?.toString() || incoming.id?.toString();
        const stored = incomingId
          ? existingTask.attachments.find((item: any) => item._id.toString() === incomingId)
          : null;
        if (stored?.storageKey || stored?.cloudinaryPublicId) {
          const storedDocument = stored as any;
          return storedDocument.toObject ? storedDocument.toObject() : storedDocument;
        }
        if (!incoming.fileUrl || !/^https?:\/\//i.test(incoming.fileUrl)) {
          throw new BadRequestException('Liên kết đính kèm không hợp lệ');
        }
        return {
          fileName: incoming.fileName || 'Liên kết đính kèm',
          fileUrl: incoming.fileUrl,
          fileType: 'url',
        };
      });
    }

    // Tự động thêm Assignee mới vào Watchers
    if (updateTaskDto.assignees && Array.isArray(updateTaskDto.assignees) && existingTask) {
      const currentWatchers = (existingTask.watchers || []).map((w: any) => w._id?.toString() || w.toString());
      const newWatchers = new Set<string>(currentWatchers);
      updateTaskDto.assignees.forEach((aId: string) => {
        if (aId) newWatchers.add(aId);
      });
      updateData.watchers = Array.from(newWatchers);
    }

    const task = await this.taskModel
      .findByIdAndUpdate(taskId, updateData, { returnDocument: 'after' })
      .populate('assignees', 'name email profileImage')
      .populate('watchers', 'name email profileImage');

    if (!task) {
      throw new NotFoundException('Không tìm thấy công việc để cập nhật');
    }

    for (const attachment of removedCloudinaryAttachments) {
      this.cloudinaryService.deleteAsset(
        attachment.cloudinaryPublicId,
        attachment.cloudinaryResourceType || 'raw',
        attachment.cloudinaryDeliveryType || 'authenticated',
      ).catch(() => undefined);
    }

    if (task.project) {
      await this.updateProjectProgress(task.project.toString(), userId);
    }

    // Ghi nhật ký nếu có userId và có sự thay đổi thực sự
    if (userId && existingTask) {
      let action: any = 'updated_task';
      let desc = '';

      const mapStatusToVi = (status?: string): string => {
        if (!status) return 'Cần làm';
        const s = status.toLowerCase().trim();
        if (s === 'in progress' || s === 'in_progress' || s === 'đang thực hiện') return 'Đang thực hiện';
        if (s === 'done' || s === 'completed' || s === 'hoàn thành') return 'Hoàn thành';
        if (s === 'review' || s === 'đang review') return 'Đang review';
        if (s === 'on hold' || s === 'on_hold' || s === 'tạm dừng') return 'Tạm dừng';
        if (s === 'cancelled' || s === 'đã hủy') return 'Đã hủy';
        return 'Cần làm';
      };

      const mapPriorityToVi = (priority?: string): string => {
        if (!priority) return 'Trung bình';
        const p = priority.toLowerCase().trim();
        if (p === 'high' || p === 'cao') return 'Cao';
        if (p === 'low' || p === 'thấp') return 'Thấp';
        return 'Trung bình';
      };

      if (updateTaskDto.status && existingTask.status !== updateTaskDto.status) {
        const viStatus = mapStatusToVi(updateTaskDto.status);
        if (viStatus === 'Hoàn thành') {
          action = 'completed_task';
          desc = 'đã hoàn thành công việc này';
        } else {
          desc = `đã chuyển trạng thái sang "${viStatus}"`;
        }
      } else if (updateTaskDto.subtasks) {
        const oldSubtasks = (existingTask.subtasks || []).map((subtask: any) => ({
          title: String(subtask.title || subtask.text || '').trim(),
          completed: Boolean(subtask.completed ?? subtask.done),
        }));
        const newSubtasks = (updateTaskDto.subtasks || []).map((subtask: any) => ({
          title: String(subtask.title || subtask.text || '').trim(),
          completed: Boolean(subtask.completed ?? subtask.done),
        }));
        const oldTitleCounts = new Map<string, number>();
        const newTitleCounts = new Map<string, number>();
        oldSubtasks.forEach(({ title }) => oldTitleCounts.set(title, (oldTitleCounts.get(title) || 0) + 1));
        newSubtasks.forEach(({ title }) => newTitleCounts.set(title, (newTitleCounts.get(title) || 0) + 1));
        const addedTitle = newSubtasks.find(({ title }) =>
          (newTitleCounts.get(title) || 0) > (oldTitleCounts.get(title) || 0),
        )?.title;
        const removedTitle = oldSubtasks.find(({ title }) =>
          (oldTitleCounts.get(title) || 0) > (newTitleCounts.get(title) || 0),
        )?.title;

        if (addedTitle) {
          action = 'created_subtask';
          desc = `đã thêm công việc phụ “${addedTitle}”`;
        } else if (removedTitle) {
          action = 'updated_subtask';
          desc = `đã xoá công việc phụ “${removedTitle}”`;
        } else {
          const changedSubtask = newSubtasks.find((subtask, index) =>
            oldSubtasks[index]
            && oldSubtasks[index].title === subtask.title
            && oldSubtasks[index].completed !== subtask.completed,
          );
          action = 'updated_subtask';
          desc = changedSubtask
            ? `đã đánh dấu công việc phụ “${changedSubtask.title}” là ${changedSubtask.completed ? 'hoàn thành' : 'chưa hoàn thành'}`
            : 'đã cập nhật danh sách công việc phụ';
        }
      } else if (updateTaskDto.attachments) {
        action = 'added_attachment';
        desc = 'đã cập nhật tệp đính kèm';
      } else if (updateTaskDto.watchers) {
        const oldWatchers = (existingTask.watchers || []).map((w: any) => w._id?.toString() || w.toString());
        const newWatchers = (updateTaskDto.watchers || []).map((w: any) => w._id?.toString() || w.toString());
        const isNowWatching = newWatchers.includes(userId);
        const wasWatching = oldWatchers.includes(userId);
        if (isNowWatching && !wasWatching) {
          desc = 'đã bắt đầu theo dõi công việc này';
        } else if (!isNowWatching && wasWatching) {
          desc = 'đã ngừng theo dõi công việc này';
        } else {
          desc = 'đã cập nhật danh sách người theo dõi';
        }
      } else if (updateTaskDto.assignees) {
        desc = 'đã thay đổi người thực hiện';
      } else if (updateTaskDto.dueDate) {
        desc = 'đã cập nhật ngày hạn chót';
      } else if (updateTaskDto.priority && existingTask.priority !== updateTaskDto.priority) {
        const viPriority = mapPriorityToVi(updateTaskDto.priority);
        desc = `đã đổi độ ưu tiên sang "${viPriority}"`;
      } else if (updateTaskDto.title && existingTask.title !== updateTaskDto.title) {
        desc = 'đã đổi tiêu đề công việc';
      } else if (updateTaskDto.description && existingTask.description !== updateTaskDto.description) {
        desc = 'đã cập nhật mô tả công việc';
      }

      if (desc) {
        await this.activitiesService.logActivity({
          user: userId,
          action,
          resourceType: 'Task',
          resourceId: taskId,
          details: { description: desc },
        });
      }
    }

    if (task && task.project) {
      this.taskSubject.next({
        projectId: task.project.toString(),
        action: 'update',
        task,
      });
    }

    return task;
  }

  async deleteTask(taskId: string, userId?: string) {
    const existing = await this.taskModel.findOne({ _id: taskId, deletedAt: null });
    if (!existing) {
      throw new NotFoundException('Không tìm thấy công việc để xóa');
    }

    if (userId && existing.project) {
      await this.checkTaskEditPermission(existing.project.toString(), userId, existing);
    }

    existing.deletedAt = new Date();
    existing.deletedBy = userId as any;
    await existing.save();

    if (existing.project) {
      await this.updateProjectProgress(existing.project.toString(), userId);

      this.taskSubject.next({
        projectId: existing.project.toString(),
        action: 'delete',
        task: { _id: taskId },
      });
    }

    return { message: 'Đã chuyển công việc vào thùng rác', taskId };
  }

  async restoreTask(taskId: string, userId: string) {
    const existing = await this.taskModel.findOne({ _id: taskId, deletedAt: { $ne: null } });
    if (!existing) {
      throw new NotFoundException('Không tìm thấy công việc đã xóa');
    }

    if (!existing.project) {
      throw new NotFoundException('Dự án của công việc không còn tồn tại');
    }
    const parentProject = await this.projectModel.findOne({
      _id: existing.project,
      deletedAt: null,
    });
    if (!parentProject) {
      throw new BadRequestException('Hãy khôi phục dự án trước khi khôi phục công việc');
    }
    if (parentProject.isArchived) {
      throw new BadRequestException('Hãy đưa dự án trở lại trước khi khôi phục công việc');
    }
    await this.checkTaskEditPermission(existing.project.toString(), userId, existing, true);

    existing.deletedAt = null;
    existing.deletedBy = null;
    await existing.save();

    if (existing.project) {
      await this.updateProjectProgress(existing.project.toString(), userId);
      this.taskSubject.next({
        projectId: existing.project.toString(),
        action: 'restore',
        task: existing,
      });
    }

    return { message: 'Đã khôi phục công việc', task: existing };
  }

  async getDeletedTasks(userId: string, page = 1, limit = 25) {
    const safePage = Math.max(1, Number(page) || 1);
    const safeLimit = Math.min(100, Math.max(1, Number(limit) || 25));
    const query = {
      $or: [{ assignees: userId }, { createdBy: userId }, { deletedBy: userId }],
      deletedAt: { $ne: null },
    };

    const [tasks, total] = await Promise.all([
      this.taskModel
        .find(query)
        .populate('assignees', 'name email profileImage')
        .populate('createdBy', 'name email profileImage')
        .populate('deletedBy', 'name email profileImage')
        .populate({
          path: 'project',
          select: 'title name workspace',
          populate: { path: 'workspace', select: 'name color' },
        })
        .sort({ deletedAt: -1 })
        .skip((safePage - 1) * safeLimit)
        .limit(safeLimit),
      this.taskModel.countDocuments(query),
    ]);

    const retentionMs = 30 * 24 * 60 * 60 * 1000;
    const data = tasks.map((task: any) => {
      const item = task.toObject();
      return {
        ...item,
        expiresAt: item.deletedAt
          ? new Date(new Date(item.deletedAt).getTime() + retentionMs)
          : null,
      };
    });

    return {
      data,
      pagination: { page: safePage, limit: safeLimit, total, totalPages: Math.ceil(total / safeLimit) },
    };
  }
}
