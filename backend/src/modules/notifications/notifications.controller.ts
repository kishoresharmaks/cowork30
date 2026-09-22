import { Controller, Get, Post, Put, Patch, Body, Param, Query, ParseIntPipe, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Notifications & Email Control')
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  // --- ADMIN SMTP CONFIGURATION ---

  @Get('admin/smtp')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current dynamic SMTP settings (Admin Only)' })
  async getSmtpSettings() {
    return this.notificationsService.getSmtpSettings();
  }

  @Put('admin/smtp')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update dynamic SMTP credentials & sender identity (Admin Only)' })
  async updateSmtpSettings(@Body() body: any) {
    return this.notificationsService.updateSmtpSettings(body);
  }

  @Post('admin/test-email')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Send instant test email to verify SMTP configuration (Admin Only)' })
  async sendTestEmail(@Body() body: { toEmail: string }) {
    return this.notificationsService.sendTestEmail(body.toEmail);
  }

  // --- ADMIN TEMPLATE EDITOR ---

  @Get('admin/templates')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get customizable HTML email templates (Admin Only)' })
  async getTemplates() {
    return this.notificationsService.getTemplates();
  }

  @Put('admin/templates/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update email template HTML body and subject line (Admin Only)' })
  async updateTemplate(@Param('id', ParseIntPipe) id: number, @Body() body: any) {
    return this.notificationsService.updateTemplate(id, body);
  }

  // --- ADMIN OUTBOUND EMAIL LOGS ---

  @Get('admin/logs')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get outbound email delivery audit logs with filters & search (Admin Only)' })
  async getEmailLogs(
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.notificationsService.getEmailLogs({
      search,
      status,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Post('admin/logs/:id/resend')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Resend an email from audit log (Admin Only)' })
  async resendEmail(@Param('id', ParseIntPipe) id: number) {
    return this.notificationsService.resendEmail(id);
  }

  // --- MEMBER IN-APP FEED ---

  @Get('in-app')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get in-app notifications & unread badge count for logged-in user' })
  async getMemberNotificationsInApp(@Request() req: any) {
    return this.notificationsService.getMemberNotifications(req.user.id);
  }

  @Get()
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get in-app notifications & unread badge count (Root)' })
  async getMemberNotificationsRoot(@Request() req: any) {
    return this.notificationsService.getMemberNotifications(req.user.id);
  }

  @Put('in-app/:id/read')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mark an in-app notification as read' })
  async markNotificationAsReadInApp(@Param('id', ParseIntPipe) id: number) {
    return this.notificationsService.markNotificationAsRead(id);
  }

  @Patch(':id/read')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mark notification as read (Patch)' })
  async markNotificationAsReadPatch(@Param('id', ParseIntPipe) id: number) {
    return this.notificationsService.markNotificationAsRead(id);
  }

  @Put(':id/read')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mark notification as read (Put)' })
  async markNotificationAsReadPut(@Param('id', ParseIntPipe) id: number) {
    return this.notificationsService.markNotificationAsRead(id);
  }

  @Post('mark-all-read')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mark all in-app notifications as read (Post)' })
  async markAllNotificationsAsReadPost(@Request() req: any) {
    return this.notificationsService.markAllNotificationsAsRead(req.user.id);
  }

  @Put('in-app/read-all')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mark all in-app notifications as read (Put)' })
  async markAllNotificationsAsReadPut(@Request() req: any) {
    return this.notificationsService.markAllNotificationsAsRead(req.user.id);
  }
}
