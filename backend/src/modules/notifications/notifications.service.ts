import { Injectable, OnModuleInit, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../shared/prisma/prisma.service';
import * as nodemailer from 'nodemailer';

export interface SendMailOptions {
  to: string;
  subject?: string;
  templateKey?: string;
  variables?: Record<string, any>;
  customHtml?: string;
  metadata?: any;
}

@Injectable()
export class NotificationsService implements OnModuleInit {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    await this.seedDefaultEmailTemplates();
  }

  // --- DYNAMIC SMTP TRANSPORT PROVIDER ---

  async getSmtpSettings() {
    try {
      const settings = await this.prisma.siteSetting.findMany({
        where: {
          key: {
            in: [
              'smtp_host',
              'smtp_port',
              'smtp_user',
              'smtp_pass',
              'smtp_from_email',
              'smtp_from_name',
              'smtp_secure',
            ],
          },
        },
      });

      const kv: Record<string, string> = {};
      settings.forEach((s) => {
        kv[s.key] = s.value;
      });

      return {
        host: kv.smtp_host || process.env.SMTP_HOST || 'smtp-relay.brevo.com',
        port: Number(kv.smtp_port || process.env.SMTP_PORT || 587),
        user: kv.smtp_user || process.env.SMTP_USER || '',
        pass: kv.smtp_pass || process.env.SMTP_PASS || '',
        fromEmail: kv.smtp_from_email || process.env.MAIL_FROM_ADDRESS || 'no-reply@cowork30.com',
        fromName: kv.smtp_from_name || process.env.MAIL_FROM_NAME || 'Cowork30 Platform',
        secure: kv.smtp_secure === 'true',
      };
    } catch (err: any) {
      this.logger.warn(`Could not read SMTP settings from DB, using env fallback: ${err.message}`);
      return {
        host: process.env.SMTP_HOST || 'smtp-relay.brevo.com',
        port: Number(process.env.SMTP_PORT || 587),
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || '',
        fromEmail: process.env.MAIL_FROM_ADDRESS || 'no-reply@cowork30.com',
        fromName: process.env.MAIL_FROM_NAME || 'Cowork30 Platform',
        secure: false,
      };
    }
  }

  async updateSmtpSettings(body: {
    host?: string;
    port?: number;
    user?: string;
    pass?: string;
    fromEmail?: string;
    fromName?: string;
    secure?: boolean;
  }) {
    const keysMap: Record<string, string | undefined> = {
      smtp_host: body.host,
      smtp_port: body.port !== undefined ? String(body.port) : undefined,
      smtp_user: body.user,
      smtp_pass: body.pass,
      smtp_from_email: body.fromEmail,
      smtp_from_name: body.fromName,
      smtp_secure: body.secure !== undefined ? String(body.secure) : undefined,
    };

    for (const [key, val] of Object.entries(keysMap)) {
      if (val !== undefined) {
        await this.prisma.siteSetting.upsert({
          where: { key },
          update: { value: val },
          create: { key, value: val },
        });
      }
    }

    return {
      success: true,
      message: 'SMTP Email Configuration updated successfully.',
      settings: await this.getSmtpSettings(),
    };
  }

  private async sendBrevoRestApi(
    apiKey: string,
    fromEmail: string,
    fromName: string,
    toEmail: string,
    subject: string,
    htmlContent: string,
  ): Promise<string> {
    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        'api-key': apiKey,
      },
      body: JSON.stringify({
        sender: {
          name: fromName || 'Cowork30 Platform',
          email: fromEmail || 'no-reply@cowork30.com',
        },
        to: [{ email: toEmail }],
        subject,
        htmlContent,
      }),
    });

    const data: any = await res.json();
    if (!res.ok) {
      throw new Error(data.message || `Brevo HTTP ${res.status}: ${JSON.stringify(data)}`);
    }

    return data.messageId || 'brevo-api-success';
  }

  private async createTransporter() {
    const smtp = await this.getSmtpSettings();
    // Port 2525 fallback for Brevo on cloud hosts (Render/AWS) where Port 587 is blocked
    const port = (smtp.host.includes('brevo') && smtp.port === 587) ? 2525 : smtp.port;
    return nodemailer.createTransport({
      host: smtp.host,
      port,
      secure: smtp.secure || port === 465,
      auth: smtp.user
        ? {
            user: smtp.user,
            pass: smtp.pass,
          }
        : undefined,
      tls: {
        rejectUnauthorized: false,
      },
      connectionTimeout: 8000,
      greetingTimeout: 8000,
      socketTimeout: 10000,
    });
  }

  // --- TEMPLATE COMPILER & SEEDER ---

  private compileTemplate(html: string, variables: Record<string, any> = {}): string {
    let result = html;
    for (const [key, val] of Object.entries(variables)) {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      result = result.replace(regex, val !== undefined && val !== null ? String(val) : '');
    }
    return result;
  }

  async seedDefaultEmailTemplates() {
    const defaultTemplates = [
      {
        key: 'booking_confirmation',
        name: 'Desk & Tour Reservation Confirmation',
        subject: 'Reservation Confirmed - Cowork30 {{bookingCode}}',
        variablesJson: ['name', 'bookingCode', 'bookingType', 'date', 'branchName', 'amount'],
        htmlBody: `
<div style="font-family: Arial, sans-serif; background-color: #0f172a; padding: 30px; color: #f8fafc;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #1e293b; border-radius: 16px; padding: 30px; border: 1px solid #334155;">
    <div style="text-align: center; margin-bottom: 20px;">
      <h1 style="color: #6366f1; margin: 0; font-size: 24px;">Cowork30 Platform</h1>
      <p style="color: #94a3b8; font-size: 14px; margin-top: 5px;">Workspace Reservation Confirmation</p>
    </div>
    <div style="background-color: #0f172a; border-radius: 12px; padding: 20px; border: 1px solid #334155; margin-bottom: 20px;">
      <h2 style="color: #10b981; font-size: 18px; margin-top: 0;">Reservation Active!</h2>
      <p style="font-size: 14px; color: #cbd5e1;">Hi <strong>{{name}}</strong>,</p>
      <p style="font-size: 14px; color: #cbd5e1;">Your workspace booking at <strong>{{branchName}}</strong> is confirmed.</p>
      <table style="width: 100%; font-size: 14px; color: #cbd5e1; margin-top: 15px; border-collapse: collapse;">
        <tr><td style="padding: 8px 0; border-bottom: 1px solid #334155;">Booking Reference:</td><td style="text-align: right; font-weight: bold; color: #6366f1; font-family: monospace;">{{bookingCode}}</td></tr>
        <tr><td style="padding: 8px 0; border-bottom: 1px solid #334155;">Booking Type:</td><td style="text-align: right; font-weight: bold;">{{bookingType}}</td></tr>
        <tr><td style="padding: 8px 0; border-bottom: 1px solid #334155;">Scheduled Date:</td><td style="text-align: right; font-weight: bold;">{{date}}</td></tr>
        <tr><td style="padding: 8px 0;">Total Amount Paid:</td><td style="text-align: right; font-weight: bold; color: #10b981;">₹{{amount}}</td></tr>
      </table>
    </div>
    <div style="text-align: center; font-size: 12px; color: #94a3b8;">
      <p>Show this email or booking reference at reception upon arrival.</p>
      <p style="margin-top: 10px;">&copy; 2026 Cowork30 Platform. All rights reserved.</p>
    </div>
  </div>
</div>
`,
      },
      {
        key: 'meeting_confirmation',
        name: 'Meeting Suite Reservation Confirmation',
        subject: 'Meeting Suite Reserved - {{roomName}} ({{bookingCode}})',
        variablesJson: ['name', 'bookingCode', 'roomName', 'date', 'timeSlot', 'seatsBooked', 'amount', 'viewToken'],
        htmlBody: `
<div style="font-family: Arial, sans-serif; background-color: #0f172a; padding: 30px; color: #f8fafc;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #1e293b; border-radius: 16px; padding: 30px; border: 1px solid #334155;">
    <div style="text-align: center; margin-bottom: 20px;">
      <h1 style="color: #6366f1; margin: 0; font-size: 24px;">Cowork30 Platform</h1>
      <p style="color: #94a3b8; font-size: 14px; margin-top: 5px;">Meeting Suite Pass Confirmation</p>
    </div>
    <div style="background-color: #0f172a; border-radius: 12px; padding: 20px; border: 1px solid #334155; margin-bottom: 20px;">
      <h2 style="color: #10b981; font-size: 18px; margin-top: 0;">Suite Reserved: {{roomName}}</h2>
      <p style="font-size: 14px; color: #cbd5e1;">Hi <strong>{{name}}</strong>,</p>
      <p style="font-size: 14px; color: #cbd5e1;">Your meeting room suite reservation has been processed successfully.</p>
      <table style="width: 100%; font-size: 14px; color: #cbd5e1; margin-top: 15px; border-collapse: collapse;">
        <tr><td style="padding: 8px 0; border-bottom: 1px solid #334155;">Pass Code:</td><td style="text-align: right; font-weight: bold; color: #6366f1; font-family: monospace;">{{bookingCode}}</td></tr>
        <tr><td style="padding: 8px 0; border-bottom: 1px solid #334155;">Meeting Room:</td><td style="text-align: right; font-weight: bold;">{{roomName}}</td></tr>
        <tr><td style="padding: 8px 0; border-bottom: 1px solid #334155;">Date & Hours:</td><td style="text-align: right; font-weight: bold;">{{date}} ({{timeSlot}})</td></tr>
        <tr><td style="padding: 8px 0; border-bottom: 1px solid #334155;">Seats Reserved:</td><td style="text-align: right; font-weight: bold;">{{seatsBooked}} Seats</td></tr>
        <tr><td style="padding: 8px 0;">Grand Total:</td><td style="text-align: right; font-weight: bold; color: #10b981;">₹{{amount}}</td></tr>
      </table>
    </div>
    <div style="text-align: center; font-size: 12px; color: #94a3b8;">
      <p>&copy; 2026 Cowork30 Platform. All rights reserved.</p>
    </div>
  </div>
</div>
`,
      },
      {
        key: 'wallet_receipt',
        name: 'Wallet Top-Up Credit Receipt',
        subject: 'Wallet Credit Top-Up Receipt - ₹{{amount}} Added',
        variablesJson: ['name', 'amount', 'newBalance', 'referenceId', 'date'],
        htmlBody: `
<div style="font-family: Arial, sans-serif; background-color: #0f172a; padding: 30px; color: #f8fafc;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #1e293b; border-radius: 16px; padding: 30px; border: 1px solid #334155;">
    <div style="text-align: center; margin-bottom: 20px;">
      <h1 style="color: #10b981; margin: 0; font-size: 24px;">Cowork30 Wallet Receipt</h1>
      <p style="color: #94a3b8; font-size: 14px; margin-top: 5px;">Credit Transaction Confirmed</p>
    </div>
    <div style="background-color: #0f172a; border-radius: 12px; padding: 20px; border: 1px solid #334155; margin-bottom: 20px;">
      <p style="font-size: 14px; color: #cbd5e1;">Hi <strong>{{name}}</strong>,</p>
      <p style="font-size: 14px; color: #cbd5e1;">Your Cowork30 credit wallet has been updated.</p>
      <div style="text-align: center; padding: 20px; background-color: #1e293b; border-radius: 12px; margin: 15px 0;">
        <span style="font-size: 12px; color: #94a3b8; display: block;">AMOUNT CREDITED</span>
        <span style="font-size: 32px; font-weight: bold; color: #10b981;">+₹{{amount}}</span>
        <span style="font-size: 13px; color: #cbd5e1; display: block; margin-top: 5px;">New Total Balance: <strong>₹{{newBalance}}</strong></span>
      </div>
      <p style="font-size: 12px; color: #94a3b8;">Transaction Reference: <strong style="font-family: monospace; color: #6366f1;">{{referenceId}}</strong></p>
    </div>
    <div style="text-align: center; font-size: 12px; color: #94a3b8;">
      <p>&copy; 2026 Cowork30 Platform. All rights reserved.</p>
    </div>
  </div>
</div>
`,
      },
      {
        key: 'password_reset',
        name: 'Account Password Reset Alert',
        subject: 'Account Password Reset Notification - Cowork30',
        variablesJson: ['name', 'email', 'newPassword'],
        htmlBody: `
<div style="font-family: Arial, sans-serif; background-color: #0f172a; padding: 30px; color: #f8fafc;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #1e293b; border-radius: 16px; padding: 30px; border: 1px solid #334155;">
    <div style="text-align: center; margin-bottom: 20px;">
      <h1 style="color: #f59e0b; margin: 0; font-size: 24px;">Security & Password Alert</h1>
      <p style="color: #94a3b8; font-size: 14px; margin-top: 5px;">Cowork30 Member Account</p>
    </div>
    <div style="background-color: #0f172a; border-radius: 12px; padding: 20px; border: 1px solid #334155; margin-bottom: 20px;">
      <p style="font-size: 14px; color: #cbd5e1;">Hi <strong>{{name}}</strong>,</p>
      <p style="font-size: 14px; color: #cbd5e1;">Your Cowork30 account password has been reset by an administrator.</p>
      <div style="background-color: #1e293b; border: 1px border-[#334155]; border-radius: 12px; padding: 15px; margin: 15px 0;">
        <p style="font-size: 12px; color: #94a3b8; margin: 0 0 5px 0;">Your Account Email: <strong>{{email}}</strong></p>
        <p style="font-size: 12px; color: #94a3b8; margin: 0;">New Temporary Password: <strong style="font-family: monospace; color: #f59e0b; font-size: 16px;">{{newPassword}}</strong></p>
      </div>
      <p style="font-size: 12px; color: #f43f5e;">If you did not request this password reset, please contact support immediately.</p>
    </div>
    <div style="text-align: center; font-size: 12px; color: #94a3b8;">
      <p>&copy; 2026 Cowork30 Platform. All rights reserved.</p>
    </div>
  </div>
</div>
`,
      },
    ];

    for (const t of defaultTemplates) {
      const existing = await this.prisma.emailTemplate.findUnique({
        where: { key: t.key },
      });
      if (!existing) {
        await this.prisma.emailTemplate.create({
          data: {
            key: t.key,
            name: t.name,
            subject: t.subject,
            htmlBody: t.htmlBody.trim(),
            variablesJson: t.variablesJson,
            isActive: true,
          },
        });
        this.logger.log(`Seeded default email template: [${t.key}]`);
      }
    }
  }

  // --- MAIL DISPATCH ENGINE ---

  async sendMail(options: SendMailOptions) {
    const { to, templateKey, variables = {}, customHtml, metadata } = options;
    const smtp = await this.getSmtpSettings();

    let subject = options.subject || 'Cowork30 Platform Notification';
    let html = customHtml || '';

    // If templateKey specified, load template from DB
    if (templateKey) {
      const tmpl = await this.prisma.emailTemplate.findUnique({
        where: { key: templateKey },
      });
      if (tmpl && tmpl.isActive) {
        subject = this.compileTemplate(tmpl.subject, variables);
        html = this.compileTemplate(tmpl.htmlBody, variables);
      }
    } else if (customHtml) {
      html = this.compileTemplate(customHtml, variables);
      subject = this.compileTemplate(subject, variables);
    }

    // Create Audit Log Entry (Safe wrapper)
    let logId: number | null = null;
    try {
      const log = await this.prisma.emailLog.create({
        data: {
          recipient: to,
          subject,
          templateKey: templateKey || 'custom',
          status: 'pending',
          metadata: metadata ? metadata : undefined,
        },
      });
      logId = log.id;
    } catch (dbErr: any) {
      this.logger.warn(`Could not log email dispatch to DB: ${dbErr.message}`);
    }

    try {
      let messageId = '';
      const isBrevoApiKey = smtp.pass && smtp.pass.startsWith('xsmtpsib-');

      if (isBrevoApiKey) {
        try {
          this.logger.log(`Attempting email dispatch to ${to} via Brevo HTTPS REST API...`);
          messageId = await this.sendBrevoRestApi(
            smtp.pass,
            smtp.fromEmail,
            smtp.fromName,
            to,
            subject,
            html,
          );
        } catch (apiErr: any) {
          this.logger.warn(`Brevo HTTPS REST API failed (${apiErr.message}), falling back to SMTP Transporter...`);
        }
      }

      if (!messageId) {
        const transporter = await this.createTransporter();
        const mailInfo = await transporter.sendMail({
          from: `"${smtp.fromName}" <${smtp.fromEmail}>`,
          to,
          subject,
          html,
        });
        messageId = mailInfo.messageId;
      }

      if (logId) {
        await this.prisma.emailLog.update({
          where: { id: logId },
          data: {
            status: 'sent',
            sentAt: new Date(),
          },
        }).catch(() => {});
      }

      this.logger.log(`Email dispatched successfully to ${to} [Log ID: ${logId || 'N/A'}]`);
      return {
        success: true,
        logId: logId || 0,
        messageId,
      };
    } catch (err: any) {
      const errMsg = err.message || String(err);
      this.logger.error(`Email dispatch failed to ${to}: ${errMsg}`);

      if (logId) {
        await this.prisma.emailLog.update({
          where: { id: logId },
          data: {
            status: 'failed',
            errorMessage: errMsg,
          },
        }).catch(() => {});
      }

      return {
        success: false,
        logId: logId || 0,
        error: errMsg,
      };
    }
  }

  // --- ADMIN TEST EMAIL DISPATCH ---

  async sendTestEmail(toEmail: string) {
    if (!toEmail || !toEmail.includes('@')) {
      throw new BadRequestException('A valid recipient email address is required for test dispatch.');
    }

    const res = await this.sendMail({
      to: toEmail,
      subject: 'Test Email Dispatch - Cowork30 SMTP Integration',
      customHtml: `
<div style="font-family: Arial, sans-serif; background-color: #0f172a; padding: 25px; color: #f8fafc;">
  <div style="max-width: 550px; margin: 0 auto; background-color: #1e293b; border-radius: 16px; padding: 25px; border: 1px solid #334155;">
    <h2 style="color: #10b981; margin-top: 0;">✓ SMTP Configuration Active!</h2>
    <p style="font-size: 14px; color: #cbd5e1;">This is an automated test email confirming that your Cowork30 platform SMTP email service is operational.</p>
    <p style="font-size: 12px; color: #94a3b8; font-family: monospace;">Timestamp: ${new Date().toISOString()}</p>
  </div>
</div>
`,
      metadata: { isTestEmail: true },
    });

    if (!res.success) {
      throw new BadRequestException(`Test email dispatch failed: ${res.error}`);
    }

    return {
      success: true,
      message: `Test email dispatched successfully to ${toEmail}. Log ID: #${res.logId}`,
    };
  }

  // --- ADMIN TEMPLATES CONTROLLER ---

  async getTemplates() {
    const templates = await this.prisma.emailTemplate.findMany({
      orderBy: { key: 'asc' },
    });
    return {
      success: true,
      templates,
    };
  }

  async updateTemplate(id: number, body: { name?: string; subject?: string; htmlBody?: string; isActive?: boolean }) {
    const tmpl = await this.prisma.emailTemplate.findUnique({ where: { id } });
    if (!tmpl) {
      throw new NotFoundException('Email template not found');
    }

    const updated = await this.prisma.emailTemplate.update({
      where: { id },
      data: {
        ...(body.name ? { name: body.name } : {}),
        ...(body.subject ? { subject: body.subject } : {}),
        ...(body.htmlBody ? { htmlBody: body.htmlBody } : {}),
        ...(body.isActive !== undefined ? { isActive: body.isActive } : {}),
      },
    });

    return {
      success: true,
      message: `Template [${updated.key}] updated successfully.`,
      template: updated,
    };
  }

  // --- ADMIN EMAIL LOGS CONTROLLER ---

  async getEmailLogs(params: { search?: string; status?: string; page?: number; limit?: number }) {
    const { search, status, page = 1, limit = 50 } = params;
    const where: any = {};

    if (status && status !== 'all') {
      where.status = status;
    }

    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { recipient: { contains: q } },
        { subject: { contains: q } },
        { templateKey: { contains: q } },
      ];
    }

    const skip = (page - 1) * limit;

    const [logs, totalCount] = await Promise.all([
      this.prisma.emailLog.findMany({
        where,
        orderBy: { sentAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.emailLog.count({ where }),
    ]);

    const sentCount = await this.prisma.emailLog.count({ where: { status: 'sent' } });
    const failedCount = await this.prisma.emailLog.count({ where: { status: 'failed' } });

    return {
      success: true,
      stats: {
        totalCount,
        sentCount,
        failedCount,
      },
      logs,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    };
  }

  async resendEmail(logId: number) {
    const log = await this.prisma.emailLog.findUnique({ where: { id: logId } });
    if (!log) {
      throw new NotFoundException('Email log record not found');
    }

    return this.sendMail({
      to: log.recipient,
      subject: log.subject,
      templateKey: log.templateKey || undefined,
      metadata: { resentFromLogId: log.id },
    });
  }

  // --- MEMBER IN-APP NOTIFICATION FEED ---

  async createNotification(userId: number | null, title: string, message: string, type = 'info', link?: string) {
    return this.prisma.notification.create({
      data: {
        userId,
        title,
        message,
        type,
        link,
      },
    });
  }

  async getMemberNotifications(userId: number) {
    const notifications = await this.prisma.notification.findMany({
      where: {
        OR: [{ userId }, { userId: null }],
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    const unreadCount = notifications.filter((n) => !n.isRead).length;

    return {
      success: true,
      unreadCount,
      notifications,
    };
  }

  async markNotificationAsRead(id: number) {
    await this.prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
    return { success: true };
  }

  async markAllNotificationsAsRead(userId: number) {
    await this.prisma.notification.updateMany({
      where: {
        OR: [{ userId }, { userId: null }],
        isRead: false,
      },
      data: { isRead: true },
    });
    return { success: true };
  }

  // --- AUTOMATED CRON REMINDER SCHEDULER ENGINE ---

  @Cron(CronExpression.EVERY_5_MINUTES)
  async processUpcomingBookingReminders() {
    this.logger.log('Running automated upcoming booking reminder scheduler...');
    const now = new Date();
    const reminderThreshold = new Date(now.getTime() + 45 * 60 * 1000); // Next 45 minutes

    let meetingRemindersSent = 0;
    let deskRemindersSent = 0;

    try {
      // 1. Check Meeting Room Bookings starting within next 45 minutes
      const upcomingMeetings = await this.prisma.meetingBooking.findMany({
        where: {
          reminderSentAt: null,
          status: { in: ['confirmed', 'pending'] },
          startTime: {
            gte: now,
            lte: reminderThreshold,
          },
        },
        include: { meetingRoom: true },
      });

      for (const mb of upcomingMeetings) {
        // Send email
        if (mb.customerEmail) {
          await this.sendMail({
            to: mb.customerEmail,
            templateKey: 'meeting_confirmation',
            variables: {
              name: mb.customerName,
              bookingCode: mb.bookingCode,
              roomName: mb.meetingRoom?.name || 'Meeting Suite',
              date: new Date(mb.bookingDate).toLocaleDateString(),
              timeSlot: `${new Date(mb.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${new Date(mb.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
              seatsBooked: mb.seatsBooked,
              amount: mb.totalAmount,
              viewToken: mb.viewToken,
            },
            metadata: { isReminder: true },
          }).catch(() => {});
        }

        // Send in-app notification
        await this.createNotification(
          mb.userId || null,
          'Upcoming Reservation Reminder',
          `Reminder: Your meeting room suite reservation for ${mb.meetingRoom?.name || 'Meeting Suite'} starts in less than 45 minutes! (Code: #${mb.bookingCode})`,
          'meeting',
          `/meeting-rooms/receipt/${mb.viewToken}`,
        ).catch(() => {});

        // Flag reminderSentAt
        await this.prisma.meetingBooking.update({
          where: { id: mb.id },
          data: { reminderSentAt: new Date() },
        });

        meetingRemindersSent++;
      }

      // 2. Check Desk / Workspace Bookings scheduled for today
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

      const upcomingDeskBookings = await this.prisma.booking.findMany({
        where: {
          reminderSentAt: null,
          status: { in: ['confirmed', 'pending'] },
          preferredDate: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
        include: { pricingPlan: true },
      });

      for (const db of upcomingDeskBookings) {
        if (db.customerEmail) {
          await this.sendMail({
            to: db.customerEmail,
            templateKey: 'booking_confirmation',
            variables: {
              name: db.customerName,
              bookingCode: db.bookingCode,
              bookingType: db.pricingPlan?.name || 'Workspace Pass',
              date: new Date(db.preferredDate).toLocaleDateString(),
              branchName: 'Ishwarji Cowork 30 Main Branch',
              amount: db.totalAmount,
            },
            metadata: { isReminder: true },
          }).catch(() => {});
        }

        await this.createNotification(
          db.userId || null,
          'Today\'s Workspace Check-in Ready',
          `Reminder: Your workspace check-in pass (Code: #${db.bookingCode}) is active for today!`,
          'booking',
          '/dashboard?tab=bookings',
        ).catch(() => {});

        await this.prisma.booking.update({
          where: { id: db.id },
          data: { reminderSentAt: new Date() },
        });

        deskRemindersSent++;
      }

      if (meetingRemindersSent > 0 || deskRemindersSent > 0) {
        this.logger.log(`Automated Reminder Summary: Sent ${meetingRemindersSent} meeting suite reminders and ${deskRemindersSent} workspace reminders.`);
      }
    } catch (err: any) {
      this.logger.error(`Error executing booking reminder scheduler: ${err.message || String(err)}`);
    }

    return {
      success: true,
      meetingRemindersSent,
      deskRemindersSent,
    };
  }
}
