import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsEmail, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class AvailabilityCheckDto {
  @ApiProperty({ example: '2026-03-01' })
  @IsString()
  @IsNotEmpty()
  date!: string;
}

export class CreateMeetingRoomDto {
  @ApiProperty({ example: 'Executive Boardroom' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: 'executive-boardroom', required: false })
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiProperty({ example: 1, required: false })
  @IsOptional()
  @IsNumber()
  branchId?: number;

  @ApiProperty({ example: 10, required: false })
  @IsOptional()
  @IsNumber()
  capacity?: number;

  @ApiProperty({ example: 2, required: false })
  @IsOptional()
  @IsNumber()
  minSeats?: number;

  @ApiProperty({ example: 12, required: false })
  @IsOptional()
  @IsNumber()
  maxSeats?: number;

  @ApiProperty({ example: 150, required: false })
  @IsOptional()
  @IsNumber()
  perSeatPrice?: number;

  @ApiProperty({ example: 'fixed', required: false })
  @IsOptional()
  @IsString()
  serviceChargeType?: string;

  @ApiProperty({ example: 200, required: false })
  @IsOptional()
  @IsNumber()
  serviceChargeValue?: number;

  @ApiProperty({ example: 500, required: false })
  @IsOptional()
  @IsNumber()
  hourlyRate?: number;

  @ApiProperty({ example: 3500, required: false })
  @IsOptional()
  @IsNumber()
  dailyRate?: number;

  @ApiProperty({ example: '09:30', required: false, description: 'Operational start time in HH:mm format' })
  @IsOptional()
  @IsString()
  startTime?: string;

  @ApiProperty({ example: '17:30', required: false, description: 'Operational end time in HH:mm format' })
  @IsOptional()
  @IsString()
  endTime?: string;

  @ApiProperty({ example: 'Executive Boardroom', required: false })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiProperty({ example: false, required: false })
  @IsOptional()
  @IsBoolean()
  is24Hours?: boolean;

  @ApiProperty({ example: 'Premium boardroom with 4K screen', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: ['4K Smart TV', 'Wi-Fi'], required: false })
  @IsOptional()
  @IsArray()
  amenities?: string[];

  @ApiProperty({ example: 'https://images.unsplash.com/...', required: false })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiProperty({ example: 'https://images.unsplash.com/...', required: false })
  @IsOptional()
  @IsString()
  featuredImage?: string;

  @ApiProperty({ example: ['https://images.unsplash.com/...'], required: false })
  @IsOptional()
  @IsArray()
  images?: any[];

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({ example: 1, required: false })
  @IsOptional()
  @IsNumber()
  floorMapId?: number;

  @ApiProperty({ example: 120.5, required: false })
  @IsOptional()
  @IsNumber()
  xCoordinate?: number;

  @ApiProperty({ example: 340.0, required: false })
  @IsOptional()
  @IsNumber()
  yCoordinate?: number;

  @ApiProperty({ example: 1, required: false })
  @IsOptional()
  @IsNumber()
  sortOrder?: number;
}

export class UpdateMeetingRoomDto {
  @ApiProperty({ example: 'Executive Boardroom', required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ example: 10, required: false })
  @IsOptional()
  @IsNumber()
  capacity?: number;

  @ApiProperty({ example: 2, required: false })
  @IsOptional()
  @IsNumber()
  minSeats?: number;

  @ApiProperty({ example: 12, required: false })
  @IsOptional()
  @IsNumber()
  maxSeats?: number;

  @ApiProperty({ example: 150, required: false })
  @IsOptional()
  @IsNumber()
  perSeatPrice?: number;

  @ApiProperty({ example: 'fixed', required: false })
  @IsOptional()
  @IsString()
  serviceChargeType?: string;

  @ApiProperty({ example: 200, required: false })
  @IsOptional()
  @IsNumber()
  serviceChargeValue?: number;

  @ApiProperty({ example: 500, required: false })
  @IsOptional()
  @IsNumber()
  hourlyRate?: number;

  @ApiProperty({ example: 3500, required: false })
  @IsOptional()
  @IsNumber()
  dailyRate?: number;

