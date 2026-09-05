import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { NotificationsGateway } from './notifications.gateway';
import { CreateNotificationDto } from './dto/create-notification.dto';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly gateway: NotificationsGateway,
  ) {}

  async create(dto: CreateNotificationDto) {
    try {
      const notification = await (this.prisma as any).notification.create({
        data: {
          userId: dto.userId || null,
          title: dto.title,
          message: dto.message,
          type: dto.type || 'info',
          link: dto.link || null,
          isRead: false,
        },
      });

      if (dto.userId) {
        const unreadCount = await (this.prisma as any).notification.count({
          where: {
            OR: [{ userId: dto.userId }, { userId: null }],
            isRead: false,
          },
        });
        this.gateway.notifyUser(dto.userId, notification, unreadCount);
      } else {
        this.gateway.broadcast(notification);
      }

      return notification;
    } catch (error) {
      this.logger.error('Failed to create notification', error);
      throw error;
    }
  }

  async findAllForUser(userId?: number) {
    try {
      let whereClause: any = { userId: null };
      if (userId) {
        whereClause = {
          OR: [{ userId }, { userId: null }],
        };
      }

      let notifications = await (this.prisma as any).notification.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        take: 25,
      });

      // If user is authenticated and has no notifications yet, seed the standard suite
      if (userId && notifications.length === 0) {
        await this.seedDefaultNotifications(userId);
        notifications = await (this.prisma as any).notification.findMany({
          where: whereClause,
          orderBy: { createdAt: 'desc' },
          take: 25,
        });
      }

      const unreadCount = notifications.filter((n: any) => !n.isRead).length;

      return {
        notifications,
        unreadCount,
      };
    } catch (error) {
      this.logger.error('Failed to fetch notifications', error);
      return { notifications: [], unreadCount: 0 };
    }
  }

  async markAsRead(id: number, userId?: number) {
    try {
      const notification = await (this.prisma as any).notification.update({
        where: { id },
        data: { isRead: true },
      });

      if (userId) {
        this.gateway.notifyNotificationRead(userId, id);
        const unreadCount = await (this.prisma as any).notification.count({
          where: {
            OR: [{ userId }, { userId: null }],
            isRead: false,
          },
        });
        this.gateway.notifyUnreadCount(userId, unreadCount);
      }

      return { success: true, notification };
    } catch (error) {
      this.logger.error(`Failed to mark notification ${id} as read`, error);
      return { success: false };
    }
  }

  async markAllAsRead(userId: number) {
    try {
      await (this.prisma as any).notification.updateMany({
        where: {
          OR: [{ userId }, { userId: null }],
          isRead: false,
        },
        data: { isRead: true },
      });

      this.gateway.notifyAllRead(userId);
      this.gateway.notifyUnreadCount(userId, 0);

      return { success: true, message: 'All notifications marked as read' };
    } catch (error) {
      this.logger.error(`Failed to mark all notifications as read for user ${userId}`, error);
      return { success: false };
    }
  }

  async seedDefaultNotifications(userId: number) {
    const defaults = [
      {
        userId,
        title: 'Desk Pass Active',
        message: 'Your QR pass is ready for Downtown Hub check-in.',
        type: 'booking',
        link: '/dashboard?tab=bookings',
        isRead: false,
      },
      {
        userId,
        title: 'Custom Quote Update',
        message: 'Center manager updated your corporate team inquiry quote.',
        type: 'inquiry',
        link: '/dashboard',
        isRead: false,
      },
      {
        userId,
        title: 'Wallet Recharge Ready',
        message: 'Use instant 1-click booking with your wallet credits.',
        type: 'wallet',
        link: '/dashboard?tab=wallet',
        isRead: false,
      },
    ];

    for (const d of defaults) {
      await (this.prisma as any).notification.create({
        data: d,
      });
    }
  }
}
