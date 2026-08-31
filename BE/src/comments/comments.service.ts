import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  MessageEvent,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Comment } from './schemas/comment.schema';
import { Task } from '../tasks/schemas/task.schema';
import { CreateCommentDto } from './dto/create-comment.dto';
import { ActivitiesService } from '../activities/activities.service';
import { NotificationsService } from '../notifications/notifications.service';
import { ProjectAccessService } from '../access-control/project-access.service';
import { Project } from '../projects/schemas/project.schema';
import { filter, map, Observable, Subject } from 'rxjs';

@Injectable()
export class CommentsService {
  private readonly commentSubject = new Subject<{ taskId: string; action: 'created' | 'deleted'; commentId: string }>();
  constructor(
    @InjectModel(Comment.name) private readonly commentModel: Model<Comment>,
    @InjectModel(Task.name) private readonly taskModel: Model<Task>,
    @InjectModel(Project.name) private readonly projectModel: Model<Project>,
    private readonly activitiesService: ActivitiesService,
    private readonly notificationsService: NotificationsService,
    private readonly projectAccessService: ProjectAccessService,
  ) {}

  async createComment(dto: CreateCommentDto, userId: string) {
    const task = await this.taskModel.findById(dto.taskId);
    if (!task) throw new NotFoundException('Công việc không tồn tại');
    const project = await this.projectAccessService.assertCanReadProject(task.project.toString(), userId);

    const textContent = dto.text || dto.content || '';
    let directReplyTarget: Comment | null = null;
    let rootReplyTarget: Comment | null = null;
    if (dto.parentCommentId) {
      directReplyTarget = await this.commentModel.findOne({
        _id: dto.parentCommentId,
        task: dto.taskId,
      });
      if (!directReplyTarget) throw new NotFoundException('Bình luận được trả lời không tồn tại');
      rootReplyTarget = directReplyTarget;
      if (directReplyTarget.parentComment) {
        rootReplyTarget = await this.commentModel.findById(directReplyTarget.parentComment);
      }
    }
    const allowedMentionIds = new Set(
      (project.members || []).map((member: any) =>
        (member.user?._id || member.user)?.toString(),
      ),
    );
    const mentions = (dto.mentions || []).filter((mention) => {
      const mentionedText = textContent.slice(mention.offset, mention.offset + mention.length);
      return allowedMentionIds.has(mention.user)
        && mentionedText.startsWith('@')
        && mention.offset + mention.length <= textContent.length;
    });

    const comment = await this.commentModel.create({
      text: textContent,
      author: userId,
      task: dto.taskId,
      mentions,
      parentComment: rootReplyTarget?._id || null,
      replyToComment: directReplyTarget?._id || null,
    } as any);

    // Bù trừ nếu task biến mất trước khi comment được liên kết.
    try {
      const linkedTask = await this.taskModel.findByIdAndUpdate(dto.taskId, {
        $push: { comments: comment._id },
      });
      if (!linkedTask) {
        throw new NotFoundException("Công việc không tồn tại");
      }
    } catch (error) {
      await this.commentModel.deleteOne({ _id: comment._id }).catch(() => undefined);
      throw error;
    }

    // Gửi thông báo cho những người liên quan đến task (assignees + creator)
    try {
      const mentionedRecipients = new Set(
        mentions.map((mention) => mention.user).filter((id) => id !== userId),
      );
      const notificationRecipients = new Set<string>();
      const replyRecipient = directReplyTarget?.author?.toString();
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

      const taskLink = `/workspaces/${project.workspace}/projects/${project._id}?taskId=${task._id}&commentId=${comment._id}`;
      if (replyRecipient && replyRecipient !== userId && !mentionedRecipients.has(replyRecipient)) {
        await this.notificationsService.createNotification({
          recipient: replyRecipient,
          sender: userId,
          type: 'COMMENT_REPLY',
          title: 'Phản hồi bình luận',
          message: `đã trả lời bình luận của bạn trong công việc "${task.title}"`,
          link: taskLink,
          dedupeKey: `comment-reply:${comment._id}:${replyRecipient}`,
        });
      }
      for (const recipientId of mentionedRecipients) {
        await this.notificationsService.createNotification({
          recipient: recipientId,
          sender: userId,
          type: 'COMMENT_MENTION',
          title: 'Bạn được nhắc đến',
          message: `đã nhắc đến bạn trong công việc "${task.title}"`,
          link: taskLink,
          dedupeKey: `comment-mention:${comment._id}:${recipientId}`,
        });
      }
      for (const recipientId of notificationRecipients) {
        if (mentionedRecipients.has(recipientId) || recipientId === replyRecipient) continue;
        await this.notificationsService.createNotification({
          recipient: recipientId,
          sender: userId,
          type: 'NEW_COMMENT',
          title: 'Bình luận mới',
          message: `đã bình luận vào công việc "${task.title}"`,
          link: taskLink,
        });
      }
    } catch (e) {
      // Ignore notification errors to avoid failing comment creation
    }

    // Trả về comment đã populate author
    const populated = await this.commentModel
      .findById(comment._id)
      .populate('author', 'name email profileImage avatarUrl')
      .populate('mentions.user', 'name email profileImage avatarUrl')
      .populate({ path: 'replyToComment', select: 'text author', populate: { path: 'author', select: 'name email profileImage avatarUrl' } });
    this.commentSubject.next({ taskId: dto.taskId, action: 'created', commentId: comment._id.toString() });
    return populated;
  }

