'use client';

import React, { useState, useEffect } from 'react';
import StaffSidebar from '@/components/layout/StaffSidebar';
import {
  BarChart3,
  Download,
  FileSpreadsheet,
  Users,
  Building2,
  Calendar,
  Wallet,
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
    <div className="min-h-screen bg-[#0F172A] text-[#F8FAFC] flex font-sans selection:bg-[#6366F1] selection:text-white">
      <StaffSidebar />

      <main className="flex-1 p-4 sm:p-8 max-w-7xl mx-auto space-y-6 overflow-x-hidden pt-16 md:pt-8">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#334155] pb-5">
          <div>
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[#6366F1]/10 border border-[#6366F1]/30 text-xs font-bold text-[#6366F1] mb-2">
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Financial & Occupancy Analytics Terminal</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#F8FAFC]">Executive Reports & CSV Exports</h1>
            <p className="text-xs text-[#94A3B8]">
              Export financial ledgers, view desk vs meeting room revenue breakdowns, and analyze occupancy metrics.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleDownloadCsv('payments')}
              className="px-5 py-2.5 rounded-full text-xs font-bold text-white bg-[#6366F1] hover:bg-[#4F46E5] shadow-md flex items-center space-x-2 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Export Payments CSV</span>
            </button>
          </div>
        </div>

        {/* Quick CSV Export Download Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-[#1E293B] p-5 rounded-2xl border border-[#334155] flex items-center justify-between space-x-3 hover:border-[#6366F1] transition-all shadow-xs">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-[#6366F1]/10 text-[#6366F1] flex items-center justify-center border border-[#6366F1]/30">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-[#F8FAFC]">Meeting Suite Ledger CSV</h4>
                <p className="text-[10px] text-[#94A3B8]">Reservations & seat counts</p>
              </div>
            </div>

            <button
              onClick={() => handleDownloadCsv('bookings')}
              className="p-2 rounded-xl bg-[#0F172A] border border-[#334155] text-[#6366F1] hover:border-[#6366F1] text-xs font-semibold cursor-pointer"
              title="Download CSV"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>

          <div className="bg-[#1E293B] p-5 rounded-2xl border border-[#334155] flex items-center justify-between space-x-3 hover:border-[#10B981] transition-all shadow-xs">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-[#10B981]/10 text-[#10B981] flex items-center justify-center border border-[#10B981]/30">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-[#F8FAFC]">Payment Transactions CSV</h4>
                <p className="text-[10px] text-[#94A3B8]">GST invoices & paid records</p>
              </div>
            </div>

            <button
              onClick={() => handleDownloadCsv('payments')}
              className="p-2 rounded-xl bg-[#0F172A] border border-[#334155] text-[#10B981] hover:border-[#10B981] text-xs font-semibold cursor-pointer"
              title="Download CSV"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>

          <div className="bg-[#1E293B] p-5 rounded-2xl border border-[#334155] flex items-center justify-between space-x-3 hover:border-[#F43F5E] transition-all shadow-xs">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-[#F43F5E]/10 text-[#F43F5E] flex items-center justify-center border border-[#F43F5E]/30">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-[#F8FAFC]">Wallet Credit Ledger CSV</h4>
                <p className="text-[10px] text-[#94A3B8]">Member top-ups & debits</p>
              </div>
            </div>

            <button
              onClick={() => handleDownloadCsv('wallet')}
              className="p-2 rounded-xl bg-[#0F172A] border border-[#334155] text-[#F43F5E] hover:border-[#F43F5E] text-xs font-semibold cursor-pointer"
              title="Download CSV"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Executive Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-5">
          <div className="bg-[#1E293B] p-6 rounded-3xl border border-[#334155] space-y-2 hover:border-[#6366F1] transition-all shadow-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#94A3B8] block">Platform Members</span>
            <div className="text-3xl font-extrabold text-[#F8FAFC] flex items-center justify-between">
              <span>{metrics.totalUsers || 0}</span>
              <Users className="w-6 h-6 text-[#6366F1]" />
            </div>
            <span className="text-[10px] text-[#94A3B8] block">{metrics.memberUsers || 0} Members • {metrics.staffUsers || 0} Staff</span>
          </div>

          <div className="bg-[#1E293B] p-6 rounded-3xl border border-[#334155] space-y-2 hover:border-[#F43F5E] transition-all shadow-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#94A3B8] block">Total Desk Revenue</span>
            <div className="text-3xl font-extrabold text-[#F43F5E] flex items-center justify-between">
              <span>₹{Number(metrics.deskRevenue || 0).toLocaleString()}</span>
              <Calendar className="w-6 h-6 text-[#F43F5E]" />
            </div>
            <span className="text-[10px] text-[#94A3B8] block">{metrics.totalDeskBookings || 0} Desk Solution Passes</span>
          </div>

          <div className="bg-[#1E293B] p-6 rounded-3xl border border-[#334155] space-y-2 hover:border-[#10B981] transition-all shadow-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#94A3B8] block">Meeting Suite Revenue</span>
            <div className="text-3xl font-extrabold text-[#10B981] flex items-center justify-between">
              <span>₹{Number(metrics.meetingRevenue || 0).toLocaleString()}</span>
              <Building2 className="w-6 h-6 text-[#10B981]" />
            </div>
            <span className="text-[10px] text-[#10B981] block">{metrics.totalMeetingBookings || 0} Suite Reservations</span>
          </div>

          <div className="bg-[#1E293B] p-6 rounded-3xl border border-[#334155] space-y-2 hover:border-[#F59E0B] transition-all shadow-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#94A3B8] block">Total Outstanding Wallet</span>
            <div className="text-3xl font-extrabold text-[#F59E0B] flex items-center justify-between">
              <span>₹{Number(metrics.totalWalletBalance || 0).toLocaleString()}</span>
              <Wallet className="w-6 h-6 text-[#F59E0B]" />
            </div>
            <span className="text-[10px] text-[#F59E0B] block font-semibold">Available for Member 1-Click Booking</span>
          </div>
        </div>

        {/* Progress Meters & Recent Ledger Feed Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue Breakdown Meter Card */}
          <div className="bg-[#1E293B] p-6 sm:p-8 rounded-3xl border border-[#334155] space-y-6 shadow-xs">
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#6366F1]">Revenue Stream Analysis</span>
              <h3 className="text-xl font-extrabold text-[#F8FAFC]">Desk vs Meeting Suite Shares</h3>
            </div>

            <div className="space-y-5">
              {/* Desk Share Bar */}
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between font-bold">
                  <span className="text-[#CBD5E1]">Workspace Desk Passes:</span>
                  <span className="text-[#F43F5E] font-mono">
                    ₹{Number(metrics.deskRevenue || 0).toLocaleString()} (
                    {metrics.totalRevenue
                      ? Math.round((Number(metrics.deskRevenue || 0) / Number(metrics.totalRevenue)) * 100)
                      : 0}
                    %)
                  </span>
                </div>
                <div className="w-full h-3 bg-[#0F172A] rounded-full overflow-hidden border border-[#334155]">
                  <div
                    className="h-full bg-[#F43F5E] rounded-full transition-all duration-500"
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
                  <span className="text-[#CBD5E1]">Meeting Room Suites:</span>
                  <span className="text-[#10B981] font-mono">
                    ₹{Number(metrics.meetingRevenue || 0).toLocaleString()} (
                    {metrics.totalRevenue
                      ? Math.round((Number(metrics.meetingRevenue || 0) / Number(metrics.totalRevenue)) * 100)
                      : 0}
                    %)
                  </span>
                </div>
                <div className="w-full h-3 bg-[#0F172A] rounded-full overflow-hidden border border-[#334155]">
                  <div
                    className="h-full bg-[#10B981] rounded-full transition-all duration-500"
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
          <div className="bg-[#1E293B] p-6 sm:p-8 rounded-3xl border border-[#334155] space-y-6 shadow-xs">
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#F43F5E]">Pricing Analytics</span>
              <h3 className="text-xl font-extrabold text-[#F8FAFC]">Plan Revenue Breakdown</h3>
            </div>

            <div className="divide-y divide-[#334155] text-xs">
              {pricingPlanRevenue.length === 0 ? (
                <p className="py-8 text-center text-[#94A3B8]">No pricing plan revenue data yet.</p>
              ) : (
                pricingPlanRevenue.map((plan: any) => (
                  <div key={plan.planName} className="py-3 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-[#F8FAFC]">{plan.planName}</p>
                      <p className="text-[10px] text-[#94A3B8]">{plan.bookings} bookings</p>
                    </div>

                    <span className="font-mono font-bold text-[#F43F5E]">₹{Number(plan.revenue).toFixed(2)}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Recent Wallet Transactions Ledger */}
          <div className="bg-[#1E293B] p-6 sm:p-8 rounded-3xl border border-[#334155] space-y-6 lg:col-span-2 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#10B981]">Live Audit Stream</span>
                <h3 className="text-xl font-extrabold text-[#F8FAFC]">Recent Wallet Ledgers</h3>
              </div>
            </div>

            <div className="divide-y divide-[#334155] text-xs">
              {recentTransactions.length === 0 ? (
                <p className="py-8 text-center text-[#94A3B8]">No transaction ledgers recorded.</p>
              ) : (
                recentTransactions.map((tx: any) => (
                  <div key={tx.id} className="py-3 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-[#F8FAFC]">{tx.description}</p>
                      <p className="text-[10px] text-[#94A3B8]">
                        {tx.user?.name || 'Member'} • {new Date(tx.createdAt).toLocaleString()}
                      </p>
                    </div>

                    <span
                      className={`font-mono font-bold ${
                        tx.type === 'debit_booking' ? 'text-[#F43F5E]' : 'text-[#10B981]'
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
