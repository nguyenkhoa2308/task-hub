import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MembersController } from './members.controller';
import { MembersService } from './members.service';
import { Workspace, WorkspaceSchema } from '../workspaces/schemas/workspace.schema';
import { UsersModule } from '../users/users.module';
import { MailModule } from '../mail/mail.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { Project, ProjectSchema } from '../projects/schemas/project.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Workspace.name, schema: WorkspaceSchema },
      { name: Project.name, schema: ProjectSchema },
    ]),
    UsersModule,
    MailModule,
    NotificationsModule,
  ],
  controllers: [MembersController],
  providers: [MembersService],
})
export class MembersModule {}
