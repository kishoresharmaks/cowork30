import { IsString, IsOptional, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateNotificationDto {
  @ApiPropertyOptional({ description: 'Target user ID. If omitted, sent globally.' })
  @IsOptional()
  @IsNumber()
  userId?: number;

  @ApiProperty({ description: 'Notification headline' })
  @IsString()
  title!: string;

  @ApiProperty({ description: 'Detailed notification message' })
  @IsString()
  message!: string;

  @ApiPropertyOptional({ description: 'Category type (booking, inquiry, wallet, system)' })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional({ description: 'Optional relative link (e.g. /dashboard?tab=wallet)' })
  @IsOptional()
  @IsString()
  link?: string;
}
