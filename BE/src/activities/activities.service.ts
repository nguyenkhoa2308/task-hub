import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Activity, ActivityLogAction, ResourceType } from './schemas/activity.schema';

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
  ) {}

  async logActivity(dto: LogActivityDto) {
    const activity = await this.activityModel.create(dto);
    return activity;
  }

  async getTaskActivities(taskId: string, limit = 20) {
    return this.activityModel
      .find({ resourceType: 'Task', resourceId: taskId })
      .populate('user', 'name email profileImage')
      .sort({ createdAt: -1 })
      .limit(limit);
  }
}
