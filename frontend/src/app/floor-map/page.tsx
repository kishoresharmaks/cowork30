'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import RazorpayGatewayModal from '@/components/ui/RazorpayGatewayModal';
import { Compass, Info, Check, Zap, Eye, Calendar, Sparkles, MapPin, Wallet, CreditCard, DollarSign, X, CheckCircle2, ArrowRight, Layers, Tag } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { loadRazorpayScript } from '@/lib/razorpay';

const DEFAULT_DESK_PHOTO = 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=600&q=80';

export default function FloorMapPage() {
  const router = useRouter();
  const { user, refreshProfile } = useAuth();

  const [floorMapData, setFloorMapData] = useState<any>(null);
  const [allFloors, setAllFloors] = useState<any[]>([]);
  const [pricingPlans, setPricingPlans] = useState<any[]>([]);
  const [selectedFloorId, setSelectedFloorId] = useState<number | null>(null);
  const [selectedDesk, setSelectedDesk] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Desk Booking Modal State
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [durationMode, setDurationMode] = useState<'daily' | 'monthly'>('daily');
  const [paymentMethod, setPaymentMethod] = useState<'credits' | 'wallet' | 'razorpay' | 'reception'>('wallet');
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    companyName: '',
    gstin: '',
    preferredDate: new Date().toISOString().split('T')[0],
  });

  // Razorpay Gateway Modal State
  const [razorpayModalData, setRazorpayModalData] = useState<{
    isOpen: boolean;
    amount: number;
    orderId: string;
    payload?: any;
  }>({
    isOpen: false,
    amount: 0,
    orderId: '',
  });

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

  async function fetchFloorMap(floorId?: number) {
    try {
      setLoading(true);
      const url = floorId ? `/floor-map/1?floorId=${floorId}` : '/floor-map/1';
      const res = await apiClient.get(url);
      setFloorMapData(res.data.floorMap);
      setSelectedFloorId(res.data.floorMap.id);
      if (res.data.allFloors) {
        setAllFloors(res.data.allFloors);
      }
    } catch (err) {
      console.error('Failed to load floor map:', err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchPricingPlans() {
    try {
      const res = await apiClient.get('/pricing/plans');
      setPricingPlans(res.data || []);
    } catch (err) {
      console.error('Failed to load pricing plans for floor map booking:', err);
    }
  }

  useEffect(() => {
    fetchFloorMap();
    fetchPricingPlans();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-emerald-500/20 border-emerald-500 text-emerald-400 hover:bg-emerald-500/30';
      case 'occupied':
        return 'bg-rose-500/20 border-rose-500 text-rose-400 opacity-60 cursor-not-allowed';
      case 'reserved':
        return 'bg-amber-500/20 border-amber-500 text-amber-400 opacity-80';
      default:
        return 'bg-slate-800 border-slate-700 text-slate-400';
    }
  };

  const getDeskPrice = () => {
    if (!selectedDesk) return 0;
    return durationMode === 'monthly' ? Number(selectedDesk.monthlyPrice || 5000) : Number(selectedDesk.dailyPrice || 500);
  };

  const getDeskCreditsNeeded = () => (durationMode === 'monthly' ? 30 : 1);

  const getDefaultPricingPlanId = () => {
    const activePlan = pricingPlans.find((plan) => plan.isActive);
    return activePlan?.id || pricingPlans[0]?.id || 1;
  };

  const currentDeskCreditsNeeded = getDeskCreditsNeeded();
  const currentDeskCreditsBalance = Number(user?.deskCreditsBalance || 0);
  const canUseDeskCredits = currentDeskCreditsBalance >= currentDeskCreditsNeeded;

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDesk) return;

    setSubmitting(true);
    const amount = getDeskPrice();
    const deskCreditsNeeded = getDeskCreditsNeeded();
    const deskCreditsBalance = Number(user?.deskCreditsBalance || 0);
    const notesText = `Floor Map Desk Reservation | Desk #${selectedDesk.deskNumber} (${selectedDesk.deskType.replace('_', ' ')}) | Rate: ₹${amount}/${durationMode}`;

    try {
      const payload = {
        pricingPlanId: getDefaultPricingPlanId(),
        branchId: floorMapData?.branchId || 1,
        userId: user?.id,
        customerName: formData.customerName,
        customerEmail: formData.customerEmail,
        customerPhone: formData.customerPhone,
        companyName: formData.companyName,
        gstin: formData.gstin,
        preferredDate: formData.preferredDate,
        preferredTimeSlot: durationMode === 'monthly' ? 'Monthly Pass (Full Access)' : 'Daily Pass (8:00 AM - 8:00 PM)',
        notes: notesText,
        bookingType: 'direct_booking',
        status: 'confirmed',
        paymentStatus: paymentMethod === 'reception' ? 'unpaid' : 'paid',
        totalAmount: amount,
      };

      // Option 1: Desk Booking Credits
      if (paymentMethod === 'credits') {
        if (!user) {
          alert('Please sign in to use desk booking credits.');
          setSubmitting(false);
          return;
        }

        if (deskCreditsBalance < deskCreditsNeeded) {
          alert(`Insufficient desk credits (Available: ${deskCreditsBalance}, Required: ${deskCreditsNeeded}). Please select Credit Wallet, Razorpay, or Reception.`);
          setSubmitting(false);
          return;
        }

        const res = await apiClient.post('/pricing/tour-booking', payload);
        const booking = res.data?.booking;

        if (booking) {
          await apiClient.post('/wallet/pay-booking', {
            amount,
            bookingType: 'desk',
            bookingId: booking.id,
            paymentMethod: 'credits',
            creditType: 'desk',
            creditsAmount: deskCreditsNeeded,
            description: `Desk Credit Payment for Desk #${selectedDesk.deskNumber} reservation`,
          });
          await refreshProfile();
          await apiClient.put(`/floor-map/desk/${selectedDesk.id}/status`, { status: 'reserved' });
        }

        alert(`Desk #${selectedDesk.deskNumber} reserved using ${deskCreditsNeeded} desk credit${deskCreditsNeeded === 1 ? '' : 's'}! Redirecting to Member Dashboard...`);
        router.push('/dashboard?tab=bookings');
        return;
      }

      // Option 2: Credit Wallet Payment
      if (paymentMethod === 'wallet') {
        if (!user) {
          alert('Please sign in to use credit wallet balance.');
          setSubmitting(false);
          return;
        }

        const walletBalance = Number(user.walletBalance || 0);
        if (walletBalance < amount) {
          alert(`Insufficient wallet balance (Available: ₹${walletBalance}, Required: ₹${amount}). Please select Online Razorpay or top up your wallet.`);
          setSubmitting(false);
          return;
        }

        const res = await apiClient.post('/pricing/tour-booking', payload);
        const booking = res.data?.booking;

        if (booking) {
          await apiClient.post('/wallet/pay-booking', {
            amount,
            bookingType: 'desk',
            bookingId: booking.id,
            description: `Wallet Payment for Desk #${selectedDesk.deskNumber} reservation`,
          });
          await refreshProfile();
          await apiClient.put(`/floor-map/desk/${selectedDesk.id}/status`, { status: 'reserved' });
        }

        alert(`Desk #${selectedDesk.deskNumber} reserved successfully using wallet credits! Redirecting to Member Dashboard...`);
        router.push('/dashboard?tab=bookings');
        return;
      }

      // Option 3: Razorpay Online Payment
      if (paymentMethod === 'razorpay') {
        const orderRes = await apiClient.post('/wallet/razorpay/create-order', { amount });
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
                name: 'Cowork30 Floor Map Desks',
                description: `Desk #${selectedDesk.deskNumber} Pass (₹${amount})`,
                image: '/Logo.png',
                order_id: orderId,
                handler: async function (response: any) {
                  try {
                    await apiClient.post('/pricing/tour-booking', payload);
                    if (selectedDesk) {
                      await apiClient.put(`/floor-map/desk/${selectedDesk.id}/status`, { status: 'reserved' });
                    }
                    alert(`Desk #${selectedDesk.deskNumber} reserved! Redirecting to dashboard...`);
                    router.push('/dashboard?tab=bookings');
                  } catch (handlerErr) {
                    console.error('Razorpay success handler failed:', handlerErr);
                    alert('Payment received but booking confirmation failed. Please contact support with your payment ID.');
                  }
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
              console.warn('Official Razorpay SDK fallback.');
            }
          }
        }

        // Open Razorpay Gateway Modal
        setRazorpayModalData({
          isOpen: true,
          amount,
          orderId,
          payload,
        });
        return;
      }

      // Option 4: Manual Payment at Reception
      await apiClient.post('/pricing/tour-booking', payload);
      await apiClient.put(`/floor-map/desk/${selectedDesk.id}/status`, { status: 'reserved' });
      alert(`Desk #${selectedDesk.deskNumber} reserved! Please pay at reception upon check-in.`);
      router.push('/dashboard?tab=bookings');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to complete desk reservation');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRazorpayModalSuccess = async (payload: any) => {
    try {
      await apiClient.post('/pricing/tour-booking', payload);
      if (selectedDesk) {
        await apiClient.put(`/floor-map/desk/${selectedDesk.id}/status`, { status: 'reserved' });
      }
      alert('Desk reservation confirmed! Redirecting to Member Dashboard...');
      router.push('/dashboard?tab=bookings');
    } catch (err: any) {
      alert('Failed to complete booking after online payment');
    } finally {
      setRazorpayModalData({ isOpen: false, amount: 0, orderId: '' });
      setBookingModalOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Navbar />

      <main className="pt-28 pb-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full grow space-y-12">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-xs font-semibold text-purple-400">
            <Compass className="w-3.5 h-3.5" />
            <span>Interactive 2D Visual Desk & Photo Picker</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-white">
            {floorMapData?.floorName ? `${floorMapData.floorName} Layout` : 'Interactive Spatial Floor Layout'}
          </h1>
          <p className="text-sm text-slate-400">
            Click any desk node to view high-resolution photos, power socket positions, window views, and instant seat reservation.
          </p>

          {/* Status Legend */}
          <div className="flex items-center justify-center space-x-6 text-xs font-medium pt-2">
            <span className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500" />
              <span>Available</span>
            </span>
            <span className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded-full bg-rose-500" />
              <span>Occupied</span>
            </span>
            <span className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded-full bg-amber-500" />
              <span>Reserved</span>
            </span>
          </div>
        </div>

        {/* Multi-Floor Selector Tabs */}
        {allFloors.length > 1 && (
          <div className="flex items-center justify-center gap-3 overflow-x-auto py-2">
            {allFloors.map((fl: any) => {
              const isActive = fl.id === selectedFloorId;
              return (
                <button
                  key={fl.id}
                  onClick={() => {
                    setSelectedDesk(null);
                    fetchFloorMap(fl.id);
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 flex items-center space-x-2 ${
                    isActive
                      ? 'bg-gradient-brand text-white shadow-lg shadow-rose-500/25 ring-1 ring-rose-400 scale-105'
                      : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Floor {fl.floorLevel}: {fl.floorName}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Floor Map Layout Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Interactive Container */}
          <div className="lg:col-span-2 glass-panel p-6 sm:p-8 rounded-3xl relative overflow-hidden border border-slate-800 min-h-125 flex flex-col justify-between">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
              <div className="flex items-center space-x-2 text-xs text-slate-300 font-bold">
                <MapPin className="w-4 h-4 text-rose-500" />
                <span>
                  {floorMapData?.branch?.name ? `${floorMapData.branch.name} — ` : ''}
                  {floorMapData?.floorName || 'Ground Floor Innovation Hub'}
                </span>
                {floorMapData?.floorLevel && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/10 text-purple-300 border border-purple-500/20">
                    Floor {floorMapData.floorLevel}
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Live Sync Active</span>
              </div>
            </div>

            {/* Grid of Desks simulating 2D Layout with Desk Photos */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 my-auto">
              {floorMapData?.desks?.map((desk: any) => {
                const photoUrl = desk.imageUrl || DEFAULT_DESK_PHOTO;
                const isSelected = selectedDesk?.id === desk.id;

                return (
                  <div
                    key={desk.id}
                    onClick={() => desk.status !== 'occupied' && setSelectedDesk(desk)}
                    className={`rounded-2xl border overflow-hidden transition-all duration-300 flex flex-col justify-between cursor-pointer ${getStatusColor(
                      desk.status
                    )} ${isSelected ? 'ring-2 ring-rose-500 scale-105 shadow-xl' : ''}`}
                  >
                    {/* Desk Photo Thumbnail Header */}
                    <div className="h-24 w-full relative overflow-hidden bg-slate-900">
                      <img src={photoUrl} alt={desk.deskNumber} className="w-full h-full object-cover opacity-90 hover:scale-105 transition-all duration-500" />
                      <div className="absolute inset-0 bg-linear-to-t from-slate-950 via-transparent to-transparent" />
                      <span className="absolute top-2 right-2 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-black/70 backdrop-blur-sm text-white">
                        {desk.deskType.replace('_', ' ')}
                      </span>
                    </div>

                    <div className="p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-extrabold text-white">Desk #{desk.deskNumber}</span>
                        <span className="font-bold text-rose-400 text-xs">₹{desk.dailyPrice}/day</span>
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800/60">
                        <div className="flex items-center space-x-2">
                          {desk.hasPowerOutlet && <Zap className="w-3 h-3 text-amber-400" />}
                          {desk.hasWindowView && <Eye className="w-3 h-3 text-sky-400" />}
                        </div>
                        <span className="capitalize font-semibold">{desk.status}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="text-center pt-6 text-[10px] text-slate-500 border-t border-slate-800 mt-6 flex items-center justify-center space-x-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>Real-time availability updated live. Click any green available desk to select and reserve.</span>
            </div>
          </div>

          {/* Desk Detail Inspector Tooltip Panel */}
          <div className="glass-panel p-6 sm:p-8 rounded-3xl space-y-6 border border-slate-800 h-fit">
            <h3 className="text-lg font-bold text-white border-b border-slate-800 pb-4">
              Desk Inspector & Photo
            </h3>

            {selectedDesk ? (
              <div className="space-y-6 text-xs">
                {/* Visual Desk Photo Card */}
                <div className="h-40 rounded-2xl overflow-hidden relative border border-slate-800">
                  <img
                    src={selectedDesk.imageUrl || DEFAULT_DESK_PHOTO}
                    alt={selectedDesk.deskNumber}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-slate-950 via-transparent to-transparent" />
                  <span className="absolute bottom-2 left-3 text-xs font-bold text-white">
                    Desk #{selectedDesk.deskNumber} High-Res View
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xl font-extrabold text-white">Desk #{selectedDesk.deskNumber}</span>
                    <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 font-bold uppercase text-[10px]">
                      {selectedDesk.status}
                    </span>
                  </div>
                  <p className="text-slate-400">Category: {selectedDesk.deskType.replace('_', ' ')}</p>
                </div>

                <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
                  <div className="flex justify-between text-slate-300">
                    <span>Daily Pass:</span>
                    <span className="font-bold text-white">₹{selectedDesk.dailyPrice}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Monthly Pass:</span>
                    <span className="font-bold text-white">₹{selectedDesk.monthlyPrice}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="font-bold text-slate-300 block">Amenities Included:</span>
                  <div className="flex items-center space-x-4 text-slate-300">
                    {selectedDesk.hasPowerOutlet && (
                      <span className="flex items-center space-x-1">
                        <Zap className="w-3.5 h-3.5 text-amber-400" />
                        <span>Power Socket</span>
                      </span>
                    )}
                    {selectedDesk.hasWindowView && (
                      <span className="flex items-center space-x-1">
                        <Eye className="w-3.5 h-3.5 text-sky-400" />
                        <span>Window View</span>
                      </span>
                    )}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-800">
                  <button
                    onClick={() => setBookingModalOpen(true)}
                    className="w-full py-3 rounded-full text-xs font-semibold text-white bg-gradient-brand hover:opacity-95 transition-all shadow-lg flex items-center justify-center space-x-2"
                  >
                    <Calendar className="w-4 h-4" />
                    <span>Reserve Desk #{selectedDesk.deskNumber} Now</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="py-16 text-center space-y-2">
                <Info className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="text-xs text-slate-400">Click any available desk on the map to inspect photo, specifications, and rates.</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* INSTANT DESK RESERVATION MODAL */}
      {bookingModalOpen && selectedDesk && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 text-slate-100 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400">Floor Map Reservation</span>
                <h3 className="text-xl font-extrabold text-white">Reserve Desk #{selectedDesk.deskNumber}</h3>
              </div>
              <button
                onClick={() => setBookingModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleBookingSubmit} className="space-y-4 text-xs">
              {/* Duration Switcher */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Pass Duration *</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setDurationMode('daily')}
                    className={`py-2.5 rounded-xl font-bold border transition-all text-center ${
                      durationMode === 'daily'
                        ? 'bg-rose-500/20 text-white border-rose-500'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    <span>Daily Pass (₹{selectedDesk.dailyPrice})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDurationMode('monthly')}
                    className={`py-2.5 rounded-xl font-bold border transition-all text-center ${
                      durationMode === 'monthly'
                        ? 'bg-rose-500/20 text-white border-rose-500'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    <span>Monthly Pass (₹{selectedDesk.monthlyPrice})</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Reservation Start Date *</label>
                <input
                  type="date"
                  required
                  min={new Date().toISOString().split('T')[0]}
                  value={formData.preferredDate}
                  onChange={(e) => setFormData({ ...formData, preferredDate: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:border-rose-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.customerName}
                    onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:border-rose-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Phone Number *</label>
                  <input
                    type="text"
                    required
                    value={formData.customerPhone}
                    onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:border-rose-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  value={formData.customerEmail}
                  onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:border-rose-500 focus:outline-none"
                />
              </div>

              {/* Payment Method Selector */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <label className="block text-slate-300 font-semibold">Select Payment Option *</label>
                <div className="space-y-2">
                  {user && (
                    <button
                      type="button"
                      disabled={!canUseDeskCredits}
                      onClick={() => setPaymentMethod('credits')}
                      className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition-all ${
                        paymentMethod === 'credits'
                          ? 'bg-rose-500/10 border-rose-500 text-white'
                          : !canUseDeskCredits
                          ? 'bg-slate-950/60 border-slate-800 text-slate-500 cursor-not-allowed opacity-70'
                          : 'bg-slate-950 border-slate-800 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <Tag className="w-4 h-4 text-sky-400" />
                        <div>
                          <p className="font-bold text-white">Use Desk Booking Credits</p>
                          <p className="text-[10px] text-slate-400">Available: {currentDeskCreditsBalance} · Required: {currentDeskCreditsNeeded}</p>
                        </div>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                        canUseDeskCredits
                          ? 'text-sky-400 bg-sky-500/10 border-sky-500/20'
                          : 'text-slate-400 bg-slate-800 border-slate-700'
                      }`}>
                        {canUseDeskCredits ? 'Member' : 'Insufficient'}
                      </span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('wallet')}
                    className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition-all ${
                      paymentMethod === 'wallet' ? 'bg-rose-500/10 border-rose-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <Wallet className="w-4 h-4 text-emerald-400" />
                      <div>
                        <p className="font-bold text-white">Pay via Credit Wallet</p>
                        <p className="text-[10px] text-slate-400">Available: ₹{user ? Number(user.walletBalance || 0).toLocaleString() : 0}</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">Instant</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('razorpay')}
                    className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition-all ${
                      paymentMethod === 'razorpay' ? 'bg-rose-500/10 border-rose-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <CreditCard className="w-4 h-4 text-rose-400" />
                      <div>
                        <p className="font-bold text-white">Razorpay Online Payment</p>
                        <p className="text-[10px] text-slate-400">Cards, UPI, NetBanking</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">Secure</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('reception')}
                    className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition-all ${
                      paymentMethod === 'reception' ? 'bg-rose-500/10 border-rose-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <DollarSign className="w-4 h-4 text-purple-400" />
                      <div>
                        <p className="font-bold text-white">Pay Cash at Reception</p>
                        <p className="text-[10px] text-slate-400">Pay upon arrival check-in</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">Manual</span>
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 rounded-full text-xs font-bold text-white bg-gradient-brand hover:opacity-95 shadow-lg shadow-rose-500/20 flex items-center justify-center space-x-2"
              >
                <span>
                  {submitting
                    ? 'Processing Reservation...'
                    : paymentMethod === 'credits'
                    ? `Use ${currentDeskCreditsNeeded} Credits & Reserve Desk`
                    : `Pay ₹${getDeskPrice().toLocaleString()} & Reserve Desk`}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Razorpay Gateway Modal Fallback */}
      <RazorpayGatewayModal
        isOpen={razorpayModalData.isOpen}
        amount={razorpayModalData.amount}
        orderId={razorpayModalData.orderId}
        customerName={formData.customerName}
        customerEmail={formData.customerEmail}
        description={`Floor Map Desk #${selectedDesk?.deskNumber} Pass`}
        onSuccess={() => handleRazorpayModalSuccess(razorpayModalData.payload)}
        onClose={() => setRazorpayModalData({ isOpen: false, amount: 0, orderId: '' })}
      />

      <Footer />
    </div>
  );
}
