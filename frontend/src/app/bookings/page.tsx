'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import {
  Calendar,
  Clock,
  Building2,
  Search,
  Download,
  Eye,
  FileText,
  Filter,
  MoreVertical,
  ShieldCheck,
  Armchair,
  Wallet,
  Users,
  Info,
  QrCode,
  MapPin,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { apiClient } from '@/lib/api-client';

// Date & Time Formatting Helpers
function formatDateWithDay(dateStr?: string | null): { date: string; day: string } {
  if (!dateStr) return { date: 'N/A', day: 'N/A' };
  const cleanStr = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
  const parts = cleanStr.split('-');
  let d: Date;
  if (parts.length === 3) {
    d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
  } else {
    d = new Date(dateStr);
  }

  if (isNaN(d.getTime())) return { date: cleanStr, day: '' };

  const dateFormatted = d.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
  const dayFormatted = d.toLocaleDateString('en-US', { weekday: 'long' });
  return { date: dateFormatted, day: dayFormatted };
}

function formatMeetingTimeSlot(startIso?: string | Date | null, endIso?: string | Date | null): { timeStr: string; durationHours: string } {
  if (!startIso || !endIso) return { timeStr: '10:00 AM - 06:00 PM', durationHours: '8h' };
  const s = new Date(startIso);
  const e = new Date(endIso);
  if (isNaN(s.getTime()) || isNaN(e.getTime())) return { timeStr: '10:00 AM - 06:00 PM', durationHours: '8h' };

  const isUtcIso = typeof startIso === 'string' && startIso.includes('Z');
  const sHours = isUtcIso ? s.getUTCHours() : s.getHours();
  const sMins = (isUtcIso ? s.getUTCMinutes() : s.getMinutes()).toString().padStart(2, '0');
  const sPeriod = sHours >= 12 ? 'PM' : 'AM';
  const s12 = sHours % 12 === 0 ? 12 : sHours % 12;

  const eHours = isUtcIso ? e.getUTCHours() : e.getHours();
  const eMins = (isUtcIso ? e.getUTCMinutes() : e.getMinutes()).toString().padStart(2, '0');
  const ePeriod = eHours >= 12 ? 'PM' : 'AM';
  const e12 = eHours % 12 === 0 ? 12 : eHours % 12;

  const diffMs = Math.max(0, e.getTime() - s.getTime());
  const hours = (diffMs / (1000 * 60 * 60)).toFixed(1).replace('.0', '');

  return {
    timeStr: `${s12}:${sMins} ${sPeriod} - ${e12}:${eMins} ${ePeriod}`,
    durationHours: `${hours}h`,
  };
}

