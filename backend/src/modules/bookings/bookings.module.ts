import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { BookingsService } from './bookings.service';
import { BookingsController } from './bookings.controller';
import { BookingsCronController } from './bookings-cron.controller';

import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [ScheduleModule.forRoot(), NotificationsModule],
  controllers: [BookingsController, BookingsCronController],
  providers: [BookingsService],
  exports: [BookingsService],
})
export class BookingsModule {}
