import { Controller, Get, Param, Query, Req, UseGuards } from '@nestjs/common';
import { ActivitiesService } from './activities.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('activities')
@UseGuards(JwtAuthGuard)
export class ActivitiesController {
  constructor(private readonly activitiesService: ActivitiesService) {}

  @Get('task/:taskId')
  async getTaskActivities(
    @Param('taskId') taskId: string,
    @Req() req: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const currentPage = page ? parseInt(page, 10) : 1;
    const lim = limit ? parseInt(limit, 10) : 20;
    return this.activitiesService.getTaskActivities(taskId, req.user.userId, currentPage, lim);
  }

  @Get('project/:projectId')
  async getProjectActivities(
    @Param('projectId') projectId: string,
    @Req() req: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const currentPage = page ? parseInt(page, 10) : 1;
    const lim = limit ? parseInt(limit, 10) : 30;
    return this.activitiesService.getProjectActivities(projectId, req.user.userId, currentPage, lim);
  }
}
