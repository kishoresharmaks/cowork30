import React from 'react';
import { Clock, MapPin, Users, Settings, ArrowRight, Star } from 'lucide-react';
import { MeetingRoom } from '../types';

interface RoomCardProps {
  room: MeetingRoom;
  isSelected: boolean;
  onSelect: (room: MeetingRoom) => void;
}

const DEFAULT_ROOM_IMAGE =
  'https://images.unsplash.com/photo-1517502884422-41eaead166d4?auto=format&fit=crop&w=600&q=80';

export const RoomCard: React.FC<RoomCardProps> = ({ room, isSelected, onSelect }) => {
  const getImageSource = () => {
    if (room.imageUrl) return room.imageUrl;
    if (room.featuredImage) return room.featuredImage;
    if (Array.isArray(room.images) && room.images.length > 0) return room.images[0];
    if (typeof room.images === 'string' && room.images.trim()) return room.images;
    return DEFAULT_ROOM_IMAGE;
  };

  const imageSrc = getImageSource();
  const suiteId = room.slug ? `Suite ID: ${room.slug.substring(0, 8).toUpperCase()}` : `Suite ID: MR-${room.id.substring(0, 4)}`;
  const statusBadge = room.category === 'Trial Rooms' || room.hourlyRate < 150 ? 'TRIAL' : 'Recommended';

  return (
    <div
      onClick={() => onSelect(room)}
      className={`group bg-white rounded-2xl p-4 border transition-all duration-300 cursor-pointer flex flex-col justify-between ${
        isSelected
          ? 'border-pink-500 ring-2 ring-pink-500/40 shadow-xl shadow-pink-500/10'
          : 'border-slate-200/80 hover:border-slate-300 hover:shadow-md'
      }`}
    >
      <div className="space-y-3">
        {/* Room Image Container */}
        <div className="relative h-44 w-full rounded-xl overflow-hidden bg-slate-100">
          <img
            src={imageSrc}
            alt={room.name}
            onError={(e) => {
              (e.target as HTMLImageElement).src = DEFAULT_ROOM_IMAGE;
            }}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />

          {/* Top Left Category Badge */}
          <span className="absolute top-2.5 left-2.5 text-[10px] font-bold px-2.5 py-0.5 rounded-md bg-indigo-700/90 text-white backdrop-blur-md">
            {room.category || 'Conference Room'}
          </span>

          {/* Top Right Status Badge */}
          <span
            className={`absolute top-2.5 right-2.5 text-[10px] font-extrabold px-2.5 py-0.5 rounded-md backdrop-blur-md uppercase tracking-wider ${
              statusBadge === 'TRIAL'
                ? 'bg-rose-500/90 text-white'
                : 'bg-gradient-to-r from-pink-500 to-rose-500 text-white'
            }`}
          >
            {statusBadge}
          </span>

          {/* Bottom Left Seat Capacity Pill */}
          <div className="absolute bottom-2.5 left-2.5 flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-slate-900/80 text-white text-[10px] font-medium backdrop-blur-md">
            <Users className="w-3 h-3 text-slate-300" />
            <span>{room.capacity} Seats</span>
          </div>
        </div>

        {/* Room Content */}
        <div className="space-y-1.5 px-1">
          <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
            {room.name}
          </h3>

          <div className="text-[11px] text-slate-500 space-y-1 font-medium">
            <div className="flex items-center space-x-3 text-slate-400">
              <span className="font-semibold text-indigo-600">{suiteId}</span>
              <span>•</span>
              <span className="flex items-center space-x-1 text-slate-500">
                <Clock className="w-3 h-3 text-slate-400" />
                <span>
                  {room.startTime && room.endTime
                    ? `${room.startTime} - ${room.endTime}`
                    : '10:00 AM - 6:00 PM'}
                </span>
              </span>
            </div>

            <div className="flex items-center space-x-1 text-slate-400 pt-0.5">
              <MapPin className="w-3 h-3 text-rose-500 shrink-0" />
              <span className="truncate">A-39, Downtown Main Hub</span>
            </div>
          </div>
        </div>
      </div>

      {/* Card Footer: Price & Selection Action Button */}
      <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between">
        <div>
          <span className="text-[11px] text-slate-400 block font-normal">From</span>
          <span className="text-sm font-extrabold text-slate-900">
            ₹{room.hourlyRate}{' '}
            <span className="text-[10px] font-normal text-slate-400">/hr</span>
          </span>
        </div>

        {isSelected ? (
          <button
            type="button"
            className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-pink-600 to-rose-600 shadow-md shadow-pink-500/25 flex items-center space-x-1.5 transition-all"
          >
            <span>Configure</span>
            <Settings className="w-3.5 h-3.5" />
          </button>
        ) : (
          <button
            type="button"
            className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-indigo-600 bg-indigo-50 border border-indigo-200/80 hover:bg-indigo-100 hover:border-indigo-300 flex items-center space-x-1 transition-all"
          >
            <span>Select Suite</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};
