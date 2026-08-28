'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import RazorpayGatewayModal from '@/components/ui/RazorpayGatewayModal';
import { Compass, Calendar, Sparkles, MapPin, Wallet, CreditCard, DollarSign, X, CheckCircle2, ArrowRight, Layers, Tag } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { useAuth } from '@/context/AuthContext';
import { useBranch } from '@/context/BranchContext';
import { useRouter } from 'next/navigation';
import { loadRazorpayScript } from '@/lib/razorpay';

const DEFAULT_DESK_PHOTO = 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=600&q=80';

export default function FloorMapPage() {
  const router = useRouter();
  const { user, refreshProfile } = useAuth();
  const { activeBranch } = useBranch();

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

  useEffect(() => {
    if (activeBranch) {
      fetchFloorMap(activeBranch.id);
    } else {
      fetchFloorMap(1);
    }
  }, [activeBranch]);

  async function fetchFloorMap(targetBranchId?: number, floorId?: number) {
    try {
      setLoading(true);
      const bId = targetBranchId || activeBranch?.id || 1;
      const url = floorId ? `/floor-map/${bId}?floorId=${floorId}` : `/floor-map/${bId}`;
      const res = await apiClient.get(url);
      setFloorMapData(res.data.floorMap);
      if (res.data.floorMap?.id) {
        setSelectedFloorId(res.data.floorMap.id);
      }
      if (res.data.allFloors) {
        setAllFloors(res.data.allFloors);
      }
    } catch (err) {
      console.error('Failed to load floor map:', err);
      setFloorMapData(null);
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'occupied':
        return 'bg-rose-50 text-rose-700 border-rose-200 opacity-65 cursor-not-allowed';
      case 'reserved':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      default:
        return 'bg-slate-100 text-slate-600 border-slate-200';
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

        alert(`Desk #${selectedDesk.deskNumber} reserved using ${deskCreditsNeeded} desk credit! Redirecting...`);
        router.push('/dashboard?tab=bookings');
        return;
      }

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

        alert(`Desk #${selectedDesk.deskNumber} reserved successfully! Redirecting...`);
        router.push('/dashboard?tab=bookings');
        return;
      }

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
                handler: async function () {
                  await apiClient.post('/pricing/tour-booking', payload);
                  await apiClient.put(`/floor-map/desk/${selectedDesk.id}/status`, { status: 'reserved' });
                  alert(`Desk #${selectedDesk.deskNumber} reserved! Redirecting...`);
                  router.push('/dashboard?tab=bookings');
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

        setRazorpayModalData({
          isOpen: true,
          amount,
          orderId,
          payload,
        });
        return;
      }

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
      alert('Desk reservation confirmed!');
      router.push('/dashboard?tab=bookings');
    } catch (err: any) {
      alert('Failed to complete booking after online payment');
    } finally {
      setRazorpayModalData({ isOpen: false, amount: 0, orderId: '' });
      setBookingModalOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFC] text-slate-900 flex flex-col font-sans selection:bg-indigo-600 selection:text-white">
      <Navbar />

      <main className="pt-24 pb-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full grow space-y-10">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white border border-slate-200 text-xs font-bold text-indigo-600 shadow-xs">
            <Compass className="w-3.5 h-3.5" />
            <span>Interactive 2D Floor Plan Picker</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900">
            {floorMapData?.floorName ? `${floorMapData.floorName} Layout` : 'Spatial Floor Layout'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-600">
            Click any desk node to view high-resolution photos, power sockets, window views, and instant seat reservation.
          </p>

          {/* Status Legend */}
          <div className="flex items-center justify-center space-x-6 text-xs font-bold pt-1">
            <span className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span className="text-slate-700">Available</span>
            </span>
            <span className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              <span className="text-slate-700">Occupied</span>
            </span>
            <span className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span className="text-slate-700">Reserved</span>
            </span>
          </div>
        </div>

        {/* Multi-Floor Selector Tabs */}
        {allFloors.length > 1 && (
          <div className="flex items-center justify-center gap-2 overflow-x-auto py-1">
            {allFloors.map((fl: any) => {
              const isActive = fl.id === selectedFloorId;
              return (
                <button
                  key={fl.id}
                  type="button"
                  onClick={() => {
                    setSelectedDesk(null);
                    fetchFloorMap(fl.id);
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
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
          {/* Interactive Canvas Container */}
          <div className="lg:col-span-2 bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs min-h-125 flex flex-col justify-between">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center space-x-2 text-xs text-slate-900 font-bold">
                <MapPin className="w-4 h-4 text-rose-500" />
                <span>
                  {floorMapData?.branch?.name ? `${floorMapData.branch.name} — ` : ''}
                  {floorMapData?.floorName || 'Ground Floor Innovation Hub'}
                </span>
              </div>
              <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Live Sync Active</span>
              </div>
            </div>

            {/* Grid of Desks simulating 2D Layout */}
            {loading ? (
              <div className="py-20 text-center text-xs text-slate-400">Loading interactive floor map...</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 my-auto">
                {floorMapData?.desks?.map((desk: any) => {
                  const photoUrl = desk.imageUrl || DEFAULT_DESK_PHOTO;
                  const isSelected = selectedDesk?.id === desk.id;

                  return (
                    <div
                      key={desk.id}
                      onClick={() => desk.status !== 'occupied' && setSelectedDesk(desk)}
                      className={`group p-4 rounded-xl border transition-all cursor-pointer relative flex flex-col justify-between ${
                        desk.status === 'occupied'
                          ? 'bg-slate-50 border-slate-200 opacity-60 cursor-not-allowed'
                          : isSelected
                          ? 'bg-indigo-50 border-indigo-600 ring-2 ring-indigo-500/30 shadow-md'
                          : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-xs'
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="relative h-28 w-full rounded-lg overflow-hidden bg-slate-100 border border-slate-200/80">
                          <img src={photoUrl} alt={desk.deskNumber} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                          <span
                            className={`absolute top-2 right-2 text-[9px] font-bold uppercase px-2 py-0.5 rounded border backdrop-blur-xs ${getStatusBadge(
                              desk.status
                            )}`}
                          >
                            {desk.status}
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="font-extrabold text-xs text-slate-900">Desk #{desk.deskNumber}</span>
                          <span className="text-[10px] font-bold text-slate-500 uppercase">{desk.deskType?.replace('_', ' ')}</span>
                        </div>
                      </div>

                      <div className="pt-2 mt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                        <span className="text-slate-500 text-[11px]">₹{desk.dailyPrice || 500}/day</span>
                        <span className={`text-[10px] font-bold ${isSelected ? 'text-indigo-600' : 'text-slate-400'}`}>
                          {isSelected ? 'Active Selection' : 'Click to View'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Selected Desk Details Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4 h-fit">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
              Selected Desk Information
            </h3>

            {selectedDesk ? (
              <div className="space-y-4">
                <div className="relative h-40 w-full rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
                  <img src={selectedDesk.imageUrl || DEFAULT_DESK_PHOTO} alt={selectedDesk.deskNumber} className="w-full h-full object-cover" />
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <h4 className="text-lg font-extrabold text-slate-900">Desk #{selectedDesk.deskNumber}</h4>
                    <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded border border-indigo-100 uppercase">
                      {selectedDesk.deskType?.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    {selectedDesk.hasWindowView ? '🪟 Window View • ' : ''}
                    {selectedDesk.hasPowerOutlet ? '⚡ Dual Power Sockets • ' : ''}
                    Ergonomic Mesh Chair
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-baseline justify-between">
                  <span className="text-xs text-slate-500">Daily Access Pass:</span>
                  <span className="text-base font-extrabold text-slate-900">₹{selectedDesk.dailyPrice || 500}</span>
                </div>

                <button
                  type="button"
                  onClick={() => setBookingModalOpen(true)}
                  className="w-full py-3 rounded-full text-xs font-bold text-white bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 hover:opacity-95 shadow-md flex items-center justify-center space-x-1.5 cursor-pointer"
                >
                  <span>Reserve Desk #{selectedDesk.deskNumber}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="py-12 text-center text-xs text-slate-400 space-y-2">
                <Compass className="w-8 h-8 text-slate-300 mx-auto" />
                <p>Click any available desk on the map to inspect details & reserve.</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Desk Booking Modal */}
      {bookingModalOpen && selectedDesk && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white p-6 sm:p-8 rounded-3xl max-w-md w-full border border-slate-200 shadow-2xl space-y-5 relative max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setBookingModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-900 text-sm font-bold p-1 rounded-full bg-slate-100"
            >
              ✕
            </button>

            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">
                Desk Pass Reservation
              </span>
              <h3 className="text-xl font-extrabold text-slate-900">Desk #{selectedDesk.deskNumber}</h3>
            </div>

            {/* Duration Selector */}
            <div className="flex items-center gap-2 p-1 rounded-xl bg-slate-100 text-xs">
              <button
                type="button"
                onClick={() => setDurationMode('daily')}
                className={`flex-1 py-1.5 rounded-lg font-bold transition-all ${
                  durationMode === 'daily' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600'
                }`}
              >
                Daily (₹{selectedDesk.dailyPrice || 500}/day)
              </button>
              <button
                type="button"
                onClick={() => setDurationMode('monthly')}
                className={`flex-1 py-1.5 rounded-lg font-bold transition-all ${
                  durationMode === 'monthly' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600'
                }`}
              >
                Monthly (₹{selectedDesk.monthlyPrice || 5000}/mo)
              </button>
            </div>

            <form onSubmit={handleBookingSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={formData.customerName}
                  onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:border-indigo-600 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Email *</label>
                  <input
                    type="email"
                    required
                    value={formData.customerEmail}
                    onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:border-indigo-600 focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Phone *</label>
                  <input
                    type="text"
                    required
                    value={formData.customerPhone}
                    onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:border-indigo-600 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Reservation Date *</label>
                <input
                  type="date"
                  required
                  value={formData.preferredDate}
                  onChange={(e) => setFormData({ ...formData, preferredDate: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:border-indigo-600 focus:bg-white focus:outline-none"
                />
              </div>

              {/* Payment Option Buttons */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <label className="block text-slate-900 font-bold">Select Payment Method *</label>

                {user && (
                  <button
                    type="button"
                    disabled={!canUseDeskCredits}
                    onClick={() => setPaymentMethod('credits')}
                    className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between text-xs transition-all ${
                      paymentMethod === 'credits' ? 'bg-indigo-50 border-indigo-600 text-indigo-900 font-bold' : 'bg-slate-50 border-slate-200 text-slate-700'
                    }`}
                  >
                    <span>Use Desk Credits (Available: {currentDeskCreditsBalance})</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setPaymentMethod('wallet')}
                  className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between text-xs transition-all ${
                    paymentMethod === 'wallet' ? 'bg-indigo-50 border-indigo-600 text-indigo-900 font-bold' : 'bg-slate-50 border-slate-200 text-slate-700'
                  }`}
                >
                  <span>Pay via Credit Wallet (Available: ₹{user ? user.walletBalance : 0})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('razorpay')}
                  className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between text-xs transition-all ${
                    paymentMethod === 'razorpay' ? 'bg-indigo-50 border-indigo-600 text-indigo-900 font-bold' : 'bg-slate-50 border-slate-200 text-slate-700'
                  }`}
                >
                  <span>Razorpay Online Payment</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('reception')}
                  className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between text-xs transition-all ${
                    paymentMethod === 'reception' ? 'bg-indigo-50 border-indigo-600 text-indigo-900 font-bold' : 'bg-slate-50 border-slate-200 text-slate-700'
                  }`}
                >
                  <span>Pay Cash at Reception</span>
                </button>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 rounded-full text-xs font-bold text-white bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 hover:opacity-95 shadow-md flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                <span>{submitting ? 'Processing...' : `Pay ₹${getDeskPrice()} & Reserve`}</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Razorpay Gateway Fallback Modal */}
      <RazorpayGatewayModal
        isOpen={razorpayModalData.isOpen}
        amount={razorpayModalData.amount}
        orderId={razorpayModalData.orderId}
        customerName={formData.customerName}
        customerEmail={formData.customerEmail}
        description={`Desk #${selectedDesk?.deskNumber} Reservation Pass`}
        onSuccess={() => handleRazorpayModalSuccess(razorpayModalData.payload)}
        onClose={() => setRazorpayModalData({ isOpen: false, amount: 0, orderId: '' })}
      />

      <Footer />
    </div>
  );
}
