import React, { useState } from 'react';
import { X, Users, Clock, MapPin, Sparkles, CheckCircle2, ShieldCheck, Tag, Building2, ArrowRight } from 'lucide-react';
import { MeetingRoom } from '../types';

interface RoomDetailsModalProps {
  room: MeetingRoom | null;
  isOpen: boolean;
  onClose: () => void;
  onSelectSuite?: (room: MeetingRoom) => void;
}

const DEFAULT_ROOM_IMAGE =
  'https://images.unsplash.com/photo-1517502884422-41eaead166d4?auto=format&fit=crop&w=600&q=80';

// Helper to parse dynamic amenities array/JSON from DB
function parseRealAmenities(amenitiesRaw: any): string[] {
  if (!amenitiesRaw) return [];
  if (Array.isArray(amenitiesRaw)) {
    return amenitiesRaw.map((a) => (typeof a === 'string' ? a : String(a?.name || a))).filter(Boolean);
  }
  if (typeof amenitiesRaw === 'string') {
    try {
      const parsed = JSON.parse(amenitiesRaw);
      if (Array.isArray(parsed)) {
        return parsed.map((a) => (typeof a === 'string' ? a : String(a?.name || a))).filter(Boolean);
      }
    } catch (e) {
      return amenitiesRaw.split(',').map((s) => s.trim()).filter(Boolean);
    }
  }
  return [];
}

// Helper to parse dynamic images array/JSON from DB
function parseRealImages(room: MeetingRoom): string[] {
  const images: string[] = [];
  if (room.imageUrl && room.imageUrl.trim()) images.push(room.imageUrl);
  if (room.featuredImage && room.featuredImage.trim()) images.push(room.featuredImage);

  const imagesRaw = room.images;
  if (Array.isArray(imagesRaw)) {
    imagesRaw.forEach((img) => {
      if (typeof img === 'string' && img.trim()) images.push(img);
    });
  } else if (typeof imagesRaw === 'string' && imagesRaw.trim()) {
    try {
      const parsed = JSON.parse(imagesRaw);
      if (Array.isArray(parsed)) {
        parsed.forEach((img) => {
          if (typeof img === 'string' && img.trim()) images.push(img);
        });
      } else {
        images.push(imagesRaw);
      }
    } catch (e) {
      images.push(imagesRaw);
    }
  }

  const unique = Array.from(new Set(images));
  return unique.length > 0 ? unique : [DEFAULT_ROOM_IMAGE];
}

