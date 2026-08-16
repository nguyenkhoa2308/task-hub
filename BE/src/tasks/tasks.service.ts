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

  async getMyTasks(userId: string) {
    const tasks = await this.taskModel
      .find({
        $or: [{ assignees: userId }, { createdBy: userId }],
      })
      .populate('assignees', 'name email profileImage')
      .populate('createdBy', 'name email profileImage')
      .populate({
        path: 'project',
        select: 'title name workspace',
        populate: { path: 'workspace', select: 'name color' },
      })
      .sort({ createdAt: -1 });

    return tasks;
  }

  async getTasksByProject(projectId: string) {
    const project = await this.projectModel.findById(projectId);
    if (!project) {
      throw new NotFoundException('Dự án không tồn tại');
    }

    const tasks = await this.taskModel
      .find({ project: projectId, isArchived: false })
      .populate('assignees', 'name email profileImage')
      .populate('createdBy', 'name email profileImage')
      .sort({ createdAt: -1 });

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
