import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateTourBookingDto {
  @ApiProperty({ example: 1 })
  @IsOptional()
  @IsNumber()
  pricingPlanId?: number;

  @ApiProperty({ example: 1, required: false })
  @IsOptional()
  @IsNumber()
  branchId?: number;

  @ApiProperty({ example: 1, required: false })
  @IsOptional()
  @IsNumber()
  userId?: number;

  @ApiProperty({ example: 'Jane Smith' })
  @IsString()
  @IsNotEmpty()
  customerName!: string;

  @ApiProperty({ example: 'jane@example.com' })
  @IsEmail()
  @IsNotEmpty()
  customerEmail!: string;

  @ApiProperty({ example: '+15559998888' })
  @IsString()
  @IsNotEmpty()
  customerPhone!: string;

  @ApiProperty({ example: 'Tech Corp', required: false })
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
  preferredDate!: string;

  @ApiProperty({ example: '10:00 AM - 11:00 AM', required: false })
  @IsOptional()
  @IsString()
  preferredTimeSlot?: string;

  @ApiProperty({ example: 'Interested in 5 dedicated desks', required: false })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ example: 'confirmed', required: false })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiProperty({ example: 'paid', required: false })
  @IsOptional()
  @IsString()
  paymentStatus?: string;

  @ApiProperty({ example: 500, required: false })
  @IsOptional()
  @IsNumber()
  totalAmount?: number;

  @ApiProperty({ example: 'desk', required: false })
  @IsOptional()
  @IsString()
  bookingType?: string;
}
