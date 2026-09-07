import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import Razorpay from 'razorpay';
import * as crypto from 'crypto';

@Injectable()
export class RazorpayService {
  private razorpay: Razorpay | null = null;
  private readonly logger = new Logger(RazorpayService.name);
  private readonly isDemoMode: boolean;
  private keyId: string;
  private keySecret: string;

  constructor() {
    // Require explicit env vars - NO hardcoded fallbacks for production security
    const envKeyId = process.env.RAZORPAY_KEY_ID;
    const envKeySecret = process.env.RAZORPAY_KEY_SECRET;
    const envDemoMode = process.env.RAZORPAY_DEMO_MODE;

    this.isDemoMode = envDemoMode === 'true';

    if (!envKeyId || !envKeySecret) {
      this.logger.warn(
        'RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET not configured. ' +
        'Razorpay features will be disabled. Set RAZORPAY_DEMO_MODE=true for local development.',
      );
      this.keyId = '';
      this.keySecret = '';
      return;
    }

    this.keyId = envKeyId;
    this.keySecret = envKeySecret;

    if (this.isDemoMode) {
      this.logger.warn(
        '⚠️  RAZORPAY_DEMO_MODE is ACTIVE. No real orders will be created. ' +
        'Payments will be simulated locally. Disable for production.',
      );
    }

    try {
      this.razorpay = new Razorpay({
        key_id: this.keyId,
        key_secret: this.keySecret,
      });
      this.logger.log('Razorpay SDK Initialized successfully');
    } catch (err) {
      this.logger.warn('Failed to initialize Razorpay SDK instance. Will use HMAC signature fallback.');
    }
  }

  getKeyId(): string {
    return this.keyId;
  }

  isDemo(): boolean {
    return this.isDemoMode;
  }

  async createOrder(params: { amount: number; currency?: string; receipt: string; notes?: any }) {
    const amountInPaise = Math.round(params.amount * 100);

    // In demo mode, return a simulated order WITHOUT calling Razorpay API
    if (this.isDemoMode) {
      const demoOrderId = `order_demo_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
      this.logger.log(`[DEMO] Simulated order created: ${demoOrderId} for ₹${params.amount}`);
      return {
        id: demoOrderId,
        entity: 'order',
        amount: amountInPaise,
        amount_paid: 0,
        amount_due: amountInPaise,
        currency: params.currency || 'INR',
        receipt: params.receipt,
        status: 'created',
        attempts: 0,
        notes: params.notes || {},
        created_at: Math.floor(Date.now() / 1000),
      };
    }

    // Production mode: require valid credentials
    if (!this.razorpay) {
      this.logger.error('Razorpay SDK not initialized. Cannot create order in production mode.');
      throw new BadRequestException('Payment gateway not configured. Please contact support.');
    }

    try {
      const order = await this.razorpay.orders.create({
        amount: amountInPaise,
        currency: params.currency || 'INR',
        receipt: params.receipt,
        notes: params.notes || {},
      });
      this.logger.log(`Razorpay order created: ${order.id} for ₹${params.amount}`);
      return order;
    } catch (err: any) {
      this.logger.error(`Razorpay order creation failed: ${err.message || err}`);
      throw new BadRequestException(`Payment order creation failed: ${err.message || 'Unknown error'}`);
    }
  }

  verifyPaymentSignature(params: { razorpayOrderId: string; razorpayPaymentId: string; razorpaySignature: string }): boolean {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = params;
    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return false;
    }

    // Strict HMAC verification using actual key secret (same algorithm Razorpay uses)
    const payload = `${razorpayOrderId}|${razorpayPaymentId}`;
    const expectedSignature = crypto
      .createHmac('sha256', this.keySecret)
      .update(payload)
      .digest('hex');

    if (expectedSignature === razorpaySignature) {
      return true;
    }

    // Allow demo mode signatures ONLY when explicitly enabled via env var
    if (this.isDemoMode && razorpaySignature.startsWith('sig_demo_')) {
      this.logger.warn(`[DEMO] Demo mode payment signature accepted for order ${razorpayOrderId}`);
      return true;
    }

    // Reject all other signatures (no blanket acceptance)
    this.logger.error(`Payment signature verification FAILED for order ${razorpayOrderId} payment ${razorpayPaymentId}`);
    return false;
  }
}
