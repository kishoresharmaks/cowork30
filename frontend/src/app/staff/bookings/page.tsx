'use client';

import React, { useState, useEffect } from 'react';
import StaffSidebar from '@/components/layout/StaffSidebar';
import {
  Calendar,
  Clock,
  Eye,
  Plus,
  Search,
  Building2,
  ScanLine,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';

function formatBookingDateDisplay(dateStr?: string | null): string {
  if (!dateStr) return 'N/A';
  const cleanStr = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
  const parts = cleanStr.split('-');
  if (parts.length === 3) {
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const d = new Date(year, month, day);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    }
  }
  const d = new Date(dateStr);
  if (!isNaN(d.getTime())) {
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }
  return cleanStr;
}

function getStatusBadgeClass(status: string) {
  switch (status) {
    case 'unpaid':
      return 'border-[#F59E0B] text-[#F59E0B] bg-[#F59E0B]/10';
    case 'pending':
      return 'border-[#38BDF8] text-[#38BDF8] bg-[#38BDF8]/10';
    case 'confirmed':
      return 'border-[#10B981] text-[#10B981] bg-[#10B981]/10';
    case 'completed':
      return 'border-[#6366F1] text-[#6366F1] bg-[#6366F1]/10';
    case 'not_checked_in':
      return 'border-[#F43F5E] text-[#F43F5E] bg-[#F43F5E]/10';
    case 'cancelled':
      return 'border-[#64748B] text-[#94A3B8] bg-[#64748B]/10';
    default:
      return 'border-[#334155] text-[#CBD5E1] bg-[#0F172A]';
  }
}

function getStatusDisplayLabel(status: string) {
  switch (status) {
    case 'unpaid':
      return 'UNPAID';
    case 'pending':
      return 'PENDING';
    case 'confirmed':
      return 'CONFIRMED';
    case 'completed':
      return 'COMPLETED';
    case 'not_checked_in':
      return 'NOT CHECKED-IN';
    case 'cancelled':
      return 'CANCELLED';
    default:
      return (status || '').toUpperCase();
  }
}

function parseBookingDetails(booking: any) {
  if (!booking) return { type: 'plan', title: 'Day Pass / Flex Desk' };

  const notes = booking.notes || '';
  const isSrv = booking.bookingCode?.startsWith('SRV-') || notes.includes('Solution:');
  const isDesk = notes.includes('Desk #') || notes.includes('Floor Map');

  if (isSrv) {
    const solutionMatch = notes.match(/Solution:\s*([^|]+)/i);
    const seatsMatch = notes.match(/Seats:\s*(\d+)/i);
    const notesMatch = notes.match(/Notes:\s*(.*)/i);

    const serviceName = solutionMatch ? solutionMatch[1].trim() : 'Workspace Solution';
    const seats = seatsMatch ? parseInt(seatsMatch[1], 10) : 1;
    const userNotes = notesMatch && notesMatch[1].trim() !== 'N/A' ? notesMatch[1].trim() : null;

    return {
      type: 'service',
      serviceName,
      seats,
      userNotes,
      rawNotes: notes,
    };
  }

  if (isDesk) {
    const deskMatch = notes.match(/Desk\s*#([A-Za-z0-9-]+)/i);
    const typeMatch = notes.match(/\(([^)]+)\)/);
    const rateMatch = notes.match(/Rate:\s*₹?([^\/|]+)(\/[a-zA-Z]+)?/i);

    return {
      type: 'desk',
      deskNumber: deskMatch ? deskMatch[1] : 'Desk',
      deskType: typeMatch ? typeMatch[1].replace('_', ' ') : 'Desk',
      rate: rateMatch ? rateMatch[0].replace('Rate:', '').trim() : undefined,
      rawNotes: notes,
    };
  }

  return {
    type: 'plan',
    planName: booking.pricingPlan?.name || (notes.includes('|') ? notes.split('|')[0].trim() : 'Day Pass / Flex Desk'),
    rawNotes: notes,
  };
}

function getPaymentMethodDisplay(booking: any) {
  if (booking?.payments && booking.payments.length > 0) {
    const p = booking.payments[0];
    if (p.paymentMethod === 'razorpay') return 'Razorpay Online Gateway';
    if (p.paymentMethod === 'wallet' || p.paymentMethod === 'credits') return 'Credit Wallet Balance';
    if (p.paymentMethod === 'cash') return 'Cash / Reception Desk';
    return String(p.paymentMethod).toUpperCase();
  }
  if (booking?.paymentMethod) {
    if (booking.paymentMethod === 'razorpay') return 'Razorpay Online Gateway';
    if (booking.paymentMethod === 'wallet' || booking.paymentMethod === 'credits') return 'Credit Wallet Balance';
    if (booking.paymentMethod === 'cash' || booking.paymentMethod === 'reception') return 'Cash / Reception Desk';
  }
  if (booking?.notes && booking.notes.includes('Wallet')) return 'Credit Wallet Balance';
  if (booking?.notes && booking.notes.includes('Razorpay')) return 'Razorpay Online Gateway';
  return 'Cash / Reception Desk';
}

