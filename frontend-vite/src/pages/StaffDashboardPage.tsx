import React from 'react';
import { UserCheck, Clock, CheckCircle2, AlertCircle, Calendar } from 'lucide-react';
import StaffSidebar from '@/components/layout/StaffSidebar';

export default function StaffDashboardPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex font-sans">
      <StaffSidebar />

      <main className="flex-1 p-8 overflow-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-black text-white">Reception Desk Portal</h1>
            <p className="text-xs text-slate-400 mt-1">Manage guest check-ins, meeting suite arrivals, and front desk cash wallet top-ups.</p>
          </div>
          <span className="px-3 py-1 bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 text-xs font-bold rounded-full">
            ● Reception Active
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
            <div className="text-xs font-bold text-slate-400 uppercase">Today's Check-Ins</div>
            <div className="text-3xl font-black text-indigo-400 mt-2">18 Guests</div>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
            <div className="text-xs font-bold text-slate-400 uppercase">Suite Reservations</div>
            <div className="text-3xl font-black text-emerald-400 mt-2">6 Active</div>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
            <div className="text-xs font-bold text-slate-400 uppercase">Pending Wallet Approvals</div>
            <div className="text-3xl font-black text-amber-400 mt-2">2 Requests</div>
          </div>
        </div>
      </main>
    </div>
  );
}
