import React from 'react';
import { Tag, Wallet, CreditCard, DollarSign, ArrowRight, ShieldCheck, User, Mail, Phone } from 'lucide-react';
import { MeetingRoom, BookingFormData, PaymentMethod } from '../types';

interface BookingSummaryCardProps {
  selectedRoom: MeetingRoom;
  formData: BookingFormData;
  onFormDataChange: (data: BookingFormData) => void;
  paymentMethod: PaymentMethod;
  onPaymentMethodChange: (method: PaymentMethod) => void;
  selectedSlotsCount: number;
  selectedSeats: number;
  user: any;
  taxRate: number;
  booking: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

export const BookingSummaryCard: React.FC<BookingSummaryCardProps> = ({
  selectedRoom,
  formData,
  onFormDataChange,
  paymentMethod,
  onPaymentMethodChange,
  selectedSlotsCount,
  selectedSeats,
  user,
  taxRate,
  booking,
  onSubmit,
}) => {
  // Financial Calculations driven strictly from existing props (each slot = 30 mins = 0.5 hr)
  const totalHours = selectedSlotsCount * 0.5;
  const baseRate = Number(selectedRoom.hourlyRate || 0);
  const perSeatRate = Number(selectedRoom.perSeatPrice || 0);
  const baseSubtotal = (baseRate + perSeatRate * selectedSeats) * totalHours;

  let serviceChargeAmount = 0;
  if (selectedRoom.serviceChargeType === 'fixed') {
    serviceChargeAmount = Number(selectedRoom.serviceChargeValue || 0);
  } else if (selectedRoom.serviceChargeType === 'percentage') {
    serviceChargeAmount = baseSubtotal * (Number(selectedRoom.serviceChargeValue || 0) / 100);
  }

  const subtotalWithService = baseSubtotal + serviceChargeAmount;
  const gstTax = subtotalWithService * taxRate;
  const grandTotal = subtotalWithService + gstTax;

  const meetingCreditsNeeded = totalHours;
  const meetingCreditsBalance = Number(user?.meetingCreditsBalance || 0);
  const canUseMeetingCredits = meetingCreditsBalance >= meetingCreditsNeeded;
  const walletBalance = Number(user?.walletBalance || 0);

  const formatDurationDisplay = (hours: number) => {
    if (hours === 0) return '0 Mins';
    if (hours === 0.5) return '30 Mins';
    if (hours === 1) return '1 Hour';
    if (hours % 1 === 0) return `${hours} Hours`;
    return `${hours} Hours (${Math.round(hours * 60)} Mins)`;
  };

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs p-5 space-y-4">
      <h3 className="text-xs font-bold text-slate-900 border-b border-slate-100 pb-2.5 flex items-center justify-between">
        <span>Guest Information & Payment</span>
        <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
          {selectedSlotsCount > 0 ? `${selectedSlotsCount} Slots • ${formatDurationDisplay(totalHours)}` : '0 Slots Selected'}
        </span>
      </h3>

      <form onSubmit={onSubmit} className="space-y-3.5 text-xs">
        {/* Guest Input Fields */}
        <div className="space-y-2">
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Full Name *</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                required
                value={formData.customerName}
                onChange={(e) => onFormDataChange({ ...formData, customerName: e.target.value })}
                placeholder="John Doe"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-900 focus:border-indigo-600 focus:bg-white focus:outline-none transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Email *</label>
              <div className="relative">
                <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="email"
                  required
                  value={formData.customerEmail}
                  onChange={(e) => onFormDataChange({ ...formData, customerEmail: e.target.value })}
                  placeholder="john@example.com"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-2.5 py-1.5 text-xs text-slate-900 focus:border-indigo-600 focus:bg-white focus:outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Phone *</label>
              <div className="relative">
                <Phone className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  required
                  value={formData.customerPhone}
                  onChange={(e) => onFormDataChange({ ...formData, customerPhone: e.target.value })}
                  placeholder="+91 98765 43210"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-2.5 py-1.5 text-xs text-slate-900 focus:border-indigo-600 focus:bg-white focus:outline-none transition-all"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Payment Method Selector */}
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <label className="block text-[11px] font-bold text-slate-900">Payment Options *</label>

          <div className="grid grid-cols-1 gap-1.5">
            {/* Meeting Room Credits */}
            {user && (
              <button
                type="button"
                disabled={!canUseMeetingCredits}
                onClick={() => onPaymentMethodChange('credits')}
                className={`p-2.5 rounded-xl border text-left flex items-center justify-between text-xs transition-all cursor-pointer ${
                  paymentMethod === 'credits'
                    ? 'bg-indigo-50 border-indigo-600 text-indigo-900 font-semibold ring-1 ring-indigo-500/30'
                    : !canUseMeetingCredits
                    ? 'bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed opacity-60'
                    : 'bg-slate-50/80 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Tag className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                  <div>
                    <p className="font-bold text-slate-900 text-xs">Meeting Room Credits</p>
                    <p className="text-[10px] text-slate-500">Balance: {meetingCreditsBalance} · Needed: {meetingCreditsNeeded}</p>
                  </div>
                </div>
              </button>
            )}

            {/* Credit Wallet */}
            <button
              type="button"
              onClick={() => onPaymentMethodChange('wallet')}
              className={`p-2.5 rounded-xl border text-left flex items-center justify-between text-xs transition-all cursor-pointer ${
                paymentMethod === 'wallet'
                  ? 'bg-indigo-50 border-indigo-600 text-indigo-900 font-semibold ring-1 ring-indigo-500/30'
                  : 'bg-slate-50/80 border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Wallet className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <div>
                  <p className="font-bold text-slate-900 text-xs">Credit Wallet Balance</p>
                  <p className="text-[10px] text-slate-500">Available: ₹{user ? walletBalance.toLocaleString() : '0'}</p>
                </div>
              </div>
            </button>

            {/* Razorpay Online */}
            <button
              type="button"
              onClick={() => onPaymentMethodChange('razorpay')}
              className={`p-2.5 rounded-xl border text-left flex items-center justify-between text-xs transition-all cursor-pointer ${
                paymentMethod === 'razorpay'
                  ? 'bg-indigo-50 border-indigo-600 text-indigo-900 font-semibold ring-1 ring-indigo-500/30'
                  : 'bg-slate-50/80 border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center space-x-2">
                <CreditCard className="w-3.5 h-3.5 text-pink-600 shrink-0" />
                <div>
                  <p className="font-bold text-slate-900 text-xs">Razorpay Online</p>
                  <p className="text-[10px] text-slate-500">UPI, Cards, NetBanking</p>
                </div>
              </div>
            </button>

            {/* Pay at Reception */}
            <button
              type="button"
              onClick={() => onPaymentMethodChange('reception')}
              className={`p-2.5 rounded-xl border text-left flex items-center justify-between text-xs transition-all cursor-pointer ${
                paymentMethod === 'reception'
                  ? 'bg-indigo-50 border-indigo-600 text-indigo-900 font-semibold ring-1 ring-indigo-500/30'
                  : 'bg-slate-50/80 border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center space-x-2">
                <DollarSign className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                <div>
                  <p className="font-bold text-slate-900 text-xs">Pay at Reception</p>
                  <p className="text-[10px] text-slate-500">Pay upon check-in</p>
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Payment Summary */}
        <div className="pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
          <div className="flex justify-between">
            <span>Base Cost ({formatDurationDisplay(totalHours)}):</span>
            <span className="font-semibold text-slate-900">₹{baseSubtotal.toFixed(2)}</span>
          </div>

          <div className="flex justify-between text-slate-500">
            <span>GST Tax ({(taxRate * 100).toFixed(0)}%):</span>
            <span>+₹{gstTax.toFixed(2)}</span>
          </div>

          <div className="flex justify-between text-sm font-extrabold text-pink-600 pt-2 border-t border-slate-100">
            <span>Grand Total</span>
            <span className="text-base">
              {paymentMethod === 'credits'
                ? `${meetingCreditsNeeded} Credit${meetingCreditsNeeded === 1 ? '' : 's'}`
                : `₹${grandTotal.toFixed(2)}`}
            </span>
          </div>
        </div>

        {/* Primary CTA Button matching reference image gradient */}
        <button
          type="submit"
          disabled={booking || totalHours === 0}
          className="w-full py-3.5 rounded-full text-xs font-bold text-white bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 hover:opacity-95 shadow-lg shadow-pink-500/25 disabled:opacity-50 transition-all flex items-center justify-center space-x-1.5 cursor-pointer mt-2"
        >
          <span>
            {booking
              ? 'Processing...'
              : totalHours === 0
              ? 'Select Time Slots Above'
              : paymentMethod === 'credits'
              ? `Pay ${meetingCreditsNeeded} Credit${meetingCreditsNeeded === 1 ? '' : 's'} & Reserve`
              : `Pay ₹${grandTotal.toFixed(2)} & Reserve`}
          </span>
          <ArrowRight className="w-4 h-4 ml-1" />
        </button>
      </form>
    </div>
  );
};
