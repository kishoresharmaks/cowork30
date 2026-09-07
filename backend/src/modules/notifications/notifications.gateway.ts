import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

const WS_ALLOWED_ORIGINS = [
  process.env.FRONTEND_URL,
  'http://localhost:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3000',
  'http://localhost:4000',
].filter(Boolean);

@WebSocketGateway({
  cors: {
    origin: WS_ALLOWED_ORIGINS,
    credentials: true,
  },
})
export class NotificationsGateway {
  @WebSocketServer()
  server!: Server;

  @SubscribeMessage('subscribe_notifications')
  handleSubscribe(
    @ConnectedSocket() client: Socket,
    @MessageBody() data?: { userId?: number },
  ) {
    client.join('global_notifications');
    if (data && data.userId) {
      const userRoom = `user_notifications_${data.userId}`;
      client.join(userRoom);
      return { event: 'subscribed_notifications', room: userRoom, userId: data.userId };
    }
    return { event: 'subscribed_notifications', room: 'global_notifications' };
  }

  @SubscribeMessage('unsubscribe_notifications')
  handleUnsubscribe(
    @ConnectedSocket() client: Socket,
    @MessageBody() data?: { userId?: number },
  ) {
    if (data && data.userId) {
      client.leave(`user_notifications_${data.userId}`);
    }
    client.leave('global_notifications');
    return { event: 'unsubscribed_notifications' };
  }

  notifyUser(userId: number, notification: any, unreadCount?: number) {
    if (this.server) {
      const room = `user_notifications_${userId}`;
      this.server.to(room).emit('notification_received', {
        ...notification,
        unreadCount,
      });
    }
  }

  broadcast(notification: any) {
    if (this.server) {
      this.server.to('global_notifications').emit('notification_received', notification);
      this.server.emit('notification_received', notification);
    }
  }

  notifyUnreadCount(userId: number, unreadCount: number) {
    if (this.server) {
      const room = `user_notifications_${userId}`;
      this.server.to(room).emit('unread_count_updated', { unreadCount });
    }
  }

  notifyNotificationRead(userId: number, notificationId: number) {
    if (this.server) {
      const room = `user_notifications_${userId}`;
      this.server.to(room).emit('notification_marked_read', { id: notificationId });
    }
  }

  notifyAllRead(userId: number) {
    if (this.server) {
      const room = `user_notifications_${userId}`;
      this.server.to(room).emit('all_notifications_read', { userId });
    }
  }
}
