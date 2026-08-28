'use client';

import React, { useState, useEffect } from 'react';
import StaffSidebar from '@/components/layout/StaffSidebar';
import RazorpayGatewayModal from '@/components/ui/RazorpayGatewayModal';
import {
  Building2,
  Users,
  Clock,
  Search,
  CheckCircle2,
  X,
  Calendar,
  CreditCard,
  UserCheck,
  Check,
  AlertCircle,
  Tag,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';

export default function StaffMeetingRoomsPage() {
  const [meetingRooms, setMeetingRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [taxRate, setTaxRate] = useState<number>(0.18);

  // Booking Modal State
  const [selectedRoomForBooking, setSelectedRoomForBooking] = useState<any>(null);
  const [bookingForm, setBookingForm] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    companyName: '',
    gstin: '',
    bookingDate: new Date().toISOString().split('T')[0],
    startTime: '10:00',
    endTime: '12:00',
    seatsBooked: 1,
    paymentMethod: 'cash',
  });

  // Auto-Fetch Member State
  const [matchedMember, setMatchedMember] = useState<any>(null);
  const [searchingMember, setSearchingMember] = useState(false);
  const [submittingBooking, setSubmittingBooking] = useState(false);

  // Razorpay Gateway State
  const [razorpayModalData, setRazorpayModalData] = useState<{
    isOpen: boolean;
    amount: number;
    orderId: string;
    bookingPayload: any;
  }>({ isOpen: false, amount: 0, orderId: '', bookingPayload: null });

  async function fetchMeetingRooms() {
    setLoading(true);
    try {
      const res = await apiClient.get('/meeting-rooms');
      setMeetingRooms(res.data || []);
    } catch (err) {
      console.error('Failed to load meeting rooms', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchMeetingRooms();
    (async () => {
      try {
        const res = await apiClient.get('/cms/settings');
        if (res.data?.taxRate !== undefined) setTaxRate(Number(res.data.taxRate));
      } catch (e) {}
    })();
  }, []);

  const handleOpenBookingModal = (room: any) => {
    setSelectedRoomForBooking(room);
    setMatchedMember(null);
    const defaultStart = room.startTime || '09:00';
    let defaultEnd = room.endTime || '10:00';
    if (room.startTime && room.endTime) {
      const [sh, sm] = room.startTime.split(':').map(Number);
      const [eh, em] = room.endTime.split(':').map(Number);
      const nextH = Math.min(eh, sh + 1);
      defaultEnd = `${nextH.toString().padStart(2, '0')}:${sm.toString().padStart(2, '0')}`;
    }
    setBookingForm({
      customerName: '',
      customerEmail: '',
      customerPhone: '',
      companyName: '',
      gstin: '',
      bookingDate: new Date().toISOString().split('T')[0],
      startTime: defaultStart,
      endTime: defaultEnd,
      seatsBooked: Number(room.minSeats || 1),
      paymentMethod: 'cash',
    });
  };

  const handleEmailChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const email = e.target.value;
    setBookingForm({ ...bookingForm, customerEmail: email });

    if (email.includes('@') && email.includes('.')) {
      setSearchingMember(true);
      try {
        const res = await apiClient.get(`/auth/admin/users?search=${encodeURIComponent(email)}`);
        const members = res.data?.users || res.data || [];
        const found = members.find((u: any) => u.email.toLowerCase() === email.toLowerCase());
        if (found) {
          setMatchedMember(found);
          setBookingForm((prev) => ({
            ...prev,
            customerName: found.name || prev.customerName,
            customerPhone: found.phone || prev.customerPhone,
            companyName: found.companyName || prev.companyName,
          }));
        } else {
          setMatchedMember(null);
        }
      } catch (err) {
        setMatchedMember(null);
      } finally {
        setSearchingMember(false);
      }
    } else {
      setMatchedMember(null);
    }
  };

  const calculateStaffPricing = () => {
    if (!selectedRoomForBooking) return { hours: 1, baseHourlySubtotal: 0, addOnSubtotal: 0, serviceCharge: 0, gstTax: 0, grandTotal: 0 };

    const [sh, sm] = bookingForm.startTime.split(':').map(Number);
    const [eh, em] = bookingForm.endTime.split(':').map(Number);
    const hours = Math.max(1, (eh * 60 + em - (sh * 60 + sm)) / 60);

    const baseRate = Number(selectedRoomForBooking.hourlyRate || 500);
    const perSeatPrice = Number(selectedRoomForBooking.perSeatPrice || 0);
    const minSeats = Number(selectedRoomForBooking.minSeats || 1);
    const seats = Number(bookingForm.seatsBooked || minSeats);

    const baseHourlySubtotal = baseRate * hours;
    const additionalSeats = Math.max(0, seats - minSeats);
    const addOnSubtotal = additionalSeats * perSeatPrice * hours;
    const subtotal = baseHourlySubtotal + addOnSubtotal;

    let serviceCharge = 0;
    if (selectedRoomForBooking.serviceChargeType === 'percentage') {
      serviceCharge = (subtotal * Number(selectedRoomForBooking.serviceChargeValue || 0)) / 100;
    } else {
      serviceCharge = Number(selectedRoomForBooking.serviceChargeValue || 0);
    }

    const preTaxTotal = subtotal + serviceCharge;
    const gstTax = preTaxTotal * taxRate;
    const grandTotal = preTaxTotal + gstTax;

    return {
      hours,
      baseHourlySubtotal,
      addOnSubtotal,
      serviceCharge,
      gstTax,
      grandTotal,
    };
  };

  const pricing = calculateStaffPricing();
  const staffMeetingCreditsNeeded = Math.max(1, Math.ceil(pricing.hours || 1));
  const staffMeetingCreditsBalance = Number(matchedMember?.meetingCreditsBalance || 0);
  const canUseStaffMeetingCredits = staffMeetingCreditsBalance >= staffMeetingCreditsNeeded;

  const executeBooking = async (payload: any) => {
    try {
      const res = await apiClient.post('/meeting-rooms/booking', payload);
      if (res.data?.success) {
        alert(`Reservation Confirmed! Booking Code: ${res.data.bookingCode}`);
        setSelectedRoomForBooking(null);
        setRazorpayModalData({ isOpen: false, amount: 0, orderId: '', bookingPayload: null });
        fetchMeetingRooms();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to reserve meeting room');
    } finally {
      setSubmittingBooking(false);
    }
  };

  const handleReserveSuiteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoomForBooking) return;

    setSubmittingBooking(true);

    const minSeats = Number(selectedRoomForBooking.minSeats || 1);
    const maxSeats = Number(selectedRoomForBooking.maxSeats || selectedRoomForBooking.capacity || 10);
    const requestedSeats = Number(bookingForm.seatsBooked);

    if (requestedSeats < minSeats || requestedSeats > maxSeats) {
      alert(`Seat Limit Exceeded: ${selectedRoomForBooking.name} capacity is between ${minSeats} and ${maxSeats} seats.`);
      setSubmittingBooking(false);
      return;
    }

    const startDateTime = `${bookingForm.bookingDate}T${bookingForm.startTime}:00`;
    const endDateTime = `${bookingForm.bookingDate}T${bookingForm.endTime}:00`;

    if (selectedRoomForBooking.startTime && selectedRoomForBooking.endTime) {
      const [rsh, rsm] = selectedRoomForBooking.startTime.split(':').map(Number);
      const [reh, rem] = selectedRoomForBooking.endTime.split(':').map(Number);
      const [bsh, bsm] = bookingForm.startTime.split(':').map(Number);
      const [beh, bem] = bookingForm.endTime.split(':').map(Number);

      const rStart = rsh * 60 + rsm;
      const rEnd = reh * 60 + rem;
      const bStart = bsh * 60 + bsm;
      const bEnd = beh * 60 + bem;

      if (bStart < rStart || bEnd > rEnd) {
        alert(`Operating Hours Error: ${selectedRoomForBooking.name} is available between ${selectedRoomForBooking.startTime} and ${selectedRoomForBooking.endTime}. Please select a time slot within operating hours.`);
        setSubmittingBooking(false);
        return;
      }
    }

    const payload = {
      meetingRoomId: selectedRoomForBooking.id,
      roomSlug: selectedRoomForBooking.slug,
      userId: matchedMember ? matchedMember.id : undefined,
      customerName: bookingForm.customerName,
      customerEmail: bookingForm.customerEmail,
      customerPhone: bookingForm.customerPhone,
      companyName: bookingForm.companyName,
      gstin: bookingForm.gstin,
      bookingDate: bookingForm.bookingDate,
      startTime: startDateTime,
      endTime: endDateTime,
      seatsBooked: Number(bookingForm.seatsBooked),
      paymentMethod: bookingForm.paymentMethod,
      totalAmount: pricing.grandTotal,
      notes: `Staff Walk-In Reservation | Payment: ${bookingForm.paymentMethod.toUpperCase()}`,
    };

    if (bookingForm.paymentMethod === 'wallet') {
      if (!matchedMember) {
        alert('Wallet Payment Error: No registered member found for this email address. Please select Cash or Razorpay.');
        setSubmittingBooking(false);
        return;
      }
      if (Number(matchedMember.walletBalance || 0) < pricing.grandTotal) {
        alert(`Insufficient Balance: Member wallet has ₹${Number(matchedMember.walletBalance || 0).toLocaleString()} (Required: ₹${pricing.grandTotal.toFixed(2)}).`);
        setSubmittingBooking(false);
        return;
      }
    }

    if (bookingForm.paymentMethod === 'credits') {
      if (!matchedMember) {
        alert('Meeting Credit Error: No registered member found for this email address. Please select Cash or Razorpay.');
        setSubmittingBooking(false);
        return;
      }
      if (!canUseStaffMeetingCredits) {
        alert(`Insufficient Meeting Credits: Member has ${staffMeetingCreditsBalance} (Required: ${staffMeetingCreditsNeeded}).`);
        setSubmittingBooking(false);
        return;
      }
    }

    if (bookingForm.paymentMethod === 'razorpay') {
      try {
        const orderRes = await apiClient.post('/wallet/razorpay/create-order', {
          amount: Math.round(pricing.grandTotal),
          currency: 'INR',
        });

        if (orderRes.data?.orderId) {
          setRazorpayModalData({
            isOpen: true,
            amount: pricing.grandTotal,
            orderId: orderRes.data.orderId,
            bookingPayload: {
              ...payload,
              razorpayOrderId: orderRes.data.orderId,
            },
          });
          return;
        }
      } catch (err: any) {
        alert(err.response?.data?.message || 'Failed to initiate Razorpay payment');
        setSubmittingBooking(false);
        return;
      }
    }

    await executeBooking(payload);
  };

  const availableCategories = ['All', ...Array.from(new Set(meetingRooms.map((r) => r.category || 'Conference Room')))];

  const filteredRooms = meetingRooms.filter((room) => {
    const matchesQuery = !searchQuery || room.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (room.description && room.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (room.category && room.category.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === 'All' || (room.category || 'Conference Room') === selectedCategory;
    return matchesQuery && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-[#0F172A] text-[#F8FAFC] flex font-sans selection:bg-[#6366F1] selection:text-white">
      <StaffSidebar />

      <main className="flex-1 p-4 sm:p-8 max-w-7xl mx-auto space-y-6 overflow-x-hidden pt-16 md:pt-8">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#334155] pb-5">
          <div>
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[#6366F1]/10 border border-[#6366F1]/30 text-xs font-bold text-[#6366F1] mb-2">
              <Building2 className="w-3.5 h-3.5" />
              <span>Staff Meeting Engine</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#F8FAFC]">Meeting Rooms & Suite Reservations</h1>
            <p className="text-xs text-[#94A3B8]">
              View real-time room availability, per-seat pricing, and reserve suites for walk-in members.
            </p>
          </div>
        </div>

        {/* Search Bar & Category Filter */}
        <div className="space-y-3">
          <div className="bg-[#1E293B] p-4 rounded-2xl border border-[#334155] flex items-center justify-between gap-4 shadow-xs">
            <div className="relative w-full sm:w-96">
              <Search className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search rooms by name, capacity, or category..."
                className="w-full bg-[#0F172A] border border-[#334155] rounded-xl pl-10 pr-4 py-2 text-xs text-[#F8FAFC] placeholder-[#94A3B8] focus:border-[#6366F1] focus:outline-none"
              />
            </div>
          </div>

          {/* Category Filter Tabs */}
          <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none">
            {availableCategories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-[#6366F1] text-white shadow-xs'
                    : 'bg-[#1E293B] border border-[#334155] text-[#94A3B8] hover:text-[#F8FAFC]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Meeting Rooms Grid */}
        {loading ? (
          <div className="py-20 text-center text-xs font-semibold text-[#94A3B8]">Loading meeting suites...</div>
        ) : filteredRooms.length === 0 ? (
          <div className="py-20 text-center text-xs font-semibold text-[#94A3B8]">No meeting rooms found matching your search.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRooms.map((room) => {
              const displayImage = room.imageUrl || room.featuredImage || (Array.isArray(room.images) && room.images.length > 0 ? room.images[0] : (typeof room.images === 'string' ? room.images : 'https://images.unsplash.com/photo-1517502884422-41eaead166d4?auto=format&fit=crop&w=600&q=80'));

              return (
                <div key={room.id} className="bg-[#1E293B] rounded-3xl border border-[#334155] overflow-hidden flex flex-col justify-between space-y-4 p-6 relative group hover:border-[#6366F1] transition-all shadow-xs">
                  {/* Room Image */}
                  <div className="relative h-40 w-full rounded-2xl overflow-hidden bg-[#0F172A] border border-[#334155]">
                    <img
                      src={displayImage}
                      alt={room.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <span className="absolute top-3 left-3 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#020617]/80 text-[#6366F1] border border-[#6366F1]/30 backdrop-blur-xs">
                      {room.category || 'Conference Room'}
                    </span>
                    <span className="absolute top-3 right-3 text-xs font-bold px-3 py-1 rounded-full bg-[#020617]/80 text-[#10B981] border border-[#10B981]/30 backdrop-blur-xs">
                      ₹{room.hourlyRate}/hr
                    </span>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-[#6366F1]/10 text-[#6366F1] border border-[#6366F1]/20">
                        Capacity: {room.capacity} Pax
                      </span>
                      <span className="font-mono font-bold text-xs text-[#10B981]">
                        ₹{Number(room.perSeatPrice || 150)}/seat/hr
                      </span>
                    </div>

                    <h3 className="text-lg font-extrabold text-[#F8FAFC]">{room.name}</h3>
                    <p className="text-xs text-[#94A3B8] line-clamp-2">{room.description}</p>

                    <div className="p-3 rounded-2xl bg-[#0F172A] border border-[#334155] space-y-1 text-xs">
                      <div className="flex justify-between text-[#CBD5E1]">
                        <span>Seat Limit:</span>
                        <span className="font-bold text-[#F8FAFC]">{room.minSeats || 1} min - {room.maxSeats || room.capacity} max</span>
                      </div>
                      <div className="flex justify-between text-[#CBD5E1]">
                        <span>Operating Hours:</span>
                        <span className="font-bold text-[#38BDF8]">{room.startTime && room.endTime ? `${room.startTime} - ${room.endTime}` : '24/7 Access'}</span>
                      </div>
                      <div className="flex justify-between text-[#CBD5E1]">
                        <span>Hourly Base Rate:</span>
                        <span className="font-mono font-bold text-[#F8FAFC]">₹{Number(room.hourlyRate || 500).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleOpenBookingModal(room)}
                    className="w-full py-3 rounded-full text-xs font-bold text-white bg-[#6366F1] hover:bg-[#4F46E5] shadow-md flex items-center justify-center space-x-2 cursor-pointer"
                  >
                    <Calendar className="w-4 h-4" />
                    <span>Reserve Suite for Customer</span>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* RESERVE SUITE MODAL */}
      {selectedRoomForBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F172A]/80 backdrop-blur-xs">
          <div className="bg-[#1E293B] border border-[#334155] rounded-3xl max-w-xl w-full p-6 sm:p-8 space-y-6 text-[#F8FAFC] shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#334155] pb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#6366F1]">Walk-In Suite Reservation</span>
                <h3 className="text-lg font-extrabold text-[#F8FAFC]">Book {selectedRoomForBooking.name}</h3>
              </div>
              <button onClick={() => setSelectedRoomForBooking(null)} className="p-1 rounded-full text-[#94A3B8] hover:text-[#F8FAFC]">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Room Photo Banner */}
            <div className="relative h-32 w-full rounded-2xl overflow-hidden bg-[#0F172A] border border-[#334155]">
              <img
                src={selectedRoomForBooking.imageUrl || selectedRoomForBooking.featuredImage || (Array.isArray(selectedRoomForBooking.images) && selectedRoomForBooking.images.length > 0 ? selectedRoomForBooking.images[0] : (typeof selectedRoomForBooking.images === 'string' ? selectedRoomForBooking.images : 'https://images.unsplash.com/photo-1517502884422-41eaead166d4?auto=format&fit=crop&w=600&q=80'))}
                alt={selectedRoomForBooking.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-3 justify-between">
                <span className="text-xs font-bold text-white">{selectedRoomForBooking.capacity} Pax Capacity</span>
                <span className="font-mono font-bold text-xs text-[#6366F1]">₹{selectedRoomForBooking.hourlyRate}/hr</span>
              </div>
            </div>

            {/* AUTO-FETCH MEMBER BADGE */}
            {searchingMember ? (
              <p className="text-[11px] text-[#6366F1] animate-pulse font-semibold">Searching member records by email...</p>
            ) : matchedMember ? (
              <div className="p-3.5 rounded-2xl bg-[#10B981]/10 border border-[#10B981]/30 text-[#10B981] text-xs font-semibold flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Check className="w-4 h-4 shrink-0" />
                  <span>Verified Member Account: {matchedMember.name}</span>
                </div>
                <span className="font-mono font-bold text-[#F8FAFC]">Wallet: ₹{Number(matchedMember.walletBalance || 0).toLocaleString()}</span>
              </div>
            ) : null}

            <form onSubmit={handleReserveSuiteSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-[#CBD5E1] font-medium mb-1">Customer Email * (Auto-Fetches Member Profile)</label>
                <input
                  type="email"
                  required
                  value={bookingForm.customerEmail}
                  onChange={handleEmailChange}
                  placeholder="mailtonexusnation@gmail.com"
                  className="w-full bg-[#0F172A] border border-[#334155] rounded-xl px-3.5 py-2.5 text-[#F8FAFC] focus:border-[#6366F1] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[#CBD5E1] font-medium mb-1">Customer Full Name *</label>
                <input
                  type="text"
                  required
                  value={bookingForm.customerName}
                  onChange={(e) => setBookingForm({ ...bookingForm, customerName: e.target.value })}
                  placeholder="Kishoresharma Nexus"
                  className="w-full bg-[#0F172A] border border-[#334155] rounded-xl px-3.5 py-2.5 text-[#F8FAFC] focus:border-[#6366F1] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[#CBD5E1] font-medium mb-1">Customer Phone</label>
                  <input
                    type="text"
                    value={bookingForm.customerPhone}
                    onChange={(e) => setBookingForm({ ...bookingForm, customerPhone: e.target.value })}
                    placeholder="+917695946750"
                    className="w-full bg-[#0F172A] border border-[#334155] rounded-xl px-3.5 py-2.5 text-[#F8FAFC] focus:border-[#6366F1] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[#CBD5E1] font-medium mb-1">Company Name</label>
                  <input
                    type="text"
                    value={bookingForm.companyName}
                    onChange={(e) => setBookingForm({ ...bookingForm, companyName: e.target.value })}
                    placeholder="Cowork30 Corporate"
                    className="w-full bg-[#0F172A] border border-[#334155] rounded-xl px-3.5 py-2.5 text-[#F8FAFC] focus:border-[#6366F1] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[#CBD5E1] font-medium mb-1">Date *</label>
                  <input
                    type="date"
                    required
                    value={bookingForm.bookingDate}
                    onChange={(e) => setBookingForm({ ...bookingForm, bookingDate: e.target.value })}
                    className="w-full bg-[#0F172A] border border-[#334155] rounded-xl px-3 py-2 text-[#F8FAFC] focus:border-[#6366F1] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[#CBD5E1] font-medium mb-1">Start Time *</label>
                  <input
                    type="time"
                    required
                    value={bookingForm.startTime}
                    onChange={(e) => setBookingForm({ ...bookingForm, startTime: e.target.value })}
                    className="w-full bg-[#0F172A] border border-[#334155] rounded-xl px-3 py-2 text-[#F8FAFC] focus:border-[#6366F1] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[#CBD5E1] font-medium mb-1">End Time *</label>
                  <input
                    type="time"
                    required
                    value={bookingForm.endTime}
                    onChange={(e) => setBookingForm({ ...bookingForm, endTime: e.target.value })}
                    className="w-full bg-[#0F172A] border border-[#334155] rounded-xl px-3 py-2 text-[#F8FAFC] focus:border-[#6366F1] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[#CBD5E1] font-medium mb-1">Seats Booked *</label>
                  <input
                    type="number"
                    required
                    min={selectedRoomForBooking.minSeats || 1}
                    max={selectedRoomForBooking.maxSeats || selectedRoomForBooking.capacity}
                    value={bookingForm.seatsBooked}
                    onChange={(e) => setBookingForm({ ...bookingForm, seatsBooked: Number(e.target.value) })}
                    className="w-full bg-[#0F172A] border border-[#334155] rounded-xl px-3 py-2 text-[#F8FAFC] font-mono focus:border-[#6366F1] focus:outline-none font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[#CBD5E1] font-medium mb-1">Payment Method</label>
                  <select
                    value={bookingForm.paymentMethod}
                    onChange={(e) => setBookingForm({ ...bookingForm, paymentMethod: e.target.value })}
                    className="w-full bg-[#0F172A] border border-[#334155] rounded-xl px-3 py-2 text-[#F8FAFC] focus:border-[#6366F1] focus:outline-none font-semibold cursor-pointer"
                  >
                    <option value="cash">Reception Cash</option>
                    {canUseStaffMeetingCredits && (
                      <option value="credits">
                        Meeting Credits ({staffMeetingCreditsNeeded} of {staffMeetingCreditsBalance})
                      </option>
                    )}
                    <option value="wallet">Member Credit Wallet</option>
                    <option value="razorpay">Online Razorpay Payment</option>
                  </select>
                  {canUseStaffMeetingCredits && (
                    <p className="text-[10px] text-[#38BDF8] mt-1 flex items-center gap-1">
                      <Tag className="w-3 h-3" />
                      <span>Meeting credit payment available for this member.</span>
                    </p>
                  )}
                </div>
              </div>

              {/* DYNAMIC PRICING BREAKDOWN BOX */}
              <div className="p-4 rounded-2xl bg-[#0F172A] border border-[#334155] space-y-2 text-xs">
                <div className="flex justify-between text-[#CBD5E1]">
                  <span>Base Hourly Rate ({pricing.hours} hour(s)):</span>
                  <span className="font-mono font-bold text-[#F8FAFC]">₹{(Number(selectedRoomForBooking.hourlyRate || 0) * pricing.hours).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-[#CBD5E1]">
                  <span>Per Seat Pricing ({bookingForm.seatsBooked} seat(s) × ₹{selectedRoomForBooking.perSeatPrice}/hr):</span>
                  <span className="font-mono font-bold text-[#F8FAFC]">₹{(Number(selectedRoomForBooking.perSeatPrice || 0) * bookingForm.seatsBooked * pricing.hours).toLocaleString()}</span>
                </div>
                {(pricing.serviceCharge || 0) > 0 && (
                  <div className="flex justify-between text-[#CBD5E1]">
                    <span>Service Charge ({selectedRoomForBooking.serviceChargeType}):</span>
                    <span className="font-mono font-bold text-[#F8FAFC]">₹{(pricing.serviceCharge || 0).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-[#94A3B8]">
                  <span>Tax ({(taxRate * 100).toFixed(0)}%):</span>
                  <span className="font-mono text-[#CBD5E1]">₹{pricing.gstTax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-[#334155] font-extrabold text-sm text-[#F8FAFC]">
                  <span>Grand Total Amount:</span>
                  <span className="font-mono text-[#10B981]">₹{pricing.grandTotal.toFixed(2)}</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={submittingBooking}
                className="w-full py-3.5 rounded-full text-xs font-bold text-white bg-[#6366F1] hover:bg-[#4F46E5] shadow-md cursor-pointer"
              >
                {submittingBooking
                  ? 'Processing Reservation...'
                  : bookingForm.paymentMethod === 'razorpay'
                  ? `Pay ₹${pricing.grandTotal.toFixed(2)} via Razorpay`
                  : `Confirm Reservation (₹${pricing.grandTotal.toFixed(2)})`}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Razorpay Gateway Modal */}
      <RazorpayGatewayModal
        isOpen={razorpayModalData.isOpen}
        amount={razorpayModalData.amount}
        orderId={razorpayModalData.orderId}
        customerName={bookingForm.customerName}
        customerEmail={bookingForm.customerEmail}
        description={`Suite Booking for ${selectedRoomForBooking?.name}`}
        onSuccess={(data) =>
          executeBooking({
            ...razorpayModalData.bookingPayload,
            paymentStatus: 'paid',
            rawResponse: {
              razorpay_order_id: data.razorpay_order_id,
              razorpay_payment_id: data.razorpay_payment_id,
            },
          })
        }
        onClose={() => setRazorpayModalData({ isOpen: false, amount: 0, orderId: '', bookingPayload: null })}
      />
    </div>
  );
}
