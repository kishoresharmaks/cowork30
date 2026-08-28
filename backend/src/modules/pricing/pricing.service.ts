import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { CreateTourBookingDto } from './dto/tour-booking.dto';
import { CreatePricingPlanDto, UpdatePricingPlanDto } from './dto/pricing-plan.dto';
import { PricingQuoteDto } from './dto/pricing-quote.dto';
import { BookingType, BookingStatus, PaymentMethod, PaymentStatus } from '@prisma/client';
import { RazorpayService } from '../wallet-billing/razorpay.service';

@Injectable()
export class PricingService {
  constructor(
    private prisma: PrismaService,
    private razorpayService: RazorpayService,
  ) {}

  private normalizeSlug(value: string) {
    return value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
  }

  private normalizeFeatures(featuresList?: string[]) {
    if (!featuresList?.length) {
      return undefined;
    }

    return featuresList.map((featureText, index) => ({
      featureText,
      isIncluded: true,
      sortOrder: index + 1,
    }));
  }

  private roundCurrency(value: number) {
    return Math.round((value + Number.EPSILON) * 100) / 100;
  }

  private resolvePlanBillingPrice(plan: { priceMonthly: any; priceDaily: any }, billingPeriod?: string) {
    const normalizedPeriod = (billingPeriod || 'Monthly').toLowerCase();
    if (normalizedPeriod === 'daily') {
      return Number(plan.priceDaily || 0) || Number(plan.priceMonthly || 0);
    }

    return Number(plan.priceMonthly || 0);
  }

  private resolveBookingType(bookingType?: string) {
    if (bookingType === 'tour') {
      return BookingType.tour;
    }

    if (bookingType === 'membership_inquiry') {
      return BookingType.membership_inquiry;
    }

    return BookingType.direct_booking;
  }

  private resolveBookingStatus(status?: string, fallback?: BookingStatus) {
    if (status === BookingStatus.unpaid) return BookingStatus.unpaid;
    if (status === BookingStatus.pending) return BookingStatus.pending;
    if (status === BookingStatus.confirmed) return BookingStatus.confirmed;
    if (status === BookingStatus.cancelled) return BookingStatus.cancelled;
    if (status === BookingStatus.completed) return BookingStatus.completed;
    if (status === BookingStatus.not_checked_in) return BookingStatus.not_checked_in;

    return fallback || BookingStatus.unpaid;
  }

  private resolvePaymentStatus(status?: string, fallback?: PaymentStatus) {
    if (status === PaymentStatus.unpaid) return PaymentStatus.unpaid;
    if (status === PaymentStatus.pending) return PaymentStatus.pending;
    if (status === PaymentStatus.paid) return PaymentStatus.paid;
    if (status === PaymentStatus.failed) return PaymentStatus.failed;
    if (status === PaymentStatus.refunded) return PaymentStatus.refunded;

    return fallback || PaymentStatus.unpaid;
  }

  private resolveDefaultStatus(bookingType: BookingType) {
    return BookingStatus.pending;
  }

  private resolveDefaultPaymentStatus(bookingType: BookingType) {
    return PaymentStatus.paid;
  }

  private getMembershipEndDate(booking: { createdAt: Date; preferredTimeSlot?: string | null }) {
    const endDate = new Date(booking.createdAt);
    if ((booking.preferredTimeSlot || '').toLowerCase().includes('daily')) {
      endDate.setDate(endDate.getDate() + 1);
    } else {
      endDate.setMonth(endDate.getMonth() + 1);
    }
    return endDate;
  }

