import React from 'react';
import { Search, Zap } from 'lucide-react';

interface MeetingRoomHeroProps {
  categories: string[];
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  totalRoomsCount: number;
}

export const MeetingRoomHero: React.FC<MeetingRoomHeroProps> = ({
  categories,
  selectedCategory,
  onSelectCategory,
  searchQuery,
  onSearchChange,
  totalRoomsCount,
}) => {
  return (
    <div className="space-y-6">
      {/* Title & Description */}
      <div className="space-y-2">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight">
          Reserve Luxury{' '}
          <span className="bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 bg-clip-text text-transparent">
            Conference Suites
          </span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 max-w-xl leading-relaxed">
          Instant real-time suite reservations, suite capacity customization, flexible credits or wallet checkout, and digital QR access passes.
        </p>
      </div>

      {/* Search Input Bar with Purple Button */}
      <div className="relative max-w-md">
        <div className="flex items-center rounded-full bg-white border border-slate-200 shadow-sm p-1 focus-within:ring-2 focus-within:ring-indigo-500/40 focus-within:border-indigo-500 transition-all">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search suite by name or capacity..."
            className="w-full px-4 py-2 text-xs text-slate-800 placeholder-slate-400 bg-transparent focus:outline-none"
          />
          <button
            type="button"
            className="shrink-0 bg-indigo-600 hover:bg-indigo-700 text-white p-2.5 rounded-full shadow-md transition-all flex items-center justify-center cursor-pointer"
          >
            <Search className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center flex-wrap gap-2 pt-1">
        {categories.map((cat) => {
          const isActive = selectedCategory === cat;
          const label = cat === 'All' ? 'All Suites' : cat;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => onSelectCategory(cat)}
              className={`px-4 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20 scale-105'
                  : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
};