  @ApiProperty({ example: '09:30', required: false, description: 'Operational start time in HH:mm format' })
  @IsOptional()
  @IsString()
  startTime?: string;

  @ApiProperty({ example: '17:30', required: false, description: 'Operational end time in HH:mm format' })
  @IsOptional()
  @IsString()
  endTime?: string;

  @ApiProperty({ example: 'Executive Boardroom', required: false })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiProperty({ example: false, required: false })
  @IsOptional()
  @IsBoolean()
  is24Hours?: boolean;

  @ApiProperty({ example: 'Updated room description', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: ['4K Smart TV', 'Wi-Fi'], required: false })
  @IsOptional()
  @IsArray()
  amenities?: string[];

  @ApiProperty({ example: 'https://images.unsplash.com/...', required: false })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiProperty({ example: 'https://images.unsplash.com/...', required: false })
  @IsOptional()
  @IsString()
  featuredImage?: string;

  @ApiProperty({ example: ['https://images.unsplash.com/...'], required: false })
  @IsOptional()
  @IsArray()
  images?: any[];

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({ example: 1, required: false })
  @IsOptional()
  @IsNumber()
  floorMapId?: number;

  @ApiProperty({ example: 120.5, required: false })
  @IsOptional()
  @IsNumber()
  xCoordinate?: number;

  @ApiProperty({ example: 340.0, required: false })
  @IsOptional()
  @IsNumber()
  yCoordinate?: number;

  @ApiProperty({ example: 1, required: false })
  @IsOptional()
  @IsNumber()
  sortOrder?: number;
}

export class CreateMeetingBookingDto {
  @ApiProperty({ example: 1, required: false })
  @IsOptional()
  @IsNumber()
  meetingRoomId?: number;

  @ApiProperty({ example: 'executive-boardroom', required: false })
  @IsOptional()
  @IsString()
  roomSlug?: string;

  @ApiProperty({ example: 'John Client' })
  @IsString()
  @IsNotEmpty()
  customerName!: string;

  @ApiProperty({ example: 'client@example.com' })
  @IsEmail()
  @IsNotEmpty()
  customerEmail!: string;

  @ApiProperty({ example: '+15551234567' })
  @IsString()
  @IsNotEmpty()
  customerPhone!: string;

  @ApiProperty({ example: 'Acme Inc', required: false })
  @IsOptional()
  @IsString()
  companyName?: string;

  @ApiProperty({ example: '22AAAAA0000A1Z5', required: false })
  @IsOptional()
  @IsString()
  gstin?: string;

  @ApiProperty({ example: '2026-03-01' })
  @IsString()
  @IsNotEmpty()
  bookingDate!: string;

  @ApiProperty({ example: ['2026-03-01T10:00:00.000Z'], required: false })
  @IsOptional()
  @IsArray()
  selectedSlots?: string[];

  @ApiProperty({ example: '2026-03-01T10:00:00.000Z', required: false })
  @IsOptional()
  @IsString()
  startTime?: string;

  @ApiProperty({ example: '2026-03-01T12:00:00.000Z', required: false })
  @IsOptional()
  @IsString()
  endTime?: string;

  @ApiProperty({ example: 6, required: false })
  @IsOptional()
  @IsNumber()
  attendeesCount?: number;

  @ApiProperty({ example: 4, required: false })
  @IsOptional()
  @IsNumber()
  seatsBooked?: number;

  @ApiProperty({ example: 1500, required: false })
  @IsOptional()
  @IsNumber()
  totalAmount?: number;

  @ApiProperty({ example: 1, required: false })
  @IsOptional()
  @IsNumber()
  userId?: number;

  @ApiProperty({ example: [], required: false })
  @IsOptional()
  @IsArray()
  addonsSelected?: any[];

  @ApiProperty({ example: 'wallet', required: false })
  @IsOptional()
  @IsString()
  paymentMethod?: string;

  @ApiProperty({ example: 'paid', required: false })
  @IsOptional()
  @IsString()
  paymentStatus?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  rawResponse?: any;

  @ApiProperty({ example: 'Staff Walk-In Reservation', required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}