  private async completeExpiredMemberships(userId: number, email: string) {
    const memberships = await this.prisma.booking.findMany({
      where: {
        bookingType: BookingType.membership_inquiry,
        status: BookingStatus.confirmed,
        paymentStatus: PaymentStatus.paid,
        OR: [{ userId }, { customerEmail: email }],
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

  async findAllPlans(includeInactive = false) {
    return this.prisma.pricingPlan.findMany({
      where: includeInactive ? {} : { isActive: true },
      include: {
        features: {
          orderBy: { sortOrder: 'asc' },
        },
      },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async findPlanBySlug(slug: string, includeInactive = false) {
    const plan = await this.prisma.pricingPlan.findFirst({
      where: {
        slug,
        ...(includeInactive ? {} : { isActive: true }),
      },
      include: {
        features: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    if (!plan) {
      throw new NotFoundException('Pricing plan not found');
    }

    return {
      success: true,
      plan,
    };
  }

  async createPlan(data: CreatePricingPlanDto) {
    const slug = data.slug || this.normalizeSlug(data.name);

    const plan = await this.prisma.pricingPlan.create({
      data: {
        name: data.name,
        slug,
        tagline: data.tagline || null,
        priceMonthly: Number(data.priceMonthly),
        priceDaily: Number(data.priceDaily || 0),
        billingPeriod: data.billingPeriod || 'Monthly',
        meetingCreditsIncluded: Number(data.meetingCreditsIncluded || 0),
        deskCreditsIncluded: Number(data.deskCreditsIncluded || 0),
        isPopular: Boolean(data.isPopular ?? false),
        sortOrder: Number(data.sortOrder || 0),
        isActive: Boolean(data.isActive ?? true),
        features: this.normalizeFeatures(data.featuresList)
          ? {
              create: this.normalizeFeatures(data.featuresList),
            }
          : undefined,
      },
      include: {
        features: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    return {
      success: true,
      plan,
    };
  }

  async updatePlan(id: number, data: UpdatePricingPlanDto) {
    const existing = await this.prisma.pricingPlan.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Pricing plan not found');
    }

    const nextSlug = data.slug || (data.name ? this.normalizeSlug(data.name) : existing.slug);
    const featuresList = data.featuresList ? this.normalizeFeatures(data.featuresList) : undefined;

    const updated = await this.prisma.$transaction(async (tx) => {
      const plan = await tx.pricingPlan.update({
        where: { id },
        data: {
          ...(data.name ? { name: data.name } : {}),
          ...(data.slug || data.name ? { slug: nextSlug } : {}),
          ...(data.tagline !== undefined ? { tagline: data.tagline || null } : {}),
          ...(data.priceMonthly !== undefined ? { priceMonthly: Number(data.priceMonthly) } : {}),
          ...(data.priceDaily !== undefined ? { priceDaily: Number(data.priceDaily) } : {}),
          ...(data.billingPeriod !== undefined ? { billingPeriod: data.billingPeriod } : {}),
          ...(data.meetingCreditsIncluded !== undefined ? { meetingCreditsIncluded: Number(data.meetingCreditsIncluded) } : {}),
          ...(data.deskCreditsIncluded !== undefined ? { deskCreditsIncluded: Number(data.deskCreditsIncluded) } : {}),
          ...(data.isPopular !== undefined ? { isPopular: Boolean(data.isPopular) } : {}),
          ...(data.sortOrder !== undefined ? { sortOrder: Number(data.sortOrder) } : {}),
          ...(data.isActive !== undefined ? { isActive: Boolean(data.isActive) } : {}),
        },
      });

      if (featuresList) {
        await tx.pricingFeature.deleteMany({ where: { pricingPlanId: id } });
        await tx.pricingFeature.createMany({
          data: featuresList.map((feature) => ({
            pricingPlanId: id,
            featureText: feature.featureText,
            isIncluded: feature.isIncluded,
            sortOrder: feature.sortOrder,
          })),
        });
      }

      return tx.pricingPlan.findUnique({
        where: { id: plan.id },
        include: {
          features: {
            orderBy: { sortOrder: 'asc' },
          },
        },
      });
    });

    return {
      success: true,
      plan: updated,
    };
  }

  async deletePlan(id: number) {
    const existing = await this.prisma.pricingPlan.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Pricing plan not found');
    }

    await this.prisma.pricingPlan.delete({ where: { id } });
    return {
      success: true,
      message: 'Pricing plan deleted successfully',
    };
  }

  async calculateQuote(dto: PricingQuoteDto) {
    const plan = await this.prisma.pricingPlan.findUnique({
      where: { id: dto.pricingPlanId },
      include: {
        features: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    if (!plan) {
      throw new NotFoundException('Pricing plan not found');
    }

    const quantity = Number(dto.quantity || 1);
    const billingPeriod = dto.billingPeriod || plan.billingPeriod || 'Monthly';
    const baseAmount = this.resolvePlanBillingPrice(plan, billingPeriod) * quantity;
    const addons = Number(dto.addonAmount || 0);
    const subtotal = baseAmount + addons;
    const siteSetting = await this.prisma.siteSetting.findUnique({ where: { key: 'tax_rate' } });
    const defaultTaxRate = siteSetting && !isNaN(Number(siteSetting.value)) ? Number(siteSetting.value) : 0.18;
    const taxRate = Number(dto.taxRate ?? defaultTaxRate);
    const taxAmount = this.roundCurrency(subtotal * taxRate);
    const totalAmount = this.roundCurrency(subtotal + taxAmount);

    return {
      success: true,
      quote: {
        plan,
        billingPeriod,
        quantity,
        baseAmount: this.roundCurrency(baseAmount),
        addonAmount: this.roundCurrency(addons),
        subtotal: this.roundCurrency(subtotal),
        taxRate,
        taxAmount,
        totalAmount,
        includedMeetingCredits: Number(plan.meetingCreditsIncluded || 0) * quantity,
        includedDeskCredits: Number(plan.deskCreditsIncluded || 0) * quantity,
      },
    };
  }

  async createTourBooking(dto: CreateTourBookingDto) {
    const plan = dto.pricingPlanId
      ? await this.prisma.pricingPlan.findUnique({ where: { id: dto.pricingPlanId } })
      : await this.prisma.pricingPlan.findFirst({
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
        });

    if (!plan) {
      throw new NotFoundException('Pricing plan not found');
    }

    const branch = dto.branchId
      ? await this.prisma.branch.findUnique({ where: { id: dto.branchId } })
      : await this.prisma.branch.findFirst();

    if (!branch) {
      throw new NotFoundException('Branch not found');
    }

    const bookingCode = `BK-${Date.now().toString(36).toUpperCase()}`;
    const validBookingType = this.resolveBookingType(dto.bookingType);
    const defaultStatus = this.resolveDefaultStatus(validBookingType);
    const defaultPaymentStatus = this.resolveDefaultPaymentStatus(validBookingType);

    const siteSettingForTax = await this.prisma.siteSetting.findUnique({ where: { key: 'tax_rate' } });
    const taxRate = siteSettingForTax && !isNaN(Number(siteSettingForTax.value)) ? Number(siteSettingForTax.value) : 0.18;

    const booking = await this.prisma.booking.create({
      data: {
        bookingCode,
        branchId: branch.id,
        pricingPlanId: plan.id,
        userId: dto.userId ? Number(dto.userId) : null,
        customerName: dto.customerName,
        customerEmail: dto.customerEmail,
        customerPhone: dto.customerPhone,
        companyName: dto.companyName,
        gstin: dto.gstin,
        preferredDate: new Date(dto.preferredDate),
        preferredTimeSlot: dto.preferredTimeSlot || 'Full Day Access',
        bookingType: validBookingType,
        notes: dto.notes,
        status: this.resolveBookingStatus(dto.status, defaultStatus),
        paymentStatus: this.resolvePaymentStatus(dto.paymentStatus, defaultPaymentStatus),
        totalAmount: dto.totalAmount ? Number(dto.totalAmount) : Number(plan.priceMonthly || plan.priceDaily || 0),
        taxAmount: dto.totalAmount ? this.roundCurrency(Number(dto.totalAmount) * taxRate) : 0,
      },
      include: {
        pricingPlan: true,
        branch: true,
      },
    });

    return {
      success: true,
      message: 'Desk / Solution booking submitted successfully',
      booking,
    };
  }

  async subscribeToPlan(planId: number, userId: number, data: { billingPeriod?: string; paymentMethod?: string; razorpayOrderId?: string; razorpayPaymentId?: string; razorpaySignature?: string }) {
    const plan = await this.prisma.pricingPlan.findUnique({ where: { id: planId } });
    if (!plan || !plan.isActive) {
      throw new NotFoundException('Pricing plan not found');
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.completeExpiredMemberships(user.id, user.email);
    const activeMembership = await this.prisma.booking.findFirst({
      where: {
        bookingType: BookingType.membership_inquiry,
        status: BookingStatus.confirmed,
        paymentStatus: PaymentStatus.paid,
        OR: [{ userId: user.id }, { customerEmail: user.email }],
      },
      include: { pricingPlan: true },
      orderBy: { createdAt: 'desc' },
    });

    // If there is an active membership, allow upgrade but prevent downgrade
    if (activeMembership) {
      const currentPlan = activeMembership.pricingPlan;
      const requestedBilling = data.billingPeriod || plan.billingPeriod || 'Monthly';
      const currentBilling = activeMembership.preferredTimeSlot?.includes('Daily') ? 'Daily' : 'Monthly';
      const currentPrice = this.resolvePlanBillingPrice(currentPlan, currentBilling);
      const requestedPrice = this.resolvePlanBillingPrice(plan, requestedBilling);

      if (requestedPrice < currentPrice) {
        const endDate = this.getMembershipEndDate(activeMembership);
        throw new BadRequestException(
          `Downgrades are not allowed. Current membership (${currentPlan?.name}) is active until ${endDate.toLocaleDateString('en-IN')}.`
        );
      }

      // If upgrading, mark previous membership completed so only one active exists
      await this.prisma.booking.updateMany({
        where: { id: activeMembership.id },
        data: { status: BookingStatus.completed },
      });
    }

    const branch = await this.prisma.branch.findFirst();
    if (!branch) {
      throw new NotFoundException('Branch not found');
    }

    const billingPeriod = data.billingPeriod || plan.billingPeriod || 'Monthly';
    const subtotal = this.resolvePlanBillingPrice(plan, billingPeriod);
    const siteSetting = await this.prisma.siteSetting.findUnique({ where: { key: 'tax_rate' } });
    const taxRate = siteSetting && !isNaN(Number(siteSetting.value)) ? Number(siteSetting.value) : 0.18;
    const taxAmount = this.roundCurrency(subtotal * taxRate);
    const totalAmount = this.roundCurrency(subtotal + taxAmount);
    const paymentMethod = data.paymentMethod === 'wallet' ? PaymentMethod.wallet : PaymentMethod.razorpay;

    if (paymentMethod === PaymentMethod.razorpay) {
      if (!data.razorpaySignature || data.razorpaySignature.startsWith('sig_demo_')) {
        throw new BadRequestException('Real Razorpay payment is required for membership subscription.');
      }

      const isValid = this.razorpayService.verifyPaymentSignature({
        razorpayOrderId: data.razorpayOrderId || '',
        razorpayPaymentId: data.razorpayPaymentId || '',
        razorpaySignature: data.razorpaySignature || '',
      });

      if (!isValid) {
        throw new BadRequestException('Razorpay payment verification failed. Subscription was not activated.');
      }
    }

    return this.prisma.$transaction(async (tx) => {
      if (paymentMethod === PaymentMethod.wallet) {
        const walletBalance = Number(user.walletBalance || 0);
        if (walletBalance < totalAmount) {
          throw new BadRequestException(`Insufficient wallet balance. Required: ₹${totalAmount}, Available: ₹${walletBalance}.`);
        }
      }

      const updatedUser = await tx.user.update({
        where: { id: user.id },
        data: {
          walletBalance: paymentMethod === PaymentMethod.wallet ? Number((Number(user.walletBalance || 0) - totalAmount).toFixed(2)) : user.walletBalance,
          meetingCreditsBalance: Number((Number((user as any).meetingCreditsBalance || 0) + Number(plan.meetingCreditsIncluded || 0)).toFixed(2)),
          deskCreditsBalance: Number((Number((user as any).deskCreditsBalance || 0) + Number(plan.deskCreditsIncluded || 0)).toFixed(2)),
        },
      });

      const booking = await tx.booking.create({
        data: {
          bookingCode: `SUB-${Date.now().toString(36).toUpperCase()}`,
          branchId: branch.id,
          pricingPlanId: plan.id,
          userId: user.id,
          customerName: user.name,
          customerEmail: user.email,
          customerPhone: user.phone || 'N/A',
          companyName: user.companyName,
          gstin: user.gstin,
          preferredDate: new Date(),
          preferredTimeSlot: `${billingPeriod} Membership`,
          bookingType: BookingType.membership_inquiry,
          notes: `Membership subscribed: ${plan.name}`,
          status: BookingStatus.confirmed,
          paymentStatus: PaymentStatus.paid,
          totalAmount,
          taxAmount,
        },
        include: { pricingPlan: true },
      });

      const payment = await tx.payment.create({
        data: {
          bookingId: booking.id,
          userId: user.id,
          amount: totalAmount,
          taxAmount,
          paymentMethod,
          status: PaymentStatus.paid,
          razorpayOrderId: data.razorpayOrderId || null,
          razorpayPaymentId: data.razorpayPaymentId || null,
          razorpaySignature: data.razorpaySignature || null,
        },
      });

      await tx.walletTransaction.create({
        data: {
          userId: user.id,
          type: 'membership_subscription',
          amount: totalAmount,
          balanceAfter: Number(updatedUser.walletBalance || 0),
          description: `Subscribed to ${plan.name}: +${plan.meetingCreditsIncluded} meeting credits, +${plan.deskCreditsIncluded} desk credits`,
          referenceId: `SUB-${booking.id}`,
        },
      });

      return {
        success: true,
        message: `${plan.name} subscription activated.`,
        booking,
        payment,
        user: {
          ...updatedUser,
          walletBalance: Number(updatedUser.walletBalance || 0),
          meetingCreditsBalance: Number((updatedUser as any).meetingCreditsBalance || 0),
          deskCreditsBalance: Number((updatedUser as any).deskCreditsBalance || 0),
        },
      };
    });
  }

  async assignPlanToUser(planId: number, userId: number, data: { waivePayment?: boolean; billingPeriod?: string }) {
    const plan = await this.prisma.pricingPlan.findUnique({ where: { id: planId } });
    if (!plan) throw new NotFoundException('Pricing plan not found');

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    await this.completeExpiredMemberships(user.id, user.email);

    const activeMembership = await this.prisma.booking.findFirst({
      where: {
        bookingType: BookingType.membership_inquiry,
        status: BookingStatus.confirmed,
        paymentStatus: PaymentStatus.paid,
        OR: [{ userId: user.id }, { customerEmail: user.email }],
      },
      orderBy: { createdAt: 'desc' },
    });

    if (activeMembership) {
      await this.prisma.booking.updateMany({ where: { id: activeMembership.id }, data: { status: BookingStatus.completed } });
    }

    const branch = await this.prisma.branch.findFirst();
    if (!branch) throw new NotFoundException('Branch not found');

    const billingPeriod = data.billingPeriod || plan.billingPeriod || 'Monthly';
    const subtotal = this.resolvePlanBillingPrice(plan, billingPeriod);
    const siteSetting2 = await this.prisma.siteSetting.findUnique({ where: { key: 'tax_rate' } });
    const taxRate2 = siteSetting2 && !isNaN(Number(siteSetting2.value)) ? Number(siteSetting2.value) : 0.18;
    const taxAmount = this.roundCurrency(subtotal * taxRate2);
    const totalAmount = data.waivePayment ? 0 : this.roundCurrency(subtotal + taxAmount);

    return this.prisma.$transaction(async (tx) => {
      const updatedUser = await tx.user.update({
        where: { id: user.id },
        data: {
          meetingCreditsBalance: Number((Number((user as any).meetingCreditsBalance || 0) + Number(plan.meetingCreditsIncluded || 0)).toFixed(2)),
          deskCreditsBalance: Number((Number((user as any).deskCreditsBalance || 0) + Number(plan.deskCreditsIncluded || 0)).toFixed(2)),
        },
      });

      const booking = await tx.booking.create({
        data: {
          bookingCode: `ADM-SUB-${Date.now().toString(36).toUpperCase()}`,
          branchId: branch.id,
          pricingPlanId: plan.id,
          userId: user.id,
          customerName: user.name,
          customerEmail: user.email,
          customerPhone: user.phone || 'N/A',
          companyName: user.companyName,
          gstin: user.gstin,
          preferredDate: new Date(),
          preferredTimeSlot: `${billingPeriod} Membership`,
          bookingType: BookingType.membership_inquiry,
          notes: `Admin assigned plan: ${plan.name}`,
          status: BookingStatus.confirmed,
          paymentStatus: PaymentStatus.paid,
          totalAmount,
          taxAmount,
        },
        include: { pricingPlan: true },
      });

      if (!data.waivePayment) {
        await tx.payment.create({
          data: {
            bookingId: booking.id,
            userId: user.id,
            amount: totalAmount,
            taxAmount,
            paymentMethod: PaymentMethod.razorpay,
            status: PaymentStatus.paid,
          },
        });
      }

      await tx.walletTransaction.create({
        data: {
          userId: user.id,
          type: 'membership_subscription_admin',
          amount: totalAmount,
          balanceAfter: Number(updatedUser.walletBalance || 0),
          description: `Admin assigned ${plan.name}`,
          referenceId: `ADM-SUB-${booking.id}`,
        },
      });

      return {
        success: true,
        message: `Plan ${plan.name} assigned to ${user.email}`,
        booking,
        user: {
          ...updatedUser,
          walletBalance: Number(updatedUser.walletBalance || 0),
          meetingCreditsBalance: Number((updatedUser as any).meetingCreditsBalance || 0),
          deskCreditsBalance: Number((updatedUser as any).deskCreditsBalance || 0),
        },
      };
    });
  }
}
