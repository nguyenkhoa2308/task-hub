import { Controller, Get, Post, Body, Patch, Param, Delete, Req, Query, UseGuards, Sse, MessageEvent, UploadedFile, UseInterceptors, Res } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Observable, map } from 'rxjs';

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
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const userId = req.user.userId;
    return this.tasksService.getMyTasks(userId, {
      status,
      priority,
      workspaceId,
      search,
      sortBy,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 25,
      isArchived: isArchived === 'true' ? true : isArchived === 'false' ? false : undefined,
    });
  }

  @Get('project/:projectId')
  findAllByProject(
    @Param('projectId') projectId: string,
    @Req() req: any,
    @Query('sortBy') sortBy?: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.tasksService.getTasksByProject(projectId, req.user.userId, {
      sortBy,
      status,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 25,
    });
  }

  @Get('trash')
  getTrash(
    @Req() req: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.tasksService.getDeletedTasks(
      req.user.userId,
      page ? Number(page) : 1,
      limit ? Number(limit) : 25,
    );
  }

  @Sse('sse')
  sse(@Req() req: any): Observable<MessageEvent> {
    return this.tasksService.getTasksEventStream(req.user.userId).pipe(
      map((event) => ({
        data: JSON.stringify(event),
      } as MessageEvent)),
    );
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: any) {
    return this.tasksService.getTaskById(id, req.user.userId);
  }

  @Patch(':id/restore')
  restore(@Param('id') id: string, @Req() req: any) {
    return this.tasksService.restoreTask(id, req.user.userId);
  }

  @Post(':id/attachments')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 10 * 1024 * 1024 } }))
  uploadAttachment(@Param('id') id: string, @UploadedFile() file: any, @Req() req: any) {
    return this.tasksService.uploadAttachment(id, req.user.userId, file);
  }

  @Get(':id/attachments/:attachmentId/download')
  async downloadAttachment(
    @Param('id') id: string,
    @Param('attachmentId') attachmentId: string,
    @Req() req: any,
    @Res({ passthrough: true }) response: any,
  ) {
    const downloadUrl = await this.tasksService.getAttachmentDownloadUrl(id, attachmentId, req.user.userId);
    return response.redirect(downloadUrl);
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
