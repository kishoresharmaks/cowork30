import { Controller, Get, Logger, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Cron } from '@nestjs/schedule';
import { AuthGuard } from '@nestjs/passport';
import { BookingsService } from '../bookings/bookings.service';

@ApiTags('Cron - Auto Complete Bookings')
@Controller('bookings/cron')
export class BookingsCronController {
  constructor(private readonly bookingsService: BookingsService) {}

  // Runs every 5 minutes via @nestjs/schedule Cron decorator
  // No HTTP auth needed - this is an internal scheduled method
  @Cron('*/5 * * * *', {
    name: 'autoCompleteExpiredBookings',
    timeZone: 'Asia/Kolkata',
  })
  @ApiOperation({
    summary: '[CRON JOB] Auto-complete expired bookings every 5 minutes',
    description: 'This method is automatically invoked by NestJS Cron scheduler. It transitions past-time bookings to completed or not_checked_in.',
  })
  async scheduledAutoComplete() {
    try {
      const result = await this.bookingsService.autoCompleteExpiredBookings();
      Logger.log(`[Cron] Auto-complete result: ${JSON.stringify(result.processed)}`, 'Cron');
      return result;
    } catch (err) {
      Logger.error(`[Cron] Failed: ${err.message}`, err.stack, 'Cron');
      return { success: false, error: err.message };
    }
  }

  // Manual trigger endpoint - protected by JWT auth
  @Get('complete-expired')
  @ApiOperation({
    summary: 'Manually trigger auto-complete expired bookings',
    description: 'Admin/Staff can manually trigger the expiration check. Requires JWT auth.',
  })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  async manualTrigger(@Request() req: any) {
    const result = await this.bookingsService.autoCompleteExpiredBookings();
    return result;
  }
}
