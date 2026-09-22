'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import RazorpayGatewayModal from '@/components/ui/RazorpayGatewayModal';
import UnauthorizedNoticeModal from '@/components/ui/UnauthorizedNoticeModal';
import { apiClient, getMediaUrl } from '@/lib/api-client';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useBranch } from '@/context/BranchContext';
import { loadRazorpayScript } from '@/lib/razorpay';
import Link from 'next/link';
import { ShieldAlert, AlertCircle, UserCheck, CreditCard, Building2, ArrowRight, Info } from 'lucide-react';

import {
  MeetingRoom,
  AvailabilityData,
  PaymentMethod,
  BookingFormData,
  MeetingRoomHero,
  RoomCard,
  SlotSelector,
  BookingSummaryCard,
  MobileBookingDrawer,
  RoomCardSkeleton,
  RoomDetailsModal,
} from '@/features/meeting-rooms';

export default function MeetingRoomsPage() {
  const router = useRouter();
  const { user, refreshProfile } = useAuth();
  const { activeBranch } = useBranch();

  // Core State
  const [rooms, setRooms] = useState<MeetingRoom[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedRoom, setSelectedRoom] = useState<MeetingRoom | null>(null);

  // Room Details Modal State
  const [detailsRoom, setDetailsRoom] = useState<MeetingRoom | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState<boolean>(false);

  const handleOpenDetails = (room: MeetingRoom) => {
    setDetailsRoom(room);
    setDetailsModalOpen(true);
  };
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [availability, setAvailability] = useState<AvailabilityData | null>(null);
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);
  const [selectedSeats, setSelectedSeats] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [taxRate, setTaxRate] = useState<number>(0.18);
  const [checking, setChecking] = useState<boolean>(false);
  const [booking, setBooking] = useState<boolean>(false);

  // Guest Auth Recovery & Error Recovery Modal States
  const [authRecoveryModalOpen, setAuthRecoveryModalOpen] = useState<boolean>(false);
  const [authRecoveryMessage, setAuthRecoveryMessage] = useState<string>('');
  const [errorModalData, setErrorModalData] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
  }>({ isOpen: false, title: '', message: '' });

  // Payment Option state: 'credits' | 'wallet' | 'razorpay' | 'reception'
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('wallet');
  const [razorpayModalData, setRazorpayModalData] = useState<{
    isOpen: boolean;
    amount: number;
    orderId: string;
    payload?: any;
  }>({ isOpen: false, amount: 0, orderId: '' });

  // Guest Form Data
  const [formData, setFormData] = useState<BookingFormData>({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    companyName: '',
    gstin: '',
  });

  // Sync Logged-In User Profile into Form Data
  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        customerName: user.name || '',
        customerEmail: user.email || '',
        customerPhone: user.phone || '',
        companyName: user.companyName || '',
        gstin: user.gstin || '',
      }));
    }
  }, [user]);

  // Fetch Rooms for Active Branch & Global Tax Rate
  useEffect(() => {
    async function fetchRooms() {
      try {
        setLoading(true);
        const url = activeBranch ? `/meeting-rooms?branchId=${activeBranch.id}` : '/meeting-rooms';
        const res = await apiClient.get(url);
        const data: MeetingRoom[] = res.data || [];
        setRooms(data);
        if (data.length > 0) {
          setSelectedRoom(data[0]);
          setSelectedSeats(data[0].minSeats || 1);
        } else {
          setSelectedRoom(null);
        }
      } catch (err) {
        console.error('Failed to load meeting rooms', err);
        setRooms([]);
        setSelectedRoom(null);
      } finally {
        setLoading(false);
      }
    }
    fetchRooms();

    async function fetchTax() {
      try {
        const res = await apiClient.get('/cms/settings');
        if (res.data?.taxRate !== undefined) {
          setTaxRate(Number(res.data.taxRate));
        }
      } catch (e) {
        // Default GST 18%
      }
    }
    fetchTax();
  }, [activeBranch]);

  // Check Slot Availability when selected room or date changes
  useEffect(() => {
    if (!selectedRoom || !selectedDate) return;
    const roomSlug = selectedRoom.slug;

    async function checkAvailability() {
      setChecking(true);
      try {
        const res = await apiClient.post(
          `/meeting-rooms/${roomSlug}/availability`,
          { date: selectedDate }
        );
        setAvailability(res.data);
        setSelectedSlots([]);
      } catch (err) {
        console.error('Failed to check room availability', err);
      } finally {
        setChecking(false);
      }
    }
    checkAvailability();
  }, [selectedRoom, selectedDate]);

  // Filter Categories
  const categories = useMemo(() => {
    const unique = Array.from(new Set(rooms.map((r) => r.category || 'Conference Room')));
    return ['All Suites', ...unique];
  }, [rooms]);

  // Filtered Rooms List
  const filteredRooms = useMemo(() => {
    return rooms.filter((room) => {
      const catName = room.category || 'Conference Room';
      const matchCategory =
        selectedCategory === 'All Suites' || selectedCategory === 'All' || catName === selectedCategory;
      const matchSearch =
        !searchQuery.trim() ||
        room.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (room.description && room.description.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchCategory && matchSearch;
    });
  }, [rooms, selectedCategory, searchQuery]);

  // Slot Selection Handlers (Enforces Contiguous Range Selection for Meeting Suite Reservations)
  const handleToggleSlot = (slotStartTime: string) => {
    if (!availability?.timeSlots || availability.timeSlots.length === 0) return;

    const allSlots = availability.timeSlots;

    // 1. If no slots selected, select the clicked slot
    if (selectedSlots.length === 0) {
      setSelectedSlots([slotStartTime]);
      return;
    }

    // 2. If clicking an already selected slot
    if (selectedSlots.includes(slotStartTime)) {
      if (selectedSlots.length === 1) {
        setSelectedSlots([]);
        return;
      }
      const sorted = [...selectedSlots].sort();
      const clickedIdx = sorted.indexOf(slotStartTime);
      if (clickedIdx === 0) {
        // Remove earliest slot
        setSelectedSlots(sorted.slice(1));
      } else if (clickedIdx === sorted.length - 1) {
        // Remove latest slot
        setSelectedSlots(sorted.slice(0, sorted.length - 1));
      } else {
        // Reset to just clicked slot
        setSelectedSlots([slotStartTime]);
      }
      return;
    }

    // 3. If clicking a new slot, form a continuous time range
    const allSelectedAndNew = [...selectedSlots, slotStartTime].sort();
    const minTime = new Date(allSelectedAndNew[0]).getTime();
    const maxTime = new Date(allSelectedAndNew[allSelectedAndNew.length - 1]).getTime();

    // Find all slots in availability that fall within [minTime, maxTime]
    const rangeSlots = allSlots.filter((s) => {
      const t = new Date(s.startTime).getTime();
      return t >= minTime && t <= maxTime;
    });

    // Check if any slot in the requested range is unavailable
    const hasUnavailableInBetween = rangeSlots.some((s) => !s.isAvailable);
    if (hasUnavailableInBetween) {
      setErrorModalData({
        isOpen: true,
        title: 'Unavailable Time Range',
        message: 'Selected range contains unavailable slots. Please select a continuous block of available time.',
      });
      setSelectedSlots([slotStartTime]);
      return;
    }

    // Expand selection to include all contiguous slots in the range
    const newSelectedRange = rangeSlots.map((s) => s.startTime).sort();
    setSelectedSlots(newSelectedRange);
  };

  const handleClearSlots = () => {
    setSelectedSlots([]);
  };

  const handleSelectAllAvailable = () => {
    if (!availability?.timeSlots) return;
    const available = availability.timeSlots.filter((s) => s.isAvailable).map((s) => s.startTime);
    setSelectedSlots(available);
  };

  const handleRoomSelect = (room: MeetingRoom) => {
    setSelectedRoom(room);
    setSelectedSeats(room.minSeats || 1);
  };

  // Grand total calculation for submission validation (each slot = 30 mins = 0.5 hr)
  const totalHours = selectedSlots.length * 0.5;
  const baseRate = Number(selectedRoom?.hourlyRate || 0);
  const perSeatRate = Number(selectedRoom?.perSeatPrice || 0);
  const baseSubtotal = (baseRate + perSeatRate * selectedSeats) * totalHours;

  let serviceChargeAmount = 0;
  if (selectedRoom?.serviceChargeType === 'fixed') {
    serviceChargeAmount = Number(selectedRoom.serviceChargeValue || 0);
  } else if (selectedRoom?.serviceChargeType === 'percentage') {
    serviceChargeAmount = baseSubtotal * (Number(selectedRoom.serviceChargeValue || 0) / 100);
  }

  const subtotalWithService = baseSubtotal + serviceChargeAmount;
  const gstTax = subtotalWithService * taxRate;
  const grandTotal = subtotalWithService + gstTax;

  const handleCreateBookingAfterPayment = async (payload: any) => {
    try {
      const res = await apiClient.post('/meeting-rooms/booking', payload);
      if (res.data?.receiptUrl) {
        router.push(res.data.receiptUrl);
      } else {
        alert('Booking successful!');
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to confirm booking after payment');
    } finally {
      setRazorpayModalData({ isOpen: false, amount: 0, orderId: '' });
      setBooking(false);
    }
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoom) return;

    if (selectedSlots.length === 0) {
      alert('Please select at least 1 time slot (30-min minimum)');
      return;
    }

    const minSeats = selectedRoom.minSeats || 1;
    const maxSeats = selectedRoom.maxSeats || selectedRoom.capacity || 10;
    if (selectedSeats < minSeats || selectedSeats > maxSeats) {
      alert(`Seat Capacity Error: ${selectedRoom.name} allows between ${minSeats} and ${maxSeats} seats. Please adjust your seat count.`);
      return;
    }

    setBooking(true);

    try {
      const payload = {
        meetingRoomId: selectedRoom.id,
        roomSlug: selectedRoom.slug,
        customerName: formData.customerName,
        customerEmail: formData.customerEmail,
        customerPhone: formData.customerPhone,
        companyName: formData.companyName,
        gstin: formData.gstin,
        bookingDate: selectedDate,
        selectedSlots,
        seatsBooked: selectedSeats,
        totalAmount: grandTotal,
        paymentMethod,
        userId: user?.id,
      };

      // Option 1: Pay via Meeting Room Credits
      if (paymentMethod === 'credits') {
        if (!user) {
          setAuthRecoveryMessage('Meeting room credits belong to registered member accounts.');
          setAuthRecoveryModalOpen(true);
          setBooking(false);
          return;
        }

        const meetingCreditsNeeded = totalHours;
        const meetingCreditsBalance = Number(user.meetingCreditsBalance || 0);

        if (meetingCreditsBalance < meetingCreditsNeeded) {
          setErrorModalData({
            isOpen: true,
            title: 'Insufficient Meeting Credits',
            message: `Available credits: ${meetingCreditsBalance}, Required: ${meetingCreditsNeeded} Credit${meetingCreditsNeeded === 1 ? '' : 's'}. Please select Credit Wallet, Razorpay, or Pay at Reception.`,
          });
          setBooking(false);
          return;
        }

        const res = await apiClient.post('/meeting-rooms/booking', payload);
        await refreshProfile();

        if (res.data?.receiptUrl) {
          router.push(res.data.receiptUrl);
        }
        return;
      }

      // Option 2: Pay via Credit Wallet
      if (paymentMethod === 'wallet') {
        if (!user) {
          setAuthRecoveryMessage('Credit wallet balances belong to registered member accounts.');
          setAuthRecoveryModalOpen(true);
          setBooking(false);
          return;
        }

        const walletBalance = Number(user.walletBalance || 0);
        if (walletBalance < grandTotal) {
          setErrorModalData({
            isOpen: true,
            title: 'Insufficient Wallet Balance',
            message: `Available balance: ₹${walletBalance}, Required: ₹${grandTotal.toFixed(2)}. Please select Online Razorpay or Pay at Reception.`,
          });
          setBooking(false);
          return;
        }

        const res = await apiClient.post('/meeting-rooms/booking', payload);
        await refreshProfile();

        if (res.data?.receiptUrl) {
          router.push(res.data.receiptUrl);
        }
        return;
      }

      // Option 3: Pay Online via Razorpay (Requires Signed-In Member Session)
      if (paymentMethod === 'razorpay') {
        if (!user) {
          setAuthRecoveryMessage('Online Razorpay payments and Credit Wallet methods are reserved for registered account members for transaction security and GST invoice tracking. Unauthenticated guests can complete reservations using Pay at Reception (Cash Method) or sign in to pay online.');
          setAuthRecoveryModalOpen(true);
          setBooking(false);
          return;
        }

        const orderRes = await apiClient.post('/wallet/razorpay/create-order', {
          amount: grandTotal,
          customerName: formData.customerName,
          customerEmail: formData.customerEmail,
        });
        const { orderId, amount: amountInPaise, keyId, currency } = orderRes.data;

        const isPlaceholderKey = !keyId || keyId.includes('placeholder') || keyId.includes('demo');

        if (!isPlaceholderKey) {
          const loaded = await loadRazorpayScript();
          if (loaded) {
            try {
              const options = {
                key: keyId,
                amount: amountInPaise,
                currency: currency || 'INR',
                name: 'Cowork30 Meeting Rooms',
                description: `${selectedRoom.name} Reservation (₹${grandTotal.toFixed(2)})`,
                image: '/Logo.png',
                order_id: orderId,
                handler: async function () {
                  await handleCreateBookingAfterPayment(payload);
                },
                prefill: {
                  name: formData.customerName,
                  email: formData.customerEmail,
                  contact: formData.customerPhone,
                },
                theme: {
                  color: '#e11d48',
                },
              };

              const paymentObject = new (window as any).Razorpay(options);
              paymentObject.open();
              return;
            } catch (e) {
              console.warn('Official Razorpay SDK failed initialization. Using Razorpay Sandbox Gateway Modal.');
            }
          }
        }

        // Fallback: Open interactive Razorpay Gateway Modal
        setRazorpayModalData({
          isOpen: true,
          amount: grandTotal,
          orderId,
          payload,
        });
        return;
      }

      // Option 4: Manual Payment at Reception (Supports Guest & Member Checkout)
      const res = await apiClient.post('/meeting-rooms/booking', payload);
      if (res.data?.receiptUrl) {
        router.push(res.data.receiptUrl);
      } else {
        router.push(`/meeting-rooms/receipt/${res.data.booking?.viewToken || 'confirmation'}`);
      }
    } catch (err: any) {
      setErrorModalData({
        isOpen: true,
        title: 'Reservation Request Notice',
        message: err.response?.data?.message || 'Failed to complete reservation. Please try again.',
      });
    } finally {
      setBooking(false);
    }
  };

  const [mobileStep, setMobileStep] = useState<'suite' | 'slots' | 'checkout'>('slots');

  return (
    <div className="min-h-screen lg:h-screen lg:max-h-screen bg-[#FAFAFC] text-slate-900 flex flex-col font-sans selection:bg-indigo-600 selection:text-white overflow-x-hidden lg:overflow-hidden">
      <Navbar />

      <main className="flex-1 min-h-0 w-full max-w-[1600px] mx-auto px-3 sm:px-6 lg:px-8 py-2.5 flex flex-col pb-32 lg:pb-2 overflow-y-auto lg:overflow-hidden">
        {/* Compact Suite Selector Header Bar */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-3 mb-2.5 shrink-0 shadow-xs">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div className="flex items-center space-x-2">
              <h2 className="text-sm font-black text-slate-900 tracking-tight">Meeting Suites</h2>
              <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                {filteredRooms.length} Available
              </span>
            </div>

            {/* Category Filter Chips */}
            <div className="flex items-center space-x-1.5 overflow-x-auto max-w-full no-scrollbar">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => {
                    setSelectedCategory(cat);
                    const matched =
                      cat === 'All Suites' || cat === 'All'
                        ? rooms[0]
                        : rooms.find((r) => (r.category || 'Conference Room') === cat);
                    if (matched) {
                      setSelectedRoom(matched);
                      setSelectedSeats(matched.minSeats || 1);
                    }
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Horizontal Selectable Room Cards Carousel */}
          {loading ? (
            <div className="flex space-x-3 mt-2 overflow-x-auto pb-1">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="w-48 h-14 bg-slate-100 animate-pulse rounded-xl shrink-0" />
              ))}
            </div>
          ) : filteredRooms.length === 0 ? (
            <p className="text-xs text-slate-400 mt-2">No suites matching search criteria.</p>
          ) : (
            <div className="flex items-center space-x-2.5 mt-2 overflow-x-auto pb-1 no-scrollbar">
              {filteredRooms.map((room) => {
                const isSelected = selectedRoom?.id === room.id;
                const rawImg = room.imageUrl || room.featuredImage || (Array.isArray(room.images) && room.images[0]) || 'https://images.unsplash.com/photo-1517502884422-41eaead166d4?auto=format&fit=crop&w=600&q=80';
                const img = getMediaUrl(rawImg);

                return (
                  <button
                    key={room.id}
                    type="button"
                    onClick={() => {
                      handleRoomSelect(room);
                      if (mobileStep === 'suite') setMobileStep('slots');
                    }}
                    className={`flex items-center space-x-2.5 p-1.5 pr-3 rounded-xl border text-left transition-all shrink-0 cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-50/90 border-indigo-600 text-indigo-950 font-semibold ring-2 ring-indigo-500/20 shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300'
                    }`}
                  >
                    <div className="relative w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-slate-200">
                      <img src={img} alt={room.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 truncate leading-tight">{room.name}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5 font-medium">
                        <span className="font-extrabold text-indigo-600">₹{room.hourlyRate}</span>/hr · {room.capacity || 10} seats
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Mobile View Navigation Stepper (< 1024px) */}
        <div className="flex lg:hidden items-center justify-between bg-white border border-slate-200/90 rounded-xl p-1 mb-2 shrink-0 gap-1 shadow-xs">
          <button
            type="button"
            onClick={() => setMobileStep('suite')}
            className={`flex-1 py-2 text-center text-[11px] font-bold rounded-lg transition-all ${
              mobileStep === 'suite' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 bg-slate-50 hover:bg-slate-100'
            }`}
          >
            1. Suite {selectedRoom ? `(${selectedRoom.name})` : ''}
          </button>
          <button
            type="button"
            onClick={() => setMobileStep('slots')}
            className={`flex-1 py-2 text-center text-[11px] font-bold rounded-lg transition-all ${
              mobileStep === 'slots' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 bg-slate-50 hover:bg-slate-100'
            }`}
          >
            2. Date & Slots
          </button>
          <button
            type="button"
            onClick={() => setMobileStep('checkout')}
            disabled={selectedSlots.length === 0}
            className={`flex-1 py-2 text-center text-[11px] font-bold rounded-lg transition-all ${
              mobileStep === 'checkout'
                ? 'bg-indigo-600 text-white shadow-xs'
                : selectedSlots.length === 0
                ? 'text-slate-300 bg-slate-50 cursor-not-allowed'
                : 'text-slate-600 bg-slate-50 hover:bg-slate-100'
            }`}
          >
            3. Checkout ({selectedSlots.length})
          </button>
        </div>

        {/* Main Split Grid (Non-Scrollable Viewport Fit) */}
        {selectedRoom ? (
          <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-3 overflow-hidden">
            {/* Mobile Step 1: Suite Selection Showcase View */}
            {mobileStep === 'suite' && (
              <div className="lg:hidden col-span-1 flex flex-col min-h-0 overflow-y-auto bg-white border border-slate-200 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-900">Choose a Suite</h3>
                  <span className="text-[10px] text-slate-500 font-semibold">{filteredRooms.length} Available</span>
                </div>

                <div className="grid grid-cols-1 gap-2.5 flex-1 overflow-y-auto pr-1">
                  {filteredRooms.map((room) => {
                    const isSelected = selectedRoom?.id === room.id;
                    const img = room.imageUrl || room.featuredImage || (Array.isArray(room.images) && room.images[0]) || 'https://images.unsplash.com/photo-1517502884422-41eaead166d4?auto=format&fit=crop&w=600&q=80';
                    return (
                      <button
                        key={room.id}
                        type="button"
                        onClick={() => {
                          handleRoomSelect(room);
                          setMobileStep('slots');
                        }}
                        className={`flex items-center space-x-3 p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-50 border-indigo-600 ring-2 ring-indigo-500/20'
                            : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <div className="relative w-12 h-12 rounded-lg overflow-hidden shrink-0 bg-slate-200">
                          <img src={img} alt={room.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h4 className="text-xs font-bold text-slate-900 truncate">{room.name}</h4>
                            <span className="text-xs font-black text-rose-600">₹{room.hourlyRate}/hr</span>
                          </div>
                          <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">
                            {room.description || `${room.capacity || 10} seats configuration available.`}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={() => setMobileStep('slots')}
                  className="w-full py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-all flex items-center justify-center space-x-1 cursor-pointer shrink-0 mt-2"
                >
                  <span>Continue with {selectedRoom.name}</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </button>
              </div>
            )}

            {/* Desktop Left / Mobile Slot Step (Step 2) */}
            <div className={`lg:col-span-6 flex flex-col min-h-0 overflow-hidden ${mobileStep === 'slots' ? 'flex' : 'hidden lg:flex'}`}>
              <SlotSelector
                selectedRoom={selectedRoom}
                selectedDate={selectedDate}
                onDateChange={setSelectedDate}
                selectedSeats={selectedSeats}
                onSeatsChange={setSelectedSeats}
                availability={availability}
                selectedSlots={selectedSlots}
                onToggleSlot={handleToggleSlot}
                onClearSlots={handleClearSlots}
                onSelectAllAvailable={handleSelectAllAvailable}
                checking={checking}
                onNextStep={() => setMobileStep('checkout')}
                onViewDetails={handleOpenDetails}
              />
            </div>

            {/* Desktop Right / Mobile Checkout Step (Step 3) */}
            <div className={`lg:col-span-6 flex flex-col min-h-0 overflow-hidden ${mobileStep === 'checkout' ? 'flex' : 'hidden lg:flex'}`}>
              <BookingSummaryCard
                selectedRoom={selectedRoom}
                formData={formData}
                onFormDataChange={setFormData}
                paymentMethod={paymentMethod}
                onPaymentMethodChange={setPaymentMethod}
                selectedSlotsCount={selectedSlots.length}
                selectedSeats={selectedSeats}
                user={user}
                taxRate={taxRate}
                booking={booking}
                onSubmit={handleBookingSubmit}
                onBackStep={() => setMobileStep('slots')}
              />
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-white border border-slate-200 rounded-2xl p-8 text-center">
            <div>
              <p className="text-sm font-bold text-slate-700">No meeting room selected.</p>
              <p className="text-xs text-slate-400 mt-1">Please select a suite from the top bar above.</p>
            </div>
          </div>
        )}
      </main>

      {/* Room Details Modal Popup */}
      <RoomDetailsModal
        room={detailsRoom}
        isOpen={detailsModalOpen}
        onClose={() => setDetailsModalOpen(false)}
        onSelectSuite={(room) => {
          handleRoomSelect(room);
          setMobileStep('slots');
        }}
      />

      {/* Razorpay Gateway Fallback Modal */}
      <RazorpayGatewayModal
        isOpen={razorpayModalData.isOpen}
        amount={razorpayModalData.amount}
        orderId={razorpayModalData.orderId}
        customerName={formData.customerName}
        customerEmail={formData.customerEmail}
        description={`${selectedRoom?.name} Suite Reservation`}
        onSuccess={() => handleCreateBookingAfterPayment(razorpayModalData.payload)}
        onClose={() => setRazorpayModalData({ isOpen: false, amount: 0, orderId: '' })}
      />

      {/* UNAUTHORIZED ACCESS NOTICE & GUEST RECOVERY MODAL */}
      <UnauthorizedNoticeModal
        isOpen={authRecoveryModalOpen}
        title="Member Sign In Required"
        reason={authRecoveryMessage || "Meeting room credits and credit wallet balances belong to registered member accounts."}
        returnUrl="/meeting-rooms"
        onClose={() => setAuthRecoveryModalOpen(false)}
        onContinueAsGuest={() => {
          setAuthRecoveryModalOpen(false);
          setPaymentMethod('reception');
          setTimeout(() => {
            const fakeEvent = { preventDefault: () => {} } as React.FormEvent;
            handleBookingSubmit(fakeEvent);
          }, 150);
        }}
        guestOptionLabel="Switch to Pay at Reception (Cash Method)"
      />

      {/* ERROR RECOVERY NOTICE MODAL */}
      {errorModalData.isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">{errorModalData.title}</h3>
                <p className="text-xs text-rose-600 font-medium mt-0.5">{errorModalData.message}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setErrorModalData({ isOpen: false, title: '', message: '' })}
              className="w-full py-2.5 rounded-2xl font-extrabold text-xs text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
