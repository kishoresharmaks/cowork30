import React from 'react';

export const RoomCardSkeleton: React.FC = () => {
  return (
    <div className="glass-panel p-6 rounded-3xl space-y-4 border border-slate-800 animate-pulse">
      <div className="h-48 w-full rounded-2xl bg-slate-800/60" />
      <div className="space-y-2">
        <div className="h-6 w-2/3 rounded bg-slate-800/60" />
        <div className="h-4 w-1/2 rounded bg-slate-800/40" />
        <div className="h-4 w-1/3 rounded bg-slate-800/40" />
      </div>
    </div>
  );
};

export const SlotSelectorSkeleton: React.FC = () => {
  return (
    <div className="glass-panel p-6 rounded-2xl space-y-4 border border-slate-800 animate-pulse">
      <div className="h-5 w-48 rounded bg-slate-800/60 mb-4" />
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-14 rounded-xl bg-slate-800/40" />
        ))}
      </div>
    </div>
  );
};
