import { Test, TestingModule } from '@nestjs/testing';
import { MeetingRoomsService, getLocalZonedNow } from './meeting-rooms.service';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { BadRequestException } from '@nestjs/common';

describe('MeetingRoomsService - Past Time Slots Prevention', () => {
  let service: MeetingRoomsService;

  const mockPrismaService = {
    meetingRoom: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    meetingBooking: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    branch: {
      findFirst: jest.fn(),
    },
    siteSetting: {
      findUnique: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MeetingRoomsService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<MeetingRoomsService>(MeetingRoomsService);
  });

  describe('getLocalZonedNow', () => {
    it('should return valid dateStr and totalMinutes for Asia/Kolkata', () => {
      const zoned = getLocalZonedNow('Asia/Kolkata');
      expect(zoned).toBeDefined();
      expect(zoned.dateStr).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(typeof zoned.totalMinutes).toBe('number');
      expect(zoned.totalMinutes).toBeGreaterThanOrEqual(0);
      expect(zoned.totalMinutes).toBeLessThan(1440);
    });
  });

  describe('checkAvailability - past slot filtering', () => {
    const mockRoom = {
      id: 1,
      name: 'Sector 62 Tech Conference (10-Seater)',
      slug: 'sector62-conference-suite',
      startTime: null,
      endTime: null, // 24/7 access
      hourlyRate: 55,
      perSeatPrice: 50,
      minSeats: 1,
      maxSeats: 10,
      serviceChargeType: 'fixed',
      serviceChargeValue: 0,
      isActive: true,
    };

    it('should return NO slots for a past date', async () => {
      mockPrismaService.meetingRoom.findUnique.mockResolvedValue(mockRoom);
      mockPrismaService.meetingBooking.findMany.mockResolvedValue([]);

      const result = await service.checkAvailability(mockRoom.slug, {
        date: '2020-01-01',
      });

      expect(result.timeSlots).toBeDefined();
      expect(result.timeSlots.length).toBe(0);
    });

    it('should filter out all slots that have already started on today', async () => {
      mockPrismaService.meetingRoom.findUnique.mockResolvedValue(mockRoom);
      mockPrismaService.meetingBooking.findMany.mockResolvedValue([]);

      const zonedNow = getLocalZonedNow('Asia/Kolkata');
      const result = await service.checkAvailability(mockRoom.slug, {
        date: zonedNow.dateStr,
      });

      expect(result.timeSlots).toBeDefined();
      for (const slot of result.timeSlots) {
        expect(slot.startMinutes).toBeGreaterThan(zonedNow.totalMinutes);
        expect(slot.isPast).toBe(false);
        expect(slot.isAvailable).toBe(true);
      }
    });

    it('should return all 48 slots for tomorrow for a 24/7 room', async () => {
      mockPrismaService.meetingRoom.findUnique.mockResolvedValue(mockRoom);
      mockPrismaService.meetingBooking.findMany.mockResolvedValue([]);

      const zonedNow = getLocalZonedNow('Asia/Kolkata');
      const tomorrow = new Date(Date.now() + 86400000);
      const tomorrowStr = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`;

      const result = await service.checkAvailability(mockRoom.slug, {
        date: tomorrowStr,
      });

      expect(result.timeSlots).toBeDefined();
      expect(result.timeSlots.length).toBe(48);
      for (const slot of result.timeSlots) {
        expect(slot.isPast).toBe(false);
        expect(slot.isAvailable).toBe(true);
      }
    });
  });

  describe('createBooking - past reservation blocking', () => {
    const mockRoom = {
      id: 1,
      name: 'Sector 62 Tech Conference (10-Seater)',
      slug: 'sector62-conference-suite',
      startTime: null,
      endTime: null,
      hourlyRate: 55,
      perSeatPrice: 50,
      minSeats: 1,
      maxSeats: 10,
      serviceChargeType: 'fixed',
      serviceChargeValue: 0,
      isActive: true,
      branchId: 1,
    };

    it('should reject booking with BadRequestException if booking date is in the past', async () => {
      mockPrismaService.meetingRoom.findUnique.mockResolvedValue(mockRoom);

      await expect(
        service.createBooking({
          roomSlug: mockRoom.slug,
          customerName: 'Test User',
          customerEmail: 'test@example.com',
          customerPhone: '+919876543210',
          bookingDate: '2020-01-01',
          selectedSlots: ['2020-01-01T10:00:00.000Z'],
          seatsBooked: 2,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject booking with BadRequestException if selected slot on today is in the past', async () => {
      mockPrismaService.meetingRoom.findUnique.mockResolvedValue(mockRoom);
      const zonedNow = getLocalZonedNow('Asia/Kolkata');

      // A slot at 00:00 or an early hour when current time is later
      if (zonedNow.totalMinutes > 60) {
        await expect(
          service.createBooking({
            roomSlug: mockRoom.slug,
            customerName: 'Test User',
            customerEmail: 'test@example.com',
            customerPhone: '+919876543210',
            bookingDate: zonedNow.dateStr,
            selectedSlots: [`${zonedNow.dateStr}T00:30:00.000Z`],
            seatsBooked: 2,
          }),
        ).rejects.toThrow(BadRequestException);
      }
    });
  });
});
