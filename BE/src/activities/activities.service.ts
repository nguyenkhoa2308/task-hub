import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Activity, ActivityLogAction, ResourceType } from './schemas/activity.schema';
import { Task } from '../tasks/schemas/task.schema';
import { ProjectAccessService } from '../access-control/project-access.service';

export interface LogActivityDto {
  user: string;
  action: ActivityLogAction;
  resourceType: ResourceType;
  resourceId: string;
  details?: Record<string, any>;
}

@Injectable()
export class ActivitiesService {
  constructor(
    @InjectModel(Activity.name)
    private readonly activityModel: Model<Activity>,
    @InjectModel(Task.name) private readonly taskModel: Model<Task>,
    private readonly projectAccessService: ProjectAccessService,
  ) {}

  async logActivity(dto: LogActivityDto) {
    const activity = await this.activityModel.create(dto);
    return activity;
  }

  async getTaskActivities(taskId: string, userId: string, page = 1, limit = 20) {
    const task = await this.taskModel.findById(taskId);
    if (!task) throw new NotFoundException('Công việc không tồn tại');
    await this.projectAccessService.assertCanReadProject(task.project.toString(), userId);

    return this.getPaginatedActivities('Task', taskId, page, limit);
  }

  async getProjectActivities(projectId: string, userId: string, page = 1, limit = 30) {
    await this.projectAccessService.assertCanReadProject(projectId, userId);
    return this.getPaginatedActivities('Project', projectId, page, limit);
  }

  private async getPaginatedActivities(
    resourceType: 'Task' | 'Project',
    resourceId: string,
    page: number,
    limit: number,
  ) {
    const safePage = Math.max(1, Number(page) || 1);
    const safeLimit = Math.min(100, Math.max(1, Number(limit) || 20));
    const query = { resourceType, resourceId };
    const [data, total] = await Promise.all([
      this.activityModel.find(query)
        .populate('user', 'name email profileImage')
        .sort({ createdAt: -1 })
        .skip((safePage - 1) * safeLimit)
        .limit(safeLimit),
      this.activityModel.countDocuments(query),
    ]);
    return {
      data,
      pagination: { page: safePage, limit: safeLimit, total, totalPages: Math.ceil(total / safeLimit) },
    };
  }
}
