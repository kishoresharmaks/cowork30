import React from 'react';
import { FileText, Download, TrendingUp, Users } from 'lucide-react';
import StaffSidebar from '@/components/layout/StaffSidebar';

export default function StaffReportsPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex font-sans">
      <StaffSidebar />

      <main className="flex-1 p-8 overflow-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-black text-white">Daily Reception Summary Reports</h1>
            <p className="text-xs text-slate-400 mt-1">Export guest check-in logs, suite occupancy metrics, and front desk cash collection reports.</p>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
          <div className="flex items-center justify-between p-4 bg-slate-950/60 rounded-2xl border border-slate-800">
            <div>
              <div className="font-bold text-white text-xs">Daily Front-Desk Guest Attendance Log</div>
              <div className="text-[11px] text-slate-400">Contains 18 guest check-ins for today</div>
            </div>
            <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl flex items-center gap-2">
              <Download className="w-4 h-4" /> Export CSV
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
