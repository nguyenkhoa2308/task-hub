import { Controller, Get, Post, Body, Patch, Param, Delete, Req, Query, UseGuards } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('tasks')
@UseGuards(JwtAuthGuard)
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  create(@Body() createTaskDto: CreateTaskDto, @Req() req: any) {
    const userId = req.user.userId;
    return this.tasksService.createTask(createTaskDto, userId);
  }

  @Get('me')
  findMyTasks(
    @Req() req: any,
    @Query('status') status?: string,
    @Query('priority') priority?: string,
    @Query('workspaceId') workspaceId?: string,
    @Query('search') search?: string,
    @Query('sortBy') sortBy?: string,
    @Query('isArchived') isArchived?: string,
  ) {
    const userId = req.user.userId;
    return this.tasksService.getMyTasks(userId, {
      status,
      priority,
      workspaceId,
      search,
      sortBy,
      isArchived: isArchived === 'true' ? true : isArchived === 'false' ? false : undefined,
    });
  }

  @Get('project/:projectId')
  findAllByProject(
    @Param('projectId') projectId: string,
    @Query('sortBy') sortBy?: string,
    @Query('status') status?: string,
  ) {
    return this.tasksService.getTasksByProject(projectId, { sortBy, status });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.tasksService.getTaskById(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateTaskDto: UpdateTaskDto,
    @Req() req: any,
  ) {
    return this.tasksService.updateTask(id, updateTaskDto, req.user.userId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: any) {
    const userId = req.user.userId;
    return this.tasksService.deleteTask(id, userId);
  }
}
