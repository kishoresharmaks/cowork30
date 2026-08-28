'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import RazorpayGatewayModal from '@/components/ui/RazorpayGatewayModal';
import UnauthorizedNoticeModal from '@/components/ui/UnauthorizedNoticeModal';
import { apiClient } from '@/lib/api-client';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useBranch } from '@/context/BranchContext';
import { loadRazorpayScript } from '@/lib/razorpay';
import Link from 'next/link';
import { ShieldAlert, AlertCircle, UserCheck, CreditCard, Building2 } from 'lucide-react';

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

  // Slot Selection Handlers
  const handleToggleSlot = (slotStartTime: string) => {
    if (selectedSlots.includes(slotStartTime)) {
      setSelectedSlots(selectedSlots.filter((s) => s !== slotStartTime));
    } else {
      setSelectedSlots([...selectedSlots, slotStartTime]);
    }
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

  // Grand total calculation for submission validation
  const totalHours = selectedSlots.length;
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
      alert('Please select at least 1 hourly time slot');
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

        const meetingCreditsNeeded = Math.max(1, totalHours);
        const meetingCreditsBalance = Number(user.meetingCreditsBalance || 0);

        if (meetingCreditsBalance < meetingCreditsNeeded) {
          setErrorModalData({
            isOpen: true,
            title: 'Insufficient Meeting Credits',
            message: `Available credits: ${meetingCreditsBalance}, Required: ${meetingCreditsNeeded}. Please select Credit Wallet, Razorpay, or Pay at Reception.`,
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

  return (
    <div className="min-h-screen bg-[#FAFAFC] text-slate-900 flex flex-col font-sans selection:bg-indigo-600 selection:text-white">
      <Navbar />

      <main className="pt-24 pb-32 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full grow">
        {/* Two-Column Desktop Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Hero, Filters, & Room Showcase Grid (7 Cols on desktop) */}
          <div className="lg:col-span-7 space-y-6">
            <MeetingRoomHero
              categories={categories}
              selectedCategory={selectedCategory}
              onSelectCategory={(cat) => {
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
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              totalRoomsCount={filteredRooms.length}
            />

            {/* Room Showcase Grid */}
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {Array.from({ length: 4 }).map((_, i) => (
                  <RoomCardSkeleton key={i} />
                ))}
              </div>
            ) : filteredRooms.length === 0 ? (
              <div className="bg-white p-10 rounded-2xl text-center border border-slate-200 shadow-xs space-y-2">
                <h3 className="text-base font-bold text-slate-900">No Suites Found</h3>
                <p className="text-xs text-slate-500">
                  No meeting rooms match your filter or search query. Try choosing another category.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {filteredRooms.map((room) => (
                  <RoomCard
                    key={room.id}
                    room={room}
                    isSelected={selectedRoom?.id === room.id}
                    onSelect={handleRoomSelect}
                  />
                ))}
              </div>
            )}
            {/* Mobile/Tablet Inline Slot Selector (< 1024px) */}
            {selectedRoom && (
              <div className="lg:hidden space-y-5 pt-4 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900">Configure & Book {selectedRoom.name}</h3>
                  <span className="text-xs font-bold text-pink-600">₹{selectedRoom.hourlyRate}/hr</span>
                </div>
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
                />
              </div>
            )}
          </div>

          {/* Right Column: Sticky Booking Console (5 Cols on desktop) */}
          {selectedRoom && (
            <div className="hidden lg:block lg:col-span-5 sticky top-24 space-y-5">
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
              />

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
              />
            </div>
          )}
        </div>

        {/* Mobile / Tablet Sticky Bar & Slide-Over Drawer (< 1024px) */}
        {selectedRoom && (
          <MobileBookingDrawer
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
            formData={formData}
            onFormDataChange={setFormData}
            paymentMethod={paymentMethod}
            onPaymentMethodChange={setPaymentMethod}
            selectedSlotsCount={selectedSlots.length}
            user={user}
            taxRate={taxRate}
            booking={booking}
            onSubmit={handleBookingSubmit}
          />
        )}
      </main>

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

      <Footer />
    </div>
  );
}
