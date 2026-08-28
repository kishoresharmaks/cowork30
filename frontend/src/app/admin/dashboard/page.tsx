'use client';

import React, { useState, useEffect } from 'react';
import AdminSidebar from '@/components/layout/AdminSidebar';
import {
  Calendar,
  Users,
  DollarSign,
  Clock,
  TrendingUp,
  ShieldCheck,
  Activity,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({
    totalBookings: 0,
    activeMembers: 0,
    roomOccupancyRate: 0,
    monthlyRevenue: 0,
  });

  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboardStats() {
      try {
        const res = await apiClient.get('/bookings/stats/dashboard');
        if (res.data.success) {
          setStats(res.data.stats);
          setRecentActivity(res.data.recentActivity || []);
        }
      } catch (err) {
        console.error('Failed to load dashboard stats:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchDashboardStats();
  }, []);

  return (
    <div className="min-h-screen bg-[#0F172A] text-[#F8FAFC] flex font-sans selection:bg-[#6366F1] selection:text-white">
      <AdminSidebar />

      {/* Main Admin Content */}
      <main className="flex-grow p-4 sm:p-8 space-y-6 overflow-y-auto pt-16 md:pt-8">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#334155] pb-5">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#6366F1]">
              Admin Control Center
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#F8FAFC] mt-0.5">
              Executive Analytics & Control
            </h1>
          </div>

          <div className="flex items-center space-x-2 text-xs font-bold text-[#10B981] bg-[#10B981]/10 border border-[#10B981]/30 px-3 py-1.5 rounded-full w-fit">
            <ShieldCheck className="w-4 h-4" />
            <span>NestJS Live API Connected</span>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="bg-[#1E293B] p-6 rounded-2xl space-y-2 border border-[#334155] shadow-xs">
            <div className="flex items-center justify-between text-xs text-[#CBD5E1] font-semibold">
              <span>Total Revenue</span>
              <DollarSign className="w-4 h-4 text-[#10B981]" />
            </div>
            <div className="text-2xl font-extrabold text-[#F8FAFC]">
              ₹{stats.monthlyRevenue.toLocaleString()}
            </div>
            <div className="flex items-center space-x-1 text-[10px] text-[#10B981] font-bold">
              <TrendingUp className="w-3 h-3" />
              <span>Real-time DB Sync</span>
            </div>
          </div>

          <div className="bg-[#1E293B] p-6 rounded-2xl space-y-2 border border-[#334155] shadow-xs">
            <div className="flex items-center justify-between text-xs text-[#CBD5E1] font-semibold">
              <span>Total Bookings</span>
              <Calendar className="w-4 h-4 text-[#6366F1]" />
            </div>
            <div className="text-2xl font-extrabold text-[#F8FAFC]">{stats.totalBookings}</div>
            <div className="text-[10px] text-[#94A3B8]">Active tours & passes</div>
          </div>

          <div className="bg-[#1E293B] p-6 rounded-2xl space-y-2 border border-[#334155] shadow-xs">
            <div className="flex items-center justify-between text-xs text-[#CBD5E1] font-semibold">
              <span>Registered Members</span>
              <Users className="w-4 h-4 text-[#6366F1]" />
            </div>
            <div className="text-2xl font-extrabold text-[#F8FAFC]">{stats.activeMembers}</div>
            <div className="text-[10px] text-[#94A3B8]">Member accounts</div>
          </div>

          <div className="bg-[#1E293B] p-6 rounded-2xl space-y-2 border border-[#334155] shadow-xs">
            <div className="flex items-center justify-between text-xs text-[#CBD5E1] font-semibold">
              <span>Room Occupancy</span>
              <Clock className="w-4 h-4 text-[#F59E0B]" />
            </div>
            <div className="text-2xl font-extrabold text-[#F8FAFC]">{stats.roomOccupancyRate}%</div>
            <div className="text-[10px] text-[#94A3B8]">Live slot utilization</div>
          </div>
        </div>

        {/* Real-time System Activity Feed */}
        <div className="bg-[#1E293B] p-6 sm:p-8 rounded-3xl space-y-4 border border-[#334155] shadow-xs">
          <div className="flex items-center space-x-2">
            <Activity className="w-4 h-4 text-[#6366F1]" />
            <h3 className="text-base font-extrabold text-[#F8FAFC]">Live System Activity Stream</h3>
          </div>

          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-14 bg-[#0F172A] rounded-xl border border-[#334155] animate-pulse" />
              ))}
            </div>
          ) : recentActivity.length === 0 ? (
            <p className="text-xs text-[#94A3B8] py-6 text-center">No recent activity recorded yet.</p>
          ) : (
            <div className="space-y-2.5 text-xs">
              {recentActivity.map((act) => (
                <div
                  key={act.id}
                  className="p-3.5 rounded-xl bg-[#0F172A] border border-[#334155] flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                >
                  <div>
                    <p className="font-bold text-[#F8FAFC]">{act.title}</p>
                    <p className="text-[10px] text-[#94A3B8]">{act.subtitle}</p>
                  </div>
                  <div className="flex items-center space-x-3 shrink-0">
                    <span className="text-[10px] text-[#94A3B8]">
                      {new Date(act.date).toLocaleDateString()}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded uppercase font-extrabold text-[10px] border ${
                        act.status === 'confirmed'
                          ? 'bg-[#10B981]/15 text-[#10B981] border-[#10B981]/30'
                          : act.status === 'pending'
                          ? 'bg-[#F59E0B]/15 text-[#F59E0B] border-[#F59E0B]/30'
                          : 'bg-[#F43F5E]/15 text-[#F43F5E] border-[#F43F5E]/30'
                      }`}
                    >
                      {act.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
