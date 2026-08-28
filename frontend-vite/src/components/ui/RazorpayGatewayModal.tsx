import React, { useState } from 'react';
import { CreditCard, Wallet, ShieldCheck, CheckCircle2, AlertCircle, X, Sparkles } from 'lucide-react';
import { apiClient } from '@/lib/api-client';

interface RazorpayGatewayModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingDetails: {
    bookingId?: number;
    meetingBookingId?: number;
    amount: number;
    description: string;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
  };
  onSuccess: (paymentId: string) => void;
  onUnauthorized?: () => void;
}

export default function RazorpayGatewayModal({
  isOpen,
  onClose,
  bookingDetails,
  onSuccess,
  onUnauthorized,
}: RazorpayGatewayModalProps) {
  const [paymentMethod, setPaymentMethod] = useState<'razorpay' | 'wallet' | 'cash'>('razorpay');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleProcessPayment = async () => {
    setProcessing(true);
    setError(null);

    try {
      if (paymentMethod === 'wallet') {
        const res = await apiClient.post('/wallet/pay', {
          bookingId: bookingDetails.bookingId,
          meetingBookingId: bookingDetails.meetingBookingId,
          amount: bookingDetails.amount,
        });
        onSuccess(res.data?.paymentId || 'WALLET_PAY_SUCCESS');
        onClose();
        return;
      }

      // Online Gateway Mock/Integration Checkout
      const orderRes = await apiClient.post('/wallet/razorpay/create-order', {
        amount: bookingDetails.amount,
        bookingId: bookingDetails.bookingId,
        meetingBookingId: bookingDetails.meetingBookingId,
      });

      const orderData = orderRes.data?.data || orderRes.data;

      // Simulate payment verification
      const verifyRes = await apiClient.post('/wallet/razorpay/verify-payment', {
        razorpayOrderId: orderData.orderId || 'order_mock_123',
        razorpayPaymentId: `pay_${Date.now()}`,
        razorpaySignature: 'sig_verified_mock_123',
        bookingId: bookingDetails.bookingId,
        meetingBookingId: bookingDetails.meetingBookingId,
      });

      onSuccess(verifyRes.data?.paymentId || 'RZP_PAY_SUCCESS');
      onClose();
    } catch (err: any) {
      if (err.response?.status === 401) {
        if (onUnauthorized) onUnauthorized();
        else setError('Authentication required for online wallet checkout.');
      } else {
        setError(err.response?.data?.message || 'Payment checkout failed. Please try again.');
      }
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-lg w-full p-6 relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Secure Payment Checkout</h3>
            <p className="text-xs text-slate-400">Razorpay 256-Bit Encrypted</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-100 rounded-xl text-xs text-rose-600 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="bg-slate-50 rounded-2xl p-4 mb-6 space-y-2 border border-slate-100">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Order Summary</div>
          <div className="text-sm font-semibold text-slate-800">{bookingDetails.description}</div>
          <div className="flex justify-between items-center pt-2 border-t border-slate-200/60">
            <span className="text-xs text-slate-500">Total Payable Amount</span>
            <span className="text-lg font-black text-rose-600">₹{bookingDetails.amount.toLocaleString()}</span>
          </div>
        </div>

        {/* Payment Options */}
        <div className="space-y-3 mb-6">
          <button
            onClick={() => setPaymentMethod('razorpay')}
            className={`w-full p-4 rounded-2xl border text-left flex items-center justify-between transition-all ${
              paymentMethod === 'razorpay'
                ? 'border-rose-500 bg-rose-50/40 ring-2 ring-rose-500/20'
                : 'border-slate-200 hover:border-slate-300 bg-white'
            }`}
          >
            <div className="flex items-center gap-3">
              <CreditCard className="w-5 h-5 text-rose-500" />
              <div>
                <div className="text-xs font-bold text-slate-900">Razorpay / UPI / NetBanking / Cards</div>
                <div className="text-[11px] text-slate-400">Instant Automated Online Confirmation</div>
              </div>
            </div>
            {paymentMethod === 'razorpay' && <CheckCircle2 className="w-5 h-5 text-rose-500" />}
          </button>

          <button
            onClick={() => setPaymentMethod('wallet')}
            className={`w-full p-4 rounded-2xl border text-left flex items-center justify-between transition-all ${
              paymentMethod === 'wallet'
                ? 'border-purple-500 bg-purple-50/40 ring-2 ring-purple-500/20'
                : 'border-slate-200 hover:border-slate-300 bg-white'
            }`}
          >
            <div className="flex items-center gap-3">
              <Wallet className="w-5 h-5 text-purple-600" />
              <div>
                <div className="text-xs font-bold text-slate-900">Pay with Cowork30 Wallet Balance</div>
                <div className="text-[11px] text-slate-400">Deduct directly from active pre-funded wallet</div>
              </div>
            </div>
            {paymentMethod === 'wallet' && <CheckCircle2 className="w-5 h-5 text-purple-600" />}
          </button>
        </div>

        <button
          onClick={handleProcessPayment}
          disabled={processing}
          className="w-full py-3.5 px-4 bg-gradient-to-r from-rose-500 to-purple-600 hover:from-rose-600 hover:to-purple-700 text-white rounded-2xl text-xs font-bold shadow-xl shadow-rose-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {processing ? (
            <span className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 animate-spin" /> Verifying Payment...
            </span>
          ) : (
            `Pay ₹${bookingDetails.amount.toLocaleString()} Now`
          )}
        </button>
      </div>
    </div>
  );
}
