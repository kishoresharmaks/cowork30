import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsInt, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreatePricingPlanDto {
  @ApiProperty({ example: 'Dedicated Pro Member' })
  @IsString()
  name!: string;

  @ApiPropertyOptional({ example: 'dedicated-pro-member' })
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiPropertyOptional({ example: 'Best for full-time teams that need a fixed seat.' })
  @IsOptional()
  @IsString()
  tagline?: string;

  @ApiProperty({ example: 8500 })
  @IsNumber()
  @Min(0)
  priceMonthly!: number;

  @ApiPropertyOptional({ example: 850 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  priceDaily?: number;

  @ApiPropertyOptional({ example: 'Monthly' })
  @IsOptional()
  @IsString()
  billingPeriod?: string;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @IsInt()
  @Min(0)
  meetingCreditsIncluded?: number;

  @ApiPropertyOptional({ example: 20 })
  @IsOptional()
  @IsInt()
  @Min(0)
  deskCreditsIncluded?: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isPopular?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @ApiPropertyOptional({ type: [String], example: ['24/7 Access', 'Meeting room credits'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  featuresList?: string[];
}

export class UpdatePricingPlanDto {
  @ApiPropertyOptional({ example: 'Dedicated Pro Member' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'dedicated-pro-member' })
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiPropertyOptional({ example: 'Best for full-time teams that need a fixed seat.' })
  @IsOptional()
  @IsString()
  tagline?: string;

  @ApiPropertyOptional({ example: 8500 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  priceMonthly?: number;

  @ApiPropertyOptional({ example: 850 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  priceDaily?: number;

  @ApiPropertyOptional({ example: 'Monthly' })
  @IsOptional()
  @IsString()
  billingPeriod?: string;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @IsInt()
  @Min(0)
  meetingCreditsIncluded?: number;

  @ApiPropertyOptional({ example: 20 })
  @IsOptional()
  @IsInt()
  @Min(0)
  deskCreditsIncluded?: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isPopular?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @ApiPropertyOptional({ type: [String], example: ['24/7 Access', 'Meeting room credits'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  featuresList?: string[];
}