import { Injectable, MessageEvent } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Subject, Observable, filter, map } from 'rxjs';
import { Notification } from './schemas/notification.schema';

export interface CreateNotificationDto {
  recipient: string;
  sender: string;
  type: string;
  title: string;
  message: string;
  link?: string;
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
    if (dto.recipient === dto.sender) return null;

    const noti = await this.notificationModel.create(dto);
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

  async getUserNotifications(userId: string, limit = 20) {
    return this.notificationModel
      .find({ recipient: userId })
      .populate('sender', 'name email profileImage')
      .sort({ createdAt: -1 })
      .limit(limit);
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
