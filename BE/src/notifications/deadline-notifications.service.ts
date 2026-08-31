import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Task } from '../tasks/schemas/task.schema';
import { NotificationsService } from './notifications.service';

@Injectable()
export class DeadlineNotificationsService {
  private readonly logger = new Logger(DeadlineNotificationsService.name);
  private static readonly OVERDUE_REMINDER_INTERVAL_MS = 7 * 24 * 60 * 60 * 1000;

  constructor(
    @InjectModel(Task.name) private readonly taskModel: Model<Task>,
    private readonly notificationsService: NotificationsService,
  ) {}

  @Cron('0 */15 * * * *', { timeZone: 'Asia/Ho_Chi_Minh' })
  async notifyUpcomingAndOverdueTasks() {
    const now = new Date();
    const next24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const tasks = await this.taskModel
      .find({
        dueDate: { $ne: null, $lte: next24Hours },
        status: { $nin: ['Done', 'DONE'] },
        isArchived: false,
        deletedAt: null,
      })
      .select('title dueDate assignees watchers createdBy project')
      .populate('project', 'workspace')
      .lean();

    let created = 0;
    for (const task of tasks as any[]) {
      const dueDate = new Date(task.dueDate);
      const isOverdue = dueDate.getTime() <= now.getTime();
      const kind = isOverdue ? 'overdue' : 'due-soon';
      const overdueReminderCycle = isOverdue
        ? Math.floor(
          (now.getTime() - dueDate.getTime())
          / DeadlineNotificationsService.OVERDUE_REMINDER_INTERVAL_MS,
        )
        : 0;
      const recipients = new Set<string>(
        [...(task.assignees || []), ...(task.watchers || [])]
          .map((id: any) => id?.toString())
          .filter(Boolean),
      );
      if (recipients.size === 0 && task.createdBy) recipients.add(task.createdBy.toString());

      const projectId = task.project?._id?.toString?.() || task.project?.toString?.();
      const workspaceId = task.project?.workspace?.toString?.();
      const link = workspaceId && projectId
        ? `/workspaces/${workspaceId}/projects/${projectId}?taskId=${task._id}`
        : undefined;

      for (const recipient of recipients) {
        const notification = await this.notificationsService.createNotification({
          recipient,
          type: isOverdue ? 'TASK_OVERDUE' : 'TASK_DUE_SOON',
          title: isOverdue ? 'Công việc đã quá hạn' : 'Công việc sắp đến hạn',
          message: isOverdue
            ? `Công việc "${task.title}" đã quá hạn.`
            : `Công việc "${task.title}" sẽ đến hạn trong vòng 24 giờ.`,
          link,
          dedupeKey: isOverdue
            ? `deadline:${kind}:${task._id}:${recipient}:${dueDate.toISOString()}:cycle-${overdueReminderCycle}`
            : `deadline:${kind}:${task._id}:${recipient}:${dueDate.toISOString()}`,
        });
        if (notification) created += 1;
      }
    }

    if (created > 0) this.logger.log(`Đã tạo ${created} thông báo hạn chót`);
    return { scanned: tasks.length, created };
  }
}