export const RoomDetailsModal: React.FC<RoomDetailsModalProps> = ({
  room,
  isOpen,
  onClose,
  onSelectSuite,
}) => {
  const [activeImageIndex, setActiveImageIndex] = useState<number>(0);

  if (!isOpen || !room) return null;

  const roomImages = parseRealImages(room);
  const activeImage = roomImages[activeImageIndex] || roomImages[0] || DEFAULT_ROOM_IMAGE;
  const realAmenities = parseRealAmenities(room.amenities);

  const minSeats = room.minSeats || 1;
  const maxSeats = room.maxSeats || room.capacity || 10;
  const branchName = room.branch?.name || '';
  const branchCity = room.branch?.city || '';
  const locationDisplay = [branchName, branchCity].filter(Boolean).join(' • ');

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        
        {/* Modal Header with Photo Banner */}
        <div className="relative h-48 sm:h-56 w-full bg-slate-900 shrink-0">
          <img
            src={activeImage}
            alt={room.name}
            onError={(e) => {
              (e.target as HTMLImageElement).src = DEFAULT_ROOM_IMAGE;
            }}
            className="w-full h-full object-cover opacity-90 transition-all duration-300"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent" />

          {/* Close Button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-slate-900/60 text-white hover:bg-slate-900 flex items-center justify-center backdrop-blur-md transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Category Badge */}
          {room.category && (
            <span className="absolute top-3 left-3 text-[10px] font-extrabold px-2.5 py-1 rounded-lg bg-indigo-600 text-white backdrop-blur-md uppercase tracking-wider">
              {room.category}
            </span>
          )}

          {/* Title & Rate Banner on Overlay */}
          <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between">
            <div>
              <h2 className="text-xl font-black text-white leading-tight drop-shadow-sm">
                {room.name}
              </h2>
              {locationDisplay && (
                <p className="text-xs text-slate-300 flex items-center space-x-1.5 mt-0.5 font-medium">
                  <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                  <span>{locationDisplay}</span>
                </p>
              )}
            </div>

            <div className="text-right shrink-0 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/20">
              <span className="text-[10px] text-slate-300 block uppercase font-bold">Hourly Rate</span>
              <span className="text-base font-black text-rose-400">₹{room.hourlyRate}<span className="text-xs font-normal text-white">/hr</span></span>
            </div>
          </div>
        </div>

        {/* Multi-Photo Carousel Strip if multiple photos exist in DB */}
        {roomImages.length > 1 && (
          <div className="flex items-center space-x-2 px-4 py-2 bg-slate-900 border-t border-slate-800 overflow-x-auto shrink-0 no-scrollbar">
            {roomImages.map((imgUrl, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setActiveImageIndex(idx)}
                className={`w-12 h-9 rounded-lg overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${
                  activeImageIndex === idx ? 'border-indigo-500 scale-105' : 'border-transparent opacity-60 hover:opacity-100'
                }`}
              >
                <img src={imgUrl} alt={`Room photo ${idx + 1}`} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}

        {/* Scrollable Modal Content */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs flex-1">
          
          {/* Real Database Specs Grid */}
          <div className="grid grid-cols-3 gap-2 p-2.5 bg-slate-50 rounded-2xl border border-slate-100 text-slate-700 font-semibold">
            <div className="text-center p-1.5 bg-white rounded-xl border border-slate-100 shadow-2xs">
              <span className="text-[10px] text-slate-400 block font-normal flex items-center justify-center space-x-1">
                <Users className="w-3 h-3 text-indigo-600" />
                <span>Capacity</span>
              </span>
              <span className="text-xs font-bold text-slate-900 mt-0.5 block">{minSeats}-{maxSeats} Seats</span>
            </div>

            <div className="text-center p-1.5 bg-white rounded-xl border border-slate-100 shadow-2xs">
              <span className="text-[10px] text-slate-400 block font-normal flex items-center justify-center space-x-1">
                <Clock className="w-3 h-3 text-indigo-600" />
                <span>Operating Hours</span>
              </span>
              <span className="text-xs font-bold text-slate-900 mt-0.5 block">
                {room.startTime && room.endTime ? `${room.startTime} - ${room.endTime}` : '24/7 Access'}
              </span>
            </div>

            <div className="text-center p-1.5 bg-white rounded-xl border border-slate-100 shadow-2xs">
              <span className="text-[10px] text-slate-400 block font-normal flex items-center justify-center space-x-1">
                <Tag className="w-3 h-3 text-indigo-600" />
                <span>Seat Price</span>
              </span>
              <span className="text-xs font-bold text-slate-900 mt-0.5 block">
                {room.perSeatPrice && Number(room.perSeatPrice) > 0 ? `+₹${room.perSeatPrice}/seat` : 'Base Included'}
              </span>
            </div>
          </div>

          {/* Real Description Section */}
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-slate-900 flex items-center space-x-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>Suite Overview</span>
            </h4>
            <p className="text-slate-600 leading-relaxed text-xs">
              {room.description || 'No detailed description specified for this meeting suite.'}
            </p>
          </div>

          {/* Real Database Amenities Section */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <h4 className="text-xs font-bold text-slate-900 flex items-center space-x-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
              <span>Included Amenities</span>
            </h4>

            {realAmenities.length > 0 ? (
              <div className="grid grid-cols-2 gap-2">
                {realAmenities.map((item, idx) => (
                  <div key={idx} className="flex items-center space-x-2 p-2 rounded-xl bg-slate-50 border border-slate-100">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span className="text-[11px] font-semibold text-slate-700 truncate">{item}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-400 italic text-[11px]">No specific amenities listed for this suite.</p>
            )}
          </div>

        </div>

        {/* Modal Footer CTA */}
        <div className="p-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between shrink-0">
          <div>
            <span className="text-[10px] text-slate-400 block font-medium">Reservation Rate</span>
            <span className="text-xs font-bold text-slate-900">₹{room.hourlyRate}/hr</span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              Close
            </button>
            {onSelectSuite && (
              <button
                type="button"
                onClick={() => {
                  onSelectSuite(room);
                  onClose();
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-500/20 transition-all flex items-center space-x-1 cursor-pointer"
              >
                <span>Select & Configure</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
