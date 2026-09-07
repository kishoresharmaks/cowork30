import { Controller, Get, Put, Post, Body, Param, Query, ParseIntPipe, Res, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { BookingsService } from './bookings.service';
import { BookingStatus, PaymentStatus } from '@prisma/client';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Bookings')
@Controller('bookings')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('admin', 'staff')
@ApiBearerAuth()
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Get()
  @ApiOperation({ summary: 'Admin/Staff: Search and filter desk & tour bookings' })
  async findAll(
    @Query('status') status?: BookingStatus,
    @Query('search') search?: string,
    @Query('type') type?: string,
  ) {
    return this.bookingsService.findAll({ status, search, type });
  }

  @Get('stats/dashboard')
  @ApiOperation({ summary: 'Admin/Staff: Fetch real-time executive analytics & activity feed' })
  async getDashboardStats() {
    return this.bookingsService.getAdminStats();
  }

  @Get('public-stats')
  @ApiOperation({ summary: 'Public: Fetch platform statistics for homepage display' })
  async getPublicStats() {
    return this.bookingsService.getPublicStats();
  }

  @Get('meeting-rooms')
  @ApiOperation({ summary: 'Admin/Staff: List and search all meeting room reservations' })
  async findMeetingBookings(
    @Query('status') status?: BookingStatus,
    @Query('search') search?: string,
  ) {
    return this.bookingsService.findMeetingBookings({ status, search });
  }

  @Post()
  @ApiOperation({ summary: 'Admin/Staff: Manually create a desk/tour booking record' })
  async createAdminBooking(@Body() body: any) {
    return this.bookingsService.createAdminBooking(body);
  }

  @Post('check-in')
  @ApiOperation({ summary: 'Admin/Staff Reception: Verify QR access code and check in arriving customer' })
  async verifyAndCheckIn(@Body() body: { accessCode: string }) {
    return this.bookingsService.verifyAndCheckIn(body.accessCode);
  }

  @Put(':id/status')
  @ApiOperation({ summary: 'Admin/Staff: Update booking status and payment status inline' })
  async updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { status: BookingStatus; paymentStatus?: PaymentStatus },
  ) {
    return this.bookingsService.updateStatus(id, body.status, body.paymentStatus);
  }

  @Put('meeting-rooms/:id/status')
  @ApiOperation({ summary: 'Admin/Staff: Update meeting room booking status inline' })
  async updateMeetingStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { status: BookingStatus; paymentStatus?: PaymentStatus },
  ) {
    return this.bookingsService.updateMeetingStatus(id, body.status, body.paymentStatus);
  }

  @Post(':id/notes')
  @ApiOperation({ summary: 'Admin/Staff: Add timestamped staff note to booking' })
  async addNote(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { note?: string; noteText?: string; author?: string },
    @Request() req: any,
  ) {
    const userId = req.user?.id ? Number(req.user.id) : 1;
    const text = body.noteText || body.note || '';
    return this.bookingsService.addNote(id, userId, text);
  }

  @Get('export/csv')
  @ApiOperation({ summary: 'Admin/Staff: Export filtered bookings to CSV spreadsheet' })
  async exportCsv(@Res() res: any) {
    const csvContent = await this.bookingsService.generateCsvExport();
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=cowork30_bookings_report.csv');
    return res.send(csvContent);
  }
}
