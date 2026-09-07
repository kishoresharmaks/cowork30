import { Controller, Get, Post, Put, Delete, Body, Param, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { MeetingRoomsService } from './meeting-rooms.service';
import { AvailabilityCheckDto, CreateMeetingBookingDto, CreateMeetingRoomDto, UpdateMeetingRoomDto } from './dto/meeting-room.dto';
import * as jwt from 'jsonwebtoken';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Meeting Rooms')
@Controller('meeting-rooms')
export class MeetingRoomsController {
  constructor(private readonly meetingRoomsService: MeetingRoomsService) {}

  @Get()
  @ApiOperation({ summary: 'Get meeting room catalog filterable by category and branch' })
  async findAll(
    @Query('all') all?: string,
    @Query('category') category?: string,
    @Query('branchId') branchId?: string,
  ) {
    const branchIdNum = branchId ? parseInt(branchId, 10) : undefined;
    return this.meetingRoomsService.findAll(all === 'true', category, branchIdNum);
  }

  @Get('receipt/:token')
  @ApiOperation({ summary: 'Get tokenized digital receipt details by view token' })
  async getReceiptByToken(@Param('token') token: string, @Req() req: any) {
    let requestingUser = null;
    const authHeader = req.headers['authorization'] || req.headers['Authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const jwtToken = authHeader.split(' ')[1];
        const secret = process.env.JWT_SECRET;
        if (!secret) {
          // No secret configured - proceed as unauthenticated
          return this.meetingRoomsService.getReceiptByToken(token, null);
        }
        const decoded: any = jwt.verify(jwtToken, secret);
        if (decoded) {
          requestingUser = { id: decoded.sub, email: decoded.email, role: decoded.role };
        }
      } catch (e) {}
    }
    return this.meetingRoomsService.getReceiptByToken(token, requestingUser);
  }

  @Post('booking')
  @ApiOperation({ summary: 'Create a meeting room booking reservation' })
  async createBooking(@Body() dto: CreateMeetingBookingDto) {
    return this.meetingRoomsService.createBooking(dto);
  }

  @Post('bookings')
  @ApiOperation({ summary: 'Create a meeting room booking reservation (plural alias)' })
  async createBookingPluralAlias(@Body() dto: CreateMeetingBookingDto) {
    return this.meetingRoomsService.createBooking(dto);
  }

  @Post('book')
  @ApiOperation({ summary: 'Create a meeting room booking reservation (alias)' })
  async createBookingAlias(@Body() dto: CreateMeetingBookingDto) {
    return this.meetingRoomsService.createBooking(dto);
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Get meeting room details by URL slug' })
  async findBySlug(@Param('slug') slug: string) {
    return this.meetingRoomsService.findBySlug(slug);
  }

  @Post(':slug/availability')
  @ApiOperation({ summary: 'Check real-time hourly slot availability for a date' })
  async checkAvailability(@Param('slug') slug: string, @Body() dto: AvailabilityCheckDto) {
    return this.meetingRoomsService.checkAvailability(slug, dto);
  }

  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: Create a new meeting room record' })
  async createRoom(@Body() body: CreateMeetingRoomDto) {
    return this.meetingRoomsService.createRoom(body);
  }

  @Put(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: Update meeting room details, rate, or capacity' })
  async updateRoom(@Param('id') id: string, @Body() body: UpdateMeetingRoomDto) {
    return this.meetingRoomsService.updateRoom(Number(id), body);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: Delete a meeting room record' })
  async deleteRoom(@Param('id') id: string) {
    return this.meetingRoomsService.deleteRoom(Number(id));
  }
}
