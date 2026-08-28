'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import StaffSidebar from '@/components/layout/StaffSidebar';
import {
  LayoutDashboard,
  Clock,
  Building2,
  Calendar,
  CreditCard,
  QrCode,
  Users,
  ArrowRight,
  TrendingUp,
  Zap,
  BarChart3,
  Check,
  AlertCircle,
  ShieldCheck,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';

export default function StaffDashboardPage() {
  const [stats, setStats] = useState<any>({
    totalUsers: 0,
    memberUsers: 0,
    totalDeskBookings: 0,
    totalMeetingBookings: 0,
    totalRevenue: 0,
    pendingTopups: 0,
  });
  const [loading, setLoading] = useState(true);

  // Reception QR Check-In State
  const [qrCodeInput, setQrCodeInput] = useState('');
  const [checkInResult, setCheckInResult] = useState<any>(null);
  const [checkingIn, setCheckingIn] = useState(false);

  // Recent Bookings Feed State
  const [recentMeetingBookings, setRecentMeetingBookings] = useState<any[]>([]);

  async function fetchStaffDashboardData() {
    setLoading(true);
    try {
      const summaryRes = await apiClient.get('/reports/executive-summary');
      if (summaryRes.data?.metrics) {
        setStats(summaryRes.data.metrics);
      }

      const meetingRes = await apiClient.get('/bookings/meeting-rooms');
      setRecentMeetingBookings((meetingRes.data?.meetingBookings || []).slice(0, 5));
    } catch (err) {
      console.error('Failed to load staff dashboard metrics', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchStaffDashboardData();
  }, []);

  const handleVerifyQR = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!qrCodeInput) return;

    setCheckingIn(true);
    setCheckInResult(null);

    try {
      const res = await apiClient.post('/bookings/check-in', { accessCode: qrCodeInput });
      setCheckInResult({
        success: true,
        message: res.data?.message || 'Customer checked in successfully!',
        booking: res.data?.booking,
      });
      setQrCodeInput('');
      fetchStaffDashboardData();
    } catch (err: any) {
      setCheckInResult({
        success: false,
        message: err.response?.data?.message || 'Invalid or expired QR access code',
      });
    } finally {
      setCheckingIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0F172A] text-[#F8FAFC] flex font-sans selection:bg-[#6366F1] selection:text-white">
      <StaffSidebar />

      <main className="flex-1 p-4 sm:p-8 max-w-7xl mx-auto space-y-6 overflow-x-hidden pt-16 md:pt-8">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#334155] pb-5">
          <div>
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[#6366F1]/10 border border-[#6366F1]/30 text-xs font-bold text-[#6366F1] mb-2">
              <Zap className="w-3.5 h-3.5" />
              <span>Operations Control Terminal</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#F8FAFC]">Staff Operations Dashboard</h1>
            <p className="text-xs text-[#94A3B8]">
              Reception QR check-ins, manual payment proof verification, meeting room engines, and daily occupancy.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <Link
              href="/staff/wallet-requests"
              className="px-4 py-2.5 rounded-full text-xs font-bold text-white bg-[#6366F1] hover:bg-[#4F46E5] shadow-md flex items-center space-x-2 shrink-0 cursor-pointer"
            >
              <CreditCard className="w-4 h-4" />
              <span>Wallet Approvals ({stats.pendingTopups || 0})</span>
            </Link>
          </div>
        </div>

        {/* PENDING PROOF VERIFICATION ALERT BANNER */}
        {stats.pendingTopups > 0 && (
          <div className="p-5 rounded-3xl border border-[#F59E0B]/40 bg-[#F59E0B]/10 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-md">
            <div className="flex items-center space-x-3.5">
              <div className="w-10 h-10 rounded-2xl bg-[#F59E0B]/20 text-[#F59E0B] flex items-center justify-center font-bold border border-[#F59E0B]/30 shrink-0">
                <Clock className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-[#F8FAFC]">
                  {stats.pendingTopups} Pending Wallet Top-Up Request(s)
                </h3>
                <p className="text-xs text-[#94A3B8]">
                  Members have submitted bank/transfer receipt proofs awaiting staff approval.
                </p>
              </div>
            </div>

            <Link
              href="/staff/wallet-requests"
              className="px-5 py-2.5 rounded-full text-xs font-extrabold text-white bg-[#F59E0B] hover:bg-[#D97706] transition-all flex items-center space-x-2 shadow-md shrink-0 cursor-pointer"
            >
              <span>Review Verification Queue</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}

        {/* METRICS OVERVIEW CARDS GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-5">
          {/* Card 1 */}
          <div className="bg-[#1E293B] p-6 rounded-3xl border border-[#334155] space-y-2 hover:border-[#6366F1] transition-all shadow-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#94A3B8] block">Total Active Members</span>
            <div className="text-3xl font-extrabold text-[#F8FAFC] flex items-center justify-between">
              <span>{stats.memberUsers || 0}</span>
              <Users className="w-6 h-6 text-[#6366F1]" />
            </div>
            <span className="text-[10px] text-[#6366F1] block font-semibold">Platform Registered Community</span>
          </div>

          {/* Card 2 */}
          <div className="bg-[#1E293B] p-6 rounded-3xl border border-[#334155] space-y-2 hover:border-[#F43F5E] transition-all shadow-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#94A3B8] block">Desk Reservations</span>
            <div className="text-3xl font-extrabold text-[#F43F5E] flex items-center justify-between">
              <span>{stats.totalDeskBookings || 0}</span>
              <Calendar className="w-6 h-6 text-[#F43F5E]" />
            </div>
            <span className="text-[10px] text-[#94A3B8] block font-semibold">Solution Passes & Floor Desks</span>
          </div>

          {/* Card 3 */}
          <div className="bg-[#1E293B] p-6 rounded-3xl border border-[#334155] space-y-2 hover:border-[#10B981] transition-all shadow-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#94A3B8] block">Meeting Room Bookings</span>
            <div className="text-3xl font-extrabold text-[#10B981] flex items-center justify-between">
              <span>{stats.totalMeetingBookings || 0}</span>
              <Building2 className="w-6 h-6 text-[#10B981]" />
            </div>
            <span className="text-[10px] text-[#10B981] block font-semibold">Meeting Suite Slots Reserved</span>
          </div>

          {/* Card 4 */}
          <div className="bg-[#1E293B] p-6 rounded-3xl border border-[#334155] space-y-2 hover:border-[#F59E0B] transition-all shadow-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#94A3B8] block">Gross Platform Revenue</span>
            <div className="text-3xl font-extrabold text-[#F59E0B] flex items-center justify-between">
              <span>₹{Number(stats.totalRevenue || 0).toLocaleString()}</span>
              <TrendingUp className="w-6 h-6 text-[#F59E0B]" />
            </div>
            <span className="text-[10px] text-[#F59E0B] block font-semibold">Bookings & Wallet Ledgers</span>
          </div>
        </div>

        {/* Main Content Grid: Reception Check-In Widget + Recent Meeting Bookings Feed */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* RECEPTION QR CHECK-IN WIDGET */}
          <div className="bg-[#1E293B] p-6 sm:p-8 rounded-3xl border border-[#334155] space-y-6 shadow-xs">
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#6366F1]">Reception Desk Terminal</span>
              <h3 className="text-xl font-extrabold text-[#F8FAFC] flex items-center space-x-2">
                <QrCode className="w-5 h-5 text-[#6366F1]" />
                <span>Instant QR Access Code Check-In</span>
              </h3>
              <p className="text-xs text-[#94A3B8]">Verify customer QR code pass or enter manual 6-digit access code for instant check-in.</p>
            </div>

            {checkInResult && (
              <div
                className={`p-4 rounded-2xl border text-xs font-semibold flex items-start space-x-3 ${
                  checkInResult.success
                    ? 'bg-[#10B981]/10 border-[#10B981]/30 text-[#10B981]'
                    : 'bg-[#F43F5E]/10 border-[#F43F5E]/30 text-[#F43F5E]'
                }`}
              >
                {checkInResult.success ? <Check className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
                <div>
                  <p className="font-bold text-sm">{checkInResult.message}</p>
                  {checkInResult.booking && (
                    <p className="text-[11px] text-[#CBD5E1] mt-1">
                      Customer: {checkInResult.booking.customerName} ({checkInResult.booking.customerEmail})
                    </p>
                  )}
                </div>
              </div>
            )}

            <form onSubmit={handleVerifyQR} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#CBD5E1] mb-1.5">QR Access Code / Token</label>
                <div className="relative">
                  <QrCode className="w-5 h-5 text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={qrCodeInput}
                    onChange={(e) => setQrCodeInput(e.target.value.toUpperCase())}
                    placeholder="e.g. QR-8X92K1 or BK-MT7HDISN"
                    className="w-full bg-[#0F172A] border border-[#334155] rounded-2xl pl-12 pr-4 py-3.5 text-sm text-[#F8FAFC] font-mono uppercase tracking-wider focus:border-[#6366F1] focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={checkingIn}
                className="w-full py-3.5 rounded-full text-xs font-bold text-white bg-[#6366F1] hover:bg-[#4F46E5] shadow-md flex items-center justify-center space-x-2 cursor-pointer"
              >
                <span>{checkingIn ? 'Verifying Code...' : 'Verify Pass & Confirm Check-In'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>

          {/* RECENT MEETING SUITE RESERVATIONS FEED */}
          <div className="bg-[#1E293B] p-6 sm:p-8 rounded-3xl border border-[#334155] space-y-6 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#10B981]">Live Reservations Feed</span>
                <h3 className="text-xl font-extrabold text-[#F8FAFC]">Recent Meeting Rooms</h3>
              </div>

              <Link
                href="/staff/meeting-rooms"
                className="text-xs font-bold text-[#6366F1] hover:text-[#818CF8] flex items-center space-x-1"
              >
                <span>Manage All →</span>
              </Link>
            </div>

            <div className="divide-y divide-[#334155] text-xs">
              {recentMeetingBookings.length === 0 ? (
                <p className="py-8 text-center text-[#94A3B8]">No meeting room bookings recorded yet.</p>
              ) : (
                recentMeetingBookings.map((mb) => (
                  <div key={mb.id} className="py-3 flex items-center justify-between">
                    <div>
                      <span className="font-mono font-bold text-[#6366F1]">{mb.bookingCode}</span>
                      <h4 className="text-sm font-bold text-[#F8FAFC]">{mb.meetingRoom?.name}</h4>
                      <p className="text-[10px] text-[#94A3B8]">Customer: {mb.customerName} ({mb.customerPhone || 'N/A'})</p>
                    </div>

                    <div className="text-right space-y-1">
                      <span className="font-mono font-bold text-[#F8FAFC] block">₹{Number(mb.totalAmount).toFixed(2)}</span>
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/30">
                        {mb.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Quick Staff Navigation Links Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link
            href="/staff/wallet-requests"
            className="p-5 rounded-2xl bg-[#1E293B] border border-[#334155] hover:border-[#6366F1] transition-all flex items-center justify-between group shadow-xs"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-[#6366F1]/10 text-[#6366F1] flex items-center justify-center border border-[#6366F1]/30">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-[#F8FAFC]">Wallet Proof Approvals</h4>
                <p className="text-[10px] text-[#94A3B8]">Verify member top-up receipts</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-[#94A3B8] group-hover:text-[#6366F1] group-hover:translate-x-1 transition-all" />
          </Link>

          <Link
            href="/staff/bookings"
            className="p-5 rounded-2xl bg-[#1E293B] border border-[#334155] hover:border-[#F43F5E] transition-all flex items-center justify-between group shadow-xs"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-[#F43F5E]/10 text-[#F43F5E] flex items-center justify-center border border-[#F43F5E]/30">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-[#F8FAFC]">Desk & Tour Bookings</h4>
                <p className="text-[10px] text-[#94A3B8]">Manage member desk passes</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-[#94A3B8] group-hover:text-[#F43F5E] group-hover:translate-x-1 transition-all" />
          </Link>

          <Link
            href="/staff/reports"
            className="p-5 rounded-2xl bg-[#1E293B] border border-[#334155] hover:border-[#10B981] transition-all flex items-center justify-between group shadow-xs"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-[#10B981]/10 text-[#10B981] flex items-center justify-center border border-[#10B981]/30">
                <BarChart3 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-[#F8FAFC]">Executive Reports & CSV</h4>
                <p className="text-[10px] text-[#94A3B8]">Export financial ledgers</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-[#94A3B8] group-hover:text-[#10B981] group-hover:translate-x-1 transition-all" />
          </Link>
        </div>
      </main>
    </div>
  );
}
