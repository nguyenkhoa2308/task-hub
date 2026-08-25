import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Comment } from './schemas/comment.schema';
import { Task } from '../tasks/schemas/task.schema';
import { CreateCommentDto } from './dto/create-comment.dto';
import { ActivitiesService } from '../activities/activities.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class CommentsService {
  constructor(
    @InjectModel(Comment.name) private readonly commentModel: Model<Comment>,
    @InjectModel(Task.name) private readonly taskModel: Model<Task>,
    private readonly activitiesService: ActivitiesService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async createComment(dto: CreateCommentDto, userId: string) {
    const task = await this.taskModel.findById(dto.taskId);
    if (!task) throw new NotFoundException('Công việc không tồn tại');

    const textContent = dto.text || dto.content || '';

    const comment = await this.commentModel.create({
      text: textContent,
      author: userId,
      task: dto.taskId,
    });

    // Push comment id vào task.comments[]
    await this.taskModel.findByIdAndUpdate(dto.taskId, {
      $push: { comments: comment._id },
    });

    // Ghi nhật ký hoạt động theo ActivityLog schema chuẩn
    await this.activitiesService.logActivity({
      user: userId,
      action: 'added_comment',
      resourceType: 'Task',
      resourceId: dto.taskId,
      details: { text: textContent },
    });

    // Gửi thông báo cho những người liên quan đến task (assignees + creator)
    try {
      const notificationRecipients = new Set<string>();
      if (task.createdBy && task.createdBy.toString() !== userId) {
        notificationRecipients.add(task.createdBy.toString());
      }
      if (Array.isArray(task.assignees)) {
        task.assignees.forEach((assigneeId: any) => {
          const aId = assigneeId._id?.toString() || assigneeId.toString();
          if (aId !== userId) notificationRecipients.add(aId);
        });
      }
      if (Array.isArray(task.watchers)) {
        task.watchers.forEach((watcherId: any) => {
          const wId = watcherId._id?.toString() || watcherId.toString();
          if (wId !== userId) notificationRecipients.add(wId);
        });
      }

      for (const recipientId of notificationRecipients) {
        await this.notificationsService.createNotification({
          recipient: recipientId,
          sender: userId,
          type: 'NEW_COMMENT',
          title: 'Bình luận mới',
          message: `đã bình luận vào công việc "${task.title}"`,
          link: `/workspaces?taskId=${task._id}`,
        });
      }
    } catch (e) {
      // Ignore notification errors to avoid failing comment creation
    }

    // Trả về comment đã populate author
    return this.commentModel
      .findById(comment._id)
      .populate('author', 'name email profileImage avatarUrl');
  }

  async getCommentsByTask(taskId: string) {
    const task = await this.taskModel.findById(taskId);
    if (!task) throw new NotFoundException('Công việc không tồn tại');

    return this.commentModel
      .find({ task: taskId })
      .populate('author', 'name email profileImage avatarUrl')
      .sort({ createdAt: 1 });
  }

  async deleteComment(commentId: string, userId: string) {
    const comment = await this.commentModel.findById(commentId);
    if (!comment) throw new NotFoundException('Bình luận không tồn tại');

    // Chỉ tác giả mới được xoá
    if (comment.author.toString() !== userId) {
      throw new ForbiddenException('Bạn không có quyền xoá bình luận này');
    }

    await this.taskModel.findByIdAndUpdate(comment.task, {
      $pull: { comments: comment._id },
    });

    await this.commentModel.findByIdAndDelete(commentId);

    return { success: true };
  }
}
