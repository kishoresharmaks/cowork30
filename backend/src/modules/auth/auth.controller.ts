import { Controller, Post, Body, Get, Put, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto, RegisterDto } from './dto/auth.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from './guards/roles.guard';
import { Roles } from './decorators/roles.decorator';

import { ParseIntPipe } from '@nestjs/common';
import { PricingService } from '../pricing/pricing.service';

@ApiTags('Auth & User Management')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly pricingService: PricingService,
  ) {}

  @Post('login')
  @ApiOperation({ summary: 'Login member or admin user' })
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('admin/login')
  @ApiOperation({ summary: 'Login admin user with strict role verification' })
  async adminLogin(@Body() dto: LoginDto) {
    return this.authService.adminLogin(dto);
  }

  @Post('register')
  @ApiOperation({ summary: 'Register a new member account with ₹500 welcome bonus' })
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Get('user-by-email')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Auto-lookup member details by email address for booking forms (authenticated)' })
  async findUserByEmail(@Query('email') email: string, @Request() req: any) {
    return this.authService.findUserByEmail(email, req.user?.id);
  }

  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current logged-in user profile & wallet balance' })
  async getProfile(@Request() req: any) {
    return this.authService.getProfile(req.user.id);
  }

  @Put('profile')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update logged-in member profile details' })
  async updateProfile(@Request() req: any, @Body() body: any) {
    return this.authService.updateProfile(req.user.id, body);
  }

  @Get('my-bookings')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get member active & past reservations (desk & meeting rooms)' })
  async getMyBookings(@Request() req: any) {
    return this.authService.getMyBookings(req.user.id);
  }

  // --- ADMIN USER MANAGEMENT ENDPOINTS ---

  @Get('admin/users')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all platform users with search, role filter, and booking metrics (Admin Only)' })
  async getAdminUsers(
    @Query('search') search?: string,
    @Query('role') role?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.authService.getAdminUsers({
      search,
      role,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Get('admin/users/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get detailed member profile with all desk/meeting room bookings, wallet logs, and invoices (Admin Only)' })
  async getAdminUserDetail(@Param('id') id: string) {
    return this.authService.getAdminUserDetail(Number(id));
  }

  @Post('admin/users/:id/wallet-adjust')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin manual wallet credit/debit adjustment (Admin Only)' })
  async adjustUserWallet(
    @Param('id') id: string,
    @Body() body: { amount: number; type: 'credit' | 'debit'; reason: string },
  ) {
    return this.authService.adjustUserWallet(Number(id), body);
  }

  @Put('admin/users/:id/role')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Change user account role between member and admin (Admin Only)' })
  async updateUserRole(
    @Param('id') id: string,
    @Body() body: { role: string },
  ) {
    return this.authService.updateUserRole(Number(id), body.role);
  }

  @Post('admin/users/:id/assign-plan')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Assign pricing plan to user (Admin Only)' })
  async assignPlanToUser(
    @Param('id', ParseIntPipe) userId: number,
    @Body() body: { pricingPlanId: number; waivePayment?: boolean; billingPeriod?: string },
  ) {
    return this.pricingService.assignPlanToUser(Number(body.pricingPlanId), userId, body);
  }
}
