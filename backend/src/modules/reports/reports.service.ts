import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);

  constructor(private prisma: PrismaService) {}

  async getExecutiveSummary() {
    // Platform Users breakdown
    const users = await this.prisma.user.findMany({
      select: { id: true, role: true, walletBalance: true },
    });

    const totalUsers = users.length;
    const memberUsers = users.filter((u) => u.role === 'member').length;
    const staffUsers = users.filter((u) => u.role === 'staff').length;
    const adminUsers = users.filter((u) => u.role === 'admin').length;
    const totalWalletBalance = users.reduce((sum, u) => sum + Number(u.walletBalance || 0), 0);

    // Bookings breakdown
    const deskBookings = await this.prisma.booking.findMany({
      include: { pricingPlan: true },
    });

    const meetingBookings = await this.prisma.meetingBooking.findMany({
      include: { meetingRoom: true },
    });

    const totalDeskBookings = deskBookings.length;
    const totalMeetingBookings = meetingBookings.length;

    const deskRevenue = deskBookings.reduce((sum, b) => {
      const price = b.pricingPlan
        ? Number(b.pricingPlan.priceMonthly || b.pricingPlan.priceDaily || 0)
        : 0;
      return sum + price;
    }, 0);

    const pricingPlanRevenueMap = new Map<string, { planName: string; bookings: number; revenue: number }>();
    for (const booking of deskBookings) {
      const planName = booking.pricingPlan?.name || 'Unassigned Plan';
      const bookingRevenue = Number(booking.totalAmount || booking.pricingPlan?.priceMonthly || booking.pricingPlan?.priceDaily || 0);
      const current = pricingPlanRevenueMap.get(planName) || { planName, bookings: 0, revenue: 0 };
      current.bookings += 1;
      current.revenue += bookingRevenue;
      pricingPlanRevenueMap.set(planName, current);
    }

    const pricingPlanRevenue = Array.from(pricingPlanRevenueMap.values()).sort((a, b) => b.revenue - a.revenue);

    const meetingRevenue = meetingBookings.reduce(
      (sum, mb) => sum + Number(mb.totalAmount || 0),
      0,
    );

    const totalRevenue = deskRevenue + meetingRevenue;

    // Payments & Invoices summary
    const payments = await this.prisma.payment.findMany();
    const paidPayments = payments.filter((p) => p.status === 'paid');
    const totalPaymentsValue = paidPayments.reduce((sum, p) => sum + Number(p.amount), 0);

    // Manual Top-Up Requests summary
    const topupRequests = await (this.prisma as any).walletTopupRequest.findMany();
    const pendingTopups = topupRequests.filter((r: any) => r.status === 'pending').length;
    const approvedTopups = topupRequests.filter((r: any) => r.status === 'approved').length;

    // Recent 10 Transactions
    const recentTransactions = await this.prisma.walletTransaction.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { id: true, name: true, email: true } } },
    });

    return {
      success: true,
      metrics: {
        totalUsers,
        memberUsers,
        staffUsers,
        adminUsers,
        totalWalletBalance,
        totalDeskBookings,
        totalMeetingBookings,
        deskRevenue,
        meetingRevenue,
        totalRevenue,
        pricingPlanRevenue,
        totalPaymentsValue,
        pendingTopups,
        approvedTopups,
      },
      recentTransactions,
    };
  }

  async exportCsvData(type: 'bookings' | 'payments' | 'wallet') {
    if (type === 'payments') {
      const payments = await this.prisma.payment.findMany({
        include: { user: true },
        orderBy: { createdAt: 'desc' },
      });

      const header = 'ID,User Name,Email,Amount,Tax Amount,Payment Method,Status,Created At\n';
      const rows = payments
        .map(
          (p) =>
            `${p.id},"${p.user?.name || 'N/A'}","${p.user?.email || 'N/A'}",${p.amount},${p.taxAmount},"${p.paymentMethod}","${p.status}","${p.createdAt.toISOString()}"`,
        )
        .join('\n');

      return header + rows;
    }

    if (type === 'wallet') {
      const transactions = await this.prisma.walletTransaction.findMany({
        include: { user: true },
        orderBy: { createdAt: 'desc' },
      });

      const header = 'ID,User Name,Email,Type,Amount,Balance After,Description,Reference ID,Created At\n';
      const rows = transactions
        .map(
          (tx) =>
            `${tx.id},"${tx.user?.name || 'N/A'}","${tx.user?.email || 'N/A'}","${tx.type}",${tx.amount},${tx.balanceAfter},"${tx.description}","${tx.referenceId || ''}","${tx.createdAt.toISOString()}"`,
        )
        .join('\n');

      return header + rows;
    }

    // Default: Bookings
    const meetingBookings = await this.prisma.meetingBooking.findMany({
      include: { user: true, meetingRoom: true },
      orderBy: { createdAt: 'desc' },
    });

    const header = 'Booking Code,User Name,Email,Room Name,Date,Seats,Total Amount,Status,Created At\n';
    const rows = meetingBookings
      .map(
        (mb) =>
          `"${mb.bookingCode}","${mb.user?.name || mb.customerName}","${mb.user?.email || mb.customerEmail}","${mb.meetingRoom?.name}",${mb.bookingDate.toISOString().split('T')[0]},${mb.seatsBooked},${mb.totalAmount},"${mb.status}","${mb.createdAt.toISOString()}"`,
      )
      .join('\n');

    return header + rows;
  }
}
