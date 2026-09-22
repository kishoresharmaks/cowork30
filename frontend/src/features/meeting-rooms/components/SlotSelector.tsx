import React, { useMemo } from 'react';
import { Calendar as CalendarIcon, Clock, ChevronLeft, ChevronRight, Users, AlertCircle, ArrowRight, Info } from 'lucide-react';
import { MeetingRoom, AvailabilityData } from '../types';
import { SlotSelectorSkeleton } from './RoomSkeleton';

interface SlotSelectorProps {
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
  onNextStep?: () => void;
  onViewDetails?: (room: MeetingRoom) => void;
}

export const SlotSelector: React.FC<SlotSelectorProps> = ({
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
  onNextStep,
  onViewDetails,
}) => {
  const minSeats = selectedRoom.minSeats || 1;
  const maxSeats = selectedRoom.maxSeats || selectedRoom.capacity || 10;
  const isSeatInvalid = selectedSeats < minSeats || selectedSeats > maxSeats;

  // Generate dynamic horizontal day picker array (Next 7 days from today)
  const dayOptions = useMemo(() => {
    const days = [];
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const isoDate = d.toISOString().split('T')[0];
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
      const dayNum = d.getDate();
      const monthName = d.toLocaleDateString('en-US', { month: 'short' });
      days.push({
        isoDate,
        dayName,
        label: `${dayNum} ${monthName}`,
        fullDisplay: `${dayName} ${dayNum} ${monthName}`,
      });
    }
    return days;
  }, []);

  const getImageSource = () => {
    if (selectedRoom.imageUrl) return selectedRoom.imageUrl;
    if (selectedRoom.featuredImage) return selectedRoom.featuredImage;
    if (Array.isArray(selectedRoom.images) && selectedRoom.images.length > 0) return selectedRoom.images[0];
    if (typeof selectedRoom.images === 'string' && selectedRoom.images.trim()) return selectedRoom.images;
    return 'https://images.unsplash.com/photo-1517502884422-41eaead166d4?auto=format&fit=crop&w=600&q=80';
  };

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs p-4 flex flex-col space-y-3.5 lg:h-full lg:overflow-hidden">
      {/* Selected Suite Info Banner */}
      <div className="flex items-center space-x-3 pb-3 border-b border-slate-100 shrink-0">
        <div className="relative h-12 w-16 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
          <img
            src={getImageSource()}
            alt={selectedRoom.name}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 min-w-0">
              <h3 className="text-sm font-bold text-slate-900 leading-tight truncate">
                {selectedRoom.name}
              </h3>
              {onViewDetails && (
                <button
                  type="button"
                  onClick={() => onViewDetails(selectedRoom)}
                  className="px-2 py-0.5 text-[10px] font-extrabold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/80 rounded-lg flex items-center space-x-1 shrink-0 transition-colors cursor-pointer"
                  title="View Suite Details & Amenities"
                >
                  <Info className="w-3 h-3" />
                  <span>View Details</span>
                </button>
              )}
            </div>
            <span className="text-xs font-black text-rose-600 ml-2 shrink-0">₹{selectedRoom.hourlyRate}/hr</span>
          </div>
          <p className="text-[11px] text-slate-500 truncate mt-0.5">
            {selectedRoom.description || 'A modern private suite for focused meetings.'}
          </p>
        </div>
      </div>

      {/* Date & Time Selector Section */}
      <div className="space-y-2 shrink-0">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-900 flex items-center space-x-1.5">
            <CalendarIcon className="w-3.5 h-3.5 text-indigo-600" />
            <span>Select Date</span>
          </label>

          <input
            type="date"
            value={selectedDate}
            min={new Date().toISOString().split('T')[0]}
            onChange={(e) => onDateChange(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-0.5 text-xs text-slate-700 font-semibold focus:border-indigo-600 focus:outline-none"
          />
        </div>

        {/* Horizontal Day Picker Bar */}
        <div className="flex items-center space-x-1 overflow-x-auto pb-1 no-scrollbar">
          {dayOptions.map((item) => {
            const isSelected = selectedDate === item.isoDate;
            return (
              <button
                key={item.isoDate}
                type="button"
                onClick={() => onDateChange(item.isoDate)}
                className={`flex-1 min-w-[58px] py-1.5 px-1.5 rounded-xl text-center transition-all cursor-pointer border ${
                  isSelected
                    ? 'bg-indigo-600 text-white border-indigo-600 font-bold shadow-xs shadow-indigo-500/20'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 font-medium'
                }`}
              >
                <span className="text-[9px] uppercase block tracking-wider opacity-80">
                  {item.dayName}
                </span>
                <span className="text-[11px] font-bold block whitespace-nowrap">
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Seat Count Adjuster */}
      <div className="pt-2 border-t border-slate-100 shrink-0 flex items-center justify-between">
        <label className="text-xs font-semibold text-slate-700 flex items-center space-x-1.5">
          <Users className="w-3.5 h-3.5 text-indigo-600" />
          <span>Seats ({minSeats}-{maxSeats})</span>
        </label>
        <div className="flex items-center space-x-2">
          <input
            type="number"
            min={minSeats}
            max={maxSeats}
            value={selectedSeats}
            onChange={(e) => onSeatsChange(Number(e.target.value))}
            className={`w-20 bg-slate-50 border rounded-lg px-2.5 py-1 text-xs text-slate-900 font-semibold text-center focus:outline-none ${
              isSeatInvalid
                ? 'border-rose-500 bg-rose-50 text-rose-900'
                : 'border-slate-200 focus:border-indigo-600'
            }`}
          />
        </div>
      </div>
      {isSeatInvalid && (
        <p className="text-[10px] text-rose-500 font-bold shrink-0 flex items-center space-x-1">
          <AlertCircle className="w-3 h-3 shrink-0" />
          <span>Seat count must be between {minSeats} and {maxSeats}.</span>
        </p>
      )}

      {/* Available Time Slots Section (3-Column Grid) */}
      <div className="space-y-2 pt-2 border-t border-slate-100 flex-1 min-h-0 flex flex-col">
        <div className="flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-1.5">
            <h4 className="text-xs font-bold text-slate-900 flex items-center space-x-1">
              <Clock className="w-3.5 h-3.5 text-indigo-600" />
              <span>Available Time Slots</span>
            </h4>
            <span className="text-[9px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded-full border border-indigo-100">
              30-Min
            </span>
          </div>

          <div className="flex items-center space-x-2">
            {availability?.timeSlots && availability.timeSlots.length > 0 && (
              <button
                type="button"
                onClick={onSelectAllAvailable}
                className="text-[10px] font-semibold text-indigo-600 hover:text-indigo-700 cursor-pointer"
              >
                Select All
              </button>
            )}
            {selectedSlots.length > 0 && (
              <button
                type="button"
                onClick={onClearSlots}
                className="text-[10px] font-semibold text-rose-600 hover:text-rose-700 cursor-pointer"
              >
                Clear ({selectedSlots.length})
              </button>
            )}
          </div>
        </div>

        {checking ? (
          <div className="py-6 text-center text-xs text-slate-400 my-auto">Checking slot availability...</div>
        ) : !availability?.timeSlots || availability.timeSlots.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-400 my-auto">No available slots for selected date.</div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-3 gap-1.5 overflow-y-auto pr-1 flex-1 min-h-0">
            {availability.timeSlots.map((slot) => {
              const isSelected = selectedSlots.includes(slot.startTime);
              const isUnavailable = !slot.isAvailable;

              return (
                <button
                  key={slot.startTime}
                  disabled={isUnavailable}
                  type="button"
                  onClick={() => onToggleSlot(slot.startTime)}
                  className={`py-1.5 px-1.5 rounded-lg border text-[11px] font-semibold transition-all duration-150 text-center cursor-pointer ${
                    isUnavailable
                      ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed line-through'
                      : isSelected
                      ? 'bg-indigo-600 text-white border-indigo-600 font-bold shadow-xs scale-[1.02]'
                      : 'bg-slate-50 border-slate-200/90 text-slate-700 hover:bg-slate-100 hover:border-slate-300'
                  }`}
                >
                  {slot.label || slot.hour || slot.startTime}
                </button>
              );
            })}
          </div>
        )}

        {/* Mobile Next Action Button */}
        {onNextStep && (
          <button
            type="button"
            disabled={selectedSlots.length === 0}
            onClick={onNextStep}
            className="lg:hidden w-full py-2.5 px-4 rounded-xl font-bold text-xs text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 transition-all flex items-center justify-center space-x-1 shrink-0 shadow-md cursor-pointer mt-2"
          >
            <span>
              {selectedSlots.length === 0
                ? 'Select Time Slot to Continue'
                : `Proceed to Checkout (${selectedSlots.length} slot${selectedSlots.length === 1 ? '' : 's'})`}
            </span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </button>
        )}
      </div>
    </div>
  );
};