function formatMeetingTimeSlot(startIso?: string | Date | null, endIso?: string | Date | null): string {
  if (!startIso || !endIso) return 'Standard Reserved Slot';
  const s = new Date(startIso);
  const e = new Date(endIso);
  if (isNaN(s.getTime()) || isNaN(e.getTime())) return 'Standard Reserved Slot';

  const isUtcIso = typeof startIso === 'string' && startIso.includes('Z');
  const sHours = isUtcIso ? s.getUTCHours() : s.getHours();
  const sMins = (isUtcIso ? s.getUTCMinutes() : s.getMinutes()).toString().padStart(2, '0');
  const sPeriod = sHours >= 12 ? 'PM' : 'AM';
  const s12 = sHours % 12 === 0 ? 12 : sHours % 12;
  const startStr = `${s12}:${sMins} ${sPeriod}`;

  const eHours = isUtcIso ? e.getUTCHours() : e.getHours();
  const eMins = (isUtcIso ? e.getUTCMinutes() : e.getMinutes()).toString().padStart(2, '0');
  const ePeriod = eHours >= 12 ? 'PM' : 'AM';
  const e12 = eHours % 12 === 0 ? 12 : eHours % 12;
  const endStr = `${e12}:${eMins} ${ePeriod}`;

  return `${startStr} - ${endStr}`;
}

function getMeetingPaymentMethodDisplay(mb: any) {
  if (mb?.creditsUsed && Number(mb.creditsUsed) > 0) {
    return 'Meeting Credits';
  }
  if (mb?.payments && mb.payments.length > 0) {
    const p = mb.payments[0];
    if (p.paymentMethod === 'razorpay') return 'Razorpay Online Gateway';
    if (p.paymentMethod === 'wallet') return 'Credit Wallet Balance';
    if (p.paymentMethod === 'credits') return 'Meeting Credits';
    if (p.paymentMethod === 'cash') return 'Cash / Reception Desk';
    return String(p.paymentMethod).toUpperCase();
  }
  if (mb?.paymentStatus === 'paid' && Number(mb.totalAmount) === 0) {
    return 'Meeting Credits';
  }
  return 'Razorpay Online Gateway';
}

