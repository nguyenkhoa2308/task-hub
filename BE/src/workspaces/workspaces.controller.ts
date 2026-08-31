import { Controller, Get, Post, Body, Patch, Param, Delete, Req, Query, UseGuards } from '@nestjs/common';
import { WorkspacesService } from './workspaces.service';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiCookieAuth, ApiTags } from '@nestjs/swagger';

@Controller('workspaces')
@ApiTags('Workspaces')
@ApiCookieAuth('access_token')
@UseGuards(JwtAuthGuard)
export class WorkspacesController {
  constructor(private readonly workspacesService: WorkspacesService) { }

  @Post()
  create(@Body() createWorkspaceDto: CreateWorkspaceDto, @Req() req: any) {
    const userId = req.user.userId;
    return this.workspacesService.createWorkSpace(createWorkspaceDto, userId);
  }

  @Get()
  findAll(@Req() req: any) {
    const userId = req.user.userId;
    return this.workspacesService.getWorkspaces(userId);
  }

  @Get('dashboard/stats')
  getDashboardStats(@Req() req: any, @Query('workspaceId') workspaceId?: string) {
    const userId = req.user.userId;
    return this.workspacesService.getDashboardStats(userId, workspaceId);
  }

  @Get('trash/all')
  getTrash(@Req() req: any, @Query('page') page?: string, @Query('limit') limit?: string) {
    return this.workspacesService.getDeletedWorkspaces(
      req.user.userId,
      page ? Number(page) : 1,
      limit ? Number(limit) : 12,
    );
  }

  @Patch(':id/restore')
  restore(@Param('id') id: string, @Req() req: any) {
    return this.workspacesService.restoreWorkspace(id, req.user.userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: any) {
    const userId = req.user.userId;
    return this.workspacesService.getWorkspaceById(id, userId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateWorkspaceDto: UpdateWorkspaceDto,
    @Req() req: any,
  ) {
    return this.workspacesService.updateWorkspace(
      id,
      updateWorkspaceDto,
      req.user.userId,
    );
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: any) {
    return this.workspacesService.deleteWorkspace(id, req.user.userId);
  }

  @Post(':id/join')
  joinWorkspace(@Param('id') id: string, @Req() req: any) {
    const userId = req.user.userId;
    return this.workspacesService.joinWorkspace(id, userId);
  }
}

