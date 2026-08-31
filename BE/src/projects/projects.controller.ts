import { Controller, Get, Post, Body, Patch, Param, Delete, Req, Query, UseGuards } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('projects')
@UseGuards(JwtAuthGuard)
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post('workspace/:workspaceId/create')
  createWithWorkspaceParam(
    @Param('workspaceId') workspaceId: string,
    @Body() createProjectDto: CreateProjectDto,
    @Req() req: any,
  ) {
    const userId = req.user.userId;
    return this.projectsService.createProject(createProjectDto, workspaceId, userId);
  }

  @Post()
  create(@Body() createProjectDto: CreateProjectDto, @Req() req: any) {
    const userId = req.user.userId;
    return this.projectsService.createProject(createProjectDto, createProjectDto.workspaceId || '', userId);
  }

  @Get('workspace/:workspaceId')
  findAllByWorkspace(@Param('workspaceId') workspaceId: string, @Req() req: any) {
    const userId = req.user.userId;
    return this.projectsService.getProjectsByWorkspace(workspaceId, userId);
  }

  @Get('archived/all')
  findArchived(@Req() req: any, @Query('page') page?: string, @Query('limit') limit?: string) {
    return this.projectsService.getArchivedProjects(
      req.user.userId,
      page ? Number(page) : 1,
      limit ? Number(limit) : 12,
    );
  }

  @Get('trash/all')
  findDeleted(@Req() req: any, @Query('page') page?: string, @Query('limit') limit?: string) {
    return this.projectsService.getDeletedProjects(
      req.user.userId,
      page ? Number(page) : 1,
      limit ? Number(limit) : 12,
    );
  }

  @Patch(':id/restore')
  restore(@Param('id') id: string, @Req() req: any) {
    return this.projectsService.restoreProject(id, req.user.userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: any) {
    const userId = req.user.userId;
    return this.projectsService.getProjectById(id, userId);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateProjectDto: UpdateProjectDto, @Req() req: any) {
    const userId = req.user.userId;
    return this.projectsService.updateProject(id, updateProjectDto, userId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: any) {
    const userId = req.user.userId;
    return this.projectsService.deleteProject(id, userId);
  }
}
