import React, { useState } from 'react';
import { ArrowRight, X, ShieldCheck, Calendar as CalendarIcon, Clock } from 'lucide-react';
import { SlotSelector } from './SlotSelector';
import { BookingSummaryCard } from './BookingSummaryCard';
import { MeetingRoom, AvailabilityData, BookingFormData, PaymentMethod } from '../types';

interface MobileBookingDrawerProps {
  selectedRoom: MeetingRoom;
  selectedDate: string;
  onDateChange: (date: string) => void;
  selectedSeats: number;
  onSeatsChange: (seats: number) => void;
  availability: AvailabilityData | null;
  selectedSlots: string[];
  onToggleSlot: (slotStartTime: string) => void;
  onClearSlots: () => void;
  onSelectAllAvailable: () => void;
  checking: boolean;

  formData: BookingFormData;
  onFormDataChange: (data: BookingFormData) => void;
  paymentMethod: PaymentMethod;
  onPaymentMethodChange: (method: PaymentMethod) => void;
  selectedSlotsCount: number;
  user: any;
  taxRate: number;
  booking: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

export const MobileBookingDrawer: React.FC<MobileBookingDrawerProps> = (props) => {
  const [isOpen, setIsOpen] = useState(false);
  const {
    selectedRoom,
    selectedDate,
    onDateChange,
    selectedSeats,
    onSeatsChange,
    availability,
    selectedSlots,
    onToggleSlot,
    onClearSlots,
    onSelectAllAvailable,
    checking,
    formData,
    onFormDataChange,
    paymentMethod,
    onPaymentMethodChange,
    selectedSlotsCount,
    user,
    taxRate,
    booking,
    onSubmit,
  } = props;

  const totalHours = selectedSlotsCount;
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

  return (
    <>
      {/* Sticky Bottom Floating Bar on Mobile/Tablet (< 1024px) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 p-3.5 bg-white/95 border-t border-slate-200 backdrop-blur-xl shadow-2xl">
        <div className="max-w-md mx-auto flex items-center justify-between gap-3">
          <div>
            {totalHours > 0 ? (
              <>
                <span className="text-[10px] uppercase tracking-wider font-extrabold text-pink-600 block">
                  {totalHours} {totalHours === 1 ? 'Slot' : 'Slots'} Selected
                </span>
                <div className="flex items-baseline space-x-1">
                  <span className="text-base font-extrabold text-slate-900">
                    {paymentMethod === 'credits' ? `${totalHours} Credits` : `₹${grandTotal.toFixed(2)}`}
                  </span>
                  <span className="text-[10px] text-slate-400">incl. GST</span>
                </div>
              </>
            ) : (
              <>
                <span className="text-[10px] uppercase tracking-wider font-extrabold text-indigo-600 block line-clamp-1">
                  {selectedRoom.name}
                </span>
                <div className="flex items-baseline space-x-1">
                  <span className="text-sm font-extrabold text-slate-900">₹{selectedRoom.hourlyRate}/hr</span>
                  <span className="text-[10px] text-slate-400">base rate</span>
                </div>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="px-5 py-3 rounded-full text-xs font-bold text-white bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 shadow-lg shadow-pink-500/25 flex items-center space-x-1.5 active:scale-95 transition-all cursor-pointer shrink-0"
          >
            <span>{totalHours > 0 ? 'Review & Reserve' : 'Select Time Slots'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Slide-over Drawer Modal */}
      {isOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end bg-slate-900/60 backdrop-blur-xs">
          <div className="absolute inset-0" onClick={() => setIsOpen(false)} />

          <div className="relative w-full max-h-[92vh] overflow-y-auto bg-white border-t border-slate-200 rounded-t-3xl p-4 sm:p-6 shadow-2xl z-10 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-slate-900 flex items-center space-x-1.5">
                  <ShieldCheck className="w-4 h-4 text-pink-600" />
                  <span>Reserve {selectedRoom.name}</span>
                </span>
                <p className="text-[11px] text-slate-400">Configure time slots & complete booking</p>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-full bg-slate-100 border border-slate-200 text-slate-500 hover:text-slate-900 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Time Slot & Date Selector */}
            <SlotSelector
              selectedRoom={selectedRoom}
              selectedDate={selectedDate}
              onDateChange={onDateChange}
              selectedSeats={selectedSeats}
              onSeatsChange={onSeatsChange}
              availability={availability}
              selectedSlots={selectedSlots}
              onToggleSlot={onToggleSlot}
              onClearSlots={onClearSlots}
              onSelectAllAvailable={onSelectAllAvailable}
              checking={checking}
            />

            {/* Guest Info & Checkout Summary */}
            <BookingSummaryCard
              selectedRoom={selectedRoom}
              formData={formData}
              onFormDataChange={onFormDataChange}
              paymentMethod={paymentMethod}
              onPaymentMethodChange={onPaymentMethodChange}
              selectedSlotsCount={selectedSlotsCount}
              selectedSeats={selectedSeats}
              user={user}
              taxRate={taxRate}
              booking={booking}
              onSubmit={(e) => {
                onSubmit(e);
              }}
            />
          </div>
        </div>
      )}
    </>
  );
};
