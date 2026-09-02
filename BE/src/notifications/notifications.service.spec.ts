import type { MessageEvent } from '@nestjs/common';
import { NotificationsService } from './notifications.service';

describe('NotificationsService SSE', () => {
  it('delivers notifications across service instances', async () => {
    const notification = {
      _id: 'notification-1',
      recipient: 'user-1',
      type: 'TASK_UPDATED',
      title: 'Task updated',
      message: 'A task changed',
      isRead: false,
    };
    const model = {
      create: jest.fn().mockResolvedValue({ _id: notification._id }),
      findById: jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue({
          _id: notification._id,
          recipient: notification.recipient,
          toObject: () => notification,
        }),
      }),
      countDocuments: jest.fn().mockResolvedValue(1),
    };
    const streamService = new NotificationsService(model as never);
    const publisherService = new NotificationsService(model as never);
    const events: MessageEvent[] = [];
    const subscription = streamService
      .getSSENotificationStream('user-1')
      .subscribe((event) => events.push(event));

    await publisherService.createNotification({
      recipient: 'user-1',
      type: notification.type,
      title: notification.title,
      message: notification.message,
    });

    expect(events).toHaveLength(2);
    expect(events[0]).toMatchObject({ type: 'connected' });
    expect(events[1]).toEqual({
      data: {
        notification,
        unreadCount: 1,
      },
    });
    subscription.unsubscribe();
  });
});
