'use client';

import React, { useState } from 'react';
import { CreditCard, QrCode, Building2, CheckCircle2, ShieldCheck, X, Smartphone } from 'lucide-react';

interface RazorpayModalProps {
  isOpen: boolean;
  amount: number;
  orderId: string;
  customerName?: string;
  customerEmail?: string;
  description?: string;
  onSuccess: (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => void;
  onClose: () => void;
}

export default function RazorpayGatewayModal({
  isOpen,
  amount,
  orderId,
  customerName,
  customerEmail,
  description,
  onSuccess,
  onClose,
}: RazorpayModalProps) {
  const [selectedMethod, setSelectedMethod] = useState<'upi' | 'card' | 'netbanking'>('upi');
  const [processing, setProcessing] = useState(false);

  if (!isOpen) return null;

  const handleSimulatePayment = () => {
    setProcessing(true);
    setTimeout(() => {
      const paymentId = `pay_online_${Date.now()}`;
      const signature = `sig_demo_passed`;
      onSuccess({
        razorpay_order_id: orderId,
        razorpay_payment_id: paymentId,
        razorpay_signature: signature,
      });
      setProcessing(false);
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full overflow-hidden shadow-2xl space-y-0 text-slate-100 relative">
        {/* Razorpay Brand Header */}
        <div className="bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-900 p-6 text-white space-y-3 relative border-b border-slate-800">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-full bg-slate-950/40"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-blue-500 text-white flex items-center justify-center font-black text-sm shadow">
              R
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-300 block">Razorpay Checkout Sandbox</span>
              <h3 className="text-base font-extrabold text-white">Cowork30 Ecosystem</h3>
            </div>
          </div>

          <div className="pt-2 flex items-baseline justify-between border-t border-white/10">
            <div>
              <p className="text-[11px] text-slate-300">{description || 'Wallet Recharge / Reservation'}</p>
              <p className="text-[10px] font-mono text-slate-400">Order ID: #{orderId.slice(0, 16)}...</p>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase text-slate-400 block font-bold">Amount Due</span>
              <span className="text-xl font-black text-emerald-400">₹{amount.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Payment Methods Body */}
        <div className="p-6 space-y-5 text-xs">
          <div className="space-y-2">
            <label className="block font-bold text-slate-300">Select Razorpay Payment Method</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setSelectedMethod('upi')}
                className={`p-3 rounded-xl border text-center space-y-1 transition-all ${
                  selectedMethod === 'upi'
                    ? 'bg-blue-500/10 border-blue-500 text-blue-300 font-bold'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <Smartphone className="w-4 h-4 mx-auto text-blue-400" />
                <span className="block text-[10px]">UPI / QR</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedMethod('card')}
                className={`p-3 rounded-xl border text-center space-y-1 transition-all ${
                  selectedMethod === 'card'
                    ? 'bg-blue-500/10 border-blue-500 text-blue-300 font-bold'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <CreditCard className="w-4 h-4 mx-auto text-purple-400" />
                <span className="block text-[10px]">Cards</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedMethod('netbanking')}
                className={`p-3 rounded-xl border text-center space-y-1 transition-all ${
                  selectedMethod === 'netbanking'
                    ? 'bg-blue-500/10 border-blue-500 text-blue-300 font-bold'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <Building2 className="w-4 h-4 mx-auto text-emerald-400" />
                <span className="block text-[10px]">NetBanking</span>
              </button>
            </div>
          </div>

          {/* Details Card */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
            {selectedMethod === 'upi' && (
              <div className="space-y-1.5 text-center">
                <QrCode className="w-16 h-16 mx-auto text-blue-400" />
                <p className="font-bold text-white">UPI Instant Auto-Pay</p>
                <p className="text-[10px] text-slate-400">Google Pay • PhonePe • Paytm • BHIM UPI</p>
              </div>
            )}

            {selectedMethod === 'card' && (
              <div className="space-y-2">
                <p className="font-bold text-white">Credit / Debit Card</p>
                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 font-mono text-[11px] text-slate-300">
                  •••• •••• •••• 4242 (Visa / MasterCard / RuPay)
                </div>
              </div>
            )}

            {selectedMethod === 'netbanking' && (
              <div className="space-y-1 text-center">
                <p className="font-bold text-white">NetBanking Direct Gateway</p>
                <p className="text-[10px] text-slate-400">HDFC Bank • ICICI Bank • State Bank of India • Axis</p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 pt-2">
            <button
              onClick={handleSimulatePayment}
              disabled={processing}
              className="w-full py-3.5 rounded-full text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center space-x-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{processing ? 'Processing Payment Authorization...' : `Pay ₹${amount.toLocaleString()} Online Now`}</span>
            </button>

            <button
              onClick={onClose}
              disabled={processing}
              className="w-full py-2 text-center text-xs text-slate-500 hover:text-slate-300"
            >
              Cancel Payment Session
            </button>
          </div>
        </div>

        {/* Security Footer */}
        <div className="p-3 bg-slate-950 text-center text-[10px] text-slate-500 border-t border-slate-800 flex items-center justify-center space-x-1">
          <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
          <span>Secured by 256-Bit SSL Encryption & Razorpay Merchant Network</span>
        </div>
      </div>
    </div>
  );
}
