'use client';

import React, { useState, useEffect } from 'react';
import StaffSidebar from '@/components/layout/StaffSidebar';
import {
  BarChart3,
  Download,
  FileSpreadsheet,
  TrendingUp,
  DollarSign,
  Users,
  Building2,
  Calendar,
  Wallet,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';

export default function StaffReportsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  async function fetchExecutiveSummary() {
    setLoading(true);
    try {
      const res = await apiClient.get('/reports/executive-summary');
      setData(res.data);
    } catch (err) {
      console.error('Failed to load executive reports', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchExecutiveSummary();
  }, []);

  // Download CSV File Function
  const handleDownloadCsv = async (type: 'bookings' | 'payments' | 'wallet') => {
    try {
      const response = await apiClient.get(`/reports/export-csv?type=${type}`, {
        responseType: 'blob',
      });

      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `cowork30_${type}_report.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert(`Failed to export ${type} CSV spreadsheet`);
    }
  };

  const metrics = data?.metrics || {};
  const recentTransactions = data?.recentTransactions || [];
  const pricingPlanRevenue = metrics.pricingPlanRevenue || [];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex font-sans selection:bg-purple-500 selection:text-white">
      <StaffSidebar />

      <main className="flex-1 p-6 sm:p-10 max-w-7xl mx-auto space-y-8 overflow-x-hidden relative">
        {/* Aceternity UI Glow Backdrop Effects */}
        <div className="absolute top-0 right-1/4 w-125 h-125 bg-purple-600/10 blur-[130px] rounded-full pointer-events-none" />
        <div className="absolute bottom-10 left-10 w-100 h-100 bg-emerald-600/10 blur-[110px] rounded-full pointer-events-none" />

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6 relative z-10">
          <div>
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-bold text-emerald-400 mb-2">
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Financial & Occupancy Analytics Engine</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Executive Reports & CSV Exports</h1>
            <p className="text-xs text-slate-400">Export financial ledgers, view desk vs meeting room revenue breakdowns, and analyze occupancy metrics.</p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleDownloadCsv('payments')}
              className="px-4 py-2.5 rounded-full text-xs font-bold text-white bg-gradient-brand hover:opacity-95 shadow-lg shadow-purple-500/20 flex items-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>Export Payments CSV</span>
            </button>
          </div>
        </div>

        {/* Quick CSV Export Download Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 relative z-10">
          <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex items-center justify-between space-x-3 hover:border-purple-500/50 transition-all">
            <div className="flex items-center space-x-3">
              <FileSpreadsheet className="w-8 h-8 text-purple-400 shrink-0" />
              <div>
                <h4 className="text-xs font-bold text-white">Meeting Suite Ledger CSV</h4>
                <p className="text-[10px] text-slate-400">Reservations & seat counts</p>
              </div>
            </div>

            <button
              onClick={() => handleDownloadCsv('bookings')}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-purple-400 hover:border-purple-500 text-xs font-semibold"
              title="Download CSV"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex items-center justify-between space-x-3 hover:border-emerald-500/50 transition-all">
            <div className="flex items-center space-x-3">
              <FileSpreadsheet className="w-8 h-8 text-emerald-400 shrink-0" />
              <div>
                <h4 className="text-xs font-bold text-white">Payment Transactions CSV</h4>
                <p className="text-[10px] text-slate-400">GST invoices & paid records</p>
              </div>
            </div>

            <button
              onClick={() => handleDownloadCsv('payments')}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-emerald-400 hover:border-emerald-500 text-xs font-semibold"
              title="Download CSV"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex items-center justify-between space-x-3 hover:border-rose-500/50 transition-all">
            <div className="flex items-center space-x-3">
              <FileSpreadsheet className="w-8 h-8 text-rose-400 shrink-0" />
              <div>
                <h4 className="text-xs font-bold text-white">Wallet Credit Ledger CSV</h4>
                <p className="text-[10px] text-slate-400">Member top-ups & debits</p>
              </div>
            </div>

            <button
              onClick={() => handleDownloadCsv('wallet')}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-rose-400 hover:border-rose-500 text-xs font-semibold"
              title="Download CSV"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Aceternity UI Executive Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-5 relative z-10">
          <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Platform Members</span>
            <div className="text-3xl font-black text-white flex items-center justify-between">
              <span>{metrics.totalUsers || 0}</span>
              <Users className="w-6 h-6 text-purple-400" />
            </div>
            <span className="text-[10px] text-slate-500 block">{metrics.memberUsers || 0} Members • {metrics.staffUsers || 0} Staff</span>
          </div>

          <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Total Desk Revenue</span>
            <div className="text-3xl font-black text-rose-400 flex items-center justify-between">
              <span>₹{Number(metrics.deskRevenue || 0).toLocaleString()}</span>
              <Calendar className="w-6 h-6 text-rose-400" />
            </div>
            <span className="text-[10px] text-slate-400 block">{metrics.totalDeskBookings || 0} Desk Solution Passes</span>
          </div>

          <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Meeting Suite Revenue</span>
            <div className="text-3xl font-black text-emerald-400 flex items-center justify-between">
              <span>₹{Number(metrics.meetingRevenue || 0).toLocaleString()}</span>
              <Building2 className="w-6 h-6 text-emerald-400" />
            </div>
            <span className="text-[10px] text-emerald-400/80 block">{metrics.totalMeetingBookings || 0} Suite Reservations</span>
          </div>

          <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Total Outstanding Wallet</span>
            <div className="text-3xl font-black text-amber-300 flex items-center justify-between">
              <span>₹{Number(metrics.totalWalletBalance || 0).toLocaleString()}</span>
              <Wallet className="w-6 h-6 text-amber-400" />
            </div>
            <span className="text-[10px] text-amber-400/80 block font-semibold">Available for Member 1-Click Booking</span>
          </div>
        </div>

        {/* Aceternity Styled Progress Meters & Recent Ledger Feed */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 relative z-10">
          {/* Revenue Breakdown Meter Card */}
          <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-6">
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400">Revenue Stream Analysis</span>
              <h3 className="text-xl font-extrabold text-white">Desk vs Meeting Suite Shares</h3>
            </div>

            <div className="space-y-5">
              {/* Desk Share Bar */}
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between font-bold">
                  <span className="text-slate-300">Workspace Desk Passes:</span>
                  <span className="text-rose-400 font-mono">
                    ₹{Number(metrics.deskRevenue || 0).toLocaleString()} (
                    {metrics.totalRevenue
                      ? Math.round((Number(metrics.deskRevenue || 0) / Number(metrics.totalRevenue)) * 100)
                      : 0}
                    %)
                  </span>
                </div>
                <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className="h-full bg-linear-to-r from-rose-500 to-purple-600 rounded-full transition-all duration-500"
                    style={{
                      width: `${
                        metrics.totalRevenue
                          ? Math.round((Number(metrics.deskRevenue || 0) / Number(metrics.totalRevenue)) * 100)
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>

              {/* Meeting Suite Share Bar */}
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between font-bold">
                  <span className="text-slate-300">Meeting Room Suites:</span>
                  <span className="text-emerald-400 font-mono">
                    ₹{Number(metrics.meetingRevenue || 0).toLocaleString()} (
                    {metrics.totalRevenue
                      ? Math.round((Number(metrics.meetingRevenue || 0) / Number(metrics.totalRevenue)) * 100)
                      : 0}
                    %)
                  </span>
                </div>
                <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className="h-full bg-linear-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
                    style={{
                      width: `${
                        metrics.totalRevenue
                          ? Math.round((Number(metrics.meetingRevenue || 0) / Number(metrics.totalRevenue)) * 100)
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Pricing Plan Revenue Breakdown */}
          <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-6">
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400">Pricing Analytics</span>
              <h3 className="text-xl font-extrabold text-white">Plan Revenue Breakdown</h3>
            </div>

            <div className="divide-y divide-slate-800/80 text-xs">
              {pricingPlanRevenue.length === 0 ? (
                <p className="py-8 text-center text-slate-500">No pricing plan revenue data yet.</p>
              ) : (
                pricingPlanRevenue.map((plan: any) => (
                  <div key={plan.planName} className="py-3 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-white">{plan.planName}</p>
                      <p className="text-[10px] text-slate-500">{plan.bookings} bookings</p>
                    </div>

                    <span className="font-mono font-bold text-rose-400">₹{Number(plan.revenue).toFixed(2)}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Recent Wallet Transactions Ledger */}
          <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Live Audit Stream</span>
                <h3 className="text-xl font-extrabold text-white">Recent Wallet Ledgers</h3>
              </div>
            </div>

            <div className="divide-y divide-slate-800/80 text-xs">
              {recentTransactions.length === 0 ? (
                <p className="py-8 text-center text-slate-500">No transaction ledgers recorded.</p>
              ) : (
                recentTransactions.map((tx: any) => (
                  <div key={tx.id} className="py-3 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-white">{tx.description}</p>
                      <p className="text-[10px] text-slate-500">
                        {tx.user?.name || 'Member'} • {new Date(tx.createdAt).toLocaleString()}
                      </p>
                    </div>

                    <span
                      className={`font-mono font-bold ${
                        tx.type === 'debit_booking' ? 'text-rose-400' : 'text-emerald-400'
                      }`}
                    >
                      {tx.type === 'debit_booking' ? '-' : '+'}₹{Number(tx.amount).toFixed(2)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
