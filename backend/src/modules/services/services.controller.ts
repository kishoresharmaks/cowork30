import { Controller, Get, Post, Put, Delete, Body, Param, Query, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ServicesService } from './services.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

import { IsOptional, IsString, IsNumber } from 'class-validator';

export class UpdateInquiryDto {
  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsNumber()
  totalAmount?: number;

  @IsOptional()
  @IsString()
  paymentStatus?: string;
}

export class CreateInquiryMessageDto {
  @IsString()
  senderType!: string;

  @IsString()
  senderName!: string;

  @IsString()
  message!: string;

  @IsOptional()
  @IsNumber()
  senderId?: number;
}

@ApiTags('Services')
@Controller('services')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Get('inquiries/:id/messages')
  @ApiOperation({ summary: 'Get live chat message history for a service inquiry' })
  async getInquiryMessages(@Param('id', ParseIntPipe) id: number) {
    return this.servicesService.getInquiryMessages(id);
  }

  @Post('inquiries/:id/messages')
  @ApiOperation({ summary: 'Post a chat message to a service inquiry' })
  async sendInquiryMessage(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateInquiryMessageDto,
  ) {
    return this.servicesService.sendInquiryMessage(
      id,
      dto.senderType,
      dto.senderName,
      dto.message,
      dto.senderId,
    );
  }

  @Get()
  @ApiOperation({ summary: 'Get workspace services catalog filterable by branch' })
  async findAll(@Query('all') all?: string, @Query('branchId') branchId?: string) {
    const branchIdNum = branchId ? parseInt(branchId, 10) : undefined;
    return this.servicesService.findAll(all === 'true', branchIdNum);
  }

  @Post('inquiry')
  @ApiOperation({ summary: 'Submit a workspace solution inquiry or reservation' })
  async createServiceInquiry(@Body() body: any) {
    return this.servicesService.createServiceInquiry(body);
  }

  @Get('admin/inquiries')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: Get all service solution inquiries' })
  async findAllInquiries(@Query('branchId') branchId?: string) {
    const branchIdNum = branchId ? parseInt(branchId, 10) : undefined;
    return this.servicesService.findAllInquiries(branchIdNum);
  }

  @Put('admin/inquiries/:id/status')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: Update service inquiry status or total quote amount' })
  async updateInquiryStatus(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateInquiryDto) {
    return this.servicesService.updateInquiryStatus(id, dto.status as any, dto.totalAmount, dto.paymentStatus as any);
  }

  @Delete('admin/inquiries/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: Delete service inquiry record' })
  async deleteInquiry(@Param('id', ParseIntPipe) id: number) {
    return this.servicesService.deleteInquiry(id);
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Get workspace service details by URL slug' })
  async findBySlug(@Param('slug') slug: string) {
    return this.servicesService.findBySlug(slug);
  }

  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: Create a new workspace solution' })
  async createService(@Body() body: any) {
    return this.servicesService.createService(body);
  }

  @Put(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: Update workspace solution details and active status' })
  async updateService(@Param('id', ParseIntPipe) id: number, @Body() body: any) {
    return this.servicesService.updateService(id, body);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: Delete workspace solution' })
  async deleteService(@Param('id', ParseIntPipe) id: number) {
    return this.servicesService.deleteService(id);
  }
}
