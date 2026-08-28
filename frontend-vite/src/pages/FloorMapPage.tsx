import React, { useState, useEffect } from 'react';
import { Compass, CheckCircle2, AlertCircle, Info, Sparkles } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { apiClient } from '@/lib/api-client';
import { useBranch } from '@/context/BranchContext';

export default function FloorMapPage() {
  const { activeBranch } = useBranch();
  const [desks, setDesks] = useState<any[]>([]);
  const [selectedDesk, setSelectedDesk] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Generate interactive 2D desk coordinates demo data
    const mockDesks = Array.from({ length: 16 }).map((_, i) => ({
      id: i + 1,
      deskNumber: `D-${101 + i}`,
      deskType: i % 4 === 0 ? 'dedicated_desk' : 'hot_desk',
      status: i % 5 === 0 ? 'occupied' : i % 7 === 0 ? 'reserved' : 'available',
      monthlyPrice: i % 4 === 0 ? 449 : 199,
      dailyPrice: 25,
      hasPowerOutlet: true,
      hasWindowView: i % 2 === 0,
      x: (i % 4) * 160 + 40,
      y: Math.floor(i / 4) * 120 + 40,
    }));
    setDesks(mockDesks);
    setLoading(false);
  }, [activeBranch]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-28 lg:py-36 w-full">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-black text-slate-900">Interactive 2D Floor Layout & Desk Picker</h1>
            <p className="text-xs text-slate-500 mt-1">
              Select available hot desks or dedicated cabins in real time at {activeBranch ? activeBranch.name : 'Downtown Hub'}.
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs font-semibold">
            <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" /> Available</div>
            <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-amber-500 inline-block" /> Reserved</div>
            <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-rose-500 inline-block" /> Occupied</div>
          </div>
        </div>

        {/* 2D Canvas Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 bg-white rounded-3xl p-6 border border-slate-200 shadow-sm relative overflow-hidden min-h-[480px]">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Compass className="w-4 h-4 text-rose-500" /> Floor Level 1 - Open Workspace Zone
            </div>

            <div className="relative w-full h-[400px] bg-slate-50 rounded-2xl border border-slate-200/80 p-4 overflow-auto">
              <div className="grid grid-cols-4 gap-6">
                {desks.map((d) => {
                  const isSelected = selectedDesk?.id === d.id;
                  const isAvailable = d.status === 'available';
                  return (
                    <button
                      key={d.id}
                      disabled={!isAvailable}
                      onClick={() => setSelectedDesk(d)}
                      className={`h-24 rounded-2xl border-2 p-3 text-left transition-all flex flex-col justify-between ${
                        isSelected
                          ? 'border-rose-500 bg-rose-50 ring-4 ring-rose-500/20'
                          : d.status === 'occupied'
                          ? 'border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed opacity-60'
                          : d.status === 'reserved'
                          ? 'border-amber-200 bg-amber-50 text-amber-700'
                          : 'border-emerald-200 bg-emerald-50/50 hover:bg-emerald-100/60 text-slate-900'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold">{d.deskNumber}</span>
                        <span className="text-[10px] uppercase font-extrabold px-1.5 py-0.5 rounded bg-white/80">
                          {d.deskType === 'dedicated_desk' ? 'Dedicated' : 'Hot Desk'}
                        </span>
                      </div>

                      <div className="text-[11px] font-semibold text-slate-600">
                        ₹{d.monthlyPrice}/mo
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Seat Inspector Sidebar */}
          <div className="lg:col-span-4">
            {selectedDesk ? (
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Desk {selectedDesk.deskNumber}</h3>
                    <p className="text-xs text-slate-400 uppercase font-semibold">{selectedDesk.deskType.replace('_', ' ')}</p>
                  </div>
                  <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 font-bold text-xs rounded-full">
                    Available
                  </span>
                </div>

                <div className="space-y-2 text-xs text-slate-600">
                  <div className="flex justify-between"><span>Power Outlet:</span> <strong className="text-slate-900">Dedicated Port</strong></div>
                  <div className="flex justify-between"><span>Window View:</span> <strong className="text-slate-900">{selectedDesk.hasWindowView ? 'Yes' : 'Interior Zone'}</strong></div>
                  <div className="flex justify-between"><span>Monthly Pass:</span> <strong className="text-rose-600 font-bold">₹{selectedDesk.monthlyPrice}/mo</strong></div>
                </div>

                <button className="w-full py-3 bg-gradient-to-r from-rose-500 to-purple-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-rose-500/20">
                  Reserve Desk {selectedDesk.deskNumber}
                </button>
              </div>
            ) : (
              <div className="bg-white rounded-3xl p-8 border border-slate-200 text-center text-xs text-slate-400 space-y-2">
                <Info className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="font-semibold text-slate-600">Click any available green desk slot to inspect rates and reserve.</p>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