  async getCommentsByTask(taskId: string, userId: string, page = 1, limit = 20) {
    const task = await this.taskModel.findById(taskId);
    if (!task) throw new NotFoundException('Công việc không tồn tại');
    await this.projectAccessService.assertCanReadProject(task.project.toString(), userId);

    const safePage = Math.max(1, Number(page) || 1);
    const safeLimit = Math.min(100, Math.max(1, Number(limit) || 20));
    const rootQuery = { task: taskId, parentComment: null };
    const [roots, total, totalComments] = await Promise.all([
      this.commentModel.find(rootQuery)
        .populate('author', 'name email profileImage avatarUrl')
        .populate('mentions.user', 'name email profileImage avatarUrl')
        .sort({ createdAt: -1 })
        .skip((safePage - 1) * safeLimit)
        .limit(safeLimit),
      this.commentModel.countDocuments(rootQuery),
      this.commentModel.countDocuments({ task: taskId }),
    ]);
    const rootIds = roots.map((comment) => comment._id);
    const replies = rootIds.length > 0
      ? await this.commentModel.find({ parentComment: { $in: rootIds } })
        .populate('author', 'name email profileImage avatarUrl')
        .populate('mentions.user', 'name email profileImage avatarUrl')
        .populate({ path: 'replyToComment', select: 'text author', populate: { path: 'author', select: 'name email profileImage avatarUrl' } })
        .sort({ createdAt: 1 })
      : [];
    const repliesByParent = new Map<string, any[]>();
    replies.forEach((reply) => {
      const key = reply.parentComment!.toString();
      repliesByParent.set(key, [...(repliesByParent.get(key) || []), reply]);
    });
    const data = roots.map((root) => ({
      ...root.toObject(),
      replies: repliesByParent.get(root._id.toString()) || [],
    }));
    return {
      data,
      totalComments,
      pagination: { page: safePage, limit: safeLimit, total, totalPages: Math.ceil(total / safeLimit) },
    };
  }

  async getMentionCandidates(taskId: string, userId: string) {
    const task = await this.taskModel.findById(taskId).select('project');
    if (!task) throw new NotFoundException('Công việc không tồn tại');
    await this.projectAccessService.assertCanReadProject(task.project.toString(), userId);
    const project = await this.projectModel
      .findById(task.project)
      .select('members')
      .populate('members.user', 'name email profileImage avatarUrl')
      .lean();
    return (project?.members || [])
      .map((member: any) => member.user)
      .filter(Boolean);
  }

  async deleteComment(commentId: string, userId: string) {
    const comment = await this.commentModel.findById(commentId);
    if (!comment) throw new NotFoundException('Bình luận không tồn tại');

    // Chỉ tác giả mới được xoá
    if (comment.author.toString() !== userId) {
      throw new ForbiddenException('Bạn không có quyền xoá bình luận này');
    }

    const replyIds = comment.parentComment
      ? []
      : (await this.commentModel.find({ parentComment: comment._id }).select('_id')).map((reply) => reply._id);
    const deletedIds = [comment._id, ...replyIds];
    await this.taskModel.findByIdAndUpdate(comment.task, {
      $pull: { comments: { $in: deletedIds } },
    });
    await this.commentModel.deleteMany({ _id: { $in: deletedIds } });
    this.commentSubject.next({ taskId: comment.task.toString(), action: 'deleted', commentId: comment._id.toString() });

    await this.activitiesService.logActivity({
      user: userId,
      action: 'deleted_comment',
      resourceType: 'Task',
      resourceId: comment.task.toString(),
      details: {
        commentId: comment._id.toString(),
        description: comment.parentComment
          ? 'đã xoá một phản hồi'
          : 'đã xoá một bình luận',
      },
    }).catch(() => undefined);

    return { success: true };
  }

  async getCommentStream(taskId: string, userId: string): Promise<Observable<MessageEvent>> {
    const task = await this.taskModel.findById(taskId).select('project');
    if (!task) throw new NotFoundException('Công việc không tồn tại');
    await this.projectAccessService.assertCanReadProject(task.project.toString(), userId);
    return this.commentSubject.asObservable().pipe(
      filter((event) => event.taskId === taskId),
      map((event) => ({ data: JSON.stringify(event) }) as MessageEvent),
    );
  }
}