function calculateDeskDuration(timeSlot?: string | null, notes?: string | null): string {
  const t = (timeSlot || '').trim();
  const n = (notes || '').trim().toLowerCase();

  if (n.includes('monthly') || n.includes('membership') || t.toLowerCase().includes('monthly')) {
    return '1 Month';
  }
  if (n.includes('weekly') || t.toLowerCase().includes('weekly')) {
    return '1 Week';
  }

  // Parse 12-hour time format like "8:00 AM - 8:00 PM" or "10:00 AM - 06:00 PM"
  const rangeMatch = t.match(/(\d{1,2}):(\d{2})\s*(AM|PM)\s*-\s*(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (rangeMatch) {
    let [_, h1Str, m1Str, p1, h2Str, m2Str, p2] = rangeMatch;
    let h1 = parseInt(h1Str, 10);
    let h2 = parseInt(h2Str, 10);
    const m1 = parseInt(m1Str, 10);
    const m2 = parseInt(m2Str, 10);

    if (p1.toUpperCase() === 'PM' && h1 < 12) h1 += 12;
    if (p1.toUpperCase() === 'AM' && h1 === 12) h1 = 0;
    if (p2.toUpperCase() === 'PM' && h2 < 12) h2 += 12;
    if (p2.toUpperCase() === 'AM' && h2 === 12) h2 = 0;

    let mins1 = h1 * 60 + m1;
    let mins2 = h2 * 60 + m2;

    if (mins2 < mins1) mins2 += 24 * 60; // Overflow into next day
    const diffHours = (mins2 - mins1) / 60;
    return `${diffHours % 1 === 0 ? Math.round(diffHours) : diffHours.toFixed(1)}h`;
  }

  if (t.toLowerCase().includes('morning') || t.toLowerCase().includes('afternoon')) {
    return '4h';
  }

  return '8h';
}

function getDeskTypeBadge(notes?: string) {
  const n = notes || '';
  if (n.toLowerCase().includes('dedicated') || n.includes('DD-')) {
    return { label: 'Dedicated Desk', class: 'bg-amber-50 text-amber-700 border-amber-200' };
  }
  if (n.toLowerCase().includes('cabin') || n.includes('C-')) {
    return { label: 'Cabin Desk', class: 'bg-sky-50 text-sky-700 border-sky-200' };
  }
  return { label: 'Hot Desk', class: 'bg-rose-50 text-rose-700 border-rose-200' };
}

function getStatusDisplayBadge(status: string) {
  switch (status) {
    case 'in_progress':
    case 'active':
      return { label: 'In Progress', class: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    case 'confirmed':
    case 'upcoming':
      return { label: 'Upcoming', class: 'bg-sky-50 text-sky-700 border-sky-200' };
    case 'completed':
      return { label: 'Completed', class: 'bg-emerald-100 text-emerald-800 border-emerald-300 font-extrabold' };
    case 'cancelled':
      return { label: 'Cancelled', class: 'bg-rose-50 text-rose-700 border-rose-200' };
    default:
      return { label: (status || 'Upcoming').toUpperCase(), class: 'bg-slate-100 text-slate-700 border-slate-200' };
  }
}

function MemberBookingsContent() {
  const router = useRouter();
  const { user, token, isLoading } = useAuth();

  const [deskBookings, setDeskBookings] = useState<any[]>([]);
  const [meetingBookings, setMeetingBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [filterType, setFilterType] = useState<'all' | 'desk' | 'meeting'>('all');
  const [deskSearch, setDeskSearch] = useState('');
  const [meetingSearch, setMeetingSearch] = useState('');
  const [deskStatusFilter, setDeskStatusFilter] = useState('');
  const [meetingStatusFilter, setMeetingStatusFilter] = useState('');

  // Pagination States
  const [deskPage, setDeskPage] = useState(1);
  const [meetingPage, setMeetingPage] = useState(1);
  const pageSize = 5;

  // Selected Pass Inspector Modal
  const [selectedPass, setSelectedPass] = useState<any>(null);

  useEffect(() => {
    if (!isLoading && !token) {
      router.push('/login');
    }
  }, [token, isLoading, router]);

  async function fetchMyReservations() {
    if (!token) return;
    setLoading(true);
    try {
      const res = await apiClient.get('/auth/my-bookings');
      setDeskBookings(res.data?.deskBookings || []);
      setMeetingBookings(res.data?.meetingBookings || []);
    } catch (err) {
      console.error('Failed to load my reservations', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (token) {
      fetchMyReservations();
    }
  }, [token]);

  // Export CSV Helper
  const handleExportCsv = () => {
    const rows = [
      ['Booking Code', 'Type', 'Title / Room', 'Date', 'Time Slot', 'Amount', 'Status'],
      ...deskBookings.map((b) => [
        b.bookingCode || `DESK-${b.id}`,
        'Desk Pass',
        b.notes || 'Day Pass Flex Desk',
        b.preferredDate || 'N/A',
        b.preferredTimeSlot || '10:00 AM - 06:00 PM',
        `₹${b.totalAmount || 0}`,
        b.status,
      ]),
      ...meetingBookings.map((mb) => [
        mb.bookingCode || `MEET-${mb.id}`,
        'Meeting Suite',
        mb.meetingRoom?.name || 'Conference Suite',
        mb.bookingDate || 'N/A',
        formatMeetingTimeSlot(mb.startTime, mb.endTime).timeStr,
        `₹${mb.totalAmount || 0}`,
        mb.status,
      ]),
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `my_reservations_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-[#FAFAFC] flex items-center justify-center text-slate-900 text-xs font-bold">
        Loading My Reservations...
      </div>
    );
  }

  // Filtered Lists
  const filteredDesks = deskBookings.filter((b) => {
    const matchSearch =
      !deskSearch ||
      (b.bookingCode || '').toLowerCase().includes(deskSearch.toLowerCase()) ||
      (b.notes || '').toLowerCase().includes(deskSearch.toLowerCase());
    const matchStatus = !deskStatusFilter || b.status === deskStatusFilter;
    return matchSearch && matchStatus;
  });

  const filteredMeetings = meetingBookings.filter((mb) => {
    const matchSearch =
      !meetingSearch ||
      (mb.bookingCode || '').toLowerCase().includes(meetingSearch.toLowerCase()) ||
      (mb.meetingRoom?.name || '').toLowerCase().includes(meetingSearch.toLowerCase());
    const matchStatus = !meetingStatusFilter || mb.status === meetingStatusFilter;
    return matchSearch && matchStatus;
  });

  // Pagination Math
  const totalDeskItems = filteredDesks.length;
  const totalDeskPages = Math.ceil(totalDeskItems / pageSize) || 1;
  const paginatedDesks = filteredDesks.slice((deskPage - 1) * pageSize, deskPage * pageSize);

  const totalMeetingItems = filteredMeetings.length;
  const totalMeetingPages = Math.ceil(totalMeetingItems / pageSize) || 1;
  const paginatedMeetings = filteredMeetings.slice((meetingPage - 1) * pageSize, meetingPage * pageSize);

  const totalCount = deskBookings.length + meetingBookings.length;

  return (
    <div className="min-h-screen bg-[#FAFAFC] text-slate-900 flex flex-col font-sans selection:bg-purple-600 selection:text-white">
      <Navbar />

      <main className="pt-4 sm:pt-6 pb-16 sm:pb-24 max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 w-full flex-grow space-y-6 sm:space-y-8">
        {/* Header Profile Banner Card */}
        <div className="bg-white p-5 sm:p-8 rounded-3xl border border-slate-200/90 shadow-xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5 relative overflow-hidden">
          <div className="flex items-center space-x-4 sm:space-x-5 relative z-10">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 flex items-center justify-center text-white text-2xl sm:text-3xl font-black shadow-lg shrink-0 border-2 border-white">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover rounded-2xl" />
              ) : (
                user.name.charAt(0).toUpperCase()
              )}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-3xl font-extrabold text-slate-900">{user.name}</h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200/80 flex items-center space-x-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  <span>Active Member</span>
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {user.email} • {user.phone || '+91 98765 43210'}
              </p>
              <p className="text-[11px] text-slate-400">Member since 12 Jan 2025</p>
            </div>
          </div>

          {/* Stat Cards: Stacked on Mobile, 3 Columns on Tablet/Desktop */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full lg:w-auto border-t lg:border-t-0 pt-4 lg:pt-0 border-slate-100">
            <div className="px-4 py-3 sm:px-5 sm:py-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-left flex items-center justify-between space-x-3">
              <div>
                <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider block">Desk Credits</span>
                <span className="text-lg sm:text-xl font-black text-emerald-600 block">{user.deskCreditsBalance || '12.00'}</span>
              </div>
              <div className="w-9 h-9 rounded-xl bg-emerald-100/60 text-emerald-600 flex items-center justify-center shrink-0">
                <Armchair className="w-5 h-5" />
              </div>
            </div>

            <div className="px-4 py-3 sm:px-5 sm:py-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-left flex items-center justify-between space-x-3">
              <div>
                <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider block">Meeting Credits</span>
                <span className="text-lg sm:text-xl font-black text-indigo-600 block">{user.meetingCreditsBalance || '5.00'}</span>
              </div>
              <div className="w-9 h-9 rounded-xl bg-indigo-100/60 text-indigo-600 flex items-center justify-center shrink-0">
                <Users className="w-5 h-5" />
              </div>
            </div>

            <div className="px-4 py-3 sm:px-5 sm:py-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-left flex items-center justify-between space-x-3">
              <div>
                <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider block">Wallet Balance</span>
                <span className="text-lg sm:text-xl font-black text-purple-600 block truncate">₹{user.walletBalance ? Number(user.walletBalance).toLocaleString() : '249.00'}</span>
              </div>
              <div className="w-9 h-9 rounded-xl bg-purple-100/60 text-purple-600 flex items-center justify-center shrink-0">
                <Wallet className="w-5 h-5" />
              </div>
            </div>
          </div>
        </div>

        {/* Top Filter Pills & CSV Export Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2 overflow-x-auto pb-1 sm:pb-0 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setFilterType('all')}
              className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center space-x-2 shrink-0 cursor-pointer ${
                filterType === 'all'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>All Reservations</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] ${filterType === 'all' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'}`}>
                {totalCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setFilterType('desk')}
              className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center space-x-2 shrink-0 cursor-pointer ${
                filterType === 'desk'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Armchair className="w-3.5 h-3.5" />
              <span>Desk Passes</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] ${filterType === 'desk' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'}`}>
                {deskBookings.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setFilterType('meeting')}
              className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center space-x-2 shrink-0 cursor-pointer ${
                filterType === 'meeting'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Meeting Passes</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] ${filterType === 'meeting' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'}`}>
                {meetingBookings.length}
              </span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleExportCsv}
            className="w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-extrabold text-indigo-600 bg-white border border-indigo-200 hover:bg-indigo-50 transition-all flex items-center justify-center space-x-2 shrink-0 cursor-pointer shadow-xs"
          >
            <Download className="w-4 h-4" />
            <span>Export Report</span>
          </button>
        </div>

        {/* SECTION 1: DESK & WORKSPACE RESERVATIONS TABLE */}
        {(filterType === 'all' || filterType === 'desk') && (
          <div className="bg-white rounded-3xl border border-slate-200/90 overflow-hidden shadow-xs space-y-4 p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
                  <Armchair className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base sm:text-lg font-extrabold text-slate-900">Desk & Workspace Reservations</h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-50 text-purple-600 border border-purple-100">
                      {filteredDesks.length} Bookings
                    </span>
                  </div>
                </div>
              </div>

              {/* Filters & Search */}
              <div className="flex items-center space-x-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-64">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={deskSearch}
                    onChange={(e) => {
                      setDeskSearch(e.target.value);
                      setDeskPage(1);
                    }}
                    placeholder="Search desk, ID or type..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-purple-600"
                  />
                </div>

                <select
                  value={deskStatusFilter}
                  onChange={(e) => {
                    setDeskStatusFilter(e.target.value);
                    setDeskPage(1);
                  }}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-700 focus:outline-none focus:border-purple-600 cursor-pointer"
                >
                  <option value="">All Status</option>
                  <option value="confirmed">Upcoming</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            {loading ? (
              <div className="py-12 text-center text-xs text-slate-400">Loading desk reservations...</div>
            ) : filteredDesks.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">No desk workspace reservations found.</div>
            ) : (
              <>
                {/* Mobile Cards (sm:hidden) */}
                <div className="block sm:hidden space-y-3">
                  {paginatedDesks.map((b) => {
                    const typeBadge = getDeskTypeBadge(b.notes);
                    const dateObj = formatDateWithDay(b.preferredDate);
                    const statusBadge = getStatusDisplayBadge(b.status);
                    const durationText = calculateDeskDuration(b.preferredTimeSlot, b.notes);

                    return (
                      <div key={b.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${typeBadge.class}`}>
                            {typeBadge.label}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${statusBadge.class}`}>
                            {statusBadge.label}
                          </span>
                        </div>

                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-extrabold text-slate-900 text-sm">{b.bookingCode || `D-${b.id}`}</p>
                            <p className="text-[11px] text-slate-500 flex items-center space-x-1 mt-0.5">
                              <MapPin className="w-3 h-3 text-indigo-500 inline shrink-0" />
                              <span>A-39, Downtown Main Hub</span>
                            </p>
                          </div>
                          <span className="font-black text-slate-900 text-sm">₹{Number(b.totalAmount || 128.5).toFixed(2)}</span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 bg-white p-2.5 rounded-xl border border-slate-100">
                          <div>
                            <span className="text-[9px] font-bold text-slate-400 uppercase block">Date</span>
                            <span className="font-bold text-slate-800">{dateObj.date}</span>
                          </div>
                          <div>
                            <span className="text-[9px] font-bold text-slate-400 uppercase block">Time / Duration</span>
                            <span className="font-bold text-slate-800">{b.preferredTimeSlot || '10:00 AM - 06:00 PM'} ({durationText})</span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => setSelectedPass(b)}
                          className="w-full py-2 rounded-xl text-xs font-extrabold text-indigo-600 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 transition-all flex items-center justify-center space-x-1 cursor-pointer"
                        >
                          {b.status === 'completed' || b.status === 'cancelled' ? (
                            <>
                              <FileText className="w-3.5 h-3.5" />
                              <span>View Details</span>
                            </>
                          ) : (
                            <>
                              <Eye className="w-3.5 h-3.5" />
                              <span>View Digital Pass</span>
                            </>
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>

                {/* Desktop / Tablet Table View (hidden sm:block) */}
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                        <th className="pb-3 px-3">Type</th>
                        <th className="pb-3 px-3">Desk / Workspace</th>
                        <th className="pb-3 px-3">Date</th>
                        <th className="pb-3 px-3">Time</th>
                        <th className="pb-3 px-3">Duration</th>
                        <th className="pb-3 px-3">Status</th>
                        <th className="pb-3 px-3 text-right">Amount</th>
                        <th className="pb-3 px-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {paginatedDesks.map((b) => {
                        const typeBadge = getDeskTypeBadge(b.notes);
                        const dateObj = formatDateWithDay(b.preferredDate);
                        const statusBadge = getStatusDisplayBadge(b.status);
                        const durationText = calculateDeskDuration(b.preferredTimeSlot, b.notes);

                        return (
                          <tr key={b.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-4 px-3">
                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold border ${typeBadge.class}`}>
                                {typeBadge.label}
                              </span>
                            </td>

                            <td className="py-4 px-3">
                              <p className="font-extrabold text-slate-900">{b.bookingCode || `D-${b.id}`}</p>
                              <p className="text-[10px] text-slate-500 flex items-center space-x-1 mt-0.5">
                                <MapPin className="w-3 h-3 text-indigo-500 inline shrink-0" />
                                <span>A-39, Downtown Main Hub</span>
                              </p>
                            </td>

                            <td className="py-4 px-3">
                              <div className="flex items-center space-x-2">
                                <Calendar className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                                <div>
                                  <p className="font-bold text-slate-900">{dateObj.date}</p>
                                  <p className="text-[10px] text-slate-400">{dateObj.day}</p>
                                </div>
                              </div>
                            </td>

                            <td className="py-4 px-3">
                              <div className="flex items-center space-x-2">
                                <Clock className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                                <span className="font-semibold text-slate-700">{b.preferredTimeSlot || '10:00 AM - 06:00 PM'}</span>
                              </div>
                            </td>

                            <td className="py-4 px-3 font-bold text-slate-900">{durationText}</td>

                            <td className="py-4 px-3">
                              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${statusBadge.class}`}>
                                {statusBadge.label}
                              </span>
                            </td>

                            <td className="py-4 px-3 text-right font-black text-slate-900">
                              ₹{Number(b.totalAmount || 128.5).toFixed(2)}
                            </td>

                            <td className="py-4 px-3 text-right space-x-1">
                              <button
                                type="button"
                                onClick={() => setSelectedPass(b)}
                                className="px-3 py-1.5 rounded-full text-[11px] font-extrabold text-indigo-600 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 transition-all inline-flex items-center space-x-1 cursor-pointer"
                              >
                                {b.status === 'completed' || b.status === 'cancelled' ? (
                                  <>
                                    <FileText className="w-3 h-3" />
                                    <span>View Details</span>
                                  </>
                                ) : (
                                  <>
                                    <Eye className="w-3 h-3" />
                                    <span>View Pass</span>
                                  </>
                                )}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Desk Reservations Pagination Footer */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100 text-xs">
                  <span className="text-slate-500 font-medium text-center sm:text-left">
                    Showing {totalDeskItems > 0 ? (deskPage - 1) * pageSize + 1 : 0} to {Math.min(deskPage * pageSize, totalDeskItems)} of {totalDeskItems} entries
                  </span>
                  <div className="flex items-center space-x-1">
                    <button
                      type="button"
                      disabled={deskPage <= 1}
                      onClick={() => setDeskPage((prev) => Math.max(1, prev - 1))}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-bold text-slate-700 disabled:opacity-40 hover:bg-slate-50 transition-all cursor-pointer text-xs"
                    >
                      ‹ Previous
                    </button>
                    {Array.from({ length: totalDeskPages }, (_, i) => i + 1).map((pageNum) => (
                      <button
                        key={pageNum}
                        type="button"
                        onClick={() => setDeskPage(pageNum)}
                        className={`w-8 h-8 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          deskPage === pageNum
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    ))}
                    <button
                      type="button"
                      disabled={deskPage >= totalDeskPages}
                      onClick={() => setDeskPage((prev) => Math.min(totalDeskPages, prev + 1))}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-bold text-slate-700 disabled:opacity-40 hover:bg-slate-50 transition-all cursor-pointer text-xs"
                    >
                      Next ›
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* SECTION 2: MEETING ROOM RESERVATIONS TABLE */}
        {(filterType === 'all' || filterType === 'meeting') && (
          <div className="bg-white rounded-3xl border border-slate-200/90 overflow-hidden shadow-xs space-y-4 p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base sm:text-lg font-extrabold text-slate-900">Meeting Room Reservations</h3>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-50 text-indigo-600 border border-indigo-100">
                      {filteredMeetings.length} Bookings
                    </span>
                  </div>
                </div>
              </div>

              {/* Filters & Search */}
              <div className="flex items-center space-x-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-64">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={meetingSearch}
                    onChange={(e) => {
                      setMeetingSearch(e.target.value);
                      setMeetingPage(1);
                    }}
                    placeholder="Search room or meeting..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600"
                  />
                </div>

                <select
                  value={meetingStatusFilter}
                  onChange={(e) => {
                    setMeetingStatusFilter(e.target.value);
                    setMeetingPage(1);
                  }}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-700 focus:outline-none focus:border-indigo-600 cursor-pointer"
                >
                  <option value="">All Status</option>
                  <option value="confirmed">Upcoming</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            {loading ? (
              <div className="py-12 text-center text-xs text-slate-400">Loading meeting room reservations...</div>
            ) : filteredMeetings.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">No meeting suite reservations found.</div>
            ) : (
              <>
                {/* Mobile Cards View (sm:hidden) */}
                <div className="block sm:hidden space-y-3">
                  {paginatedMeetings.map((mb) => {
                    const dateObj = formatDateWithDay(mb.bookingDate);
                    const timeInfo = formatMeetingTimeSlot(mb.startTime, mb.endTime);
                    const statusBadge = getStatusDisplayBadge(mb.status);

                    return (
                      <div key={mb.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-200">
                            Meeting Suite
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${statusBadge.class}`}>
                            {statusBadge.label}
                          </span>
                        </div>

                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-extrabold text-slate-900 text-sm">{mb.meetingRoom?.name || 'Executive Suite'}</p>
                            <p className="text-[11px] text-slate-500 font-mono">{mb.bookingCode}</p>
                            <p className="text-[11px] text-slate-500 flex items-center space-x-1 mt-0.5">
                              <MapPin className="w-3 h-3 text-indigo-500 inline shrink-0" />
                              <span>A-39, Downtown Hub - 2nd Floor</span>
                            </p>
                          </div>
                          <span className="font-black text-slate-900 text-sm">₹{Number(mb.totalAmount || 299).toFixed(2)}</span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 bg-white p-2.5 rounded-xl border border-slate-100">
                          <div>
                            <span className="text-[9px] font-bold text-slate-400 uppercase block">Date</span>
                            <span className="font-bold text-slate-800">{dateObj.date}</span>
                          </div>
                          <div>
                            <span className="text-[9px] font-bold text-slate-400 uppercase block">Time / Duration</span>
                            <span className="font-bold text-slate-800">{timeInfo.timeStr} ({timeInfo.durationHours})</span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => setSelectedPass(mb)}
                          className="w-full py-2 rounded-xl text-xs font-extrabold text-indigo-600 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 transition-all flex items-center justify-center space-x-1 cursor-pointer"
                        >
                          {mb.status === 'completed' || mb.status === 'cancelled' ? (
                            <>
                              <FileText className="w-3.5 h-3.5" />
                              <span>View Details</span>
                            </>
                          ) : (
                            <>
                              <Eye className="w-3.5 h-3.5" />
                              <span>View Digital Pass</span>
                            </>
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>

                {/* Desktop / Tablet Table View (hidden sm:block) */}
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                        <th className="pb-3 px-3">Room / Meeting</th>
                        <th className="pb-3 px-3">Location / Floor</th>
                        <th className="pb-3 px-3">Date</th>
                        <th className="pb-3 px-3">Time</th>
                        <th className="pb-3 px-3">Duration</th>
                        <th className="pb-3 px-3">Status</th>
                        <th className="pb-3 px-3 text-right">Amount</th>
                        <th className="pb-3 px-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {paginatedMeetings.map((mb) => {
                        const dateObj = formatDateWithDay(mb.bookingDate);
                        const timeInfo = formatMeetingTimeSlot(mb.startTime, mb.endTime);
                        const statusBadge = getStatusDisplayBadge(mb.status);

                        return (
                          <tr key={mb.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-4 px-3">
                              <div className="flex items-center space-x-2">
                                <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                                  <Building2 className="w-4 h-4" />
                                </div>
                                <div>
                                  <p className="font-extrabold text-slate-900">{mb.meetingRoom?.name || 'Executive Suite'}</p>
                                  <p className="text-[10px] text-slate-400 font-mono">{mb.bookingCode}</p>
                                </div>
                              </div>
                            </td>

                            <td className="py-4 px-3 text-slate-600 font-medium">
                              <p className="flex items-center space-x-1">
                                <MapPin className="w-3 h-3 text-indigo-500 shrink-0" />
                                <span>A-39, Downtown Hub - 2nd Floor</span>
                              </p>
                            </td>

                            <td className="py-4 px-3">
                              <div className="flex items-center space-x-2">
                                <Calendar className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                                <div>
                                  <p className="font-bold text-slate-900">{dateObj.date}</p>
                                  <p className="text-[10px] text-slate-400">{dateObj.day}</p>
                                </div>
                              </div>
                            </td>

                            <td className="py-4 px-3">
                              <div className="flex items-center space-x-2">
                                <Clock className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                                <span className="font-semibold text-slate-700">{timeInfo.timeStr}</span>
                              </div>
                            </td>

                            <td className="py-4 px-3 font-bold text-slate-900">{timeInfo.durationHours}</td>

                            <td className="py-4 px-3">
                              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${statusBadge.class}`}>
                                {statusBadge.label}
                              </span>
                            </td>

                            <td className="py-4 px-3 text-right font-black text-slate-900">
                              ₹{Number(mb.totalAmount || 299).toFixed(2)}
                            </td>

                            <td className="py-4 px-3 text-right space-x-1">
                              <button
                                type="button"
                                onClick={() => setSelectedPass(mb)}
                                className="px-3 py-1.5 rounded-full text-[11px] font-extrabold text-indigo-600 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 transition-all inline-flex items-center space-x-1 cursor-pointer"
                              >
                                {mb.status === 'completed' || mb.status === 'cancelled' ? (
                                  <>
                                    <FileText className="w-3 h-3" />
                                    <span>View Details</span>
                                  </>
                                ) : (
                                  <>
                                    <Eye className="w-3 h-3" />
                                    <span>View Pass</span>
                                  </>
                                )}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Meeting Room Reservations Pagination Footer */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100 text-xs">
                  <span className="text-slate-500 font-medium text-center sm:text-left">
                    Showing {totalMeetingItems > 0 ? (meetingPage - 1) * pageSize + 1 : 0} to {Math.min(meetingPage * pageSize, totalMeetingItems)} of {totalMeetingItems} entries
                  </span>
                  <div className="flex items-center space-x-1">
                    <button
                      type="button"
                      disabled={meetingPage <= 1}
                      onClick={() => setMeetingPage((prev) => Math.max(1, prev - 1))}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-bold text-slate-700 disabled:opacity-40 hover:bg-slate-50 transition-all cursor-pointer text-xs"
                    >
                      ‹ Previous
                    </button>
                    {Array.from({ length: totalMeetingPages }, (_, i) => i + 1).map((pageNum) => (
                      <button
                        key={pageNum}
                        type="button"
                        onClick={() => setMeetingPage(pageNum)}
                        className={`w-8 h-8 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          meetingPage === pageNum
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    ))}
                    <button
                      type="button"
                      disabled={meetingPage >= totalMeetingPages}
                      onClick={() => setMeetingPage((prev) => Math.min(totalMeetingPages, prev + 1))}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-bold text-slate-700 disabled:opacity-40 hover:bg-slate-50 transition-all cursor-pointer text-xs"
                    >
                      Next ›
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Footer Note */}
        <div className="flex items-center justify-center space-x-1.5 text-xs text-slate-400 text-center">
          <Info className="w-4 h-4 text-slate-400" />
          <span>All times shown are in your local timezone. For support, contact system administrator.</span>
        </div>

        {/* PASS INSPECTOR MODAL */}
        {selectedPass && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <div className="bg-white p-6 sm:p-8 rounded-3xl max-w-md w-full border border-slate-200 shadow-2xl space-y-5 relative max-h-[90vh] overflow-y-auto">
              <button
                type="button"
                onClick={() => setSelectedPass(null)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-900 text-sm font-bold p-1.5 rounded-full bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center space-x-3 border-b border-slate-100 pb-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-mono font-black text-lg border border-indigo-100">
                  {selectedPass.bookingCode ? 'QR' : '#'}
                </div>
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-600">
                    Pass Reference: {selectedPass.bookingCode || `#${selectedPass.id}`}
                  </span>
                  <h3 className="text-lg font-extrabold text-slate-900">
                    {selectedPass.meetingRoom?.name || selectedPass.notes || 'Day Pass Flex Desk'}
                  </h3>
                </div>
              </div>

              {/* Digital QR Code Box */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-center space-y-3">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(
                    selectedPass.qrAccessCode || selectedPass.bookingCode || 'QR-PASS'
                  )}`}
                  alt="QR Access Code"
                  className="w-32 h-32 object-contain mx-auto bg-white p-2 rounded-xl border border-slate-200 shadow-xs"
                />
                <p className="text-[11px] font-mono font-extrabold text-slate-700">
                  {selectedPass.qrAccessCode || selectedPass.bookingCode}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-0.5">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Date</span>
                  <p className="font-extrabold text-slate-900">{formatDateWithDay(selectedPass.bookingDate || selectedPass.preferredDate).date}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-0.5">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Total Paid</span>
                  <p className="font-extrabold text-emerald-600">₹{Number(selectedPass.totalAmount || 0).toFixed(2)}</p>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between">
                <Link
                  href={`/meeting-rooms/receipt/${selectedPass.receiptToken || selectedPass.bookingCode}`}
                  className="px-4 py-2.5 rounded-full text-xs font-extrabold text-white bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 hover:opacity-95 shadow-md flex items-center space-x-1.5"
                >
                  <QrCode className="w-4 h-4" />
                  <span>Print Digital Receipt ↗</span>
                </Link>

                <button
                  type="button"
                  onClick={() => setSelectedPass(null)}
                  className="px-4 py-2.5 rounded-full text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

export default function MemberBookingsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FAFAFC] flex items-center justify-center text-slate-900 text-xs font-bold">
          Loading My Reservations...
        </div>
      }
    >
      <MemberBookingsContent />
    </Suspense>
  );
}
