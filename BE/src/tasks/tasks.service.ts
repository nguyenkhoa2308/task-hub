import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { Task } from './schemas/task.schema';
import { Project } from '../projects/schemas/project.schema';
import { Workspace } from '../workspaces/schemas/workspace.schema';

import { ActivitiesService } from '../activities/activities.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class TasksService {
  constructor(
    @InjectModel(Task.name) private readonly taskModel: Model<Task>,
    @InjectModel(Project.name) private readonly projectModel: Model<Project>,
    @InjectModel(Workspace.name) private readonly workspaceModel: Model<Workspace>,
    private readonly activitiesService: ActivitiesService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async checkTaskEditPermission(projectId: string, userId: string, task?: any) {
    if (!userId) return;

    if (task) {
      const createdById = task.createdBy?._id?.toString() || task.createdBy?.toString();
      const isCreator = createdById === userId.toString();
      const isAssignee = Array.isArray(task.assignees) && task.assignees.some(
        (a: any) => (a._id?.toString() || a.toString() || a) === userId.toString(),
      );
      if (isCreator || isAssignee) {
        return;
      }
    }

    const project = await this.projectModel.findById(projectId);
    if (!project) {
      throw new NotFoundException('Dự án không tồn tại');
    }

    const projectMember = project.members.find(
      (m: any) => (m.user?._id?.toString() || m.user?.toString()) === userId.toString(),
    );

    if (projectMember) {
      if (projectMember.role === 'viewer') {
        throw new ForbiddenException('Tài khoản của bạn chỉ có quyền xem trong dự án này');
      }
      return;
    }

    const workspace = await this.workspaceModel.findById(project.workspace);
    const wsMember = workspace?.members.find(
      (m: any) => (m.user?._id?.toString() || m.user?.toString()) === userId.toString(),
    );

    if (!wsMember || (wsMember as any).status === 'pending') {
      throw new ForbiddenException('Bạn không có quyền chỉnh sửa công việc trong dự án này');
    }

    const isWsAdminOrOwner = ['owner', 'admin'].includes(wsMember.role);
    if (project.isPrivate && !isWsAdminOrOwner) {
      throw new ForbiddenException('Dự án này là riêng tư, bạn không có quyền chỉnh sửa');
    }
  }

  async createTask(createTaskDto: CreateTaskDto, userId: string) {
    const { projectId, title, description, status, priority, assignees, dueDate, tags } = createTaskDto;

    if (!projectId) {
      throw new BadRequestException('Project ID là bắt buộc');
    }

    await this.checkTaskEditPermission(projectId, userId);

    const project = await this.projectModel.findById(projectId);
    if (!project) {
      throw new NotFoundException('Dự án không tồn tại');
    }

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
      assignees: assignees || [],
      watchers: Array.from(initialWatchers),
      dueDate: dueDate ? new Date(dueDate) : undefined,
      tags: parsedTags,
      createdBy: userId,
    });

    // Thêm reference của task vào project
    await this.projectModel.findByIdAndUpdate(projectId, {
      $push: { tasks: task._id },
    });

    await this.updateProjectProgress(projectId);

    // Ghi nhật ký khởi tạo công việc
    await this.activitiesService.logActivity({
      user: userId,
      action: 'created_task',
      resourceType: 'Task',
      resourceId: task._id.toString(),
      details: { title: task.title, description: 'đã khởi tạo công việc này' },
    });

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

    return this.taskModel
      .findById(task._id)
      .populate('assignees', 'name email profileImage')
      .populate('createdBy', 'name email profileImage')
      .populate('watchers', 'name email profileImage');
  }

  private async updateProjectProgress(projectId: string) {
    const totalTasks = await this.taskModel.countDocuments({ project: projectId, isArchived: false });
    if (totalTasks === 0) {
      await this.projectModel.findByIdAndUpdate(projectId, { progress: 0 });
      return 0;
    }

    const completedTasks = await this.taskModel.countDocuments({
      project: projectId,
      isArchived: false,
      status: { $in: ['Done', 'DONE', 'Completed', 'COMPLETED', 'Hoàn thành'] },
    });

    const progressPercent = Math.round((completedTasks / totalTasks) * 100);
    await this.projectModel.findByIdAndUpdate(projectId, { progress: progressPercent });
    return progressPercent;
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
    } = {},
  ) {
    const query: any = {
      $or: [{ assignees: userId }, { createdBy: userId }],
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
      const searchRegex = new RegExp(filters.search, 'i');
      query.$and = query.$and || [];
      query.$and.push({
        $or: [{ title: searchRegex }, { description: searchRegex }],
      });
    }

    // Determine Sort options
    let sortOptions: any = { createdAt: -1 };
    if (filters.sortBy === 'newest') {
      sortOptions = { createdAt: -1 };
    } else if (filters.sortBy === 'oldest') {
      sortOptions = { createdAt: 1 };
    } else if (filters.sortBy === 'dueDate_asc') {
      sortOptions = { dueDate: 1 };
    } else if (filters.sortBy === 'dueDate_desc') {
      sortOptions = { dueDate: -1 };
    } else if (filters.sortBy === 'priority') {
      sortOptions = { priority: -1 };
    }

    let tasks = await this.taskModel
      .find(query)
      .populate('assignees', 'name email profileImage')
      .populate('createdBy', 'name email profileImage')
      .populate('watchers', 'name email profileImage')
      .populate({
        path: 'project',
        select: 'title name workspace',
        populate: { path: 'workspace', select: 'name color' },
      })
      .sort(sortOptions);

    // If workspaceId is specified, filter by populated project.workspace
    if (filters.workspaceId && filters.workspaceId !== 'all') {
      tasks = tasks.filter((t: any) => {
        const wsId = t.project?.workspace?._id?.toString() || t.project?.workspace?.toString();
        return wsId === filters.workspaceId;
      });
    }

    // Helper function to check if task is completed
    const isDone = (status: string) => {
      if (!status) return false;
      const s = status.toLowerCase();
      return s === 'done' || s === 'completed' || s === 'hoàn thành';
    };

    const priorityWeight: Record<string, number> = { High: 3, Medium: 2, Low: 1 };
    const now = Date.now();
    const threeDaysMs = 3 * 24 * 60 * 60 * 1000;

    // Categorize into timeline buckets:
    // Bucket 0: Overdue (hạn chót < hiện tại)
    // Bucket 1: Due soon (hạn chót trong vòng 3 ngày tới)
    // Bucket 2: Upcoming (hạn chót > 3 ngày tới hoặc chưa đặt hạn chót)
    // Bucket 3: Done (đã hoàn thành)
    const getTaskBucket = (task: any) => {
      if (isDone(task.status)) return 3;
      if (!task.dueDate) return 2;
      const dueTime = new Date(task.dueDate).getTime();
      if (dueTime < now) return 0; // Overdue
      if (dueTime <= now + threeDaysMs) return 1; // Due soon (3 ngày)
      return 2; // Upcoming
    };

    // Memory sorting
    if (filters.sortBy === 'priority') {
      tasks = [...tasks].sort((a: any, b: any) => {
        const aDone = isDone(a.status) ? 1 : 0;
        const bDone = isDone(b.status) ? 1 : 0;
        if (aDone !== bDone) return aDone - bDone;
        return (priorityWeight[b.priority] || 0) - (priorityWeight[a.priority] || 0);
      });
    } else if (filters.sortBy === 'deadline_priority' || !filters.sortBy) {
      tasks = [...tasks].sort((a: any, b: any) => {
        const bucketA = getTaskBucket(a);
        const bucketB = getTaskBucket(b);
        if (bucketA !== bucketB) return bucketA - bucketB;

        // Nếu trong cùng nhóm Overdue, Due soon, hoặc Upcoming -> ưu tiên High -> Medium -> Low
        const priDiff = (priorityWeight[b.priority] || 0) - (priorityWeight[a.priority] || 0);
        if (priDiff !== 0) return priDiff;

        // Nếu cùng độ ưu tiên -> hạn chót gần nhất trước
        const aTime = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
        const bTime = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
        return aTime - bTime;
      });
    }

    return tasks;
  }

  async getTasksByProject(
    projectId: string,
    options: { sortBy?: string; status?: string } = {},
  ) {
    const project = await this.projectModel.findById(projectId);
    if (!project) {
      throw new NotFoundException('Dự án không tồn tại');
    }

    const query: any = { project: projectId, isArchived: false };
    if (options.status) {
      query.status = options.status;
    }

    const isDone = (status: string) => {
      if (!status) return false;
      const s = status.toLowerCase();
      return s === 'done' || s === 'completed' || s === 'hoàn thành';
    };

    const priorityWeight: Record<string, number> = { High: 3, Medium: 2, Low: 1 };
    const now = Date.now();
    const threeDaysMs = 3 * 24 * 60 * 60 * 1000;

    const getTaskBucket = (task: any) => {
      if (isDone(task.status)) return 3;
      if (!task.dueDate) return 2;
      const dueTime = new Date(task.dueDate).getTime();
      if (dueTime < now) return 0;
      if (dueTime <= now + threeDaysMs) return 1;
      return 2;
    };

    let tasks = await this.taskModel
      .find(query)
      .populate('assignees', 'name email profileImage')
      .populate('createdBy', 'name email profileImage')
      .populate('watchers', 'name email profileImage')
      .sort({ createdAt: -1 });

    if (options.sortBy === 'priority_only') {
      tasks = [...tasks].sort((a: any, b: any) => {
        const aDone = isDone(a.status) ? 1 : 0;
        const bDone = isDone(b.status) ? 1 : 0;
        if (aDone !== bDone) return aDone - bDone;
        return (priorityWeight[b.priority] || 0) - (priorityWeight[a.priority] || 0);
      });
    } else if (options.sortBy === 'deadline_priority' || !options.sortBy) {
      tasks = [...tasks].sort((a: any, b: any) => {
        const bucketA = getTaskBucket(a);
        const bucketB = getTaskBucket(b);
        if (bucketA !== bucketB) return bucketA - bucketB;

        const priDiff = (priorityWeight[b.priority] || 0) - (priorityWeight[a.priority] || 0);
        if (priDiff !== 0) return priDiff;

        const aDate = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
        const bDate = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
        return aDate - bDate;
      });
    } else if (options.sortBy === 'title_az') {
      tasks = [...tasks].sort((a: any, b: any) => a.title.localeCompare(b.title));
    } else if (options.sortBy === 'deadline_only') {
      tasks = [...tasks].sort((a: any, b: any) => {
        const aDone = isDone(a.status) ? 1 : 0;
        const bDone = isDone(b.status) ? 1 : 0;
        if (aDone !== bDone) return aDone - bDone;
        const aDate = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
        const bDate = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
        return aDate - bDate;
      });
    }

    return tasks;
  }

  async getTaskById(taskId: string) {
    const task = await this.taskModel
      .findById(taskId)
      .populate('assignees', 'name email profileImage')
      .populate('createdBy', 'name email profileImage')
      .populate('watchers', 'name email profileImage')
      .populate('project', 'title name');

    if (!task) {
      throw new NotFoundException('Không tìm thấy công việc');
    }

    return task;
  }

  async updateTask(taskId: string, updateTaskDto: UpdateTaskDto, userId?: string) {
    const existingTask = await this.taskModel.findById(taskId);
    if (!existingTask) {
      throw new NotFoundException('Không tìm thấy công việc để cập nhật');
    }

    if (userId && existingTask.project) {
      await this.checkTaskEditPermission(existingTask.project.toString(), userId, existingTask);
    }

    const updateData: any = { ...updateTaskDto };

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

    if (task.project) {
      await this.updateProjectProgress(task.project.toString());
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
        action = 'updated_subtask';
        desc = 'đã cập nhật danh sách công việc phụ';
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

    return task;
  }

  async deleteTask(taskId: string, userId?: string) {
    const existing = await this.taskModel.findById(taskId);
    if (!existing) {
      throw new NotFoundException('Không tìm thấy công việc để xóa');
    }

    if (userId && existing.project) {
      await this.checkTaskEditPermission(existing.project.toString(), userId, existing);
    }

    await this.taskModel.findByIdAndDelete(taskId);

    // Xóa reference khỏi project
    if (existing.project) {
      await this.projectModel.findByIdAndUpdate(existing.project, {
        $pull: { tasks: existing._id },
      });
      await this.updateProjectProgress(existing.project.toString());
    }

    return { message: 'Đã xóa công việc thành công' };
  }
}
