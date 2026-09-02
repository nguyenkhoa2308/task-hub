import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ArcjetModule, detectBot, shield } from '@arcjet/nest';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { APP_GUARD } from '@nestjs/core';
import { WorkspacesModule } from './workspaces/workspaces.module';
import { ProjectsModule } from './projects/projects.module';
import { TasksModule } from './tasks/tasks.module';
import { CommentsModule } from './comments/comments.module';
import { ActivitiesModule } from './activities/activities.module';
import { NotificationsModule } from './notifications/notifications.module';
import { MembersModule } from './members/members.module';
import { CloudinaryModule } from './cloudinary/cloudinary.module';
import { ScheduleModule } from '@nestjs/schedule';
import { CleanupModule } from './cleanup/cleanup.module';
import { validateEnvironment } from './config/env.validation';
import { ReportsModule } from './reports/reports.module';
import { SearchModule } from './search/search.module';
import { AppArcjetGuard } from './security/app-arcjet.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      validate: validateEnvironment,
    }),
    ArcjetModule.forRoot({
      isGlobal: true,
      key: process.env.ARCJET_KEY!,
      rules: [
        // Shield protects your app from common attacks e.g. SQL injection
        shield({ mode: 'LIVE' }),
        // Create a bot detection rule
        detectBot({
          mode: 'LIVE', // Blocks requests. Use "DRY_RUN" to log only
          allow: [
            'CATEGORY:SEARCH_ENGINE', // Google, Bing, etc
            'CATEGORY:MONITOR', // UptimeRobot và các dịch vụ giám sát uptime
          ],
        }),
      ],
    }),
    MongooseModule.forRoot(process.env.MONGODB_URI!),
    AuthModule,
    UsersModule,
    WorkspacesModule,
    ProjectsModule,
    TasksModule,
    CommentsModule,
    ActivitiesModule,
    NotificationsModule,
    MembersModule,
    CloudinaryModule,
    ScheduleModule.forRoot(),
    CleanupModule,
    ReportsModule,
    SearchModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: AppArcjetGuard,
    },
  ],
})
export class AppModule {}
