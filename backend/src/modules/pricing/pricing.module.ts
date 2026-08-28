import { Module } from '@nestjs/common';
import { PricingService } from './pricing.service';
import { PricingController } from './pricing.controller';
import { RazorpayService } from '../wallet-billing/razorpay.service';

@Module({
  controllers: [PricingController],
  providers: [PricingService, RazorpayService],
  exports: [PricingService],
})
export class PricingModule {}