export default function StaffBookingsPage() {
  const [activeTab, setActiveTab] = useState<'regular' | 'meeting'>('regular');
  const [bookings, setBookings] = useState<any[]>([]);
  const [meetingBookings, setMeetingBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Viewing Detail Modals
  const [viewingBooking, setViewingBooking] = useState<any>(null);
  const [viewingMeetingBooking, setViewingMeetingBooking] = useState<any>(null);

  // Completion Confirmation Modal State
  const [pendingCompletionBooking, setPendingCompletionBooking] = useState<{ id: number; type: 'desk' | 'meeting'; code: string } | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Reception QR Scanner Modal
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [scanCode, setScanCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [checkInResult, setCheckInResult] = useState<any>(null);
  const [checkInError, setCheckInError] = useState('');

  // Walk-In Booking Modal State
  const [showNewModal, setShowNewModal] = useState(false);
  const [walkInType, setWalkInType] = useState<'desk' | 'meeting'>('desk');
  const [newForm, setNewForm] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    companyName: '',
    pricingPlanId: 0,
    meetingRoomId: 1,
    bookingDate: new Date().toISOString().split('T')[0],
    startTime: '10:00',
    endTime: '11:00',
    seatsBooked: 1,
    paymentMethod: 'cash',
    totalAmount: 250,
  });
  const [pricingPlans, setPricingPlans] = useState<any[]>([]);
  const [meetingRoomsCatalog, setMeetingRoomsCatalog] = useState<any[]>([]);
  const [submittingNew, setSubmittingNew] = useState(false);

  async function loadData() {
    setLoading(true);
    try {
      if (activeTab === 'regular') {
        const query = new URLSearchParams();
        if (search) query.set('search', search);
        if (statusFilter) query.set('status', statusFilter);
        const res = await apiClient.get(`/bookings?${query.toString()}`);
        const rawList = res.data.bookings || res.data.data || [];
        const deskOnlyList = rawList.filter((b: any) => {
          const isSrv = b.bookingCode?.startsWith('SRV-') || (b.notes && b.notes.includes('Solution:'));
          return !isSrv;
        });
        setBookings(deskOnlyList);
      } else {
        const res = await apiClient.get('/bookings/meeting-rooms');
        setMeetingBookings(res.data.meetingBookings || res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to load bookings:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [activeTab, statusFilter]);

  useEffect(() => {
    async function loadCatalogs() {
      try {
        const [plansRes, roomsRes] = await Promise.all([
          apiClient.get('/pricing/plans'),
          apiClient.get('/meeting-rooms'),
        ]);
        setPricingPlans(plansRes.data || []);
        setMeetingRoomsCatalog(roomsRes.data || []);
      } catch (err) {
        console.error('Failed to load catalogs', err);
      }
    }
    loadCatalogs();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadData();
  };

  const handleDeskStatusChange = async (id: number, status: string) => {
    if (status === 'completed') {
      const b = bookings.find((item) => item.id === id);
      setPendingCompletionBooking({ id, type: 'desk', code: b?.bookingCode || `#${id}` });
      return;
    }

    try {
      await apiClient.put(`/bookings/${id}/status`, { status });
      loadData();
      if (viewingBooking?.id === id) {
        setViewingBooking((prev: any) => ({ ...prev, status }));
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update booking status');
    }
  };

  const handleMeetingStatusChange = async (id: number, status: string) => {
    if (status === 'completed') {
      const mb = meetingBookings.find((item) => item.id === id);
      setPendingCompletionBooking({ id, type: 'meeting', code: mb?.bookingCode || `#${id}` });
      return;
    }

    try {
      await apiClient.put(`/bookings/meeting-rooms/${id}/status`, { status });
      loadData();
      if (viewingMeetingBooking?.id === id) {
        setViewingMeetingBooking((prev: any) => ({ ...prev, status }));
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update meeting booking status');
    }
  };

  const handleConfirmCompletion = async () => {
    if (!pendingCompletionBooking) return;
    setUpdatingStatus(true);
    try {
      if (pendingCompletionBooking.type === 'desk') {
        await apiClient.put(`/bookings/${pendingCompletionBooking.id}/status`, { status: 'completed' });
      } else {
        await apiClient.put(`/bookings/meeting-rooms/${pendingCompletionBooking.id}/status`, { status: 'completed' });
      }
      setPendingCompletionBooking(null);
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to complete booking');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleVerifyPassCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scanCode.trim()) return;

    setVerifying(true);
    setCheckInError('');
    setCheckInResult(null);

    try {
      const res = await apiClient.post('/bookings/check-in', { passCode: scanCode.trim() });
      if (res.data?.success) {
        setCheckInResult(res.data.booking);
        loadData();
      } else {
        setCheckInError(res.data?.message || 'Invalid QR pass code');
      }
    } catch (err: any) {
      setCheckInError(err.response?.data?.message || 'Verification failed. Pass code not found.');
    } finally {
      setVerifying(false);
    }
  };

  const handleCreateWalkIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingNew(true);
    try {
      if (walkInType === 'desk') {
        await apiClient.post('/bookings', {
          customerName: newForm.customerName,
          customerEmail: newForm.customerEmail,
          customerPhone: newForm.customerPhone,
          companyName: newForm.companyName,
          pricingPlanId: newForm.pricingPlanId || pricingPlans[0]?.id,
          preferredDate: newForm.bookingDate,
          paymentMethod: newForm.paymentMethod,
          totalAmount: newForm.totalAmount,
          notes: `Walk-In Booking | Paid via ${newForm.paymentMethod.toUpperCase()}`,
        });
      } else {
        const bDateStr = newForm.bookingDate || new Date().toISOString().split('T')[0];
        const [sh, sm] = (newForm.startTime || '10:00').split(':').map((v) => v.padStart(2, '0'));
        const [eh, em] = (newForm.endTime || '11:00').split(':').map((v) => v.padStart(2, '0'));

        const isoStart = `${bDateStr}T${sh}:${sm}:00.000Z`;
        const isoEnd = `${bDateStr}T${eh}:${em}:00.000Z`;

        await apiClient.post('/bookings/meeting-rooms', {
          customerName: newForm.customerName,
          customerEmail: newForm.customerEmail,
          customerPhone: newForm.customerPhone,
          companyName: newForm.companyName,
          meetingRoomId: newForm.meetingRoomId || meetingRoomsCatalog[0]?.id,
          bookingDate: bDateStr,
          selectedSlots: [isoStart],
          startTime: isoStart,
          endTime: isoEnd,
          seatsBooked: newForm.seatsBooked,
          paymentMethod: newForm.paymentMethod,
          totalAmount: newForm.totalAmount,
        });
      }
      alert('Walk-in booking created successfully!');
      setShowNewModal(false);
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to create walk-in booking');
    } finally {
      setSubmittingNew(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0F172A] text-[#F8FAFC] flex font-sans selection:bg-[#6366F1] selection:text-white">
      <StaffSidebar />

      <main className="flex-1 p-4 sm:p-8 max-w-7xl mx-auto space-y-6 overflow-x-hidden pt-16 md:pt-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#334155] pb-5">
          <div>
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[#6366F1]/10 border border-[#6366F1]/30 text-xs font-bold text-[#6366F1] mb-2">
              <Calendar className="w-3.5 h-3.5" />
              <span>Desk, Tour & Suite Operations</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#F8FAFC]">Staff Bookings Control Console</h1>
            <p className="text-xs text-[#94A3B8]">Audit live reservations, verify guest check-ins, manage payment states, and view details.</p>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <button
              type="button"
              onClick={() => setShowNewModal(true)}
              className="px-4 py-2.5 rounded-full text-xs font-bold text-white bg-[#10B981] hover:bg-[#059669] shadow-xs flex items-center space-x-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Walk-In Booking</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setScanCode('');
                setCheckInResult(null);
                setCheckInError('');
                setShowCheckInModal(true);
              }}
              className="px-4 py-2.5 rounded-full text-xs font-bold text-white bg-[#6366F1] hover:bg-[#4F46E5] shadow-xs flex items-center space-x-1.5 cursor-pointer"
            >
              <ScanLine className="w-4 h-4" />
              <span>Verify Guest Pass</span>
            </button>
          </div>
        </div>

        {/* Tab & Search Controls */}
        <div className="bg-[#1E293B] p-4 rounded-2xl border border-[#334155] flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center space-x-2 border-b sm:border-b-0 border-[#334155] pb-2 sm:pb-0 overflow-x-auto w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setActiveTab('regular')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 shrink-0 cursor-pointer ${
                activeTab === 'regular'
                  ? 'bg-[#6366F1] text-white shadow-xs'
                  : 'bg-[#0F172A] border border-[#334155] text-[#94A3B8] hover:text-[#F8FAFC]'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Desks & Tour Requests ({bookings.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('meeting')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 shrink-0 cursor-pointer ${
                activeTab === 'meeting'
                  ? 'bg-[#6366F1] text-white shadow-xs'
                  : 'bg-[#0F172A] border border-[#334155] text-[#94A3B8] hover:text-[#F8FAFC]'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Meeting Suite Passes ({meetingBookings.length})</span>
            </button>
          </div>

          <div className="flex items-center space-x-3 w-full sm:w-auto">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-[#0F172A] border border-[#334155] rounded-xl px-3 py-2 text-xs text-[#F8FAFC] focus:border-[#6366F1] focus:outline-none font-bold cursor-pointer"
            >
              <option value="">All Statuses</option>
              <option value="unpaid">Unpaid</option>
              <option value="pending">Pending (Paid)</option>
              <option value="confirmed">Confirmed (Checked-IN)</option>
              <option value="completed">Completed</option>
              <option value="not_checked_in">Not Checked-IN</option>
              <option value="cancelled">Cancelled</option>
            </select>

            <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search code, guest name, email..."
                className="w-full bg-[#0F172A] border border-[#334155] rounded-xl pl-10 pr-4 py-2 text-xs text-[#F8FAFC] placeholder-[#94A3B8] focus:border-[#6366F1] focus:outline-none"
              />
            </form>
          </div>
        </div>

        {/* Regular Bookings Table */}
        {activeTab === 'regular' && (
          <div className="bg-[#1E293B] rounded-2xl border border-[#334155] overflow-hidden shadow-xs">
            {loading ? (
              <div className="py-20 text-center text-xs font-semibold text-[#94A3B8]">Loading desk & tour reservations...</div>
            ) : bookings.length === 0 ? (
              <div className="py-20 text-center text-xs font-semibold text-[#94A3B8]">No bookings recorded matching your criteria.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#0F172A] text-[#94A3B8] font-bold border-b border-[#334155] uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="px-6 py-4">Booking Code</th>
                      <th className="px-6 py-4">Guest Info</th>
                      <th className="px-6 py-4">Item & Rate</th>
                      <th className="px-6 py-4">Date & Slot</th>
                      <th className="px-6 py-4 text-right">Total Amount</th>
                      <th className="px-6 py-4 text-center">Status</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#334155]">
                    {bookings.map((b) => {
                      const parsed = parseBookingDetails(b);
                      return (
                        <tr key={b.id} className="hover:bg-[#0F172A]/50 transition-colors">
                          <td className="px-6 py-4 font-mono font-bold text-[#6366F1]">
                            {b.bookingCode || `#${b.id}`}
                          </td>

                          <td className="px-6 py-4">
                            <p className="font-extrabold text-[#F8FAFC]">{b.customerName}</p>
                            <p className="text-[10px] text-[#94A3B8]">{b.customerEmail}</p>
                          </td>

                          <td className="px-6 py-4">
                            <p className="font-bold text-[#F8FAFC]">
                              {parsed.type === 'desk'
                                ? `Desk #${parsed.deskNumber}`
                                : parsed.type === 'service'
                                ? parsed.serviceName
                                : parsed.planName}
                            </p>
                            <p className="text-[10px] text-[#94A3B8]">{b.bookingType || 'direct_booking'}</p>
                          </td>

                          <td className="px-6 py-4 text-[#CBD5E1]">
                            <p className="font-bold text-[#F8FAFC]">{formatBookingDateDisplay(b.preferredDate)}</p>
                            <p className="text-[10px] text-[#94A3B8]">{b.preferredTimeSlot || 'Standard Operating Hours'}</p>
                          </td>

                          <td className="px-6 py-4 text-right font-extrabold text-[#10B981]">
                            ₹{Number(b.totalAmount || 0).toFixed(2)}
                          </td>

                          <td className="px-6 py-4 text-center">
                            <select
                              value={b.status}
                              onChange={(e) => handleDeskStatusChange(b.id, e.target.value)}
                              className={`text-[10px] font-extrabold uppercase rounded px-2.5 py-1 bg-[#0F172A] border focus:outline-none cursor-pointer ${getStatusBadgeClass(
                                b.status,
                              )}`}
                            >
                              <option value="unpaid">UNPAID</option>
                              <option value="pending">PENDING (PAID)</option>
                              <option value="confirmed">CONFIRMED (CHECKED-IN)</option>
                              <option value="completed">COMPLETED</option>
                              <option value="not_checked_in">NOT CHECKED-IN</option>
                              <option value="cancelled">CANCELLED</option>
                            </select>
                          </td>

                          <td className="px-6 py-4 text-right">
                            <button
                              type="button"
                              onClick={() => setViewingBooking(b)}
                              className="p-2 rounded-xl bg-[#0F172A] border border-[#334155] text-[#6366F1] hover:border-[#6366F1] transition-all cursor-pointer"
                              title="View Full Booking Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Meeting Suite Bookings Table */}
        {activeTab === 'meeting' && (
          <div className="bg-[#1E293B] rounded-2xl border border-[#334155] overflow-hidden shadow-xs">
            {loading ? (
              <div className="py-20 text-center text-xs font-semibold text-[#94A3B8]">Loading meeting suite passes...</div>
            ) : meetingBookings.length === 0 ? (
              <div className="py-20 text-center text-xs font-semibold text-[#94A3B8]">No meeting suite passes found.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#0F172A] text-[#94A3B8] font-bold border-b border-[#334155] uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="px-6 py-4">Booking Code</th>
                      <th className="px-6 py-4">Guest Name & Contact</th>
                      <th className="px-6 py-4">Suite Name</th>
                      <th className="px-6 py-4">Booking Date</th>
                      <th className="px-6 py-4 text-right">Total Paid</th>
                      <th className="px-6 py-4 text-center">Status</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#334155]">
                    {meetingBookings.map((mb) => (
                      <tr key={mb.id} className="hover:bg-[#0F172A]/50 transition-colors">
                        <td className="px-6 py-4 font-mono font-bold text-[#6366F1]">
                          {mb.bookingCode}
                        </td>

                        <td className="px-6 py-4">
                          <p className="font-extrabold text-[#F8FAFC]">{mb.customerName}</p>
                          <p className="text-[10px] text-[#94A3B8]">{mb.customerEmail}</p>
                        </td>

                        <td className="px-6 py-4 font-bold text-[#F8FAFC]">
                          {mb.meetingRoom?.name || 'Executive Suite'}
                        </td>

                        <td className="px-6 py-4 text-[#CBD5E1]">
                          <p className="font-bold text-[#F8FAFC]">{formatBookingDateDisplay(mb.bookingDate)}</p>
                          <p className="text-[11px] font-extrabold text-[#6366F1] font-mono mt-0.5">
                            {formatMeetingTimeSlot(mb.startTime, mb.endTime)}
                          </p>
                        </td>

                        <td className="px-6 py-4 text-right font-extrabold text-[#10B981]">
                          ₹{Number(mb.totalAmount || 0).toFixed(2)}
                        </td>

                        <td className="px-6 py-4 text-center">
                          <select
                            value={mb.status}
                            onChange={(e) => handleMeetingStatusChange(mb.id, e.target.value)}
                            className={`text-[10px] font-extrabold uppercase rounded px-2.5 py-1 bg-[#0F172A] border focus:outline-none cursor-pointer ${getStatusBadgeClass(
                              mb.status,
                            )}`}
                          >
                            <option value="unpaid">UNPAID</option>
                            <option value="pending">PENDING (PAID)</option>
                            <option value="confirmed">CONFIRMED (CHECKED-IN)</option>
                            <option value="completed">COMPLETED</option>
                            <option value="not_checked_in">NOT CHECKED-IN</option>
                            <option value="cancelled">CANCELLED</option>
                          </select>
                        </td>

                        <td className="px-6 py-4 text-right">
                          <button
                            type="button"
                            onClick={() => setViewingMeetingBooking(mb)}
                            className="p-2 rounded-xl bg-[#0F172A] border border-[#334155] text-[#6366F1] hover:border-[#6366F1] transition-all cursor-pointer"
                            title="View Suite Pass Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </main>

      {/* VIEW DESK / REGULAR BOOKING DETAIL MODAL */}
      {viewingBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F172A]/80 backdrop-blur-xs">
          <div className="bg-[#1E293B] border border-[#334155] rounded-3xl max-w-lg w-full p-6 space-y-5 text-[#F8FAFC] shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setViewingBooking(null)}
              className="absolute top-4 right-4 text-[#94A3B8] hover:text-[#F8FAFC] text-sm font-bold p-1.5 rounded-full bg-[#0F172A]"
            >
              ✕
            </button>

            <div className="flex items-center space-x-3 border-b border-[#334155] pb-4">
              <div className="w-12 h-12 rounded-2xl bg-[#6366F1]/20 text-[#6366F1] flex items-center justify-center font-mono font-black text-lg border border-[#6366F1]/30">
                #
              </div>
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#6366F1]">
                  Reservation Code: {viewingBooking.bookingCode || `#${viewingBooking.id}`}
                </span>
                <h3 className="text-xl font-extrabold text-[#F8FAFC]">{viewingBooking.customerName}</h3>
                <p className="text-xs text-[#94A3B8]">{viewingBooking.customerEmail} • {viewingBooking.customerPhone || 'No phone'}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-xl bg-[#0F172A] border border-[#334155] space-y-1">
                <span className="text-[10px] text-[#94A3B8] font-semibold block">Company Name</span>
                <p className="font-bold text-[#F8FAFC]">{viewingBooking.companyName || 'Independent'}</p>
              </div>

              <div className="p-3.5 rounded-xl bg-[#0F172A] border border-[#334155] space-y-1">
                <span className="text-[10px] text-[#94A3B8] font-semibold block">Total Amount</span>
                <p className="font-black text-[#10B981] text-sm">₹{Number(viewingBooking.totalAmount || 0).toFixed(2)}</p>
              </div>

              <div className="p-3.5 rounded-xl bg-[#0F172A] border border-[#334155] space-y-1">
                <span className="text-[10px] text-[#94A3B8] font-semibold block">Booking Date</span>
                <p className="font-bold text-[#F8FAFC]">{formatBookingDateDisplay(viewingBooking.preferredDate)}</p>
              </div>

              <div className="p-3.5 rounded-xl bg-[#0F172A] border border-[#334155] space-y-1">
                <span className="text-[10px] text-[#94A3B8] font-semibold block">Time Slot</span>
                <p className="font-bold text-[#F8FAFC]">{viewingBooking.preferredTimeSlot || 'Standard Slot'}</p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#0F172A] border border-[#334155] space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[#94A3B8] font-semibold">Payment Method:</span>
                <span className="font-bold text-[#10B981]">{getPaymentMethodDisplay(viewingBooking)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#94A3B8] font-semibold">Current Lifecycle Status:</span>
                <span className={`px-2.5 py-0.5 rounded text-[10px] font-extrabold uppercase border ${getStatusBadgeClass(viewingBooking.status)}`}>
                  {getStatusDisplayLabel(viewingBooking.status)}
                </span>
              </div>
              {viewingBooking.notes && (
                <div className="pt-2 border-t border-[#334155]">
                  <span className="text-[#94A3B8] font-semibold block">Notes & Details:</span>
                  <p className="text-[#CBD5E1] font-mono text-[11px] mt-0.5">{viewingBooking.notes}</p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setViewingBooking(null)}
                className="px-5 py-2.5 rounded-full text-xs font-bold text-[#CBD5E1] bg-[#0F172A] border border-[#334155] hover:text-[#F8FAFC]"
              >
                Close Window
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW MEETING SUITE BOOKING DETAIL MODAL */}
      {viewingMeetingBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F172A]/80 backdrop-blur-xs">
          <div className="bg-[#1E293B] border border-[#334155] rounded-3xl max-w-lg w-full p-6 space-y-5 text-[#F8FAFC] shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setViewingMeetingBooking(null)}
              className="absolute top-4 right-4 text-[#94A3B8] hover:text-[#F8FAFC] text-sm font-bold p-1.5 rounded-full bg-[#0F172A]"
            >
              ✕
            </button>

            <div className="flex items-center space-x-3 border-b border-[#334155] pb-4">
              <div className="w-12 h-12 rounded-2xl bg-[#6366F1]/20 text-[#6366F1] flex items-center justify-center font-mono font-black text-lg border border-[#6366F1]/30">
                MR
              </div>
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#6366F1]">
                  Meeting Suite Pass: {viewingMeetingBooking.bookingCode}
                </span>
                <h3 className="text-xl font-extrabold text-[#F8FAFC]">{viewingMeetingBooking.customerName}</h3>
                <p className="text-xs text-[#94A3B8]">{viewingMeetingBooking.customerEmail} • {viewingMeetingBooking.customerPhone || 'No phone'}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-xl bg-[#0F172A] border border-[#334155] space-y-1">
                <span className="text-[10px] text-[#94A3B8] font-semibold block">Conference Suite</span>
                <p className="font-bold text-[#F8FAFC]">{viewingMeetingBooking.meetingRoom?.name || 'Executive Suite'}</p>
              </div>

              <div className="p-3.5 rounded-xl bg-[#0F172A] border border-[#334155] space-y-1">
                <span className="text-[10px] text-[#94A3B8] font-semibold block">Total Amount</span>
                <p className="font-black text-[#10B981] text-sm">₹{Number(viewingMeetingBooking.totalAmount || 0).toFixed(2)}</p>
              </div>

              <div className="p-3.5 rounded-xl bg-[#0F172A] border border-[#334155] space-y-1">
                <span className="text-[10px] text-[#94A3B8] font-semibold block">Booking Date</span>
                <p className="font-bold text-[#F8FAFC]">{formatBookingDateDisplay(viewingMeetingBooking.bookingDate)}</p>
              </div>

              <div className="p-3.5 rounded-xl bg-[#0F172A] border border-[#334155] space-y-1">
                <span className="text-[10px] text-[#94A3B8] font-semibold block">Reserved Time Slot</span>
                <p className="font-black text-[#6366F1] font-mono text-[11px]">
                  {formatMeetingTimeSlot(viewingMeetingBooking.startTime, viewingMeetingBooking.endTime)}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-[#0F172A] border border-[#334155] space-y-1">
                <span className="text-[10px] text-[#94A3B8] font-semibold block">Payment Method</span>
                <p className="font-bold text-[#10B981]">
                  {getMeetingPaymentMethodDisplay(viewingMeetingBooking)}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-[#0F172A] border border-[#334155] space-y-1">
                <span className="text-[10px] text-[#94A3B8] font-semibold block">Current Status</span>
                <p className={`font-extrabold text-[10px] uppercase ${getStatusBadgeClass(viewingMeetingBooking.status)} px-2 py-0.5 rounded w-fit`}>
                  {getStatusDisplayLabel(viewingMeetingBooking.status)}
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#0F172A] border border-[#334155] flex items-center justify-between gap-4 text-xs">
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-[#94A3B8] font-semibold">Capacity & Guest(s):</span>
                  <span className="font-bold text-[#F8FAFC]">
                    {viewingMeetingBooking.seatsBooked || 1} Seat(s) • {viewingMeetingBooking.attendeesCount || 1} Guest(s)
                  </span>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-[#334155]">
                  <span className="text-[#94A3B8] font-semibold">Digital Pass Code:</span>
                  <span className="font-mono font-bold text-[#6366F1]">
                    {viewingMeetingBooking.qrAccessCode || viewingMeetingBooking.bookingCode}
                  </span>
                </div>
              </div>

              <div className="p-2 bg-white rounded-xl border border-[#334155] shrink-0 text-center">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(
                    viewingMeetingBooking.qrAccessCode || viewingMeetingBooking.bookingCode || 'QR-PASS'
                  )}`}
                  alt="QR Code Pass"
                  className="w-16 h-16 object-contain mx-auto"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <a
                href={`/meeting-rooms/receipt/${viewingMeetingBooking.viewToken || viewingMeetingBooking.bookingCode}`}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 rounded-full text-xs font-bold text-white bg-[#6366F1] hover:bg-[#4F46E5] flex items-center space-x-1.5"
              >
                <span>Print / View Digital Receipt Pass ↗</span>
              </a>

              <button
                type="button"
                onClick={() => setViewingMeetingBooking(null)}
                className="px-5 py-2 rounded-full text-xs font-bold text-[#CBD5E1] bg-[#0F172A] border border-[#334155] hover:text-[#F8FAFC]"
              >
                Close Window
              </button>
            </div>
          </div>
        </div>
      )}

      {/* WALK-IN NEW BOOKING MODAL */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F172A]/80 backdrop-blur-xs">
          <div className="bg-[#1E293B] border border-[#334155] rounded-3xl max-w-lg w-full p-6 space-y-4 text-[#F8FAFC] shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setShowNewModal(false)}
              className="absolute top-4 right-4 text-[#94A3B8] hover:text-[#F8FAFC] text-sm font-bold p-1 rounded-full bg-[#0F172A]"
            >
              ✕
            </button>

            <div className="space-y-1">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#10B981]">
                Reception Walk-In Desk & Suite Booking
              </span>
              <h3 className="text-lg font-extrabold text-[#F8FAFC]">Create On-Site Walk-In Reservation</h3>
            </div>

            <div className="flex items-center gap-2 p-1 rounded-xl bg-[#0F172A] border border-[#334155] text-xs">
              <button
                type="button"
                onClick={() => setWalkInType('desk')}
                className={`flex-1 py-1.5 rounded-lg font-extrabold transition-all cursor-pointer ${
                  walkInType === 'desk' ? 'bg-[#6366F1] text-white shadow-xs' : 'text-[#94A3B8]'
                }`}
              >
                Day Pass / Desk
              </button>
              <button
                type="button"
                onClick={() => setWalkInType('meeting')}
                className={`flex-1 py-1.5 rounded-lg font-extrabold transition-all cursor-pointer ${
                  walkInType === 'meeting' ? 'bg-[#6366F1] text-white shadow-xs' : 'text-[#94A3B8]'
                }`}
              >
                Meeting Room Suite
              </button>
            </div>

            <form onSubmit={handleCreateWalkIn} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#CBD5E1] font-semibold mb-1">Guest Full Name *</label>
                  <input
                    type="text"
                    required
                    value={newForm.customerName}
                    onChange={(e) => setNewForm({ ...newForm, customerName: e.target.value })}
                    placeholder="Guest Name"
                    className="w-full bg-[#0F172A] border border-[#334155] rounded-xl px-3 py-2 text-[#F8FAFC] focus:border-[#6366F1] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[#CBD5E1] font-semibold mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={newForm.customerEmail}
                    onChange={(e) => setNewForm({ ...newForm, customerEmail: e.target.value })}
                    placeholder="guest@company.com"
                    className="w-full bg-[#0F172A] border border-[#334155] rounded-xl px-3 py-2 text-[#F8FAFC] focus:border-[#6366F1] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#CBD5E1] font-semibold mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={newForm.customerPhone}
                    onChange={(e) => setNewForm({ ...newForm, customerPhone: e.target.value })}
                    placeholder="+91 9876543210"
                    className="w-full bg-[#0F172A] border border-[#334155] rounded-xl px-3 py-2 text-[#F8FAFC] focus:border-[#6366F1] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[#CBD5E1] font-semibold mb-1">Booking Date *</label>
                  <input
                    type="date"
                    required
                    value={newForm.bookingDate}
                    onChange={(e) => setNewForm({ ...newForm, bookingDate: e.target.value })}
                    className="w-full bg-[#0F172A] border border-[#334155] rounded-xl px-3 py-2 text-[#F8FAFC] focus:border-[#6366F1] focus:outline-none font-mono"
                  />
                </div>
              </div>

              {walkInType === 'desk' ? (
                <div>
                  <label className="block text-[#CBD5E1] font-semibold mb-1">Select Pricing Plan Tier *</label>
                  <select
                    value={newForm.pricingPlanId}
                    onChange={(e) => setNewForm({ ...newForm, pricingPlanId: Number(e.target.value) })}
                    className="w-full bg-[#0F172A] border border-[#334155] rounded-xl px-3 py-2 text-[#F8FAFC] focus:border-[#6366F1] focus:outline-none"
                  >
                    {pricingPlans.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} • ₹{(p.priceDaily || p.priceMonthly || 250).toString()}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="block text-[#CBD5E1] font-semibold mb-1">Select Conference Suite *</label>
                    <select
                      value={newForm.meetingRoomId}
                      onChange={(e) => setNewForm({ ...newForm, meetingRoomId: Number(e.target.value) })}
                      className="w-full bg-[#0F172A] border border-[#334155] rounded-xl px-3 py-2 text-[#F8FAFC] focus:border-[#6366F1] focus:outline-none"
                    >
                      {meetingRoomsCatalog.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name} • ₹{r.hourlyRate}/hr
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[#CBD5E1] font-semibold mb-1">Start Time *</label>
                      <input
                        type="time"
                        value={newForm.startTime}
                        onChange={(e) => setNewForm({ ...newForm, startTime: e.target.value })}
                        className="w-full bg-[#0F172A] border border-[#334155] rounded-xl px-3 py-2 text-[#F8FAFC] font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[#CBD5E1] font-semibold mb-1">End Time *</label>
                      <input
                        type="time"
                        value={newForm.endTime}
                        onChange={(e) => setNewForm({ ...newForm, endTime: e.target.value })}
                        className="w-full bg-[#0F172A] border border-[#334155] rounded-xl px-3 py-2 text-[#F8FAFC] font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#CBD5E1] font-semibold mb-1">Payment Method *</label>
                  <select
                    value={newForm.paymentMethod}
                    onChange={(e) => setNewForm({ ...newForm, paymentMethod: e.target.value })}
                    className="w-full bg-[#0F172A] border border-[#334155] rounded-xl px-3 py-2 text-[#F8FAFC] focus:border-[#6366F1] focus:outline-none"
                  >
                    <option value="cash">Cash / Reception Desk</option>
                    <option value="wallet">Member Credit Wallet</option>
                    <option value="razorpay">Razorpay Gateway</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[#CBD5E1] font-semibold mb-1">Total Amount (₹) *</label>
                  <input
                    type="number"
                    required
                    value={newForm.totalAmount}
                    onChange={(e) => setNewForm({ ...newForm, totalAmount: Number(e.target.value) })}
                    className="w-full bg-[#0F172A] border border-[#334155] rounded-xl px-3 py-2 text-[#F8FAFC] font-mono focus:border-[#6366F1] focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submittingNew}
                className="w-full py-3.5 rounded-full text-xs font-bold text-white bg-[#10B981] hover:bg-[#059669] shadow-md flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                <span>{submittingNew ? 'Creating Walk-In...' : 'Confirm Walk-In Booking'}</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* CHECK-IN QR CODE PASS VERIFIER MODAL */}
      {showCheckInModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F172A]/80 backdrop-blur-xs">
          <div className="bg-[#1E293B] border border-[#334155] rounded-3xl max-w-md w-full p-6 space-y-4 text-[#F8FAFC] shadow-2xl relative">
            <button
              type="button"
              onClick={() => setShowCheckInModal(false)}
              className="absolute top-4 right-4 text-[#94A3B8] hover:text-[#F8FAFC] text-sm font-bold p-1 rounded-full bg-[#0F172A]"
            >
              ✕
            </button>

            <div className="space-y-1">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#6366F1]">
                Reception Gate Pass Verification
              </span>
              <h3 className="text-lg font-extrabold text-[#F8FAFC]">Verify Digital Access Pass</h3>
            </div>

            <form onSubmit={handleVerifyPassCode} className="space-y-4 text-xs">
              <div>
                <label className="block text-[#CBD5E1] font-semibold mb-1">Pass Code / Booking Reference *</label>
                <input
                  type="text"
                  required
                  value={scanCode}
                  onChange={(e) => setScanCode(e.target.value)}
                  placeholder="e.g. MR-88219"
                  className="w-full bg-[#0F172A] border border-[#334155] rounded-xl px-3 py-2 text-[#F8FAFC] font-mono focus:border-[#6366F1] focus:outline-none uppercase"
                />
              </div>

              <button
                type="submit"
                disabled={verifying}
                className="w-full py-3 rounded-full text-xs font-bold text-white bg-[#6366F1] hover:bg-[#4F46E5] shadow-md flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                <span>{verifying ? 'Verifying Code...' : 'Verify Entry Pass'}</span>
              </button>
            </form>

            {checkInResult && (
              <div className="p-4 rounded-2xl bg-[#10B981]/15 border border-[#10B981]/30 text-xs space-y-1">
                <p className="font-extrabold text-[#10B981]">Pass Validated & Checked-IN!</p>
                <p className="text-[#F8FAFC]">Guest: {checkInResult.customerName}</p>
                <p className="text-[#94A3B8]">Suite: {checkInResult.meetingRoom?.name || 'Conference Suite'}</p>
              </div>
            )}

            {checkInError && (
              <div className="p-4 rounded-2xl bg-[#F43F5E]/15 border border-[#F43F5E]/30 text-xs text-[#F43F5E] font-bold">
                {checkInError}
              </div>
            )}
          </div>
        </div>
      )}

      {/* COMPLETION CONFIRMATION MODAL */}
      {pendingCompletionBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F172A]/80 backdrop-blur-xs">
          <div className="bg-[#1E293B] border border-[#334155] rounded-3xl max-w-md w-full p-6 space-y-4 text-[#F8FAFC] shadow-2xl relative">
            <button
              type="button"
              onClick={() => setPendingCompletionBooking(null)}
              className="absolute top-4 right-4 text-[#94A3B8] hover:text-[#F8FAFC] text-sm font-bold p-1 rounded-full bg-[#0F172A]"
            >
              ✕
            </button>

            <div className="space-y-1">
              <h3 className="text-base font-extrabold text-[#6366F1]">Mark Booking Completed</h3>
              <p className="text-xs text-[#94A3B8]">
                Confirm marking reservation <strong className="text-[#F8FAFC] font-mono">{pendingCompletionBooking.code}</strong> as COMPLETED.
              </p>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setPendingCompletionBooking(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-[#94A3B8] bg-[#0F172A] border border-[#334155]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={updatingStatus}
                onClick={handleConfirmCompletion}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#6366F1] hover:bg-[#4F46E5]"
              >
                {updatingStatus ? 'Updating...' : 'Confirm Completed'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
