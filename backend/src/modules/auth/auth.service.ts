import { Injectable, UnauthorizedException, BadRequestException, NotFoundException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { LoginDto, RegisterDto } from './dto/auth.dto';
import * as bcrypt from 'bcrypt';
import { BookingStatus, BookingType, PaymentStatus, Role } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  private getMembershipEndDate(booking: { createdAt: Date; preferredTimeSlot?: string | null }) {
    const endDate = new Date(booking.createdAt);
    if ((booking.preferredTimeSlot || '').toLowerCase().includes('daily')) {
      endDate.setDate(endDate.getDate() + 1);
    } else {
      endDate.setMonth(endDate.getMonth() + 1);
    }
    return endDate;
  }

  private async completeExpiredMemberships(userId: number, email?: string) {
    const memberships = await this.prisma.booking.findMany({
      where: {
        bookingType: BookingType.membership_inquiry,
        status: BookingStatus.confirmed,
        paymentStatus: PaymentStatus.paid,
        OR: [{ userId }, ...(email ? [{ customerEmail: email }] : [])],
      },
      select: { id: true, createdAt: true, preferredTimeSlot: true },
    });
    const expiredIds = memberships
      .filter((booking) => this.getMembershipEndDate(booking).getTime() <= Date.now())
      .map((booking) => booking.id);
    if (expiredIds.length) {
      await this.prisma.booking.updateMany({
        where: { id: { in: expiredIds } },
        data: { status: BookingStatus.completed },
      });
    }
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const payload = { sub: user.id, email: user.email, role: user.role };
    const accessToken = this.jwtService.sign(payload);

    const { passwordHash, ...userInfo } = user;
    return {
      success: true,
      accessToken,
      user: userInfo,
    };
  }

  async findUserByEmail(email: string, requesterId?: number) {
    if (!email) return { success: false, user: null };

    const requester = requesterId ? await this.prisma.user.findUnique({
      where: { id: requesterId },
      select: { id: true, role: true },
    }) : null;

    if (!requester) {
      return { success: false, user: null, message: 'Authentication required' };
    }

    const user = await this.prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        companyName: true,
        gstin: true,
        role: true,
      },
    });
    if (!user) return { success: false, user: null };
    return { success: true, user };
  }

  async adminLogin(dto: LoginDto) {
    const res = await this.login(dto);
    if (res.user.role !== Role.admin) {
      throw new UnauthorizedException('Access Denied: Account does not have administrator privileges.');
    }
    return res;
  }

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existing) {
      throw new BadRequestException('User with this email already exists');
    }

    // Dynamic Welcome Bonus lookup from site_settings (default ₹500.00)
    const bonusSetting = await this.prisma.siteSetting.findUnique({
      where: { key: 'welcome_bonus_amount' },
    });
    const welcomeBonus = bonusSetting && !isNaN(Number(bonusSetting.value)) ? Number(bonusSetting.value) : 500.00;

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        passwordHash,
        phone: dto.phone,
        companyName: dto.companyName,
        gstin: dto.gstin,
        role: Role.member,
        walletBalance: welcomeBonus,
        deskCreditsBalance: 0,
        meetingCreditsBalance: 0,
      },
    });

    // Auto-link existing guest reservations made with this email
    await this.prisma.booking.updateMany({
      where: { customerEmail: dto.email, userId: null },
      data: { userId: user.id },
    });
    await this.prisma.meetingBooking.updateMany({
      where: { customerEmail: dto.email, userId: null },
      data: { userId: user.id },
    });

    // Log Welcome Bonus in Wallet Transaction
    if (welcomeBonus > 0) {
      await this.prisma.walletTransaction.create({
        data: {
          userId: user.id,
          type: 'welcome_bonus',
          amount: welcomeBonus,
          balanceAfter: welcomeBonus,
          description: `Automated ₹${welcomeBonus.toLocaleString()} Welcome Bonus Credit`,
          referenceId: `BONUS-${user.id}`,
        },
      });
    }

    const payload = { sub: user.id, email: user.email, role: user.role };
    const accessToken = this.jwtService.sign(payload);

    const { passwordHash: ph, ...userInfo } = user;
    return {
      success: true,
      accessToken,
      user: userInfo,
    };
  }

  async getProfile(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const { passwordHash, ...userInfo } = user;
    return {
      success: true,
      user: userInfo,
    };
  }

  async updateProfile(userId: number, data: any) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(data.name ? { name: data.name } : {}),
        ...(data.phone !== undefined ? { phone: data.phone } : {}),
        ...(data.companyName !== undefined ? { companyName: data.companyName } : {}),
        ...(data.gstin !== undefined ? { gstin: data.gstin } : {}),
        ...(data.avatarUrl !== undefined ? { avatarUrl: data.avatarUrl } : {}),
        ...(data.bio !== undefined ? { bio: data.bio } : {}),
      },
    });

    const { passwordHash, ...userInfo } = user;
    return {
      success: true,
      user: userInfo,
    };
  }

  async getMyBookings(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    await this.completeExpiredMemberships(userId, user.email);

    const deskBookings = await this.prisma.booking.findMany({
      where: {
        OR: [
          { userId },
          { customerEmail: user.email },
        ],
      },
      include: {
        pricingPlan: true,
        branch: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const meetingBookings = await this.prisma.meetingBooking.findMany({
      where: {
        OR: [
          { userId },
          { customerEmail: user.email },
        ],
      },
      include: {
        meetingRoom: true,
        branch: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      success: true,
      deskBookings,
      meetingBookings,
    };
  }

  // --- ADMIN USER MANAGEMENT METHODS ---

  async getAdminUsers(params: { search?: string; role?: string; page?: number; limit?: number }) {
    const { search, role, page = 1, limit = 50 } = params;

    const where: any = {};

    if (role && role !== 'all') {
      where.role = role === 'admin' ? Role.admin : Role.member;
    }

    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { name: { contains: q } },
        { email: { contains: q } },
        { phone: { contains: q } },
        { companyName: { contains: q } },
        { gstin: { contains: q } },
      ];
    }

    const skip = (page - 1) * limit;

    // Use _count aggregation to avoid N+1 queries for booking counts
    const [users, totalCount] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          companyName: true,
          gstin: true,
          role: true,
          walletBalance: true,
          deskCreditsBalance: true,
          meetingCreditsBalance: true,
          avatarUrl: true,
          bio: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              bookings: true,
              meetingBookings: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.user.count({ where }),
    ]);

    // Attach membership summary for each user
    const usersWithMembership = await Promise.all(
      users.map(async (u) => {
        const membershipBooking = await this.prisma.booking.findFirst({
          where: {
            bookingType: BookingType.membership_inquiry,
            status: BookingStatus.confirmed,
            paymentStatus: PaymentStatus.paid,
            OR: [{ userId: u.id }, { customerEmail: u.email }],
          },
          include: { pricingPlan: true },
          orderBy: { createdAt: 'desc' },
        });

        if (!membershipBooking) {
          return {
            ...u,
            walletBalance: Number(u.walletBalance),
            deskCreditsBalance: Number((u as any).deskCreditsBalance || 0),
            meetingCreditsBalance: Number((u as any).meetingCreditsBalance || 0),
            deskBookingsCount: u._count.bookings,
            meetingBookingsCount: u._count.meetingBookings,
            totalBookings: u._count.bookings + u._count.meetingBookings,
            membershipActive: false,
            membershipExpiresAt: null,
            membershipPlanName: null,
          };
        }

        const expiresAt = this.getMembershipEndDate(membershipBooking as any);
        const isActive = expiresAt.getTime() > Date.now();

        return {
          ...u,
          walletBalance: Number(u.walletBalance),
          deskCreditsBalance: Number((u as any).deskCreditsBalance || 0),
          meetingCreditsBalance: Number((u as any).meetingCreditsBalance || 0),
          deskBookingsCount: u._count.bookings,
          meetingBookingsCount: u._count.meetingBookings,
          totalBookings: u._count.bookings + u._count.meetingBookings,
          membershipActive: isActive,
          membershipExpiresAt: expiresAt,
          membershipPlanName: membershipBooking.pricingPlan?.name || null,
        };
      }),
    );

    // Aggregate summary stats
    const totalUsersCount = await this.prisma.user.count();
    const adminUsersCount = await this.prisma.user.count({ where: { role: Role.admin } });
    const memberUsersCount = totalUsersCount - adminUsersCount;

    const walletSumAggregate = await this.prisma.user.aggregate({
      _sum: { walletBalance: true },
    });

    const totalWalletBalance = Number(walletSumAggregate._sum.walletBalance || 0);

    const totalPages = Math.ceil(totalCount / limit);

    return {
      success: true,
      stats: {
        totalUsers: totalUsersCount,
        adminUsers: adminUsersCount,
        memberUsers: memberUsersCount,
        totalWalletBalance,
      },
      users: usersWithMembership,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }

  async getAdminUserDetail(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        companyName: true,
        gstin: true,
        role: true,
        walletBalance: true,
        deskCreditsBalance: true,
        meetingCreditsBalance: true,
        avatarUrl: true,
        bio: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.completeExpiredMemberships(userId, user.email);

    const deskBookings = await this.prisma.booking.findMany({
      where: {
        OR: [
          { userId },
          { customerEmail: user.email },
        ],
      },
      include: { pricingPlan: true },
      orderBy: { createdAt: 'desc' },
    });

    const meetingBookings = await this.prisma.meetingBooking.findMany({
      where: {
        OR: [
          { userId },
          { customerEmail: user.email },
        ],
      },
      include: { meetingRoom: true },
      orderBy: { createdAt: 'desc' },
    });

    const walletTransactions = await this.prisma.walletTransaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    const invoices = await this.prisma.invoice.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    // Membership summary for detailed user view
    const membershipBooking = await this.prisma.booking.findFirst({
      where: {
        bookingType: BookingType.membership_inquiry,
        status: BookingStatus.confirmed,
        paymentStatus: PaymentStatus.paid,
        OR: [{ userId }, { customerEmail: user.email }],
      },
      include: { pricingPlan: true },
      orderBy: { createdAt: 'desc' },
    });

    let membershipMeta = { membershipActive: false, membershipExpiresAt: null, membershipPlanName: null } as any;
    if (membershipBooking) {
      const expiresAt = this.getMembershipEndDate(membershipBooking as any);
      membershipMeta = {
        membershipActive: expiresAt.getTime() > Date.now(),
        membershipExpiresAt: expiresAt,
        membershipPlanName: membershipBooking.pricingPlan?.name || null,
      };
    }

    return {
      success: true,
      user: {
        ...user,
        walletBalance: Number(user.walletBalance),
        deskCreditsBalance: Number((user as any).deskCreditsBalance || 0),
        meetingCreditsBalance: Number((user as any).meetingCreditsBalance || 0),
        deskBookingsCount: deskBookings.length,
        meetingBookingsCount: meetingBookings.length,
        totalBookings: deskBookings.length + meetingBookings.length,
        ...membershipMeta,
      },
      deskBookings,
      meetingBookings,
      walletTransactions,
      invoices,
    };
  }

  async adjustUserWallet(userId: number, data: { amount: number; type: 'credit' | 'debit'; reason: string }) {
    // Input validation
    if (!data.amount || data.amount <= 0) {
      throw new BadRequestException('Adjustment amount must be greater than zero');
    }

    if (!data.reason || data.reason.trim().length === 0) {
      throw new BadRequestException('A reason for the adjustment is required');
    }

    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({ where: { id: userId } });
      if (!user) {
        throw new NotFoundException('User not found');
      }

      const currentBalance = Number(user.walletBalance || 0);
      const adjustAmount = Math.abs(Number(data.amount));

      let newBalance = currentBalance;
      if (data.type === 'credit') {
        newBalance = Number((currentBalance + adjustAmount).toFixed(2));
      } else {
        if (currentBalance < adjustAmount) {
          throw new BadRequestException(
            `Insufficient wallet balance to debit ₹${adjustAmount}. Current: ₹${currentBalance}`,
          );
        }
        newBalance = Number((currentBalance - adjustAmount).toFixed(2));
      }

      // Optimistic lock: only update if balance unchanged (prevents race conditions)
      const updateResult = await tx.user.update({
        where: {
          id: userId,
          walletBalance: currentBalance,
        },
        data: { walletBalance: newBalance },
      });

      if (!updateResult) {
        throw new ConflictException('Wallet balance was modified during processing. Please retry.');
      }

      // Create Wallet Transaction Log
      const transaction = await tx.walletTransaction.create({
        data: {
          userId,
          type: data.type === 'credit' ? 'admin_credit' : 'admin_debit',
          amount: adjustAmount,
          balanceAfter: newBalance,
          description: data.reason || `Admin Manual Wallet ${data.type === 'credit' ? 'Credit' : 'Debit'}`,
          referenceId: `ADM-ADJ-${Date.now()}`,
        },
      });

      return {
        success: true,
        message: `Successfully ${data.type === 'credit' ? 'credited' : 'debited'} ₹${adjustAmount} to ${user.name}'s wallet.`,
        walletBalance: newBalance,
        transaction,
      };
    });
  }

  async updateUserRole(userId: number, role: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const targetRole = role === 'admin' ? Role.admin : Role.member;

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: { role: targetRole },
    });

    return {
      success: true,
      message: `User role updated to ${targetRole}`,
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
      },
    };
  }
}
