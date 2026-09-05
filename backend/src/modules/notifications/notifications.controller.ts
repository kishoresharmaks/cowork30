import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Req,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import * as jwt from 'jsonwebtoken';

@ApiTags('Notifications')
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  private extractUserId(req: any): number | undefined {
    const authHeader = req.headers?.['authorization'] || req.headers?.['Authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.split(' ')[1];
        const secret = process.env.JWT_SECRET || 'cowork30_super_secret_jwt_key_2026';
        const decoded: any = jwt.verify(token, secret);
        if (decoded && (decoded.sub || decoded.id)) {
          return Number(decoded.sub || decoded.id);
        }
      } catch (err) {
        // invalid or expired token
      }
    }
    return undefined;
  }

  @Get()
  @ApiOperation({ summary: 'Get recent live notifications for authenticated user or public' })
  async getNotifications(@Req() req: any) {
    const userId = this.extractUserId(req);
    const data = await this.notificationsService.findAllForUser(userId);
    return {
      success: true,
      data,
    };
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark a notification as read' })
  async markRead(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    const userId = this.extractUserId(req);
    const result = await this.notificationsService.markAsRead(id, userId);
    return {
      success: true,
      data: result,
    };
  }

  @Post('mark-all-read')
  @ApiOperation({ summary: 'Mark all notifications as read for the user' })
  async markAllRead(@Req() req: any) {
    const userId = this.extractUserId(req);
    if (!userId) {
      return { success: false, message: 'Authentication required' };
    }
    const result = await this.notificationsService.markAllAsRead(userId);
    return {
      success: true,
      data: result,
    };
  }

  @Post('test-trigger')
  @ApiOperation({ summary: 'Trigger a real-time notification for test purposes' })
  async triggerTest(@Req() req: any, @Body() body: CreateNotificationDto) {
    const userId = body.userId || this.extractUserId(req);
    const notification = await this.notificationsService.create({
      userId,
      title: body.title || 'Desk Pass Active',
      message: body.message || 'Your QR pass is ready for Downtown Hub check-in.',
      type: body.type || 'booking',
      link: body.link || '/dashboard?tab=bookings',
    });

    return {
      success: true,
      message: 'Real-time notification emitted successfully',
      data: notification,
    };
  }
}
