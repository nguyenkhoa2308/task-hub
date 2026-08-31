import { Injectable, MessageEvent } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Subject, Observable, filter, map } from 'rxjs';
import { Notification } from './schemas/notification.schema';

export interface CreateNotificationDto {
  recipient: string;
  sender?: string;
  type: string;
  title: string;
  message: string;
  link?: string;
  dedupeKey?: string;
}

@Injectable()
export class NotificationsService {
  private notificationSubject = new Subject<{ recipientId: string; data: any }>();

  constructor(
    @InjectModel(Notification.name)
    private readonly notificationModel: Model<Notification>,
  ) {}

  async createNotification(dto: CreateNotificationDto) {
    // Đừng tự gửi thông báo cho chính mình
    if (dto.sender && dto.recipient === dto.sender) return null;

    let noti: Notification;
    try {
      noti = await this.notificationModel.create(dto);
    } catch (error: any) {
      // A unique dedupe key makes scheduled notifications safe across restarts
      // and across multiple backend instances.
      if (error?.code === 11000 && dto.dedupeKey) return null;
      throw error;
    }
    const populated = await this.notificationModel
      .findById(noti._id)
      .populate('sender', 'name email profileImage');

    // Bắn sự kiện SSE đẩy xuống client
    if (populated) {
      this.notificationSubject.next({
        recipientId: dto.recipient,
        data: populated,
      });
    }

    return populated;
  }

  async getUserNotifications(userId: string, page = 1, limit = 20) {
    const safePage = Math.max(1, Number(page) || 1);
    const safeLimit = Math.min(50, Math.max(1, Number(limit) || 20));
    const query = { recipient: userId };
    const [data, total] = await Promise.all([
      this.notificationModel
        .find(query)
        .populate('sender', 'name email profileImage')
        .sort({ createdAt: -1 })
        .skip((safePage - 1) * safeLimit)
        .limit(safeLimit),
      this.notificationModel.countDocuments(query),
    ]);
    return {
      data,
      pagination: {
        page: safePage,
        limit: safeLimit,
        total,
        totalPages: Math.ceil(total / safeLimit),
      },
    };
  }

  async getUnreadCount(userId: string) {
    const count = await this.notificationModel.countDocuments({
      recipient: userId,
      isRead: false,
    });
    return { unreadCount: count };
  }

  async markAsRead(notificationId: string, userId: string) {
    return this.notificationModel.findOneAndUpdate(
      { _id: notificationId, recipient: userId },
      { isRead: true },
      { new: true },
    );
  }

  async markAllAsRead(userId: string) {
    await this.notificationModel.updateMany(
      { recipient: userId, isRead: false },
      { isRead: true },
    );
    return { success: true };
  }

  // SSE Stream Observable dành cho từng user
  getSSENotificationStream(userId: string): Observable<MessageEvent> {
    return this.notificationSubject.asObservable().pipe(
      filter((event) => event.recipientId === userId),
      map((event) => ({
        data: JSON.stringify(event.data),
      }) as MessageEvent),
    );
  }
}
