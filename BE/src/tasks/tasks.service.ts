import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { Task } from './schemas/task.schema';
import { Project } from '../projects/schemas/project.schema';

@Injectable()
export class TasksService {
  constructor(
    @InjectModel(Task.name) private readonly taskModel: Model<Task>,
    @InjectModel(Project.name) private readonly projectModel: Model<Project>,
  ) {}

  async createTask(createTaskDto: CreateTaskDto, userId: string) {
    const { projectId, title, description, status, priority, assignees, dueDate, tags } = createTaskDto;

    if (!projectId) {
      throw new BadRequestException('Project ID là bắt buộc');
    }

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

    const task = await this.taskModel.create({
      title,
      description,
      project: projectId,
      status: status || 'To Do',
      priority: priority || 'Medium',
      assignees: assignees || [],
      dueDate: dueDate ? new Date(dueDate) : undefined,
      tags: parsedTags,
      createdBy: userId,
    });

    // Thêm reference của task vào project
    await this.projectModel.findByIdAndUpdate(projectId, {
      $push: { tasks: task._id },
    });

    await this.updateProjectProgress(projectId);

    return task;
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
      .populate('project', 'title name');

    if (!task) {
      throw new NotFoundException('Không tìm thấy công việc');
    }

    return task;
  }

  async updateTask(taskId: string, updateTaskDto: UpdateTaskDto) {
    const updateData: any = { ...updateTaskDto };

    // Tự động ghi nhận ngày hoàn thành khi chuyển trạng thái sang Done / DONE
    if (updateTaskDto.status === 'Done' || updateTaskDto.status === 'DONE') {
      updateData.completedAt = new Date();
    }

    if (updateTaskDto.dueDate) {
      updateData.dueDate = new Date(updateTaskDto.dueDate);
    }

    const task = await this.taskModel
      .findByIdAndUpdate(taskId, updateData, { returnDocument: 'after' })
      .populate('assignees', 'name email profileImage');

    if (!task) {
      throw new NotFoundException('Không tìm thấy công việc để cập nhật');
    }

    if (task.project) {
      await this.updateProjectProgress(task.project.toString());
    }

    return task;
  }

  async deleteTask(taskId: string) {
    const task = await this.taskModel.findByIdAndDelete(taskId);
    if (!task) {
      throw new NotFoundException('Không tìm thấy công việc để xóa');
    }

    // Xóa reference khỏi project
    await this.projectModel.findByIdAndUpdate(task.project, {
      $pull: { tasks: task._id },
    });

    if (task.project) {
      await this.updateProjectProgress(task.project.toString());
    }

    return { message: 'Đã xóa công việc thành công' };
  }
}
