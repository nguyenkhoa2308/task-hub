import {
  Injectable,
  Logger,
  MessageEvent,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  Subject,
  Observable,
  filter,
  interval,
  map,
  merge,
  startWith,
} from 'rxjs';
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

interface NotificationRealtimeEvent {
  recipientId: string;
  data: {
    notification: Record<string, unknown>;
    unreadCount: number;
  };
}

const hasToHexString = (
  value: unknown,
): value is { toHexString: () => string } =>
  typeof value === 'object' &&
  value !== null &&
  'toHexString' in value &&
  typeof value.toHexString === 'function';

const getInsertedDocumentId = (change: unknown): string | null => {
  if (typeof change !== 'object' || change === null) return null;
  if (!('operationType' in change) || change.operationType !== 'insert') {
    return null;
  }
  if (!('documentKey' in change)) return null;
  const documentKey = change.documentKey;
  if (typeof documentKey !== 'object' || documentKey === null) return null;
  if (!('_id' in documentKey) || documentKey._id == null) return null;
  if (typeof documentKey._id === 'string') return documentKey._id;
  return hasToHexString(documentKey._id) ? documentKey._id.toHexString() : null;
};

@Injectable()
export class NotificationsService implements OnModuleInit, OnModuleDestroy {
  private static readonly logger = new Logger(NotificationsService.name);
  private static readonly notificationSubject =
    new Subject<NotificationRealtimeEvent>();
  private static readonly recentlyPublishedIds = new Set<string>();
  private static changeStream: ReturnType<Model<Notification>['watch']> | null =
    null;

  constructor(
    @InjectModel(Notification.name)
    private readonly notificationModel: Model<Notification>,
  ) {}

  onModuleInit() {
    if (NotificationsService.changeStream) return;

    const changeStream = this.notificationModel.watch([
      { $match: { operationType: 'insert' } },
    ]);
    NotificationsService.changeStream = changeStream;
    changeStream.on('change', (change: unknown) => {
      const notificationId = getInsertedDocumentId(change);
      if (notificationId) {
        void this.publishStoredNotification(notificationId);
      }
    });
    changeStream.on('error', (error) => {
      NotificationsService.logger.error(
        `Notification change stream stopped: ${error.message}`,
      );
      NotificationsService.changeStream = null;
    });
  }

  async onModuleDestroy() {
    await NotificationsService.changeStream?.close();
    NotificationsService.changeStream = null;
  }

  async createNotification(dto: CreateNotificationDto) {
    // Đừng tự gửi thông báo cho chính mình
    if (dto.sender && dto.recipient === dto.sender) return null;

    let noti: Notification;
    try {
      noti = await this.notificationModel.create(dto);
    } catch (error: unknown) {
      // A unique dedupe key makes scheduled notifications safe across restarts
      // and across multiple backend instances.
      const errorCode =
        typeof error === 'object' && error !== null && 'code' in error
          ? error.code
          : undefined;
      if (errorCode === 11000 && dto.dedupeKey) return null;
      throw error;
    }
    const populated = await this.notificationModel
      .findById(noti._id)
      .populate('sender', 'name email profileImage');

    // Bắn sự kiện SSE đẩy xuống client
    if (populated) {
      const unreadCount = await this.notificationModel.countDocuments({
        recipient: dto.recipient,
        isRead: false,
      });
      this.publishRealtimeNotification(populated, unreadCount);
    }

    return populated;
  }

  private async publishStoredNotification(notificationId: string) {
    const notification = await this.notificationModel
      .findById(notificationId)
      .populate('sender', 'name email profileImage');
    if (!notification) return;
    const unreadCount = await this.notificationModel.countDocuments({
      recipient: notification.recipient,
      isRead: false,
    });
    this.publishRealtimeNotification(notification, unreadCount);
  }

  private publishRealtimeNotification(
    notification: Notification,
    unreadCount: number,
  ) {
    const notificationId = notification._id.toString();
    if (NotificationsService.recentlyPublishedIds.has(notificationId)) return;
    NotificationsService.recentlyPublishedIds.add(notificationId);
    setTimeout(() => {
      NotificationsService.recentlyPublishedIds.delete(notificationId);
    }, 30_000).unref();

    NotificationsService.notificationSubject.next({
      recipientId: notification.recipient.toString(),
      data: {
        notification: notification.toObject<Record<string, unknown>>(),
        unreadCount,
      },
    });
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
    const notifications = NotificationsService.notificationSubject
      .asObservable()
      .pipe(
        filter((event) => event.recipientId === userId.toString()),
        map((event) => ({ data: event.data }) satisfies MessageEvent),
      );
    const connection = interval(25_000).pipe(
      map(
        () =>
          ({
            type: 'heartbeat',
            data: { timestamp: Date.now() },
          }) satisfies MessageEvent,
      ),
      startWith({
        type: 'connected',
        data: { timestamp: Date.now() },
      } satisfies MessageEvent),
    );

    return merge(notifications, connection);
  }
}
