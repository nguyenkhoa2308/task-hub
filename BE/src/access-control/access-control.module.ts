import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Project, ProjectSchema } from '../projects/schemas/project.schema';
import { Workspace, WorkspaceSchema } from '../workspaces/schemas/workspace.schema';
import { ProjectAccessService } from './project-access.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Project.name, schema: ProjectSchema },
      { name: Workspace.name, schema: WorkspaceSchema },
    ]),
  ],
  providers: [ProjectAccessService],
  exports: [ProjectAccessService],
})
export class AccessControlModule {}
