import { Test, TestingModule } from '@nestjs/testing';
import { BookingsService } from './bookings.service';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { BookingStatus, PaymentStatus } from '@prisma/client';
import { BadRequestException } from '@nestjs/common';

describe('BookingsService', () => {
  let service: BookingsService;

  const mockPrismaService = {
    meetingBooking: {
      findMany: jest.fn(),
      updateMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
      groupBy: jest.fn(),
    },
    booking: {
      findMany: jest.fn(),
      updateMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      aggregate: jest.fn(),
    },
    bookingNote: {
      create: jest.fn(),
    },
    payment: {
      aggregate: jest.fn(),
      create: jest.fn(),
    },
    user: {
      count: jest.fn(),
    },
    meetingRoom: {
      count: jest.fn(),
    },
    desk: {
      count: jest.fn(),
    },
    pricingPlan: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookingsService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<BookingsService>(BookingsService);

    jest.clearAllMocks();
  });

  describe('autoCompleteExpiredBookings', () => {
    it('Scenario A: SHOULD transition expired PAID but NOT checked-in meeting booking to not_checked_in (preserving paid status)', async () => {
      const pastDate = new Date(Date.now() - 3600000);
      mockPrismaService.meetingBooking.findMany.mockResolvedValue([
        {
          id: 101,
          startTime: new Date(pastDate.getTime() - 3600000),
          endTime: pastDate,
          status: BookingStatus.pending, // NOT checked in
          paymentStatus: PaymentStatus.paid,
        },
      ]);
      mockPrismaService.booking.findMany.mockResolvedValue([]);
      mockPrismaService.meetingBooking.updateMany.mockResolvedValue({
        count: 1,
      });

      const result = await service.autoCompleteExpiredBookings();

      expect(result.processed.meetingsNotCheckedIn).toBe(1);
      expect(result.processed.meetingsCompleted).toBe(0);
      expect(mockPrismaService.meetingBooking.updateMany).toHaveBeenCalledWith({
        where: {
          id: { in: [101] },
          status: { in: [BookingStatus.pending, BookingStatus.unpaid] },
        },
        data: { status: BookingStatus.not_checked_in },
      });
    });

    it('Scenario B: SHOULD transition expired PAID and checked-in meeting booking to completed (preserving paid status)', async () => {
      const pastDate = new Date(Date.now() - 3600000);
      mockPrismaService.meetingBooking.findMany.mockResolvedValue([
        {
          id: 102,
          startTime: new Date(pastDate.getTime() - 3600000),
          endTime: pastDate,
          status: BookingStatus.confirmed, // CHECKED IN
          paymentStatus: PaymentStatus.paid,
        },
      ]);
      mockPrismaService.booking.findMany.mockResolvedValue([]);
      mockPrismaService.meetingBooking.updateMany.mockResolvedValue({
        count: 1,
      });

      const result = await service.autoCompleteExpiredBookings();

      expect(result.processed.meetingsCompleted).toBe(1);
      expect(result.processed.meetingsNotCheckedIn).toBe(0);
      expect(mockPrismaService.meetingBooking.updateMany).toHaveBeenCalledWith({
        where: { id: { in: [102] }, status: BookingStatus.confirmed },
        data: { status: BookingStatus.completed },
      });
    });

    it('Scenario C: SHOULD transition expired UNPAID and NOT checked-in desk pass to not_checked_in (preserving unpaid status)', async () => {
      const pastDate = new Date(Date.now() - 86400000);
      mockPrismaService.meetingBooking.findMany.mockResolvedValue([]);
      mockPrismaService.booking.findMany.mockResolvedValue([
        {
          id: 201,
          preferredDate: pastDate,
          preferredTimeSlot: '10:00 AM - 06:00 PM',
          status: BookingStatus.pending,
          paymentStatus: PaymentStatus.unpaid,
        },
      ]);
      mockPrismaService.booking.updateMany.mockResolvedValue({ count: 1 });

      const result = await service.autoCompleteExpiredBookings();

      expect(result.processed.deskNotCheckedIn).toBe(1);
      expect(result.processed.deskCompleted).toBe(0);
      expect(mockPrismaService.booking.updateMany).toHaveBeenCalledWith({
        where: {
          id: { in: [201] },
          status: { in: [BookingStatus.pending, BookingStatus.unpaid] },
        },
        data: { status: BookingStatus.not_checked_in },
      });
    });
  });

  describe('updateStatus & Admin Safeguards', () => {
    it('SHOULD throw BadRequestException if admin attempts to manually set status to confirmed via updateStatus', async () => {
      mockPrismaService.booking.findUnique.mockResolvedValue({
        id: 1,
        bookingCode: 'BK-100',
        status: BookingStatus.pending,
        paymentStatus: PaymentStatus.paid,
      });

      await expect(
        service.updateStatus(1, BookingStatus.confirmed),
      ).rejects.toThrow(
        "Direct status transition to 'confirmed' via admin update is disallowed",
      );
    });

    it('SHOULD allow admin to update paymentStatus to paid while keeping status as pending', async () => {
      mockPrismaService.booking.findUnique.mockResolvedValue({
        id: 1,
        bookingCode: 'BK-100',
        status: BookingStatus.pending,
        paymentStatus: PaymentStatus.unpaid,
      });
      mockPrismaService.booking.update.mockResolvedValue({
        id: 1,
        bookingCode: 'BK-100',
        status: BookingStatus.pending,
        paymentStatus: PaymentStatus.paid,
      });

      const res = await service.updateStatus(
        1,
        BookingStatus.pending,
        PaymentStatus.paid,
      );

      expect(mockPrismaService.booking.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          status: BookingStatus.pending,
          paymentStatus: PaymentStatus.paid,
        },
        include: expect.any(Object),
      });
      expect(res.booking.paymentStatus).toBe(PaymentStatus.paid);
      expect(res.booking.status).toBe(BookingStatus.pending);
    });

    it('SHOULD throw BadRequestException when modifying a completed booking', async () => {
      mockPrismaService.booking.findUnique.mockResolvedValue({
        id: 1,
        bookingCode: 'BK-100',
        status: BookingStatus.completed,
        paymentStatus: PaymentStatus.paid,
      });

      await expect(
        service.updateStatus(1, BookingStatus.cancelled),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('verifyAndCheckIn & Scenarios E, F, G, H', () => {
    it('Scenario E: SHOULD deny QR check-in for expired meeting booking', async () => {
      mockPrismaService.meetingBooking.findFirst.mockResolvedValue({
        id: 1,
        bookingCode: 'MB-100',
        status: BookingStatus.pending,
        paymentStatus: PaymentStatus.paid,
        startTime: new Date(Date.now() - 7200000),
        endTime: new Date(Date.now() - 3600000), // EXPIRED
      });

      await expect(service.verifyAndCheckIn('MB-100')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('Scenario F: SHOULD deny QR check-in for cancelled meeting booking', async () => {
      mockPrismaService.meetingBooking.findFirst.mockResolvedValue({
        id: 1,
        bookingCode: 'MB-100',
        status: BookingStatus.cancelled,
        paymentStatus: PaymentStatus.paid,
        startTime: new Date(Date.now() + 1800000),
        endTime: new Date(Date.now() + 3600000),
      });

      await expect(service.verifyAndCheckIn('MB-100')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('Scenario G: SHOULD deny QR check-in for already completed meeting booking', async () => {
      mockPrismaService.meetingBooking.findFirst.mockResolvedValue({
        id: 1,
        bookingCode: 'MB-100',
        status: BookingStatus.completed,
        paymentStatus: PaymentStatus.paid,
        startTime: new Date(Date.now() - 7200000),
        endTime: new Date(Date.now() - 3600000),
      });

      await expect(service.verifyAndCheckIn('MB-100')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('Scenario H: SHOULD deny QR check-in for UNPAID booking', async () => {
      mockPrismaService.meetingBooking.findFirst.mockResolvedValue({
        id: 1,
        bookingCode: 'MB-100',
        status: BookingStatus.pending,
        paymentStatus: PaymentStatus.unpaid, // UNPAID
        startTime: new Date(Date.now() + 600000),
        endTime: new Date(Date.now() + 4200000),
      });

      await expect(service.verifyAndCheckIn('MB-100')).rejects.toThrow(
        'Payment must be settled before check-in',
      );
    });

    it('Scenario I: SHOULD deny QR check-in for desk pass before 30-minute early check-in window', async () => {
      const futureDate = new Date(Date.now() + 86400000 * 5); // 5 days in future
      mockPrismaService.meetingBooking.findFirst.mockResolvedValue(null);
      mockPrismaService.booking.findFirst.mockResolvedValue({
        id: 2,
        bookingCode: 'BK-FUTURE',
        status: BookingStatus.pending,
        paymentStatus: PaymentStatus.paid,
        preferredDate: futureDate,
        preferredTimeSlot: '10:00 AM - 06:00 PM',
      });

      await expect(service.verifyAndCheckIn('BK-FUTURE')).rejects.toThrow(
        'Early check-in is not open yet',
      );
    });

    it('Scenario J: SHOULD deny QR check-in if branch ID does not match', async () => {
      mockPrismaService.meetingBooking.findFirst.mockResolvedValue({
        id: 1,
        branchId: 1,
        bookingCode: 'MB-BRANCH1',
        status: BookingStatus.pending,
        paymentStatus: PaymentStatus.paid,
        startTime: new Date(Date.now() + 600000),
        endTime: new Date(Date.now() + 4200000),
      });

      await expect(service.verifyAndCheckIn('MB-BRANCH1', 2)).rejects.toThrow(
        'registered for a different branch',
      );
    });

    it('Scenario K: SHOULD successfully check in valid paid meeting booking within valid time window', async () => {
      const now = Date.now();
      mockPrismaService.meetingBooking.findFirst.mockResolvedValue({
        id: 1,
        bookingCode: 'MB-VALID',
        status: BookingStatus.pending,
        paymentStatus: PaymentStatus.paid,
        startTime: new Date(now + 600000), // starts in 10 mins (within 30m window)
        endTime: new Date(now + 4200000),
      });
      mockPrismaService.meetingBooking.updateMany.mockResolvedValue({
        count: 1,
      });
      mockPrismaService.meetingBooking.findUnique.mockResolvedValue({
        id: 1,
        bookingCode: 'MB-VALID',
        status: BookingStatus.confirmed,
        paymentStatus: PaymentStatus.paid,
      });

      const res = await service.verifyAndCheckIn('MB-VALID');

      expect(res.success).toBe(true);
      expect(mockPrismaService.meetingBooking.updateMany).toHaveBeenCalledWith({
        where: {
          id: 1,
          status: { in: [BookingStatus.pending, BookingStatus.unpaid] },
          paymentStatus: PaymentStatus.paid,
        },
        data: { status: BookingStatus.confirmed },
      });
    });
  });

  describe('createAdminBooking & Financial Integrity', () => {
    it('SHOULD preserve 0 totalAmount when totalAmount is explicitly set to 0', async () => {
      mockPrismaService.booking.create.mockImplementation(({ data }) =>
        Promise.resolve({ id: 99, ...data }),
      );
      mockPrismaService.payment.create.mockResolvedValue({ id: 1 });

      const res = await service.createAdminBooking({
        customerName: 'Zero Pass',
        customerEmail: 'zero@test.com',
        totalAmount: 0,
        isPaid: true,
      });

      expect(res.success).toBe(true);
      expect(mockPrismaService.booking.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            totalAmount: 0,
            paymentStatus: PaymentStatus.paid,
          }),
        }),
      );
      expect(mockPrismaService.payment.create).toHaveBeenCalledWith({
        data: {
          bookingId: 99,
          userId: null,
          amount: 0,
          paymentMethod: 'cash',
          status: PaymentStatus.paid,
        },
      });
    });

    it('SHOULD create unpaid booking when isPaid is false', async () => {
      mockPrismaService.booking.create.mockImplementation(({ data }) =>
        Promise.resolve({ id: 100, ...data }),
      );

      const res = await service.createAdminBooking({
        customerName: 'Unpaid Pass',
        customerEmail: 'unpaid@test.com',
        totalAmount: 150,
        isPaid: false,
      });

      expect(res.success).toBe(true);
      expect(res.booking.paymentStatus).toBe(PaymentStatus.unpaid);
      expect(res.booking.status).toBe(BookingStatus.unpaid);
      expect(mockPrismaService.payment.create).not.toHaveBeenCalled();
    });

    it('SHOULD override totalAmount with pricingPlan price when pricingPlanId is provided', async () => {
      mockPrismaService.pricingPlan.findUnique.mockResolvedValue({
        id: 5,
        priceDaily: 999,
        priceMonthly: 1500,
      });
      mockPrismaService.booking.create.mockImplementation(({ data }) =>
        Promise.resolve({ id: 101, ...data }),
      );

      const res = await service.createAdminBooking({
        customerName: 'Plan Pass',
        customerEmail: 'plan@test.com',
        pricingPlanId: 5,
        totalAmount: 50, // Client spoofed 50, should be overridden to 999
        isPaid: false,
      });

      expect(res.success).toBe(true);
      expect(res.booking.totalAmount).toBe(999);
      expect(mockPrismaService.pricingPlan.findUnique).toHaveBeenCalledWith({
        where: { id: 5 },
      });
    });

    it('SHOULD throw BadRequestException if pricingPlanId does not exist', async () => {
      mockPrismaService.pricingPlan.findUnique.mockResolvedValue(null);

      await expect(
        service.createAdminBooking({
          customerName: 'Bad Plan Pass',
          customerEmail: 'badplan@test.com',
          pricingPlanId: 9999,
        }),
      ).rejects.toThrow('Referenced pricing plan does not exist');
    });
  });

  describe('Validation & Security Enhancements', () => {
    it('SHOULD throw BadRequestException if updateStatus receives an invalid BookingStatus value', async () => {
      await expect(
        service.updateStatus(1, 'INVALID_STATUS' as any),
      ).rejects.toThrow('Invalid status value');
    });

    it('SHOULD throw BadRequestException if updateMeetingStatus receives an invalid BookingStatus value', async () => {
      await expect(
        service.updateMeetingStatus(1, 'INVALID_STATUS' as any),
      ).rejects.toThrow('Invalid status value');
    });

    it('SHOULD neutralize CSV formula injection in exportCsv', async () => {
      mockPrismaService.booking.findMany.mockResolvedValue([
        {
          bookingCode: '=SUM(1,2)',
          customerName: '+MaliciousName',
          customerEmail: 'test@example.com',
          customerPhone: '-12345',
          companyName: '@EvilCorp',
          gstin: 'GST123',
          pricingPlan: { name: 'Day Pass' },
          preferredDate: new Date('2026-09-22'),
          preferredTimeSlot: '10:00 AM - 06:00 PM',
          bookingType: 'desk',
          status: BookingStatus.confirmed,
          paymentStatus: PaymentStatus.paid,
          createdAt: new Date('2026-09-22T10:00:00Z'),
        },
      ]);

      const csv = await service.exportCsv();
      expect(csv).toContain("'=SUM(1,2)");
      expect(csv).toContain("'+MaliciousName");
      expect(csv).toContain("'-12345");
      expect(csv).toContain("'@EvilCorp");
    });
  });
});
