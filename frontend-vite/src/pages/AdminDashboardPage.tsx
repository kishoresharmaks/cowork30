import React, { useState, useEffect } from 'react';
import {
  Users,
  Grid,
  Calendar,
  Wallet,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  MapPin,
  ShieldCheck,
} from 'lucide-react';
import AdminSidebar from '@/components/layout/AdminSidebar';
import { apiClient } from '@/lib/api-client';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({
    totalUsers: 48,
    totalBookings: 124,
    revenueThisMonth: 184500,
    activeHubs: 3,
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex font-sans">
      <AdminSidebar />

      <main className="flex-1 p-8 overflow-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-black text-white">Enterprise Administration Overview</h1>
            <p className="text-xs text-slate-400 mt-1">Real-time occupancy rates, revenue metrics, and booking audit logs.</p>
          </div>

          <div className="flex items-center gap-2 text-xs font-bold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-3 py-1.5 rounded-full">
            ● Enterprise Node Active
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
            <div className="text-xs font-bold text-slate-400 uppercase">Total Members</div>
            <div className="text-3xl font-black text-white mt-2">{stats.totalUsers}</div>
            <div className="text-[11px] text-emerald-400 font-semibold mt-2 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" /> +12% from last month
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
            <div className="text-xs font-bold text-slate-400 uppercase">Active Bookings</div>
            <div className="text-3xl font-black text-rose-500 mt-2">{stats.totalBookings}</div>
            <div className="text-[11px] text-slate-400 mt-2">Occupancy rate 84%</div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
            <div className="text-xs font-bold text-slate-400 uppercase">Monthly Revenue</div>
            <div className="text-3xl font-black text-emerald-400 mt-2">₹{stats.revenueThisMonth.toLocaleString()}</div>
            <div className="text-[11px] text-emerald-400 font-semibold mt-2 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" /> GST Tax Compliant
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
            <div className="text-xs font-bold text-slate-400 uppercase">Active Hubs</div>
            <div className="text-3xl font-black text-purple-400 mt-2">{stats.activeHubs}</div>
            <div className="text-[11px] text-slate-400 mt-2">Downtown, Sector 62, Westside</div>
          </div>
        </div>

        {/* Quick Admin Actions */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
          <h3 className="text-sm font-bold text-white mb-4">Recent Platform Audit Logs</h3>
          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-950/60 border border-slate-800">
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Booking Suite #MB-2026-088 Confirmed for Executive Tech Team</span>
              </div>
              <span className="text-slate-500 text-[10px]">2 mins ago</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-950/60 border border-slate-800">
              <div className="flex items-center gap-3">
                <Wallet className="w-4 h-4 text-purple-400" />
                <span>Wallet Credit Request ₹5,000 Approved for user #42</span>
              </div>
              <span className="text-slate-500 text-[10px]">14 mins ago</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
