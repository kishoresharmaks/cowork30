import { Controller, Post, Get, Body, Param, ParseIntPipe, UseGuards, Request, Res, UnauthorizedException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { WalletBillingService } from './wallet-billing.service';
import { InvoiceService } from './invoice.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import type { Response } from 'express';

import * as jwt from 'jsonwebtoken';

@ApiTags('Wallet & Billing')
@Controller('wallet')
export class PublicInvoiceController {
  constructor(
    private readonly invoiceService: InvoiceService,
    private readonly walletBillingService: WalletBillingService,
  ) {}

  @Get('invoices/:invoiceNumber/pdf')
  @ApiOperation({ summary: 'Public: Download & View GST Tax Invoice PDF Document' })
  async getInvoicePdfHtml(@Param('invoiceNumber') invoiceNumber: string, @Res() res: any) {
    const html = await this.invoiceService.getInvoiceHtml(invoiceNumber);
    res.setHeader('Content-Type', 'text/html');
    return res.send(html);
  }

  @Post('razorpay/create-order')
  @ApiOperation({ summary: 'Public & Member: Create online Razorpay payment order' })
  async createRazorpayOrderPublic(@Request() req: any, @Body() body: { amount: number; customerName?: string; customerEmail?: string }) {
    let userId: number | undefined = undefined;
    const authHeader = req.headers['authorization'] || req.headers['Authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const jwtToken = authHeader.split(' ')[1];
        const secret = process.env.JWT_SECRET;
        if (!secret) {
          throw new UnauthorizedException('Server misconfiguration');
        }
        const decoded: any = jwt.verify(jwtToken, secret);
        if (decoded && decoded.sub) {
          userId = Number(decoded.sub);
        }
      } catch (e) {}
    }

    return this.walletBillingService.createRazorpayOrder({
      userId,
      customerName: body.customerName,
      customerEmail: body.customerEmail,
      amount: Number(body.amount),
    });
  }
}

@ApiTags('Wallet & Billing')
@Controller('wallet')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class WalletBillingController {
  constructor(private readonly walletBillingService: WalletBillingService) {}

  @Post('request-topup')
  @ApiOperation({ summary: 'Member: Submit manual cash payment proof receipt for admin verification' })
  async requestManualTopUp(
    @Request() req: any,
    @Body()
    body: {
      amount: number;
      bonus?: number;
      paymentProofUrl: string;
      referenceNumber?: string;
      notes?: string;
    },
  ) {
    return this.walletBillingService.requestManualTopUp({
      userId: req.user.id,
      amount: Number(body.amount),
      bonus: Number(body.bonus || 0),
      paymentProofUrl: body.paymentProofUrl,
      referenceNumber: body.referenceNumber,
      notes: body.notes,
    });
  }

  @Get('my-topup-requests')
  @ApiOperation({ summary: 'Member: View history of submitted wallet topup proof requests' })
  async getMyTopupRequests(@Request() req: any) {
    const requests = await this.walletBillingService.getMyTopupRequests(req.user.id);
    return {
      success: true,
      requests,
    };
  }

  @Get('admin/pending-topups')
  @UseGuards(RolesGuard)
  @Roles('admin', 'staff')
  @ApiOperation({ summary: 'Admin/Staff: Get list of all pending wallet topup requests for proof verification' })
  async getPendingTopupRequests() {
    const requests = await this.walletBillingService.getPendingTopupRequests();
    return {
      success: true,
      requests,
    };
  }

  @Post('admin/topup-requests/:id/approve')
  @UseGuards(RolesGuard)
  @Roles('admin', 'staff')
  @ApiOperation({ summary: 'Admin/Staff: Approve member payment proof & credit wallet balance' })
  async approveTopupRequest(@Param('id', ParseIntPipe) id: number) {
    return this.walletBillingService.approveTopupRequest(id);
  }

  @Post('admin/topup-requests/:id/reject')
  @UseGuards(RolesGuard)
  @Roles('admin', 'staff')
  @ApiOperation({ summary: 'Admin/Staff: Reject member payment proof with reason' })
  async rejectTopupRequest(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { rejectionReason?: string },
  ) {
    return this.walletBillingService.rejectTopupRequest(id, body.rejectionReason);
  }

  @Post('top-up')
  @ApiOperation({ summary: 'Admin / Direct Credit Wallet Top-Up (Instant Admin Override)' })
  async topUpManual(
    @Request() req: any,
    @Body() body: { amount: number; bonus?: number; paymentMethod?: string; description?: string },
  ) {
    return this.walletBillingService.topUpManual({
      userId: req.user.id,
      amount: Number(body.amount),
      bonus: Number(body.bonus || 0),
      paymentMethod: body.paymentMethod,
      description: body.description,
    });
  }

  @Post('razorpay/create-order')
  @ApiOperation({ summary: 'Create online Razorpay order for wallet top-up' })
  async createRazorpayOrder(@Request() req: any, @Body() body: { amount: number }) {
    return this.walletBillingService.createRazorpayOrder({
      userId: req.user.id,
      amount: Number(body.amount),
    });
  }

  @Post('razorpay/verify-topup')
  @ApiOperation({ summary: 'Verify online Razorpay payment HMAC signature and credit wallet' })
  async verifyRazorpayTopUp(
    @Request() req: any,
    @Body()
    body: {
      amount: number;
      bonus?: number;
      razorpayOrderId: string;
      razorpayPaymentId: string;
      razorpaySignature: string;
    },
  ) {
    return this.walletBillingService.verifyRazorpayTopUp({
      userId: req.user.id,
      amount: Number(body.amount),
      bonus: Number(body.bonus || 0),
      razorpayOrderId: body.razorpayOrderId,
      razorpayPaymentId: body.razorpayPaymentId,
      razorpaySignature: body.razorpaySignature,
    });
  }

  @Post('pay-booking')
  @ApiOperation({ summary: 'Pay for desk or meeting room booking using wallet balance or booking credits' })
  async payBookingWithWallet(
    @Request() req: any,
    @Body()
    body: {
      amount: number;
      bookingType: 'meeting' | 'desk';
      bookingId: number;
      paymentMethod?: 'wallet' | 'credits';
      creditType?: 'desk' | 'meeting';
      creditsAmount?: number;
      description?: string;
    },
  ) {
    return this.walletBillingService.payBookingWithWallet({
      userId: req.user.id,
      amount: Number(body.amount),
      bookingType: body.bookingType,
      bookingId: Number(body.bookingId),
      paymentMethod: body.paymentMethod,
      creditType: body.creditType,
      creditsAmount: body.creditsAmount !== undefined ? Number(body.creditsAmount) : undefined,
      description: body.description,
    });
  }

  @Get('transactions')
  @ApiOperation({ summary: 'Get member credit & debit transaction history' })
  async getUserTransactions(@Request() req: any) {
    const transactions = await this.walletBillingService.getUserTransactions(req.user.id);
    return {
      success: true,
      transactions,
    };
  }

  @Get('invoices')
  @ApiOperation({ summary: 'Get member GST tax invoices' })
  async getUserInvoices(@Request() req: any) {
    const invoices = await this.walletBillingService.getUserInvoices(req.user.id);
    return {
      success: true,
      invoices,
    };
  }
}
