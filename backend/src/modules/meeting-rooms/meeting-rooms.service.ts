import { Injectable, NotFoundException, BadRequestException, ForbiddenException, UnauthorizedException, ConflictException, Optional } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { AvailabilityCheckDto, CreateMeetingRoomDto, UpdateMeetingRoomDto } from './dto/meeting-room.dto';
import { BookingStatus, PaymentStatus, PaymentMethod } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';
import * as crypto from 'crypto';

export function timeToMinutes(time: string | null | undefined): number {
  if (!time) return 0;
  const cleanTime = time.trim();
  const is12Hr = /am|pm/i.test(cleanTime);
  if (is12Hr) {
    const parts = cleanTime.split(/[\s:]+/);
    let h = parseInt(parts[0], 10) || 0;
    const m = parseInt(parts[1] || '0', 10) || 0;
    const period = (parts[2] || '').toUpperCase();
    if (period === 'PM' && h < 12) h += 12;
    if (period === 'AM' && h === 12) h = 0;
    return h * 60 + m;
  }
  const [hours, minutes] = cleanTime.split(':').map((v) => parseInt(v, 10) || 0);
  return hours * 60 + (minutes || 0);
}

export function formatMinutesTo12Hr(totalMinutes: number): string {
  const normalized = totalMinutes % (24 * 60);
  const hour = Math.floor(normalized / 60);
  const minute = normalized % 60;
  const period = hour >= 12 ? 'PM' : 'AM';
  const h12 = hour % 12 === 0 ? 12 : hour % 12;
  const minuteStr = minute.toString().padStart(2, '0');
  return `${h12}:${minuteStr} ${period}`;
}

export function generateTimeSlots(startTime: string | null | undefined, endTime: string | null | undefined) {
  // If neither start nor end time is set, support 24/7 round-the-clock (00:00 to 24:00) in 30-min intervals
  if (!startTime && !endTime) {
    const slots = [];
    for (let current = 0; current + 30 <= 1440; current += 30) {
      slots.push({
        startMinutes: current,
        endMinutes: current + 30,
      });
    }
    return slots;
  }

  // If only one is set
  if (!startTime || !endTime) {
    throw new BadRequestException('Both Start Time and End Time must be configured together, or both left blank for 24/7 access.');
  }

  const startMinutes = timeToMinutes(startTime);
  const endMinutes = timeToMinutes(endTime);

  if (startMinutes >= endMinutes) {
    throw new BadRequestException('Start Time must be strictly earlier than End Time.');
  }

  const slots = [];
  // Strict boundary rule: slotStart + 30 <= operatingEnd
  for (let current = startMinutes; current + 30 <= endMinutes; current += 30) {
    slots.push({
      startMinutes: current,
      endMinutes: current + 30,
    });
  }

  return slots;
}

export function getLocalZonedNow(timeZone = 'Asia/Kolkata') {
  const now = new Date();
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: false,
  }).formatToParts(now);

  const getPart = (type: string) => {
    const p = parts.find((pt) => pt.type === type);
    return p ? parseInt(p.value, 10) : 0;
  };

  const year = getPart('year');
  const month = getPart('month');
  const day = getPart('day');
  let hours = getPart('hour');
  if (hours === 24) hours = 0;
  const minutes = getPart('minute');
  const seconds = getPart('second');

  const monthStr = month.toString().padStart(2, '0');
  const dayStr = day.toString().padStart(2, '0');
  const dateStr = `${year}-${monthStr}-${dayStr}`;

  return {
    dateStr,
    year,
    month,
    day,
    hours,
    minutes,
    seconds,
    totalMinutes: hours * 60 + minutes,
  };
}

