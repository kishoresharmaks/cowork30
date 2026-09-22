import { Injectable, NotFoundException, BadRequestException, Optional, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { randomBytes } from 'crypto';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { BookingStatus, PaymentStatus, Role } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class BookingsService {
  private readonly logger = new Logger(BookingsService.name);

  constructor(
    private prisma: PrismaService,
    @Optional() private notificationsService?: NotificationsService,
  ) {}

  private getBookingTimeWindow(preferredDate: Date, preferredTimeSlot?: string | null): { startTime: Date; endTime: Date } {
    const startDate = new Date(preferredDate);
    const endDate = new Date(preferredDate);
    const slot = (preferredTimeSlot || '').trim();
    const slotLower = slot.toLowerCase();

    // Match all 12-hour time patterns: e.g. "10:00 AM", "06:00 PM", "10 AM", "6 PM", "8:00AM"
    const matches = Array.from(
      slot.matchAll(/\b(\d{1,2})(?::(\d{2}))?\s*(AM|PM)\b/gi),
    );

    if (matches.length >= 2) {
      // Time range found (e.g. "10:00 AM - 06:00 PM", "8:00 AM to 8:00 PM", "10 AM - 6 PM")
      const startMatch = matches[0];
      const lastMatch = matches[matches.length - 1];

      let sHours = parseInt(startMatch[1], 10);
      const sMinutes = startMatch[2] ? parseInt(startMatch[2], 10) : 0;
      const sAmpm = startMatch[3].toUpperCase();
      if (sAmpm === 'PM' && sHours < 12) sHours += 12;
      if (sAmpm === 'AM' && sHours === 12) sHours = 0;
      startDate.setHours(sHours, sMinutes, 0, 0);

      let eHours = parseInt(lastMatch[1], 10);
      const eMinutes = lastMatch[2] ? parseInt(lastMatch[2], 10) : 0;
      const eAmpm = lastMatch[3].toUpperCase();
      if (eAmpm === 'PM' && eHours < 12) eHours += 12;
      if (eAmpm === 'AM' && eHours === 12) eHours = 0;

      const startTotalMins = sHours * 60 + sMinutes;
      const endTotalMins = eHours * 60 + eMinutes;
      if (endTotalMins <= startTotalMins) {
        endDate.setDate(endDate.getDate() + 1);
      }
      endDate.setHours(eHours, eMinutes, 0, 0);

      return { startTime: startDate, endTime: endDate };
    }

    if (matches.length === 1) {
      // Single time matched e.g. "10:00 AM" or "Morning 10:00 AM"
      const match = matches[0];
      let startHours = parseInt(match[1], 10);
      const startMins = match[2] ? parseInt(match[2], 10) : 0;
      const ampm = match[3].toUpperCase();

      if (ampm === 'PM' && startHours < 12) startHours += 12;
      if (ampm === 'AM' && startHours === 12) startHours = 0;
      startDate.setHours(startHours, startMins, 0, 0);

      // Half-day (morning/afternoon) = 4h, Day pass default = 8h
      const durationHours = (slotLower.includes('morning') || slotLower.includes('afternoon')) ? 4 : 8;
      const endHours = startHours + durationHours;
      const finalEHours = endHours % 24;

      const startTotalMins = startHours * 60 + startMins;

      if (endHours >= 24 || (finalEHours * 60 + startMins) <= startTotalMins) {
        endDate.setDate(endDate.getDate() + 1);
      }
      endDate.setHours(finalEHours, startMins, 0, 0);
      return { startTime: startDate, endTime: endDate };
    }

    // Default operating window: 8:00 AM to 8:00 PM (20:00)
    startDate.setHours(8, 0, 0, 0);
    endDate.setHours(20, 0, 0, 0);
    return { startTime: startDate, endTime: endDate };
  }

  @Cron(CronExpression.EVERY_5_MINUTES)
  async autoCompleteExpiredBookings() {
    const now = new Date();
    const nowTime = now.getTime();

    // 1. Process Meeting Bookings whose slot time has finished
    const activeMeetings = await this.prisma.meetingBooking.findMany({
      where: {
        status: {
          in: [BookingStatus.confirmed, BookingStatus.pending, BookingStatus.unpaid],
        },
      },
      select: { id: true, startTime: true, endTime: true, status: true, paymentStatus: true },
    });

    const meetingIdsToComplete: number[] = [];
    const meetingIdsNotCheckedIn: number[] = [];

    for (const mb of activeMeetings) {
      const endTimeMs = new Date(mb.endTime).getTime();
      if (endTimeMs <= nowTime) {
        // ONLY if customer actually checked in (status === BookingStatus.confirmed)
        // paymentStatus is completely independent!
        if (mb.status === BookingStatus.confirmed) {
          meetingIdsToComplete.push(mb.id);
        } else {
          meetingIdsNotCheckedIn.push(mb.id);
        }
      }
    }

    if (meetingIdsToComplete.length > 0) {
      await this.prisma.meetingBooking.updateMany({
        where: {
          id: { in: meetingIdsToComplete },
          status: BookingStatus.confirmed, // Atomic guard: ONLY currently confirmed meetings
        },
        data: { status: BookingStatus.completed }, // DO NOT automatically alter paymentStatus
      });
    }

    if (meetingIdsNotCheckedIn.length > 0) {
      await this.prisma.meetingBooking.updateMany({
        where: {
          id: { in: meetingIdsNotCheckedIn },
          status: { in: [BookingStatus.pending, BookingStatus.unpaid] }, // Atomic guard: ONLY currently non-checked-in
        },
        data: { status: BookingStatus.not_checked_in },
      });
    }

    // 2. Process Desk / Regular Bookings whose preferred date/slot has finished
    const activeDeskBookings = await this.prisma.booking.findMany({
      where: {
        status: {
          in: [BookingStatus.confirmed, BookingStatus.pending, BookingStatus.unpaid],
        },
        NOT: [
          { bookingCode: { startsWith: 'SRV-' } },
          { notes: { contains: 'Solution:' } },
        ],
      },
      select: { id: true, preferredDate: true, preferredTimeSlot: true, status: true, paymentStatus: true },
    });

    const deskIdsToComplete: number[] = [];
    const deskIdsNotCheckedIn: number[] = [];

    for (const db of activeDeskBookings) {
      const { endTime } = this.getBookingTimeWindow(db.preferredDate, db.preferredTimeSlot);
      if (endTime.getTime() <= nowTime) {
        // ONLY if customer actually checked in (status === BookingStatus.confirmed)
        if (db.status === BookingStatus.confirmed) {
          deskIdsToComplete.push(db.id);
        } else {
          deskIdsNotCheckedIn.push(db.id);
        }
      }
    }

    if (deskIdsToComplete.length > 0) {
      await this.prisma.booking.updateMany({
        where: {
          id: { in: deskIdsToComplete },
          status: BookingStatus.confirmed, // Atomic guard: ONLY currently confirmed passes
        },
        data: { status: BookingStatus.completed }, // DO NOT automatically alter paymentStatus
      });
    }

    if (deskIdsNotCheckedIn.length > 0) {
      await this.prisma.booking.updateMany({
        where: {
          id: { in: deskIdsNotCheckedIn },
          status: { in: [BookingStatus.pending, BookingStatus.unpaid] }, // Atomic guard: ONLY currently non-checked-in
        },
        data: { status: BookingStatus.not_checked_in },
      });
    }

    return {
      success: true,
      processed: {
        meetingsCompleted: meetingIdsToComplete.length,
        meetingsNotCheckedIn: meetingIdsNotCheckedIn.length,
        deskCompleted: deskIdsToComplete.length,
        deskNotCheckedIn: deskIdsNotCheckedIn.length,
      },
      timestamp: now.toISOString(),
    };
  }

  async findAll(query: { status?: BookingStatus; search?: string; type?: string }) {
    const where: any = {
      NOT: [
        { bookingCode: { startsWith: 'SRV-' } },
        { notes: { contains: 'Solution:' } },
      ],
    };

    if (query.status) {
      where.status = query.status;
    }

    if (query.type) {
      where.bookingType = query.type;
    }

    if (query.search) {
      where.OR = [
        { customerName: { contains: query.search } },
        { customerEmail: { contains: query.search } },
        { customerPhone: { contains: query.search } },
        { bookingCode: { contains: query.search } },
      ];
    }

    const bookings = await this.prisma.booking.findMany({
      where,
      include: {
        pricingPlan: true,
        branch: true,
        notesList: { orderBy: { createdAt: 'desc' } },
        payments: { orderBy: { createdAt: 'desc' } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      success: true,
      count: bookings.length,
      data: bookings,
      bookings,
    };
  }

  async findMeetingBookings(query: { status?: BookingStatus; search?: string }) {
    const where: any = {};

    if (query.status) {
      where.status = query.status;
    }

    if (query.search) {
      where.OR = [
        { customerName: { contains: query.search } },
        { customerEmail: { contains: query.search } },
        { customerPhone: { contains: query.search } },
        { bookingCode: { contains: query.search } },
        { qrAccessCode: { contains: query.search } },
      ];
    }

    const meetingBookings = await this.prisma.meetingBooking.findMany({
      where,
      include: {
        meetingRoom: true,
        branch: true,
        payments: { orderBy: { createdAt: 'desc' } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      success: true,
      count: meetingBookings.length,
      data: meetingBookings,
      meetingBookings,
    };
  }

  async updateStatus(id: number, status: BookingStatus, paymentStatus?: PaymentStatus) {
    if (!Object.values(BookingStatus).includes(status)) {
      throw new BadRequestException('Invalid status value');
    }

    const booking = await this.prisma.booking.findUnique({ where: { id } });
    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (
      booking.status === BookingStatus.completed ||
      booking.status === BookingStatus.cancelled ||
      booking.status === BookingStatus.not_checked_in
    ) {
      throw new BadRequestException(
        `Status Locked: Booking #${booking.bookingCode} is already in terminal '${booking.status}' status and cannot be modified.`
      );
    }

    if (status === BookingStatus.confirmed) {
      throw new BadRequestException(
        `Direct status transition to 'confirmed' via admin update is disallowed. Guest check-in must be processed via reception check-in terminal or QR verification (/api/v1/bookings/check-in).`
      );
    }

    const nextPaymentStatus = paymentStatus !== undefined ? paymentStatus : booking.paymentStatus;

    const updated = await this.prisma.booking.update({
      where: { id },
      data: {
        status,
        paymentStatus: nextPaymentStatus,
      },
      include: {
        pricingPlan: true,
        payments: true,
      },
    });

    return {
      success: true,
      booking: updated,
    };
  }

  async updateMeetingStatus(id: number, status: BookingStatus, paymentStatus?: PaymentStatus) {
    if (!Object.values(BookingStatus).includes(status)) {
      throw new BadRequestException('Invalid status value');
    }

    const booking = await this.prisma.meetingBooking.findUnique({ where: { id } });
    if (!booking) {
      throw new NotFoundException('Meeting room booking not found');
    }

    if (
      booking.status === BookingStatus.completed ||
      booking.status === BookingStatus.cancelled ||
      booking.status === BookingStatus.not_checked_in
    ) {
      throw new BadRequestException(
        `Status Locked: Meeting reservation #${booking.bookingCode} is already in terminal '${booking.status}' status and cannot be modified.`
      );
    }

    if (status === BookingStatus.confirmed) {
      throw new BadRequestException(
        `Direct status transition to 'confirmed' via admin update is disallowed. Guest check-in must be processed via reception check-in terminal or QR verification (/api/v1/bookings/check-in).`
      );
    }

    const nextPaymentStatus = paymentStatus !== undefined ? paymentStatus : booking.paymentStatus;

    const updated = await this.prisma.meetingBooking.update({
      where: { id },
      data: {
        status,
        paymentStatus: nextPaymentStatus,
      },
      include: {
        meetingRoom: true,
        payments: true,
      },
    });

    return {
      success: true,
      booking: updated,
    };
  }

  async addNote(bookingId: number, adminUserId: number, noteText: string) {
    const booking = await this.prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (!adminUserId) {
      throw new BadRequestException('Admin user ID is required');
    }

    const note = await this.prisma.bookingNote.create({
      data: {
        bookingId,
        adminUserId,
        noteText,
      },
    });

    return {
      success: true,
      note,
    };
  }

  private escapeCsv(value: any): string {
    if (value === null || value === undefined) return '';
    let str = String(value);
    if (/^[=+\-@\t\r]/.test(str)) {
      str = `'${str}`;
    }
    if (str.includes('"') || str.includes(',') || str.includes('\n') || str.includes('\r')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  }

  async getAdminStats() {
    const regularBookingsCount = await this.prisma.booking.count();
    const meetingBookingsCount = await this.prisma.meetingBooking.count();
    const totalBookings = regularBookingsCount + meetingBookingsCount;

    const activeMembers = await this.prisma.user.count({
      where: { role: Role.member },
    });

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const paidRevenue = await this.prisma.payment.aggregate({
      where: {
        status: PaymentStatus.paid,
        createdAt: { gte: startOfMonth, lt: startOfNextMonth },
      },
      _sum: { amount: true },
    });

    const monthlyRevenue = Number(paidRevenue._sum.amount || 0);

    const totalRooms = await this.prisma.meetingRoom.count({ where: { isActive: true } });
    const activeRoomsGroup = await this.prisma.meetingBooking.groupBy({
      by: ['meetingRoomId'],
      where: {
        status: BookingStatus.confirmed,
        startTime: { lte: now },
        endTime: { gte: now },
      },
    });
    const occupiedRoomsCount = activeRoomsGroup.length;
    const roomOccupancyRate = totalRooms > 0 ? Math.min(100, Math.round((occupiedRoomsCount / totalRooms) * 100)) : 0;

    const recentRegular = await this.prisma.booking.findMany({
      take: 3,
      orderBy: { createdAt: 'desc' },
      include: { pricingPlan: true },
    });

    const recentMeeting = await this.prisma.meetingBooking.findMany({
      take: 3,
      orderBy: { createdAt: 'desc' },
      include: { meetingRoom: true },
    });

    const recentActivity = [
      ...recentRegular.map((b) => ({
        id: `b-${b.id}`,
        title: `${b.pricingPlan?.name || 'Workspace Tour'} Requested`,
        subtitle: `Customer: ${b.customerName} (${b.customerEmail})`,
        status: b.status,
        date: b.createdAt,
      })),
      ...recentMeeting.map((m) => ({
        id: `m-${m.id}`,
        title: `${m.meetingRoom?.name || 'Meeting Room'} Reserved`,
        subtitle: `Customer: ${m.customerName} (${m.totalHours} hrs)`,
        status: m.status,
        date: m.createdAt,
      })),
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);

    return {
      success: true,
      stats: {
        totalBookings,
        activeMembers,
        monthlyRevenue,
        roomOccupancyRate,
      },
      recentActivity,
    };
  }

  async getPublicStats() {
    const availableDesks = await this.prisma.desk.count({
      where: { status: 'available' },
    });

    const meetingRooms = await this.prisma.meetingRoom.count({
      where: { isActive: true },
    });

    const totalMembers = await this.prisma.user.count({
      where: { role: Role.member },
    });

    return {
      success: true,
      stats: {
        availableDesks,
        meetingRooms,
        totalMembers,
        satisfactionRate: 99.9,
      },
    };
  }

  async exportCsv() {
    const bookings = await this.prisma.booking.findMany({
      where: {
        NOT: [
          { bookingCode: { startsWith: 'SRV-' } },
          { notes: { contains: 'Solution:' } },
        ],
      },
      include: { pricingPlan: true, branch: true, user: true },
      orderBy: { createdAt: 'desc' },
    });

    const header = 'Booking Code,Customer Name,Email,Phone,Company,GSTIN,Plan Name,Preferred Date,Time Slot,Booking Type,Status,Payment Status,Created At\n';
    const rows = bookings
      .map(
        (b) =>
          `${this.escapeCsv(b.bookingCode)},${this.escapeCsv(b.customerName)},${this.escapeCsv(b.customerEmail)},${this.escapeCsv(b.customerPhone || '')},${this.escapeCsv(b.companyName || '')},${this.escapeCsv(b.gstin || '')},${this.escapeCsv(b.pricingPlan?.name || 'Pass')},${this.escapeCsv(b.preferredDate ? b.preferredDate.toISOString().split('T')[0] : '')},${this.escapeCsv(b.preferredTimeSlot || '')},${this.escapeCsv(b.bookingType || '')},${this.escapeCsv(b.status)},${this.escapeCsv(b.paymentStatus)},${this.escapeCsv(b.createdAt.toISOString())}`,
      )
      .join('\n');

    return header + rows;
  }

  private generateUniqueBookingCode(prefix: string): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = randomBytes(3).toString('hex').toUpperCase();
    return `${prefix}-${timestamp}-${random}`;
  }

  async createAdminBooking(data: any) {
    const bookingCode = this.generateUniqueBookingCode('BK');

    // Input validation and sanitization
    const customerName = String(data.customerName || '').trim();
    const customerEmail = String(data.customerEmail || '').trim().toLowerCase();
    const customerPhone = data.customerPhone ? String(data.customerPhone).trim() : null;
    const companyName = data.companyName ? String(data.companyName).trim() : null;
    const gstin = data.gstin ? String(data.gstin).trim() : null;
    const preferredDate = data.preferredDate ? new Date(data.preferredDate) : new Date();

    let totalAmount = data.totalAmount !== undefined && data.totalAmount !== null && data.totalAmount !== ''
      ? Number(data.totalAmount)
      : 150;

    let pricingPlanId: number | undefined = undefined;
    if (data.pricingPlanId) {
      pricingPlanId = Number(data.pricingPlanId);
      if (isNaN(pricingPlanId)) {
        throw new BadRequestException('Invalid pricing plan ID');
      }
      const plan = await this.prisma.pricingPlan.findUnique({
        where: { id: pricingPlanId },
      });
      if (!plan) {
        throw new BadRequestException('Referenced pricing plan does not exist');
      }
      totalAmount = Number(plan.priceDaily) > 0 ? Number(plan.priceDaily) : Number(plan.priceMonthly);
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(customerEmail)) {
      throw new BadRequestException('Invalid email format');
    }

    // Validate amount
    if (isNaN(totalAmount) || totalAmount < 0) {
      throw new BadRequestException('Total amount must be a non-negative number');
    }

    // Validate date
    if (isNaN(preferredDate.getTime())) {
      throw new BadRequestException('Invalid preferred date');
    }

    const isPaid = data.paymentStatus === PaymentStatus.paid || data.paymentStatus === 'paid' || data.isPaid === true;

    const payload: any = {
      bookingCode,
      branchId: Number(data.branchId) || 1,
      customerName,
      customerEmail,
      customerPhone,
      companyName,
      gstin,
      preferredDate,
      preferredTimeSlot: String(data.preferredTimeSlot || '10:00 AM').trim().slice(0, 50),
      status: isPaid ? BookingStatus.pending : BookingStatus.unpaid,
      paymentStatus: isPaid ? PaymentStatus.paid : PaymentStatus.unpaid,
      totalAmount,
    };

    if (pricingPlanId) {
      payload.pricingPlanId = pricingPlanId;
    }

    if (data.userId) {
      payload.userId = Number(data.userId);
    }

    const booking = await this.prisma.booking.create({
      data: payload,
      include: {
        pricingPlan: true,
      },
    });

    if (isPaid) {
      await this.prisma.payment.create({
        data: {
          bookingId: booking.id,
          userId: booking.userId || null,
          amount: totalAmount,
          paymentMethod: data.paymentMethod === 'wallet' ? 'wallet' : data.paymentMethod === 'credits' ? 'credits' : 'cash',
          status: PaymentStatus.paid,
        },
      }).catch((err) => {
        this.logger.error(`Failed to create audit payment record for admin booking #${booking.id}: ${err.message}`, err.stack);
      });
    }

    return {
      success: true,
      booking,
    };
  }

  async verifyAndCheckIn(code: string, branchId?: number) {
    const cleanCode = String(code || '').trim();
    if (!cleanCode) {
      throw new BadRequestException('Access code or pass code is required');
    }

    const meetingBooking = await this.prisma.meetingBooking.findFirst({
      where: {
        OR: [
          { qrAccessCode: cleanCode },
          { bookingCode: cleanCode },
        ],
      },
      include: { meetingRoom: true },
    });

    if (meetingBooking) {
      // 1. Branch Validation
      if (branchId && meetingBooking.branchId !== Number(branchId)) {
        throw new BadRequestException(
          `Access Denied: Meeting Suite Reservation #${meetingBooking.bookingCode} is registered for a different branch.`,
        );
      }

      // 2. Terminal State Checks
      if (meetingBooking.status === BookingStatus.cancelled) {
        throw new BadRequestException(
          `Access Denied: Meeting Suite Reservation #${meetingBooking.bookingCode} was CANCELLED. Access revoked.`,
        );
      }
      if (meetingBooking.status === BookingStatus.completed) {
        throw new BadRequestException(
          `Access Denied: Meeting Suite Reservation #${meetingBooking.bookingCode} is already COMPLETED.`,
        );
      }
      if (meetingBooking.status === BookingStatus.not_checked_in) {
        throw new BadRequestException(
          `Access Denied: Meeting Suite Reservation #${meetingBooking.bookingCode} was NOT CHECKED-IN and has expired.`,
        );
      }

      // 3. Payment Rule Check: Payment MUST be settled prior to check-in!
      if (meetingBooking.paymentStatus !== PaymentStatus.paid) {
        throw new BadRequestException(
          `Access Denied: Meeting Suite Reservation #${meetingBooking.bookingCode} is UNPAID (Payment Status: ${meetingBooking.paymentStatus}). Payment must be settled before check-in.`,
        );
      }

      // 4. Time Window Check
      const nowTime = Date.now();
      const startTimeMs = new Date(meetingBooking.startTime).getTime();
      const endTimeMs = new Date(meetingBooking.endTime).getTime();

      if (endTimeMs <= nowTime) {
        throw new BadRequestException(
          `Access Denied: Meeting Suite Reservation #${meetingBooking.bookingCode} has EXPIRED. Check-in is not permitted for past reservations.`,
        );
      }

      // Allow check-in starting 30 minutes before scheduled start time
      const earlyCheckInWindowMs = startTimeMs - 30 * 60 * 1000;
      if (nowTime < earlyCheckInWindowMs) {
        const startTimeStr = new Date(meetingBooking.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        throw new BadRequestException(
          `Access Denied: Early check-in is not open yet for #${meetingBooking.bookingCode}. Check-in opens 30 minutes prior to start time (${startTimeStr}).`,
        );
      }

      // 5. Already Checked-In Check
      if (meetingBooking.status === BookingStatus.confirmed) {
        return {
          success: true,
          type: 'meeting_room',
          detailName: meetingBooking.meetingRoom?.name,
          customerName: meetingBooking.customerName,
          booking: meetingBooking,
          message: `Member is already checked in for ${meetingBooking.meetingRoom?.name || 'Meeting Room'}!`,
        };
      }

      // 6. Atomic Update: Set status to confirmed (checked-in) preserving paymentStatus
      const updateResult = await this.prisma.meetingBooking.updateMany({
        where: {
          id: meetingBooking.id,
          status: { in: [BookingStatus.pending, BookingStatus.unpaid] },
          paymentStatus: PaymentStatus.paid,
        },
        data: {
          status: BookingStatus.confirmed,
        },
      });

      if (updateResult.count === 0) {
        throw new BadRequestException(`Check-In Failed: Reservation #${meetingBooking.bookingCode} status has been updated by another process.`);
      }

      const updated = await this.prisma.meetingBooking.findUnique({
        where: { id: meetingBooking.id },
        include: { meetingRoom: true },
      });

      if (this.notificationsService && updated) {
        await this.notificationsService.createNotification(
          updated.userId || null,
          'Check-In Verified',
          `Member verified and checked in for ${updated.meetingRoom?.name || 'Meeting Room'}!`,
          'meeting',
        ).catch((err) => {
          this.logger.error(`Failed to send check-in notification: ${err?.message}`);
        });
      }

      return {
        success: true,
        type: 'meeting_room',
        detailName: meetingBooking.meetingRoom?.name,
        customerName: meetingBooking.customerName,
        booking: updated,
        message: `Member Verified & Checked-In for ${meetingBooking.meetingRoom?.name || 'Meeting Room'}!`,
      };
    }

    const regularBooking = await this.prisma.booking.findFirst({
      where: { bookingCode: cleanCode },
      include: { pricingPlan: true },
    });

    if (regularBooking) {
      // 1. Branch Validation
      if (branchId && regularBooking.branchId !== Number(branchId)) {
        throw new BadRequestException(
          `Access Denied: Pass #${regularBooking.bookingCode} is registered for a different branch.`,
        );
      }

      // 2. Terminal State Checks
      if (regularBooking.status === BookingStatus.cancelled) {
        throw new BadRequestException(
          `Access Denied: Pass #${regularBooking.bookingCode} was CANCELLED. Access revoked.`,
        );
      }
      if (regularBooking.status === BookingStatus.completed) {
        throw new BadRequestException(
          `Access Denied: Pass #${regularBooking.bookingCode} is already COMPLETED.`,
        );
      }
      if (regularBooking.status === BookingStatus.not_checked_in) {
        throw new BadRequestException(
          `Access Denied: Pass #${regularBooking.bookingCode} was NOT CHECKED-IN and has expired.`,
        );
      }

      // 3. Payment Rule Check: Payment MUST be settled prior to check-in!
      if (regularBooking.paymentStatus !== PaymentStatus.paid) {
        throw new BadRequestException(
          `Access Denied: Pass #${regularBooking.bookingCode} is UNPAID (Payment Status: ${regularBooking.paymentStatus}). Payment must be settled before check-in.`,
        );
      }

      // 4. Time Window Check
      const nowTime = Date.now();
      const { startTime, endTime } = this.getBookingTimeWindow(regularBooking.preferredDate, regularBooking.preferredTimeSlot);
      const endTimeMs = endTime.getTime();

      if (endTimeMs <= nowTime) {
        throw new BadRequestException(
          `Access Denied: Pass #${regularBooking.bookingCode} has EXPIRED. Check-in is not permitted for past dates.`,
        );
      }

      const earlyCheckInWindowMs = startTime.getTime() - 30 * 60 * 1000;
      if (nowTime < earlyCheckInWindowMs) {
        const startTimeStr = startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const dateStr = new Date(regularBooking.preferredDate).toLocaleDateString();
        throw new BadRequestException(
          `Access Denied: Early check-in is not open yet for #${regularBooking.bookingCode} (${dateStr}). Check-in opens 30 minutes prior to pass start time (${startTimeStr}).`,
        );
      }

      // 5. Already Checked-In Check
      if (regularBooking.status === BookingStatus.confirmed) {
        return {
          success: true,
          type: 'desk_pass',
          detailName: regularBooking.pricingPlan?.name || 'Workspace Pass',
          customerName: regularBooking.customerName,
          booking: regularBooking,
          message: `Member is already checked in for ${regularBooking.pricingPlan?.name || 'Workspace Pass'}!`,
        };
      }

      // 6. Atomic Update: Set status to confirmed (checked-in) preserving paymentStatus
      const updateResult = await this.prisma.booking.updateMany({
        where: {
          id: regularBooking.id,
          status: { in: [BookingStatus.pending, BookingStatus.unpaid] },
          paymentStatus: PaymentStatus.paid,
        },
        data: {
          status: BookingStatus.confirmed,
        },
      });

      if (updateResult.count === 0) {
        throw new BadRequestException(`Check-In Failed: Pass #${regularBooking.bookingCode} status has been updated by another process.`);
      }

      const updated = await this.prisma.booking.findUnique({
        where: { id: regularBooking.id },
        include: { pricingPlan: true },
      });

      if (this.notificationsService && updated) {
        await this.notificationsService.createNotification(
          updated.userId || null,
          'Check-In Verified',
          `Member verified and checked in for ${updated.pricingPlan?.name || 'Workspace Pass'}!`,
          'booking',
        ).catch((err) => {
          this.logger.error(`Failed to send check-in notification: ${err?.message}`);
        });
      }

      return {
        success: true,
        type: 'desk_pass',
        detailName: regularBooking.pricingPlan?.name || 'Workspace Pass',
        customerName: regularBooking.customerName,
        booking: updated,
        message: `Member Verified & Checked-In for ${regularBooking.pricingPlan?.name || 'Workspace Pass'}!`,
      };
    }

    throw new NotFoundException('Invalid access QR code or reservation reference');
  }
}

