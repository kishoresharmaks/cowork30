import { Module } from '@nestjs/common';
import { WalletBillingController, PublicInvoiceController } from './wallet-billing.controller';
import { WalletBillingService } from './wallet-billing.service';
import { RazorpayService } from './razorpay.service';
import { InvoiceService } from './invoice.service';

@Module({
  controllers: [WalletBillingController, PublicInvoiceController],
  providers: [WalletBillingService, RazorpayService, InvoiceService],
  exports: [WalletBillingService, RazorpayService, InvoiceService],
})
export class WalletBillingModule {}