export function formatIsoTo12Hr(isoVal: string | Date | null | undefined): string {
  if (!isoVal) return '';
  const iso = isoVal instanceof Date ? isoVal.toISOString() : String(isoVal);
  const match = iso.match(/T(\d{2}):(\d{2})/);
  if (!match) return '';
  let h = parseInt(match[1], 10);
  const m = match[2];
  const period = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${m} ${period}`;
}

export function formatIsoToDateStr(isoVal: string | Date | null | undefined): string {
  if (!isoVal) return '';
  const iso = isoVal instanceof Date ? isoVal.toISOString() : String(isoVal);
  const match = iso.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return '';
  const d = new Date(parseInt(match[1], 10), parseInt(match[2], 10) - 1, parseInt(match[3], 10));
  return d.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function parseBookingWallClock(val: string | Date | null | undefined): { dateStr: string; year: number; month: number; day: number; hours: number; minutes: number; totalMinutes: number; timestamp: number } | null {
  if (!val) return null;
  const iso = val instanceof Date ? val.toISOString() : String(val);
  const match = iso.match(/^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?/);
  if (!match) return null;
  const year = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  const day = parseInt(match[3], 10);
  const hours = match[4] ? parseInt(match[4], 10) : 0;
  const minutes = match[5] ? parseInt(match[5], 10) : 0;

  const monthStr = month.toString().padStart(2, '0');
  const dayStr = day.toString().padStart(2, '0');
  const hStr = hours.toString().padStart(2, '0');
  const mStr = minutes.toString().padStart(2, '0');
  const istIso = `${year}-${monthStr}-${dayStr}T${hStr}:${mStr}:00+05:30`;
  const timestamp = new Date(istIso).getTime();

  return {
    dateStr: `${year}-${monthStr}-${dayStr}`,
    year,
    month,
    day,
    hours,
    minutes,
    totalMinutes: hours * 60 + minutes,
    timestamp,
  };
}

@Injectable()
export class MeetingRoomsService {
  constructor(
    private prisma: PrismaService,
    @Optional() private notificationsService?: NotificationsService,
  ) {}

  async findAll(includeInactive = false, category?: string, branchId?: number) {
    const whereClause: any = includeInactive ? {} : { isActive: true };
    if (category && category !== 'all') {
      whereClause.category = category;
    }
    if (branchId) {
      whereClause.branchId = branchId;
    }
    return this.prisma.meetingRoom.findMany({
      where: whereClause,
      include: { branch: { select: { id: true, name: true, city: true, state: true } } },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async findBySlug(slug: string) {
    const room = await this.prisma.meetingRoom.findUnique({
      where: { slug },
      include: {
        branch: true,
        reviews: {
          where: { isPublished: true },
          include: { user: { select: { name: true, avatarUrl: true } } },
        },
      },
    });

    if (!room) {
      throw new NotFoundException('Meeting room not found');
    }

    return room;
  }

  async checkAvailability(slug: string, dto: AvailabilityCheckDto) {
    const room = await this.prisma.meetingRoom.findUnique({ where: { slug } });
    if (!room) {
      throw new NotFoundException('Meeting room not found');
    }

    const timeZone = (dto && dto.timezone) ? dto.timezone : 'Asia/Kolkata';
    const zonedNow = getLocalZonedNow(timeZone);
    const targetDateStr = (dto && dto.date) ? dto.date : zonedNow.dateStr;
    const dateOnly = targetDateStr.split('T')[0];
    const parts = dateOnly.split('-').map(Number);
    const year = parts[0] || zonedNow.year;
    const month = parts[1] || zonedNow.month;
    const day = parts[2] || zonedNow.day;

    const isTargetDatePast = dateOnly < zonedNow.dateStr;
    const isTargetDateToday = dateOnly === zonedNow.dateStr;

    const startOfDayUtc = new Date(`${dateOnly}T00:00:00.000Z`);
    const endOfDayUtc = new Date(`${dateOnly}T23:59:59.999Z`);
    const startOfDayLocal = new Date(year, month - 1, day, 0, 0, 0, 0);
    const endOfDayLocal = new Date(year, month - 1, day, 23, 59, 59, 999);

    const minDateGte = startOfDayUtc.getTime() < startOfDayLocal.getTime() ? startOfDayUtc : startOfDayLocal;
    const maxDateLte = endOfDayUtc.getTime() > endOfDayLocal.getTime() ? endOfDayUtc : endOfDayLocal;

    const existingBookings = await this.prisma.meetingBooking.findMany({
      where: {
        meetingRoomId: room.id,
        status: { in: [BookingStatus.pending, BookingStatus.confirmed] },
        OR: [
          {
            bookingDate: {
              gte: minDateGte,
              lte: maxDateLte,
            },
          },
          {
            startTime: {
              gte: minDateGte,
              lte: maxDateLte,
            },
          },
        ],
      },
      select: {
        startTime: true,
        endTime: true,
        status: true,
      },
    });

    // Generate dynamic slots based on room operating hours
    const slotsConfig = generateTimeSlots(room.startTime, room.endTime);
    const timeSlots = [];

    for (const slot of slotsConfig) {
      const startH = Math.floor(slot.startMinutes / 60);
      const startM = slot.startMinutes % 60;
      const endH = Math.floor(slot.endMinutes / 60);
      const endM = slot.endMinutes % 60;

      const startHStr = startH.toString().padStart(2, '0');
      const startMStr = startM.toString().padStart(2, '0');
      const endHStr = endH.toString().padStart(2, '0');
      const endMStr = endM.toString().padStart(2, '0');

      // Check if slot has already passed or started
      let isPast = false;
      if (isTargetDatePast) {
        isPast = true;
      } else if (isTargetDateToday) {
        // Any slot whose start time has already arrived or passed is in the past
        if (slot.startMinutes <= zonedNow.totalMinutes) {
          isPast = true;
        }
      }

      if (isPast) {
        // Skip past/already-started time slots
        continue;
      }

      const slotStartIso = `${dateOnly}T${startHStr}:${startMStr}:00.000Z`;
      const slotEndIso = `${dateOnly}T${endHStr}:${endMStr}:00.000Z`;

      const slotStartMs = new Date(slotStartIso).getTime();
      const slotEndMs = new Date(slotEndIso).getTime();

      const isOccupied = existingBookings.some((b) => {
        const bStartMs = new Date(b.startTime).getTime();
        const bEndMs = new Date(b.endTime).getTime();
        return slotStartMs < bEndMs && slotEndMs > bStartMs;
      });

      const isAvailable = !isOccupied;
      const label = `${formatMinutesTo12Hr(slot.startMinutes)} - ${formatMinutesTo12Hr(slot.endMinutes)}`;

      timeSlots.push({
        label,
        hour: label,
        rawHour: startH,
        startMinutes: slot.startMinutes,
        endMinutes: slot.endMinutes,
        startTime: slotStartIso,
        endTime: slotEndIso,
        isAvailable,
        available: isAvailable,
        isOccupied,
        isPast: false,
      });
    }

    return {
      date: targetDateStr,
      roomName: room.name,
      startTime: room.startTime || null,
      endTime: room.endTime || null,
      operatingHours: (room.startTime && room.endTime)
        ? `${formatMinutesTo12Hr(timeToMinutes(room.startTime))} - ${formatMinutesTo12Hr(timeToMinutes(room.endTime))}`
        : '24/7 Access',
      hourlyRate: room.hourlyRate,
      perSeatPrice: room.perSeatPrice,
      minSeats: room.minSeats,
      maxSeats: room.maxSeats,
      serviceChargeType: room.serviceChargeType,
      serviceChargeValue: room.serviceChargeValue,
      timeSlots,
    };
  }

  async createBooking(dto: any) {
    // Input validation and sanitization
    if (!dto.customerName || !dto.customerEmail || !dto.customerPhone) {
      throw new BadRequestException('Customer name, email, and phone are required');
    }

    const customerName = String(dto.customerName).trim().slice(0, 100);
    const customerEmail = String(dto.customerEmail).trim().toLowerCase();
    const customerPhone = String(dto.customerPhone).trim().slice(0, 20);
    const companyName = dto.companyName ? String(dto.companyName).trim().slice(0, 100) : null;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(customerEmail)) {
      throw new BadRequestException('Invalid email format');
    }

    let room = null;
    if (dto.roomSlug) {
      room = await this.prisma.meetingRoom.findUnique({ where: { slug: dto.roomSlug } });
    } else if (dto.meetingRoomId) {
      room = await this.prisma.meetingRoom.findUnique({ where: { id: Number(dto.meetingRoomId) } });
    }

    if (!room) {
      throw new NotFoundException('Meeting room not found');
    }

    if (!room.isActive) {
      throw new BadRequestException('This meeting room is not available for booking');
    }

    const branch = await this.prisma.branch.findFirst();
    const branchId = room.branchId || (branch ? branch.id : 1);

    const bookingCode = `MR-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
    const qrAccessCode = `QR-MR-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(6).toString('hex').toUpperCase()}`;
    const viewToken = crypto.randomBytes(16).toString('hex');

    let startTime = new Date();
    let endTime = new Date(Date.now() + 1800000); // Default 30 min

    if (Array.isArray(dto.selectedSlots) && dto.selectedSlots.length > 0) {
      const sortedSlots = [...dto.selectedSlots].sort();
      startTime = new Date(sortedSlots[0]);
      const lastSlotStart = new Date(sortedSlots[sortedSlots.length - 1]);
      // Each slot is 30 minutes = 30 * 60 * 1000 = 1,800,000 ms
      endTime = new Date(lastSlotStart.getTime() + 1800000);
    } else if (dto.startTime && dto.endTime) {
      const dateStr = dto.bookingDate ? new Date(dto.bookingDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];

      if (typeof dto.startTime === 'string' && dto.startTime.includes('T')) {
        startTime = new Date(dto.startTime);
      } else {
        const [sh, sm] = String(dto.startTime).split(':').map((v) => v.padStart(2, '0'));
        startTime = new Date(`${dateStr}T${sh || '10'}:${sm || '00'}:00.000Z`);
      }

      if (typeof dto.endTime === 'string' && dto.endTime.includes('T')) {
        endTime = new Date(dto.endTime);
      } else {
        const [eh, em] = String(dto.endTime).split(':').map((v) => v.padStart(2, '0'));
        endTime = new Date(`${dateStr}T${eh || '11'}:${em || '00'}:00.000Z`);
      }
    }

    // Calculate total hours and slots directly from the actual duration range [startTime -> endTime]
    const durationMs = Math.max(1800000, endTime.getTime() - startTime.getTime());
    const totalHours = Number((durationMs / 3600000).toFixed(2));
    const totalSlotsCount = Math.round(totalHours * 2);

    const seatsCount = Number(dto.seatsBooked || 1);
    const minSeats = Number(room.minSeats || 1);
    const maxSeats = Number(room.maxSeats || room.capacity || 10);

    if (seatsCount < minSeats || seatsCount > maxSeats) {
      throw new BadRequestException(
        `Seat Limit Exceeded: ${room.name} capacity is between ${minSeats} and ${maxSeats} seats. You requested ${seatsCount} seats.`
      );
    }

    const baseRate = Number(room.hourlyRate || 0);
    const perSeatRate = Number(room.perSeatPrice || 0);

    const rawBaseSubtotal = (baseRate + perSeatRate * seatsCount) * totalHours;

    let serviceChargeAmount = 0;
    if (room.serviceChargeType === 'fixed') {
      serviceChargeAmount = Number(room.serviceChargeValue || 0);
    } else if (room.serviceChargeType === 'percentage') {
      serviceChargeAmount = rawBaseSubtotal * (Number(room.serviceChargeValue || 0) / 100);
    }

    const subtotal = rawBaseSubtotal + serviceChargeAmount;
    const setting = await this.prisma.siteSetting.findUnique({ where: { key: 'tax_rate' } });
    const taxRate = setting && !isNaN(Number(setting.value)) ? Number(setting.value) : 0.18;
    const calculatedTaxAmount = Number((subtotal * taxRate).toFixed(2));
    const calculatedGrandTotal = Number((subtotal + calculatedTaxAmount).toFixed(2));

    // SECURITY: Always use server-calculated totalAmount. Never trust client-supplied price.
    const finalTotalAmount = calculatedGrandTotal;
    const finalTaxAmount = calculatedTaxAmount;

    // STRICT GUARD 1: Block booking if reservation date or time has already passed in Asia/Kolkata
    const zonedNow = getLocalZonedNow('Asia/Kolkata');
    const bookingDateStr = dto.bookingDate
      ? String(dto.bookingDate).split('T')[0]
      : (Array.isArray(dto.selectedSlots) && dto.selectedSlots.length > 0
          ? String(dto.selectedSlots[0]).split('T')[0]
          : zonedNow.dateStr);

    let bookingStartMinutes = 0;
    if (Array.isArray(dto.selectedSlots) && dto.selectedSlots.length > 0) {
      const sortedSlots = [...dto.selectedSlots].sort();
      const firstSlot = String(sortedSlots[0]);
      const match = firstSlot.match(/T(\d{2}):(\d{2})/);
      if (match) {
        bookingStartMinutes = parseInt(match[1], 10) * 60 + parseInt(match[2], 10);
      }
    } else if (dto.startTime) {
      const sStr = String(dto.startTime);
      if (sStr.includes('T')) {
        const match = sStr.match(/T(\d{2}):(\d{2})/);
        if (match) {
          bookingStartMinutes = parseInt(match[1], 10) * 60 + parseInt(match[2], 10);
        }
      } else {
        bookingStartMinutes = timeToMinutes(sStr);
      }
    }

    const isBookingInPast =
      bookingDateStr < zonedNow.dateStr ||
      (bookingDateStr === zonedNow.dateStr && bookingStartMinutes <= zonedNow.totalMinutes);

    if (isBookingInPast) {
      throw new BadRequestException(
        'Selected reservation time slot has already passed. Please select an upcoming time slot.'
      );
    }

    if (endTime.getTime() <= startTime.getTime()) {
      throw new BadRequestException('Booking end time must be after booking start time.');
    }

    // STRICT GUARD 2: Validate within room operating hours if configured
    if (room.startTime && room.endTime) {
      const roomStart = timeToMinutes(room.startTime);
      const roomEnd = timeToMinutes(room.endTime);

      const bookingStart = new Date(startTime);
      const bookingEnd = new Date(endTime);

      const bookingStartMinutes = bookingStart.getUTCHours() * 60 + bookingStart.getUTCMinutes();
      const rawBookingEndMinutes = bookingEnd.getUTCHours() * 60 + bookingEnd.getUTCMinutes();
      const bookingEndMinutes = rawBookingEndMinutes === 0 && bookingEnd.getTime() > bookingStart.getTime() ? 1440 : rawBookingEndMinutes;

      if (bookingStartMinutes < roomStart || bookingEndMinutes > roomEnd) {
        throw new BadRequestException(
          `Booking interval must be strictly within ${room.name}'s operating hours (${formatMinutesTo12Hr(roomStart)} - ${formatMinutesTo12Hr(roomEnd)}).`
        );
      }
    }

    // Double-booking guard is now inside the $transaction to prevent race conditions
    const booking = await this.prisma.$transaction(async (tx) => {
      // STRICT OVERLAP & DOUBLE-BOOKING GUARD (inside transaction)
      const doubleBooking = await tx.meetingBooking.findFirst({
        where: {
          meetingRoomId: room.id,
          status: { in: [BookingStatus.pending, BookingStatus.confirmed] },
          AND: [
            { startTime: { lt: endTime } },
            { endTime: { gt: startTime } },
          ],
        },
        include: { meetingRoom: true },
      });

      if (doubleBooking) {
        throw new ConflictException(
          `Time Slot Conflict: ${room.name} is already reserved for the selected time slot (Booking Ref: #${doubleBooking.bookingCode}). Please select another time slot.`
        );
      }

      let payMethodEnum: PaymentMethod = PaymentMethod.razorpay;
      if (dto.paymentMethod === 'wallet') {
        payMethodEnum = PaymentMethod.wallet;
      } else if (dto.paymentMethod === 'credits') {
        payMethodEnum = PaymentMethod.credits;
      } else if (dto.paymentMethod === 'cash' || dto.paymentMethod === 'reception') {
        payMethodEnum = PaymentMethod.cash;
      } else {
        payMethodEnum = PaymentMethod.razorpay;
      }

      const useCredits = dto.paymentMethod === 'credits';
      const useWallet = dto.paymentMethod === 'wallet';
      const creditsNeeded = totalHours; // 0.5 for 30m, 1.0 for 1 hr, etc.

      let memberBalanceAfter: number | null = null;

      if (useCredits || useWallet) {
        if (!dto.userId) {
          throw new BadRequestException(
            `A signed-in member is required to pay with ${useCredits ? 'meeting credits' : 'wallet balance'}.`
          );
        }

        const user = await tx.user.findUnique({ where: { id: Number(dto.userId) } });
        if (!user) {
          throw new NotFoundException('Member not found for member payment.');
        }

        if (useCredits) {
          const currentCredits = Number(user.meetingCreditsBalance || 0);
          if (currentCredits < creditsNeeded) {
            throw new BadRequestException(
              `Insufficient meeting credits. Required: ${creditsNeeded}, Available: ${currentCredits}.`
            );
          }

          memberBalanceAfter = Number((currentCredits - creditsNeeded).toFixed(2));
          await tx.user.update({
            where: { id: user.id },
            data: {
              meetingCreditsBalance: memberBalanceAfter,
            },
          });
        } else {
          const currentBalance = Number(user.walletBalance || 0);
          if (currentBalance < finalTotalAmount) {
            throw new BadRequestException(
              `Insufficient credit wallet balance. Required: ₹${finalTotalAmount}, Available: ₹${currentBalance}. Please top up your wallet.`
            );
          }

          memberBalanceAfter = Number((currentBalance - finalTotalAmount).toFixed(2));
          await tx.user.update({
            where: { id: user.id },
            data: {
              walletBalance: memberBalanceAfter,
            },
          });
        }
      }

      const createdBooking = await tx.meetingBooking.create({
        data: {
          bookingCode,
          qrAccessCode,
          viewToken,
          branchId,
          meetingRoomId: room.id,
          customerName: dto.customerName,
          customerEmail: dto.customerEmail,
          customerPhone: dto.customerPhone,
          companyName: dto.companyName,
          userId: dto.userId ? Number(dto.userId) : null,
          bookingDate: dto.bookingDate ? new Date(dto.bookingDate) : new Date(),
          startTime,
          endTime,
          totalHours,
          creditsUsed: useCredits ? Math.ceil(creditsNeeded) : 0,
          taxAmount: finalTaxAmount,
          totalAmount: finalTotalAmount,
          seatsBooked: seatsCount,
          status: (useCredits || useWallet || dto.paymentStatus === PaymentStatus.paid || dto.isPaid) ? BookingStatus.pending : BookingStatus.unpaid,
          paymentStatus: (useCredits || useWallet || dto.paymentStatus === PaymentStatus.paid || dto.isPaid) ? PaymentStatus.paid : PaymentStatus.unpaid,
        },
        include: {
          meetingRoom: true,
        },
      });

      if (useCredits || useWallet) {
        await tx.walletTransaction.create({
          data: {
            userId: Number(dto.userId),
            type: useCredits ? 'debit_credit_booking' : 'debit_booking',
            amount: useCredits ? creditsNeeded : finalTotalAmount,
            balanceAfter: memberBalanceAfter || 0,
            description: useCredits
              ? `Meeting Credit Payment for ${room.name} reservation`
              : `Wallet Payment for ${room.name} reservation`,
            referenceId: `PAY-MEETING-${createdBooking.id}`,
          },
        });
      }

      const isPaidMethod = useCredits || useWallet || dto.paymentStatus === PaymentStatus.paid || dto.isPaid;

      await tx.payment.create({
        data: {
          meetingBookingId: createdBooking.id,
          userId: dto.userId ? Number(dto.userId) : null,
          amount: finalTotalAmount,
          taxAmount: finalTaxAmount,
          paymentMethod: payMethodEnum,
          status: isPaidMethod ? PaymentStatus.paid : PaymentStatus.unpaid,
          razorpayPaymentId: dto.razorpayPaymentId || null,
          razorpayOrderId: dto.razorpayOrderId || null,
          razorpaySignature: dto.razorpaySignature || null,
        },
      });

      return createdBooking;
    });

    if (this.notificationsService) {
      this.notificationsService.createNotification(
        booking.userId || null,
        'Meeting Suite Pass Ready',
        `Your reservation for ${booking.meetingRoom?.name || 'Meeting Suite'} (Code: #${booking.bookingCode}) is confirmed.`,
        'meeting',
        `/meeting-rooms/receipt/${booking.viewToken}`,
      ).catch(() => {});

      if (booking.customerEmail) {
        this.notificationsService.sendMail({
          to: booking.customerEmail,
          templateKey: 'meeting_confirmation',
          variables: {
            name: booking.customerName,
            bookingCode: booking.bookingCode,
            roomName: booking.meetingRoom?.name || 'Meeting Suite',
            date: formatIsoToDateStr(booking.bookingDate),
            timeSlot: `${formatIsoTo12Hr(booking.startTime)} - ${formatIsoTo12Hr(booking.endTime)}`,
            seatsBooked: booking.seatsBooked,
            amount: booking.totalAmount,
            viewToken: booking.viewToken,
          },
          metadata: { bookingId: booking.id },
        }).catch(() => {});
      }
    }

    const primaryPayment = await this.prisma.payment.findFirst({
      where: { meetingBookingId: booking.id },
      orderBy: { createdAt: 'desc' },
    });

    return {
      success: true,
      bookingCode: booking.bookingCode,
      viewToken: booking.viewToken,
      receiptToken: booking.viewToken,
      receiptUrl: `/meeting-rooms/receipt/${booking.viewToken}`,
      booking: {
        ...booking,
        paymentMethod: primaryPayment ? primaryPayment.paymentMethod : (booking.creditsUsed > 0 ? 'credits' : 'cash'),
      },
    };
  }

  async getReceiptByToken(token: string, requestingUser?: any) {
    const booking = await this.prisma.meetingBooking.findFirst({
      where: {
        OR: [
          { viewToken: token },
          { bookingCode: token },
          { qrAccessCode: token },
        ],
      },
      include: {
        meetingRoom: true,
        branch: true,
        payments: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (booking) {
      if (requestingUser && requestingUser.role !== 'admin') {
        const isOwner =
          (booking.userId && booking.userId === requestingUser.id) ||
          booking.customerEmail.toLowerCase() === requestingUser.email.toLowerCase();

        if (!isOwner) {
          throw new ForbiddenException('Access Denied. You do not have authorization to view this receipt.');
        }
      }

      const primaryPayment = booking.payments && booking.payments.length > 0 ? booking.payments[0] : null;
      const paymentMethodStr = primaryPayment
        ? primaryPayment.paymentMethod
        : (booking.creditsUsed > 0 ? 'credits' : 'cash');

      return {
        success: true,
        booking: {
          ...booking,
          paymentMethod: paymentMethodStr,
        },
      };
    }

    const deskBooking = await this.prisma.booking.findFirst({
      where: { bookingCode: token },
      include: {
        pricingPlan: true,
        branch: true,
        payments: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (deskBooking) {
      if (requestingUser && requestingUser.role !== 'admin') {
        const isOwner =
          (deskBooking.userId && deskBooking.userId === requestingUser.id) ||
          deskBooking.customerEmail.toLowerCase() === requestingUser.email.toLowerCase();

        if (!isOwner) {
          throw new ForbiddenException('Access Denied. You do not have authorization to view this receipt.');
        }
      }

      return {
        success: true,
        booking: {
          id: deskBooking.id,
          bookingCode: deskBooking.bookingCode,
          customerName: deskBooking.customerName,
          customerEmail: deskBooking.customerEmail,
          customerPhone: deskBooking.customerPhone,
          companyName: deskBooking.companyName,
          gstin: deskBooking.gstin,
          bookingDate: deskBooking.preferredDate,
          startTime: deskBooking.preferredDate,
          endTime: new Date(new Date(deskBooking.preferredDate).getTime() + 86400000),
          status: deskBooking.status,
          paymentStatus: deskBooking.paymentStatus,
          totalAmount: deskBooking.totalAmount,
          taxAmount: deskBooking.taxAmount,
          qrAccessCode: deskBooking.bookingCode,
          viewToken: deskBooking.bookingCode,
          receiptToken: deskBooking.bookingCode,
          meetingRoom: {
            name: deskBooking.pricingPlan?.name || 'Workspace Pass',
            branch: deskBooking.branch,
          },
          payments: deskBooking.payments,
        },
      };
    }

    throw new NotFoundException(`Booking receipt not found for reference code/token '${token}'.`);
  }

  async createRoom(data: CreateMeetingRoomDto | any) {
    const slug = data.slug || data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    const branch = await this.prisma.branch.findFirst();
    const branchId = data.branchId || (branch ? branch.id : 1);

    const startTime = data.startTime?.trim() || null;
    const endTime = data.endTime?.trim() || null;

    if ((startTime && !endTime) || (!startTime && endTime)) {
      throw new BadRequestException('Both Start Time and End Time must be provided together, or both left blank for 24/7 access.');
    }
    if (startTime && endTime) {
      const sMin = timeToMinutes(startTime);
      const eMin = timeToMinutes(endTime);
      if (sMin >= eMin) {
        throw new BadRequestException('Start Time must be strictly earlier than End Time.');
      }
    }

    let images: string[] | undefined = undefined;
    if (data.images && Array.isArray(data.images) && data.images.length > 0) {
      images = data.images.filter(Boolean);
    } else if (data.imageUrl || data.featuredImage) {
      images = [data.imageUrl || data.featuredImage];
    }

    const room = await this.prisma.meetingRoom.create({
      data: {
        branchId,
        floorMapId: data.floorMapId ? Number(data.floorMapId) : null,
        xCoordinate: data.xCoordinate !== undefined && data.xCoordinate !== null && data.xCoordinate !== '' ? Number(data.xCoordinate) : null,
        yCoordinate: data.yCoordinate !== undefined && data.yCoordinate !== null && data.yCoordinate !== '' ? Number(data.yCoordinate) : null,
        name: data.name,
        slug,
        capacity: Number(data.capacity || data.maxSeats || 6),
        minSeats: Number(data.minSeats || 1),
        maxSeats: Number(data.maxSeats || data.capacity || 6),
        perSeatPrice: Number(data.perSeatPrice || 250),
        hourlyRate: Number(data.hourlyRate || 1200),
        dailyRate: Number(data.dailyRate || 8000),
        serviceChargeType: data.serviceChargeType || 'fixed',
        serviceChargeValue: Number(data.serviceChargeValue || 0),
        startTime,
        endTime,
        category: data.category?.trim() || 'Conference Room',
        description: data.description || '',
        amenities: data.amenities || ['High-Speed Wi-Fi', 'Interactive Display', 'Whiteboard'],
        images: images,
        isActive: Boolean(data.isActive ?? true),
        sortOrder: Number(data.sortOrder || 1),
      },
    });

    return {
      success: true,
      room,
    };
  }

  async updateRoom(id: number, data: UpdateMeetingRoomDto | any) {
    const existing = await this.prisma.meetingRoom.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Meeting room not found');
    }

    let startTime = existing.startTime;
    let endTime = existing.endTime;

    if (data.startTime !== undefined) {
      startTime = data.startTime?.trim() || null;
    }
    if (data.endTime !== undefined) {
      endTime = data.endTime?.trim() || null;
    }

    if ((startTime && !endTime) || (!startTime && endTime)) {
      throw new BadRequestException('Both Start Time and End Time must be provided together, or both left blank for 24/7 access.');
    }
    if (startTime && endTime) {
      const sMin = timeToMinutes(startTime);
      const eMin = timeToMinutes(endTime);
      if (sMin >= eMin) {
        throw new BadRequestException('Start Time must be strictly earlier than End Time.');
      }
    }

    let imagesToUpdate = undefined;
    if (data.images !== undefined) {
      imagesToUpdate = Array.isArray(data.images) ? data.images.filter(Boolean) : [data.images];
    } else if (data.imageUrl !== undefined || data.featuredImage !== undefined) {
      const img = data.imageUrl || data.featuredImage;
      imagesToUpdate = img ? [img] : [];
    }

    const updated = await this.prisma.meetingRoom.update({
      where: { id },
      data: {
        ...(data.name ? { name: data.name } : {}),
        ...(data.slug ? { slug: data.slug } : {}),
        ...(data.branchId !== undefined ? { branchId: Number(data.branchId) } : {}),
        ...(data.floorMapId !== undefined ? { floorMapId: data.floorMapId ? Number(data.floorMapId) : null } : {}),
        ...(data.xCoordinate !== undefined ? { xCoordinate: data.xCoordinate !== null && data.xCoordinate !== '' ? Number(data.xCoordinate) : null } : {}),
        ...(data.yCoordinate !== undefined ? { yCoordinate: data.yCoordinate !== null && data.yCoordinate !== '' ? Number(data.yCoordinate) : null } : {}),
        ...(data.capacity !== undefined ? { capacity: Number(data.capacity) } : data.maxSeats !== undefined ? { capacity: Number(data.maxSeats) } : {}),
        ...(data.minSeats !== undefined ? { minSeats: Number(data.minSeats) } : {}),
        ...(data.maxSeats !== undefined ? { maxSeats: Number(data.maxSeats) } : {}),
        ...(data.perSeatPrice !== undefined ? { perSeatPrice: Number(data.perSeatPrice) } : {}),
        ...(data.hourlyRate !== undefined ? { hourlyRate: Number(data.hourlyRate) } : {}),
        ...(data.dailyRate !== undefined ? { dailyRate: Number(data.dailyRate) } : {}),
        ...(data.serviceChargeType ? { serviceChargeType: data.serviceChargeType } : {}),
        ...(data.serviceChargeValue !== undefined ? { serviceChargeValue: Number(data.serviceChargeValue) } : {}),
        startTime,
        endTime,
        ...(data.category !== undefined ? { category: data.category?.trim() || 'Conference Room' } : {}),
        ...(data.description !== undefined ? { description: data.description } : {}),
        ...(data.amenities !== undefined ? { amenities: data.amenities } : {}),
        ...(imagesToUpdate !== undefined ? { images: imagesToUpdate } : {}),
        ...(data.isActive !== undefined ? { isActive: Boolean(data.isActive) } : {}),
        ...(data.sortOrder !== undefined ? { sortOrder: Number(data.sortOrder) } : {}),
      },
    });

    return {
      success: true,
      room: updated,
    };
  }

  async deleteRoom(id: number) {
    const existing = await this.prisma.meetingRoom.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Meeting room not found');
    }

    await this.prisma.meetingRoom.delete({ where: { id } });
    return {
      success: true,
      message: 'Meeting room deleted successfully',
    };
  }
}
