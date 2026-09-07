import { Injectable, NotFoundException, BadRequestException, Optional } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { BookingStatus, PaymentStatus } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class BookingsService {
  constructor(
    private prisma: PrismaService,
    @Optional() private notificationsService?: NotificationsService,
  ) {}

  async autoCompleteExpiredBookings() {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const currentDay = now.getDate();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    // 1. Process Meeting Bookings whose slot time has finished
    const activeMeetings = await this.prisma.meetingBooking.findMany({
      where: {
        status: {
          in: [BookingStatus.confirmed, BookingStatus.pending, BookingStatus.unpaid],
        },
      },
      select: { id: true, bookingDate: true, startTime: true, endTime: true, status: true },
    });

    const meetingIdsToComplete: number[] = [];
    const meetingIdsNotCheckedIn: number[] = [];

    for (const mb of activeMeetings) {
      const bDate = new Date(mb.bookingDate);
      const bYear = bDate.getFullYear();
      const bMonth = bDate.getMonth();
      const bDay = bDate.getDate();

      const isPastDate =
        new Date(bYear, bMonth, bDay).getTime() < new Date(currentYear, currentMonth, currentDay).getTime();

      const endUtcHours = new Date(mb.endTime).getUTCHours();
      const endUtcMinutes = new Date(mb.endTime).getUTCMinutes();

      const isPastTimeToday =
        bYear === currentYear &&
        bMonth === currentMonth &&
        bDay === currentDay &&
        (endUtcHours < currentHour || (endUtcHours === currentHour && endUtcMinutes <= currentMinute));

      if (isPastDate || isPastTimeToday) {
        if (mb.status === BookingStatus.confirmed) {
          meetingIdsToComplete.push(mb.id);
        } else {
          meetingIdsNotCheckedIn.push(mb.id);
        }
      }
    }

    if (meetingIdsToComplete.length > 0) {
      await this.prisma.meetingBooking.updateMany({
        where: { id: { in: meetingIdsToComplete } },
        data: { status: BookingStatus.completed, paymentStatus: PaymentStatus.paid },
      });
    }

    if (meetingIdsNotCheckedIn.length > 0) {
      await this.prisma.meetingBooking.updateMany({
        where: { id: { in: meetingIdsNotCheckedIn } },
        data: { status: BookingStatus.not_checked_in },
      });
    }

    // 2. Process Desk / Regular Bookings whose date/slot has finished
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
      select: { id: true, preferredDate: true, status: true },
    });

    const deskIdsToComplete: number[] = [];
    const deskIdsNotCheckedIn: number[] = [];

    for (const db of activeDeskBookings) {
      const dDate = new Date(db.preferredDate);
      const dYear = dDate.getFullYear();
      const dMonth = dDate.getMonth();
      const dDay = dDate.getDate();

      const isPastDate =
        new Date(dYear, dMonth, dDay).getTime() < new Date(currentYear, currentMonth, currentDay).getTime();

      if (isPastDate) {
        if (db.status === BookingStatus.confirmed) {
          deskIdsToComplete.push(db.id);
        } else {
          deskIdsNotCheckedIn.push(db.id);
        }
      }
    }

    if (deskIdsToComplete.length > 0) {
      await this.prisma.booking.updateMany({
        where: { id: { in: deskIdsToComplete } },
        data: { status: BookingStatus.completed, paymentStatus: PaymentStatus.paid },
      });
    }

    if (deskIdsNotCheckedIn.length > 0) {
      await this.prisma.booking.updateMany({
        where: { id: { in: deskIdsNotCheckedIn } },
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
    const booking = await this.prisma.booking.findUnique({ where: { id } });
    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (booking.status === BookingStatus.completed || booking.status === BookingStatus.cancelled) {
      throw new BadRequestException(
        `Status Locked: Booking #${booking.bookingCode} is already in terminal '${booking.status}' status and cannot be modified.`
      );
    }

    let nextPaymentStatus = paymentStatus || booking.paymentStatus;
    if (status === BookingStatus.confirmed || status === BookingStatus.completed) {
      nextPaymentStatus = PaymentStatus.paid;
    } else if (status === BookingStatus.unpaid) {
      nextPaymentStatus = PaymentStatus.unpaid;
    }

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

    if (status === BookingStatus.confirmed && this.notificationsService) {
      this.notificationsService.create({
        userId: (updated as any).userId || undefined,
        title: 'Desk Pass Active',
        message: `Your QR pass is ready for Downtown Hub check-in (Code: #${updated.bookingCode}).`,
        type: 'booking',
        link: '/dashboard?tab=bookings',
      }).catch(() => {});
    }

    return {
      success: true,
      booking: updated,
    };
  }

  async updateMeetingStatus(id: number, status: BookingStatus, paymentStatus?: PaymentStatus) {
    const booking = await this.prisma.meetingBooking.findUnique({ where: { id } });
    if (!booking) {
      throw new NotFoundException('Meeting room booking not found');
    }

    if (booking.status === BookingStatus.completed || booking.status === BookingStatus.cancelled) {
      throw new BadRequestException(
        `Status Locked: Meeting reservation #${booking.bookingCode} is already in terminal '${booking.status}' status and cannot be modified.`
      );
    }

    let nextPaymentStatus = paymentStatus || booking.paymentStatus;
    if (status === BookingStatus.confirmed || status === BookingStatus.completed) {
      nextPaymentStatus = PaymentStatus.paid;
    } else if (status === BookingStatus.unpaid) {
      nextPaymentStatus = PaymentStatus.unpaid;
    }

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

    const note = await this.prisma.bookingNote.create({
      data: {
        bookingId,
        adminUserId: adminUserId || 1,
        noteText,
      },
    });

    return {
      success: true,
      note,
    };
  }

  async generateCsvExport() {
    const bookings = await this.prisma.booking.findMany({
      include: { pricingPlan: true, user: true },
      orderBy: { createdAt: 'desc' },
    });

    const header = 'Booking Code,Customer Name,Email,Phone,Plan Name,Preferred Date,Time Slot,Booking Type,Status,Created At\n';
    const rows = bookings
      .map(
        (b) =>
          `"${this.escapeCsv(b.bookingCode)}","${this.escapeCsv(b.customerName)}","${this.escapeCsv(b.customerEmail)}","${this.escapeCsv(b.customerPhone || '')}","${this.escapeCsv(b.pricingPlan?.name || 'Pass')}","${b.preferredDate.toISOString().split('T')[0]}","${this.escapeCsv(b.preferredTimeSlot || '')}","${b.bookingType}","${b.status}","${b.createdAt.toISOString()}"`,
      )
      .join('\n');

    return header + rows;
  }

  private escapeCsv(value: string): string {
    return String(value).replace(/"/g, '""');
  }

  async getAdminStats() {
    const regularBookingsCount = await this.prisma.booking.count();
    const meetingBookingsCount = await this.prisma.meetingBooking.count();
    const totalBookings = regularBookingsCount + meetingBookingsCount;

    const activeMembers = await this.prisma.user.count();

    const bookingRevenue = await this.prisma.booking.aggregate({
      _sum: { totalAmount: true },
    });
    const meetingRevenue = await this.prisma.meetingBooking.aggregate({
      _sum: { totalAmount: true },
    });

    const monthlyRevenue =
      Number(bookingRevenue._sum.totalAmount || 0) +
      Number(meetingRevenue._sum.totalAmount || 0);

    const totalRooms = await this.prisma.meetingRoom.count();
    const activeReservations = await this.prisma.meetingBooking.count({
      where: { status: BookingStatus.confirmed },
    });
    const roomOccupancyRate = totalRooms > 0 ? Math.min(100, Math.round((activeReservations / (totalRooms * 10)) * 100)) : 75;

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
        monthlyRevenue: monthlyRevenue > 0 ? monthlyRevenue : 2540,
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
      where: { role: 'member' },
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
      include: { pricingPlan: true, branch: true },
      orderBy: { createdAt: 'desc' },
    });

    const header = 'Booking Code,Customer Name,Customer Email,Customer Phone,Company,Plan,Status,Payment Status,Date\n';
    const rows = bookings
      .map(
        (b) =>
          `"${b.bookingCode}","${b.customerName}","${b.customerEmail}","${b.customerPhone}","${b.companyName || ''}","${b.pricingPlan?.name || ''}","${b.status}","${b.paymentStatus}","${b.createdAt.toISOString()}"`,
      )
      .join('\n');

    return header + rows;
  }

  private generateUniqueBookingCode(prefix: string): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = require('crypto').randomBytes(3).toString('hex').toUpperCase();
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
    const totalAmount = Number(data.totalAmount || 150);

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(customerEmail)) {
      throw new BadRequestException('Invalid email format');
    }

    // Validate amount
    if (isNaN(totalAmount) || totalAmount < 0) {
      throw new BadRequestException('Total amount must be a positive number');
    }

    // Validate date
    if (isNaN(preferredDate.getTime())) {
      throw new BadRequestException('Invalid preferred date');
    }

    const isPaid = data.paymentStatus === PaymentStatus.paid || data.paymentMethod === 'wallet' || data.paymentMethod === 'credits' || data.isPaid;

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

    if (data.pricingPlanId) {
      payload.pricingPlanId = Number(data.pricingPlanId);
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

    return {
      success: true,
      booking,
    };
  }

  async verifyAndCheckIn(code: string) {
    const meetingBooking = await this.prisma.meetingBooking.findFirst({
      where: {
        OR: [
          { qrAccessCode: code },
          { bookingCode: code },
        ],
      },
      include: { meetingRoom: true },
    });

    if (meetingBooking) {
      if (meetingBooking.status === BookingStatus.cancelled) {
        throw new BadRequestException(`Access Denied: Meeting Suite Reservation #${meetingBooking.bookingCode} was CANCELLED. Access revoked.`);
      }

      let updated = meetingBooking;
      if (meetingBooking.status !== BookingStatus.completed) {
        const isUnpaid = meetingBooking.paymentStatus === PaymentStatus.unpaid || meetingBooking.paymentStatus === PaymentStatus.pending;
        updated = await this.prisma.meetingBooking.update({
          where: { id: meetingBooking.id },
          data: {
            status: BookingStatus.confirmed,
            paymentStatus: isUnpaid ? meetingBooking.paymentStatus : PaymentStatus.paid,
          },
          include: { meetingRoom: true },
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
      where: { bookingCode: code },
      include: { pricingPlan: true },
    });

    if (regularBooking) {
      if (regularBooking.status === BookingStatus.cancelled) {
        throw new BadRequestException(`Access Denied: Pass #${regularBooking.bookingCode} was CANCELLED. Access revoked.`);
      }

      let updated = regularBooking;
      if (regularBooking.status !== BookingStatus.completed) {
        const isUnpaid = regularBooking.paymentStatus === PaymentStatus.unpaid || regularBooking.paymentStatus === PaymentStatus.pending;
        updated = await this.prisma.booking.update({
          where: { id: regularBooking.id },
          data: {
            status: BookingStatus.confirmed,
            paymentStatus: isUnpaid ? regularBooking.paymentStatus : PaymentStatus.paid,
          },
          include: { pricingPlan: true },
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
