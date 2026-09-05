import React, { useMemo } from 'react';
import { Calendar as CalendarIcon, Clock, ChevronLeft, ChevronRight, Users, AlertCircle } from 'lucide-react';
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
    <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs p-5 space-y-5">
      {/* Selected Suite Info Banner */}
      <div className="flex items-center space-x-3 pb-4 border-b border-slate-100">
        <div className="relative h-14 w-20 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
          <img
            src={getImageSource()}
            alt={selectedRoom.name}
            className="w-full h-full object-cover"
          />
        </div>
        <div>
          <h3 className="text-base font-bold text-slate-900 leading-tight">
            {selectedRoom.name}
          </h3>
          <p className="text-xs text-slate-500 line-clamp-1">
            {selectedRoom.description || 'A modern private suite for focused meetings & discussions.'}
          </p>
        </div>
      </div>

      {/* Date & Time Selector Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-900 flex items-center space-x-1.5">
            <span>Select Date & Time</span>
          </label>

          <div className="relative">
            <input
              type="date"
              value={selectedDate}
              min={new Date().toISOString().split('T')[0]}
              onChange={(e) => onDateChange(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-xs text-slate-700 font-semibold focus:border-indigo-600 focus:outline-none"
            />
          </div>
        </div>

        {/* Horizontal Day Picker Bar */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 no-scrollbar">
          {dayOptions.map((item) => {
            const isSelected = selectedDate === item.isoDate;
            return (
              <button
                key={item.isoDate}
                type="button"
                onClick={() => onDateChange(item.isoDate)}
                className={`flex-1 min-w-[70px] py-2 px-2 rounded-xl text-center transition-all cursor-pointer border ${
                  isSelected
                    ? 'bg-indigo-600 text-white border-indigo-600 font-bold shadow-md shadow-indigo-500/20'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 font-medium'
                }`}
              >
                <span className="text-[10px] uppercase block tracking-wider opacity-80">
                  {item.dayName}
                </span>
                <span className="text-xs font-bold block whitespace-nowrap">
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Seat Count Adjuster */}
      <div className="pt-2 border-t border-slate-100">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-slate-700 flex items-center space-x-1.5">
            <Users className="w-3.5 h-3.5 text-indigo-600" />
            <span>Seats Configuration</span>
          </label>
          <span className="text-[11px] text-slate-400 font-medium">
            ({minSeats} - {maxSeats} Seats)
          </span>
        </div>
        <div className="mt-1.5">
          <input
            type="number"
            min={minSeats}
            max={maxSeats}
            value={selectedSeats}
            onChange={(e) => onSeatsChange(Number(e.target.value))}
            className={`w-full bg-slate-50 border rounded-xl px-3 py-1.5 text-xs text-slate-900 font-semibold focus:outline-none ${
              isSeatInvalid
                ? 'border-rose-500 bg-rose-50 text-rose-900'
                : 'border-slate-200 focus:border-indigo-600'
            }`}
          />
          {isSeatInvalid && (
            <p className="text-[10px] text-rose-500 font-bold mt-1 flex items-center space-x-1">
              <AlertCircle className="w-3 h-3 shrink-0" />
              <span>Seat count must be between {minSeats} and {maxSeats}.</span>
            </p>
          )}
        </div>
      </div>

      {/* Available Time Slots Section (2-Column Grid with 30-Min Intervals) */}
      <div className="space-y-3 pt-2 border-t border-slate-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <h4 className="text-xs font-bold text-slate-900 flex items-center space-x-1.5">
              <Clock className="w-3.5 h-3.5 text-indigo-600" />
              <span>Available Time Slots</span>
            </h4>
            <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
              30-Min Slots
            </span>
          </div>

          {selectedSlots.length > 0 && (
            <button
              type="button"
              onClick={onClearSlots}
              className="text-[11px] font-semibold text-rose-600 hover:text-rose-700 cursor-pointer"
            >
              Clear ({selectedSlots.length})
            </button>
          )}
        </div>

        {checking ? (
          <div className="py-8 text-center text-xs text-slate-400">Checking slot availability...</div>
        ) : !availability?.timeSlots || availability.timeSlots.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">No available slots for selected date.</div>
        ) : (
          <div className="grid grid-cols-2 gap-2 max-h-[360px] overflow-y-auto pr-1">
            {availability.timeSlots.map((slot) => {
              const isSelected = selectedSlots.includes(slot.startTime);
              const isUnavailable = !slot.isAvailable;

              return (
                <button
                  key={slot.startTime}
                  disabled={isUnavailable}
                  type="button"
                  onClick={() => onToggleSlot(slot.startTime)}
                  className={`py-2 px-2.5 rounded-xl border text-xs font-semibold transition-all duration-200 text-center cursor-pointer ${
                    isUnavailable
                      ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed line-through'
                      : isSelected
                      ? 'bg-indigo-600 text-white border-indigo-600 font-bold shadow-md shadow-indigo-500/20 scale-[1.02]'
                      : 'bg-slate-50 border-slate-200/90 text-slate-700 hover:bg-slate-100 hover:border-slate-300'
                  }`}
                >
                  {slot.label || slot.hour || slot.startTime}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* NOTE: Add-ons section completely omitted as per user instruction */}
    </div>
  );
};
