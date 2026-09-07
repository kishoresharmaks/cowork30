import { Injectable, Logger, BadRequestException, NotFoundException, Optional, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { RazorpayService } from './razorpay.service';
import { InvoiceService } from './invoice.service';
import { PaymentMethod, PaymentStatus, BookingStatus, Prisma } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class WalletBillingService {
  private readonly logger = new Logger(WalletBillingService.name);

  constructor(
    private prisma: PrismaService,
    private razorpayService: RazorpayService,
    private invoiceService: InvoiceService,
    @Optional() private notificationsService?: NotificationsService,
  ) {}

  private async getTaxRate(): Promise<number> {
    const setting = await this.prisma.siteSetting.findUnique({ where: { key: 'tax_rate' } });
    const rate = setting && !isNaN(Number(setting.value)) ? Number(setting.value) : 0.18;
    return rate;
  }

  async requestManualTopUp(params: {
    userId: number;
    amount: number;
    bonus?: number;
    paymentProofUrl: string;
    referenceNumber?: string;
    notes?: string;
  }) {
    const { userId, amount, bonus, paymentProofUrl, referenceNumber, notes } = params;

    if (!amount || amount <= 0) {
      throw new BadRequestException('Top-up amount must be greater than zero');
    }

    if (!paymentProofUrl) {
      throw new BadRequestException('Payment receipt proof image URL is required');
    }

    const request = await (this.prisma as any).walletTopupRequest.create({
      data: {
        userId,
        amount,
        bonus: bonus || 0,
        paymentProofUrl,
        referenceNumber,
        notes,
        status: 'pending',
      },
    });

    this.logger.log(`User #${userId} submitted manual wallet top-up proof for ₹${amount} (Request #${request.id})`);
    return {
      success: true,
      message: 'Payment proof submitted successfully! Pending admin verification.',
      request,
    };
  }

  async getMyTopupRequests(userId: number) {
    return (this.prisma as any).walletTopupRequest.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getPendingTopupRequests() {
    return (this.prisma as any).walletTopupRequest.findMany({
      where: { status: 'pending' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            walletBalance: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async approveTopupRequest(requestId: number) {
    const req = await (this.prisma as any).walletTopupRequest.findUnique({
      where: { id: requestId },
    });

    if (!req) {
      throw new NotFoundException('Top-up request not found');
    }

    if (req.status !== 'pending') {
      throw new BadRequestException(`Request #${requestId} has already been processed (${req.status})`);
    }

    const topUpResult = await this.topUpManual({
      userId: req.userId,
      amount: Number(req.amount),
      bonus: Number(req.bonus || 0),
      paymentMethod: 'cash',
      description: `Manual Payment Verified by Admin (Ref: ${req.referenceNumber || 'N/A'})`,
    });

    // Update request status
    await (this.prisma as any).walletTopupRequest.update({
      where: { id: requestId },
      data: { status: 'approved' },
    });

    return {
      success: true,
      message: 'Top-up request approved and wallet credited successfully!',
      topUpResult,
    };
  }

  async rejectTopupRequest(requestId: number, rejectionReason?: string) {
    const req = await (this.prisma as any).walletTopupRequest.findUnique({
      where: { id: requestId },
    });

    if (!req) {
      throw new NotFoundException('Top-up request not found');
    }

    await (this.prisma as any).walletTopupRequest.update({
      where: { id: requestId },
      data: {
        status: 'rejected',
        rejectionReason: rejectionReason || 'Payment proof verification failed or invalid receipt',
      },
    });

    return {
      success: true,
      message: 'Top-up request rejected.',
    };
  }

  async topUpManual(params: {
    userId: number;
    amount: number;
    bonus?: number;
    paymentMethod?: string;
    description?: string;
  }) {
    const { userId, amount, paymentMethod, description } = params;
    const bonus = Number(params.bonus || 0);
    const totalCredit = amount + bonus;

    if (!amount || amount <= 0) {
      throw new BadRequestException('Top-up amount must be greater than zero');
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const previousBalance = Number(user.walletBalance || 0);
    const newBalance = Number((previousBalance + totalCredit).toFixed(2));

    // Update user wallet balance
    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: { walletBalance: newBalance },
    });

    // Create Wallet Transaction Log
    const transaction = await this.prisma.walletTransaction.create({
      data: {
        userId,
        type: 'credit_topup',
        amount: totalCredit,
        balanceAfter: newBalance,
        description: description || `Instant Wallet Top-Up (Paid ₹${amount.toLocaleString()}${bonus > 0 ? ` + ₹${bonus.toLocaleString()} Bonus` : ''})`,
        referenceId: `TX-TOPUP-${Date.now()}`,
      },
    });

    let mappedMethod: PaymentMethod = PaymentMethod.wallet;
    if (paymentMethod === 'razorpay') {
      mappedMethod = PaymentMethod.razorpay;
    } else if (paymentMethod === 'cash' || paymentMethod === 'manual' || paymentMethod === 'manual_cash') {
      mappedMethod = PaymentMethod.cash;
    } else if (paymentMethod === 'credits') {
      mappedMethod = PaymentMethod.credits;
    }

    // Create Payment Record (Wallet Topups are 0% Tax Stored Value Deposits)
    const payment = await this.prisma.payment.create({
      data: {
        userId,
        amount,
        taxAmount: 0,
        paymentMethod: mappedMethod,
        status: PaymentStatus.paid,
        rawResponse: { type: 'manual_topup', timestamp: new Date().toISOString() },
      },
    });

    // Generate Invoice (0% tax for wallet topup)
    const invoice = await this.invoiceService.generateInvoice({
      paymentId: payment.id,
      userId,
      customerName: user.name,
      customerGstin: user.gstin || undefined,
      companyName: user.companyName || undefined,
      subtotal: amount,
      taxAmount: 0,
      isTaxable: false,
    });

    if (this.notificationsService) {
      this.notificationsService.create({
        userId: params.userId,
        title: 'Wallet Recharge Ready',
        message: `Use instant 1-click booking with your ₹${totalCredit} wallet credits.`,
        type: 'wallet',
        link: '/dashboard?tab=wallet',
      }).catch(() => {});
    }

    return {
      success: true,
      message: `Successfully topped up ₹${totalCredit} to wallet balance`,
      walletBalance: newBalance,
      transaction,
      payment,
      invoice,
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        walletBalance: updatedUser.walletBalance,
      },
    };
  }

  async createRazorpayOrder(params: { userId?: number; customerName?: string; customerEmail?: string; amount: number }) {
    const { userId, amount, customerName, customerEmail } = params;
    if (!amount || amount <= 0) {
      throw new BadRequestException('Order amount must be greater than zero');
    }

    let email = customerEmail || 'guest@cowork30.com';
    let name = customerName || 'Guest Visitor';

    if (userId) {
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      if (user) {
        email = user.email;
        name = user.name;
      }
    }

    const receipt = `RCPT-${Date.now().toString(36).toUpperCase()}`;
    const razorpayOrder = await this.razorpayService.createOrder({
      amount,
      currency: 'INR',
      receipt,
      notes: {
        userId: userId || 'guest',
        customerEmail: email,
        customerName: name,
        purpose: 'razorpay_checkout',
      },
    });

    return {
      success: true,
      orderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      amountInRupees: amount,
      currency: razorpayOrder.currency,
      keyId: this.razorpayService.getKeyId(),
      receipt: razorpayOrder.receipt,
    };
  }

  async verifyRazorpayTopUp(params: {
    userId: number;
    amount: number;
    bonus?: number;
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
  }) {
    const { userId, amount, razorpayOrderId, razorpayPaymentId, razorpaySignature } = params;
    const bonus = Number(params.bonus || 0);
    const totalCredit = amount + bonus;

    // Check for duplicate payment using transaction-level row lock to prevent race conditions
    const existingPayment = await this.prisma.$queryRaw`
      SELECT id FROM payments
      WHERE razorpay_payment_id = ${razorpayPaymentId}
      AND status = 'paid'
      FOR UPDATE
      LIMIT 1
    `;

    if (existingPayment && Array.isArray(existingPayment) && existingPayment.length > 0) {
      throw new ConflictException(`Payment ${razorpayPaymentId} has already been processed`);
    }

    const isValid = this.razorpayService.verifyPaymentSignature({
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    });

    if (!isValid) {
      throw new BadRequestException('Invalid Razorpay payment signature verification failed');
    }

    // Use transaction with row-level locking to prevent race conditions on wallet balance
    const result = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, email: true, walletBalance: true, gstin: true, companyName: true }
      });
      if (!user) {
        throw new NotFoundException('User not found');
      }

      const previousBalance = Number(user.walletBalance || 0);
      const newBalance = Number((previousBalance + totalCredit).toFixed(2));

      // Lock the user row and update with CAS-like pattern
      const updateResult = await tx.user.update({
        where: {
          id: userId,
          walletBalance: previousBalance,  // Optimistic lock: only update if balance unchanged
        },
        data: { walletBalance: newBalance },
        select: { id: true, walletBalance: true },
      });

      if (!updateResult) {
        throw new ConflictException('Wallet balance was modified during processing. Please retry.');
      }

      // Create Wallet Transaction Log
      const transaction = await tx.walletTransaction.create({
        data: {
          userId,
          type: 'credit_topup',
          amount: totalCredit,
          balanceAfter: newBalance,
          description: `Online Razorpay Wallet Top-Up (Paid ₹${amount.toLocaleString()}${bonus > 0 ? ` + ₹${bonus.toLocaleString()} Bonus` : ''} - #${razorpayPaymentId})`,
          referenceId: razorpayPaymentId,
        },
      });

      // Create Payment Record
      const payment = await tx.payment.create({
        data: {
          userId,
          razorpayOrderId,
          razorpayPaymentId,
          razorpaySignature,
          amount,
          taxAmount: 0,
          paymentMethod: PaymentMethod.razorpay,
          status: PaymentStatus.paid,
          rawResponse: { razorpayOrderId, razorpayPaymentId, timestamp: new Date().toISOString() },
        },
      });

      // Generate Invoice
      const invoice = await this.invoiceService.generateInvoice({
        paymentId: payment.id,
        userId,
        customerName: user.name,
        customerGstin: user.gstin || undefined,
        companyName: user.companyName || undefined,
        subtotal: amount,
        taxAmount: 0,
        isTaxable: false,
      });

      return {
        user: { ...user, walletBalance: newBalance },
        transaction,
        payment,
        invoice,
      };
    });

    if (this.notificationsService) {
      this.notificationsService.create({
        userId,
        title: 'Wallet Recharge Ready',
        message: `Use instant 1-click booking with your ₹${totalCredit} wallet credits.`,
        type: 'wallet',
        link: '/dashboard?tab=wallet',
      }).catch(() => {});
    }

    return {
      success: true,
      message: `Razorpay Online Payment verified! ₹${totalCredit} credited to wallet.`,
      walletBalance: result.user.walletBalance,
      transaction: result.transaction,
      payment: result.payment,
      invoice: result.invoice,
    };
  }

  async payBookingWithWallet(params: {
    userId: number;
    amount: number;
    bookingType: 'meeting' | 'desk';
    bookingId: number;
    paymentMethod?: 'wallet' | 'credits';
    creditType?: 'desk' | 'meeting';
    creditsAmount?: number;
    description?: string;
  }) {
    const { userId, amount, bookingType, bookingId, paymentMethod = 'wallet', creditType, creditsAmount } = params;

    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, email: true, walletBalance: true, deskCreditsBalance: true, meetingCreditsBalance: true }
      });
      if (!user) {
        throw new NotFoundException('User not found');
      }

      if (paymentMethod === 'credits') {
        const field = creditType === 'meeting' ? 'meetingCreditsBalance' : 'deskCreditsBalance';
        const currentCredits = Number((user as any)[field] || 0);
        const reqCredits = creditsAmount || 1;

        if (currentCredits < reqCredits) {
          throw new BadRequestException(`Insufficient ${creditType || 'desk'} credits. Available: ${currentCredits}, required: ${reqCredits}`);
        }

        const newCreditBal = Number((currentCredits - reqCredits).toFixed(2));
        const updateResult = await tx.user.update({
          where: {
            id: userId,
            [field]: currentCredits,  // Optimistic lock: only update if balance unchanged
          },
          data: { [field]: newCreditBal } as any,
        });

        if (!updateResult) {
          throw new ConflictException('Credit balance was modified during processing. Please retry.');
        }

        const transaction = await tx.walletTransaction.create({
          data: {
            userId,
            type: 'debit_booking',
            amount: 0,
            balanceAfter: Number(user.walletBalance || 0),
            description: params.description || `Redeemed ${reqCredits} ${creditType || 'desk'} credit(s) for ${bookingType} reservation #${bookingId}`,
            referenceId: `REF-${bookingType.toUpperCase()}-${bookingId}`,
          },
        });

        const payment = await tx.payment.create({
          data: {
            userId,
            amount: 0,
            taxAmount: 0,
            paymentMethod: PaymentMethod.credits,
            status: PaymentStatus.paid,
            ...(bookingType === 'meeting' ? { meetingBookingId: bookingId } : { bookingId }),
          },
        });

        return {
          success: true,
          walletBalance: Number(user.walletBalance || 0),
          deskCreditsBalance: creditType === 'desk' ? newCreditBal : Number((user as any).deskCreditsBalance || 0),
          meetingCreditsBalance: creditType === 'meeting' ? newCreditBal : Number((user as any).meetingCreditsBalance || 0),
          transaction,
          payment,
        };
      }

      const currentBalance = Number(user.walletBalance || 0);
      if (currentBalance < amount) {
        throw new BadRequestException(`Insufficient wallet balance. Available: ₹${currentBalance}, required: ₹${amount}`);
      }

      const newBalance = Number((currentBalance - amount).toFixed(2));

      // Optimistic lock: only update if balance unchanged since read
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

      const transaction = await tx.walletTransaction.create({
        data: {
          userId,
          type: 'debit_booking',
          amount: amount,
          balanceAfter: newBalance,
          description: params.description || `Wallet Debit for ${bookingType} reservation #${bookingId}`,
          referenceId: `REF-${bookingType.toUpperCase()}-${bookingId}`,
        },
      });

      const taxRate = await this.getTaxRate();
      if (bookingType === 'desk') {
        await tx.booking.update({
          where: { id: bookingId },
          data: { status: BookingStatus.confirmed, paymentStatus: PaymentStatus.paid },
        });
      } else {
        await tx.meetingBooking.update({
          where: { id: bookingId },
          data: { status: BookingStatus.confirmed, paymentStatus: PaymentStatus.paid },
        });
      }

      const payment = await tx.payment.create({
        data: {
          userId,
          amount,
          taxAmount: Number((amount * taxRate).toFixed(2)),
          paymentMethod: PaymentMethod.wallet,
          status: PaymentStatus.paid,
          ...(bookingType === 'meeting' ? { meetingBookingId: bookingId } : { bookingId }),
        },
      });

      return {
        success: true,
        walletBalance: newBalance,
        deskCreditsBalance: Number((user as any).deskCreditsBalance || 0),
        meetingCreditsBalance: Number((user as any).meetingCreditsBalance || 0),
        transaction,
        payment,
      };
    });
  }

  async getUserTransactions(userId: number) {
    return this.prisma.walletTransaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
  }

  async getUserInvoices(userId: number) {
    const rawInvoices = await this.prisma.invoice.findMany({
      where: { userId },
      include: { payment: true },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    const taxRate = await this.getTaxRate();

    return rawInvoices.map((inv) => {
      const isTopup = !inv.payment?.bookingId && !inv.payment?.meetingBookingId;

      if (isTopup) {
        const paidAmount = Number(inv.payment?.amount || inv.totalAmount || 0);
        return {
          ...inv,
          subtotal: paidAmount,
          cgst: 0,
          sgst: 0,
          igst: 0,
          totalAmount: paidAmount,
        };
      }

      const grandTotalNum = Number(inv.payment?.amount || inv.totalAmount || 0);
      const netSubtotal = Number((grandTotalNum / (1 + taxRate)).toFixed(2));
      const totalTax = Number((grandTotalNum - netSubtotal).toFixed(2));
      const halfTax = Number((totalTax / 2).toFixed(2));

      return {
        ...inv,
        subtotal: netSubtotal,
        cgst: halfTax,
        sgst: halfTax,
        igst: 0,
        totalAmount: grandTotalNum,
      };
    });
  }
}
