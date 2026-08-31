import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CleanupService } from './cleanup.service';
import { Task, TaskSchema } from '../tasks/schemas/task.schema';
import { Project, ProjectSchema } from '../projects/schemas/project.schema';
import { Workspace, WorkspaceSchema } from '../workspaces/schemas/workspace.schema';
import { Comment, CommentSchema } from '../comments/schemas/comment.schema';
import { Activity, ActivitySchema } from '../activities/schemas/activity.schema';
import { TrashController } from './trash.controller';

@Module({
  imports: [MongooseModule.forFeature([
    { name: Task.name, schema: TaskSchema },
    { name: Project.name, schema: ProjectSchema },
    { name: Workspace.name, schema: WorkspaceSchema },
    { name: Comment.name, schema: CommentSchema },
    { name: Activity.name, schema: ActivitySchema },
  ])],
  providers: [CleanupService],
  controllers: [TrashController],
  exports: [CleanupService],
})
export class CleanupModule {}
