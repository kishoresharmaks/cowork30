import { Controller, Get, Post, Put, Delete, Body, Param, Query, ParseIntPipe, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PricingService } from './pricing.service';
import { CreateTourBookingDto } from './dto/tour-booking.dto';
import { CreatePricingPlanDto, UpdatePricingPlanDto } from './dto/pricing-plan.dto';
import { PricingQuoteDto } from './dto/pricing-quote.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Pricing')
@Controller('pricing')
export class PricingController {
  constructor(private readonly pricingService: PricingService) {}

  @Get('plans')
  @ApiOperation({ summary: 'Get all membership pricing plans' })
  async findAllPlans(@Query('all') all?: string) {
    return this.pricingService.findAllPlans(all === 'true');
  }

  @Get('plans/slug/:slug')
  @ApiOperation({ summary: 'Get a pricing plan by slug' })
  async findPlanBySlug(@Param('slug') slug: string, @Query('all') all?: string) {
    return this.pricingService.findPlanBySlug(slug, all === 'true');
  }

  @Post('quote')
  @ApiOperation({ summary: 'Calculate a pricing quote' })
  async calculateQuote(@Body() dto: PricingQuoteDto) {
    return this.pricingService.calculateQuote(dto);
  }

  @Post('plans')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: Create a new membership pricing plan' })
  async createPlan(@Body() body: CreatePricingPlanDto) {
    return this.pricingService.createPlan(body);
  }

  @Post('plans/:id/subscribe')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Member: Subscribe to a pricing plan and receive included credits' })
  async subscribeToPlan(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: any,
    @Body() body: { billingPeriod?: string; paymentMethod?: string; razorpayOrderId?: string; razorpayPaymentId?: string; razorpaySignature?: string },
  ) {
    return this.pricingService.subscribeToPlan(id, req.user.id, body);
  }

  @Put('plans/:id/assign/:userId')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: Assign a pricing plan to a member (waivePayment optional)' })
  async assignPlanToUser(
    @Param('id', ParseIntPipe) id: number,
    @Param('userId', ParseIntPipe) userId: number,
    @Body() body: { waivePayment?: boolean; billingPeriod?: string },
  ) {
    return this.pricingService.assignPlanToUser(id, userId, body);
  }

  @Put('plans/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: Update membership pricing plan & features' })
  async updatePlan(@Param('id', ParseIntPipe) id: number, @Body() body: UpdatePricingPlanDto) {
    return this.pricingService.updatePlan(id, body);
  }

  @Delete('plans/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: Delete pricing plan' })
  async deletePlan(@Param('id', ParseIntPipe) id: number) {
    return this.pricingService.deletePlan(id);
  }

  @Post('tour-booking')
  @ApiOperation({ summary: 'Submit a tour or membership booking request' })
  async createTourBooking(@Body() dto: CreateTourBookingDto) {
    return this.pricingService.createTourBooking(dto);
  }
}
