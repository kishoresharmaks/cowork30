import React from 'react';
import { Tag, Wallet, CreditCard, DollarSign, ArrowRight, ShieldCheck, User, Mail, Phone, ChevronLeft } from 'lucide-react';
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
  onBackStep?: () => void;
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
  onBackStep,
}) => {
  // Financial Calculations driven strictly from existing props (each slot = 30 mins = 0.5 hr)
  const totalHours = selectedSlotsCount * 0.5;
  const baseRate = Number(selectedRoom.hourlyRate || 0);
  const perSeatRate = Number(selectedRoom.perSeatPrice || 0);
  const minSeats = Number(selectedRoom.minSeats || 1);
  const additionalSeats = Math.max(0, selectedSeats - minSeats);
  const baseSubtotal = (baseRate + perSeatRate * additionalSeats) * totalHours;

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
    <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs p-4 flex flex-col space-y-3 h-full overflow-y-auto min-h-0">
      <div className="flex items-center justify-between border-b border-slate-100 pb-2 shrink-0">
        <div className="flex items-center space-x-2">
          {onBackStep && (
            <button
              type="button"
              onClick={onBackStep}
              className="lg:hidden p-1 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
              title="Back to Time Slots"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
          <h3 className="text-xs font-bold text-slate-900">Guest Info & Payment</h3>
        </div>
        <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
          {selectedSlotsCount > 0 ? `${selectedSlotsCount} Slots • ${formatDurationDisplay(totalHours)}` : '0 Slots Selected'}
        </span>
      </div>

      <form onSubmit={onSubmit} className="flex-1 flex flex-col justify-between space-y-3 text-xs min-h-0">
        {/* Guest Input Fields */}
        <div className="space-y-2 shrink-0">
          <div>
            <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">Full Name *</label>
            <div className="relative">
              <User className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                required
                value={formData.customerName}
                onChange={(e) => onFormDataChange({ ...formData, customerName: e.target.value })}
                placeholder="John Doe"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-2.5 py-1 text-xs text-slate-900 focus:border-indigo-600 focus:bg-white focus:outline-none transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">Email *</label>
              <div className="relative">
                <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="email"
                  required
                  value={formData.customerEmail}
                  onChange={(e) => onFormDataChange({ ...formData, customerEmail: e.target.value })}
                  placeholder="john@example.com"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-2 py-1 text-xs text-slate-900 focus:border-indigo-600 focus:bg-white focus:outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">Phone *</label>
              <div className="relative">
                <Phone className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  required
                  value={formData.customerPhone}
                  onChange={(e) => onFormDataChange({ ...formData, customerPhone: e.target.value })}
                  placeholder="+91 9820431183"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-2 py-1 text-xs text-slate-900 focus:border-indigo-600 focus:bg-white focus:outline-none transition-all"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Payment Method Selector Grid */}
        <div className="space-y-1.5 pt-2 border-t border-slate-100 shrink-0">
          <label className="block text-[10px] font-bold text-slate-900">Payment Options *</label>

          <div className="grid grid-cols-2 gap-1.5">
            {/* Meeting Room Credits */}
            {user && (
              <button
                type="button"
                disabled={!canUseMeetingCredits}
                onClick={() => onPaymentMethodChange('credits')}
                className={`p-2 rounded-xl border text-left flex items-center space-x-2 text-xs transition-all cursor-pointer ${
                  paymentMethod === 'credits'
                    ? 'bg-indigo-50 border-indigo-600 text-indigo-900 font-semibold ring-1 ring-indigo-500/30'
                    : !canUseMeetingCredits
                    ? 'bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed opacity-60'
                    : 'bg-slate-50/80 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Tag className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                <div className="min-w-0">
                  <p className="font-bold text-slate-900 text-[11px] truncate">Room Credits</p>
                  <p className="text-[9px] text-slate-500 truncate">Bal: {meetingCreditsBalance} (Need {meetingCreditsNeeded})</p>
                </div>
              </button>
            )}

            {/* Credit Wallet */}
            <button
              type="button"
              onClick={() => onPaymentMethodChange('wallet')}
              className={`p-2 rounded-xl border text-left flex items-center space-x-2 text-xs transition-all cursor-pointer ${
                paymentMethod === 'wallet'
                  ? 'bg-indigo-50 border-indigo-600 text-indigo-900 font-semibold ring-1 ring-indigo-500/30'
                  : 'bg-slate-50/80 border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Wallet className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <div className="min-w-0">
                <p className="font-bold text-slate-900 text-[11px] truncate">Credit Wallet</p>
                <p className="text-[9px] text-slate-500 truncate">Bal: ₹{user ? walletBalance.toLocaleString() : '0'}</p>
              </div>
            </button>

            {/* Razorpay Online */}
            <button
              type="button"
              onClick={() => onPaymentMethodChange('razorpay')}
              className={`p-2 rounded-xl border text-left flex items-center space-x-2 text-xs transition-all cursor-pointer ${
                paymentMethod === 'razorpay'
                  ? 'bg-indigo-50 border-indigo-600 text-indigo-900 font-semibold ring-1 ring-indigo-500/30'
                  : 'bg-slate-50/80 border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5 text-pink-600 shrink-0" />
              <div className="min-w-0">
                <p className="font-bold text-slate-900 text-[11px] truncate">Razorpay Online</p>
                <p className="text-[9px] text-slate-500 truncate">UPI, Cards, NetBanking</p>
              </div>
            </button>

            {/* Pay at Reception */}
            <button
              type="button"
              onClick={() => onPaymentMethodChange('reception')}
              className={`p-2 rounded-xl border text-left flex items-center space-x-2 text-xs transition-all cursor-pointer ${
                paymentMethod === 'reception'
                  ? 'bg-indigo-50 border-indigo-600 text-indigo-900 font-semibold ring-1 ring-indigo-500/30'
                  : 'bg-slate-50/80 border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <DollarSign className="w-3.5 h-3.5 text-purple-600 shrink-0" />
              <div className="min-w-0">
                <p className="font-bold text-slate-900 text-[11px] truncate">Pay at Reception</p>
                <p className="text-[9px] text-slate-500 truncate">Pay on check-in</p>
              </div>
            </button>
          </div>
        </div>

        {/* Payment Summary */}
        <div className="pt-2 border-t border-slate-100 space-y-1 text-[11px] text-slate-600 shrink-0">
          <div className="flex justify-between">
            <span>Base Cost ({formatDurationDisplay(totalHours)}):</span>
            <span className="font-semibold text-slate-900">₹{baseSubtotal.toFixed(2)}</span>
          </div>

          <div className="flex justify-between text-slate-500">
            <span>GST Tax ({(taxRate * 100).toFixed(0)}%):</span>
            <span>+₹{gstTax.toFixed(2)}</span>
          </div>

          <div className="flex justify-between text-xs font-extrabold text-pink-600 pt-1.5 border-t border-slate-100">
            <span>Grand Total</span>
            <span className="text-sm">
              {paymentMethod === 'credits'
                ? `${meetingCreditsNeeded} Credit${meetingCreditsNeeded === 1 ? '' : 's'}`
                : `₹${grandTotal.toFixed(2)}`}
            </span>
          </div>
        </div>

        {/* Primary CTA Button */}
        <button
          type="submit"
          disabled={booking || totalHours === 0}
          className="w-full py-2.5 rounded-full text-xs font-bold text-white bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 hover:opacity-95 shadow-md shadow-pink-500/20 disabled:opacity-50 transition-all flex items-center justify-center space-x-1 cursor-pointer shrink-0 mt-1"
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
          <ArrowRight className="w-3.5 h-3.5 ml-1" />
        </button>
      </form>
    </div>
  );
};
