import { Controller, Get, Post, Body, Patch, Param, Delete, Req, UseGuards } from '@nestjs/common';
import { WorkspacesService } from './workspaces.service';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@Controller('workspaces')
export class WorkspacesController {
  constructor(private readonly workspacesService: WorkspacesService) { }

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() createWorkspaceDto: CreateWorkspaceDto, @Req() req: any) {
    const userId = req.user.userId;
    return this.workspacesService.createWorkSpace(createWorkspaceDto, userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(@Req() req: any) {
    const userId = req.user.userId;
    return this.workspacesService.getWorkspaces(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.workspacesService.getWorkspaceById(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/join')
  joinWorkspace(@Param('id') id: string, @Req() req: any) {
    const userId = req.user.userId;
    return this.workspacesService.joinWorkspace(id, userId);
  }
}
