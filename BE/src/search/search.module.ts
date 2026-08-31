import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';
import { Workspace, WorkspaceSchema } from '../workspaces/schemas/workspace.schema';
import { Project, ProjectSchema } from '../projects/schemas/project.schema';
import { Task, TaskSchema } from '../tasks/schemas/task.schema';

@Module({
  imports: [MongooseModule.forFeature([
    { name: Workspace.name, schema: WorkspaceSchema },
    { name: Project.name, schema: ProjectSchema },
    { name: Task.name, schema: TaskSchema },
  ])],
  controllers: [SearchController],
  providers: [SearchService],
})
export class SearchModule {}
