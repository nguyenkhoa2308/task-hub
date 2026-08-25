import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MembersController } from './members.controller';
import { MembersService } from './members.service';
import { Workspace, WorkspaceSchema } from '../workspaces/schemas/workspace.schema';
import { UsersModule } from '../users/users.module';
import { MailModule } from '../mail/mail.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Workspace.name, schema: WorkspaceSchema },
    ]),
    UsersModule,
    MailModule,
    NotificationsModule,
  ],
  controllers: [MembersController],
  providers: [MembersService],
})
export class MembersModule {}
