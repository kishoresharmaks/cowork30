'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Check, Sparkles, Calendar, ArrowRight, MapPin, Building2, CreditCard, Layers } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { useAuth } from '@/context/AuthContext';
import { loadRazorpayScript } from '@/lib/razorpay';

type PricingFeature = {
  id: number;
  featureText: string;
  isIncluded: boolean;
  sortOrder: number;
};

type PricingPlan = {
  id: number;
  name: string;
  slug: string;
  tagline?: string | null;
  billingPeriod?: string | null;
  priceMonthly: number;
  priceDaily: number;
  meetingCreditsIncluded: number;
  deskCreditsIncluded: number;
  isPopular: boolean;
  isActive: boolean;
  features?: PricingFeature[];
};

type MeetingRoom = {
  id: number;
  name: string;
  slug: string;
  capacity: number;
  hourlyRate: number;
  dailyRate: number;
  amenities?: string[];
  isActive: boolean;
};

type ServiceItem = {
  id: number;
  name: string;
  slug: string;
  shortDescription: string;
  startingPrice: number;
  featuredImage?: string;
};

const tabs = [
  { id: 'membership', label: 'Membership Plans' },
  { id: 'desk', label: 'Desk Bookings' },
  { id: 'meeting', label: 'Meeting Rooms' },
  { id: 'services', label: 'Workspace Services' },
] as const;

type TabId = (typeof tabs)[number]['id'];

export default function PricingPage() {
  const router = useRouter();
  const { user, refreshProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<TabId>('membership');
  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [meetingRooms, setMeetingRooms] = useState<MeetingRoom[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [activeMembership, setActiveMembership] = useState<any>(null);
  const [selectedPlan, setSelectedPlan] = useState<PricingPlan | null>(null);
  const [showTourModal, setShowTourModal] = useState(false);
  const [billingMode, setBillingMode] = useState<'monthly' | 'daily'>('monthly');
  const [quote, setQuote] = useState<any>(null);
  const [loadingQuote, setLoadingQuote] = useState(false);

  const [formData, setFormData] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    companyName: '',
    preferredDate: '',
    preferredTimeSlot: '10:00 AM - 11:00 AM',
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [subscribingPlanId, setSubscribingPlanId] = useState<number | null>(null);
  const [successMsg, setSuccessMsg] = useState(false);

  useEffect(() => {
    async function fetchCatalogs() {
      try {
        const [plansRes, roomsRes, servicesRes] = await Promise.all([
          apiClient.get('/pricing/plans'),
          apiClient.get('/meeting-rooms'),
          apiClient.get('/services'),
        ]);
        setPlans(plansRes.data || []);
        setMeetingRooms(roomsRes.data || []);
        setServices(servicesRes.data || []);
      } catch (err) {
        console.error('Failed to load pricing catalogs:', err);
      }
    }

    fetchCatalogs();
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const billing = params.get('billing');
      if (billing === 'daily' || billing === 'monthly') {
        setBillingMode(billing);
      }
      const tab = params.get('tab');
      if (tab && ['membership', 'desk', 'meeting', 'services'].includes(tab)) {
        setActiveTab(tab as TabId);
      }
    }
  }, []);

  useEffect(() => {
    async function fetchMembership() {
      if (!user) {
        setActiveMembership(null);
        return;
      }
      try {
        const res = await apiClient.get('/auth/my-bookings');
        const membership = (res.data?.deskBookings || []).find(
          (booking: any) =>
            booking.bookingType === 'membership_inquiry' &&
            booking.status === 'confirmed' &&
            booking.paymentStatus === 'paid',
        );
        setActiveMembership(membership || null);
      } catch {
        setActiveMembership(null);
      }
    }
    fetchMembership();
  }, [user]);

  useEffect(() => {
    async function fetchQuote() {
      if (!selectedPlan) {
        setQuote(null);
        return;
      }

      setLoadingQuote(true);
      try {
        const res = await apiClient.post('/pricing/quote', {
          pricingPlanId: selectedPlan.id,
          billingPeriod: billingMode === 'daily' ? 'Daily' : 'Monthly',
          quantity: 1,
        });
        setQuote(res.data?.quote || null);
      } catch (err) {
        console.error('Failed to load quote:', err);
        setQuote(null);
      } finally {
        setLoadingQuote(false);
      }
    }

    fetchQuote();
  }, [selectedPlan, billingMode]);

  const visiblePlans = useMemo(() => plans.filter((plan) => plan.isActive), [plans]);
  const featuredRooms = useMemo(() => meetingRooms.filter((room) => room.isActive), [meetingRooms]);
  const featuredServices = useMemo(() => services.slice(0, 6), [services]);

  const openTourModal = (plan: PricingPlan) => {
    setSelectedPlan(plan);
    setShowTourModal(true);
    setSuccessMsg(false);
  };

  const handleTourSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlan) return;

    setSubmitting(true);
    try {
      await apiClient.post('/pricing/tour-booking', {
        pricingPlanId: selectedPlan.id,
        customerName: formData.customerName,
        customerEmail: formData.customerEmail,
        customerPhone: formData.customerPhone,
        companyName: formData.companyName,
        preferredDate: formData.preferredDate,
        preferredTimeSlot: formData.preferredTimeSlot,
        notes: formData.notes,
        bookingType: 'tour',
        status: 'pending',
        paymentStatus: 'unpaid',
      });
      setSuccessMsg(true);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to submit tour request');
    } finally {
      setSubmitting(false);
    }
  };

  const getPlanTotal = (plan: PricingPlan) => {
    const subtotal = billingMode === 'daily' ? Number(plan.priceDaily || plan.priceMonthly) : Number(plan.priceMonthly || plan.priceDaily);
    return Math.round((subtotal * 1.18 + Number.EPSILON) * 100) / 100;
  };

  const computePlanTotalWithBilling = (plan: PricingPlan, billing: 'daily' | 'monthly') => {
    const subtotal = billing === 'daily' ? Number(plan.priceDaily || plan.priceMonthly) : Number(plan.priceMonthly || plan.priceDaily);
    return Math.round((subtotal * 1.18 + Number.EPSILON) * 100) / 100;
  };

  const getMembershipEndDate = (membership: any) => {
    const endDate = new Date(membership.createdAt);
    if ((membership.preferredTimeSlot || '').toLowerCase().includes('daily')) {
      endDate.setDate(endDate.getDate() + 1);
    } else {
      endDate.setMonth(endDate.getMonth() + 1);
    }
    return endDate;
  };

  const subscribeToPlan = async (plan: PricingPlan, paymentMethod: 'wallet' | 'razorpay', razorpayResponse?: any) => {
    const res = await apiClient.post(`/pricing/plans/${plan.id}/subscribe`, {
      billingPeriod: billingMode === 'daily' ? 'Daily' : 'Monthly',
      paymentMethod,
      razorpayOrderId: razorpayResponse?.razorpay_order_id,
      razorpayPaymentId: razorpayResponse?.razorpay_payment_id,
      razorpaySignature: razorpayResponse?.razorpay_signature,
    });
    await refreshProfile();
    alert(res.data?.message || `${plan.name} subscription activated.`);
    router.push('/dashboard');
  };

  const handleSubscribe = async (plan: PricingPlan) => {
    if (!user) {
      router.push('/login?redirect=/pricing');
      return;
    }

    if (activeMembership) {
      const currentBilling = (activeMembership.preferredTimeSlot || '').toLowerCase().includes('daily') ? 'daily' : 'monthly';
      const currentTotal = computePlanTotalWithBilling(activeMembership.pricingPlan, currentBilling as 'daily' | 'monthly');
      const requestedBilling = billingMode === 'daily' ? 'daily' : 'monthly';
      const requestedTotal = computePlanTotalWithBilling(plan, requestedBilling as 'daily' | 'monthly');

      if (requestedTotal < currentTotal - 0.01) {
        alert(`Downgrades are not allowed. Your current membership (${activeMembership.pricingPlan?.name}) is active until ${getMembershipEndDate(activeMembership).toLocaleDateString()}.`);
        return;
      }

      if (Math.abs(requestedTotal - currentTotal) < 0.01) {
        alert(`You already have an active ${activeMembership.pricingPlan?.name}. No change needed.`);
        return;
      }

      const confirmUpgrade = confirm(
        `Upgrade to ${plan.name} will charge ₹${requestedTotal}. Do you want to proceed?`
      );
      if (!confirmUpgrade) return;
    }

    const total = getPlanTotal(plan);
    const useWallet = Number(user.walletBalance || 0) >= total && confirm(`Use wallet balance to subscribe to ${plan.name} for ₹${total}? Click Cancel to pay online.`);

    setSubscribingPlanId(plan.id);
    try {
      if (useWallet) {
        await subscribeToPlan(plan, 'wallet');
        return;
      }

      const orderRes = await apiClient.post('/wallet/razorpay/create-order', { amount: total });
      const { orderId, amount: amountInPaise, keyId, currency } = orderRes.data;
      const isPlaceholderKey = !keyId || keyId.includes('placeholder') || keyId.includes('demo');

      if (isPlaceholderKey) {
        alert('Razorpay keys are not configured. Add real RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET, then restart backend.');
        setSubscribingPlanId(null);
        return;
      }

      const loaded = await loadRazorpayScript();
      if (!loaded || !(window as any).Razorpay) {
        alert('Could not load Razorpay Checkout. Please try again.');
        setSubscribingPlanId(null);
        return;
      }

      const paymentObject = new (window as any).Razorpay({
        key: keyId,
        amount: amountInPaise,
        currency: currency || 'INR',
        name: 'Cowork30 Membership',
        description: `${plan.name} Subscription`,
        image: '/Logo.png',
        order_id: orderId,
        handler: async (response: any) => {
          try {
            await subscribeToPlan(plan, 'razorpay', response);
          } catch (err: any) {
            alert(err.response?.data?.message || 'Payment verification failed');
          } finally {
            setSubscribingPlanId(null);
          }
        },
        prefill: {
          name: user.name,
          email: user.email,
          contact: user.phone,
        },
        theme: { color: '#e11d48' },
        modal: {
          ondismiss: () => setSubscribingPlanId(null),
        },
      });
      paymentObject.open();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to start subscription');
      setSubscribingPlanId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFC] text-slate-900 flex flex-col font-sans selection:bg-indigo-600 selection:text-white">
      <Navbar />

      <main className="pt-6 sm:pt-8 pb-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full grow space-y-10">
        <div className="text-center max-w-4xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white border border-slate-200 text-xs font-bold text-indigo-600 shadow-xs">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Transparent Membership & Billing</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900">
            Flexible Plans Built For Teams & Creators
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Start free, or unlock desk credits and meeting room credits with monthly and daily membership tiers.
          </p>
        </div>

        {/* Category Navigation Pills */}
        <div className="flex flex-wrap justify-center gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-500/20'
                  : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'membership' && (
          <section className="space-y-8">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">Membership Tiers</h2>
                <p className="text-xs text-slate-500">Free users can book as-you-go. Membership tiers include bonus credits.</p>
              </div>
              <div className="flex items-center gap-1.5 bg-white p-1 rounded-full border border-slate-200 shadow-xs text-xs">
                <button
                  type="button"
                  onClick={() => setBillingMode('monthly')}
                  className={`px-3 py-1 rounded-full font-bold transition-all cursor-pointer ${billingMode === 'monthly' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  Monthly
                </button>
                <button
                  type="button"
                  onClick={() => setBillingMode('daily')}
                  className={`px-3 py-1 rounded-full font-bold transition-all cursor-pointer ${billingMode === 'daily' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  Daily
                </button>
              </div>
            </div>

            {/* Current Membership Header Card */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">Active Membership Status</span>
                <h3 className="text-lg font-extrabold text-slate-900 mt-0.5">
                  {activeMembership?.pricingPlan?.name || 'Free / Pay-As-You-Go User'}
                </h3>
                <p className="text-xs text-slate-500">
                  {activeMembership
                    ? `Active until ${getMembershipEndDate(activeMembership).toLocaleDateString()}`
                    : 'No active subscription. You can subscribe to any tier below.'}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5">
                  <span className="text-slate-500 block text-[11px] font-medium">Meeting Credits</span>
                  <strong className="text-slate-900 text-base font-extrabold">{Number(user?.meetingCreditsBalance || 0)}</strong>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5">
                  <span className="text-slate-500 block text-[11px] font-medium">Desk Credits</span>
                  <strong className="text-slate-900 text-base font-extrabold">{Number(user?.deskCreditsBalance || 0)}</strong>
                </div>
              </div>
            </div>

            {/* Pricing Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Free Tier */}
              <div className="bg-white p-6 rounded-2xl space-y-6 flex flex-col justify-between border border-slate-200 shadow-xs">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xl font-extrabold text-slate-900">Free / On-Demand</h3>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">Book desks & rooms on-demand without a monthly commitment.</p>
                  </div>

                  <div className="pt-2 flex items-baseline space-x-1">
                    <span className="text-4xl font-extrabold text-slate-900">₹0</span>
                    <span className="text-xs text-slate-400">/ month</span>
                  </div>

                  <div className="text-xs text-slate-500 space-y-1 font-medium">
                    <div>Meeting credits: 0</div>
                    <div>Desk credits: 0</div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 space-y-2.5 text-xs">
                    <span className="font-bold text-slate-900 block text-[11px] uppercase tracking-wider">Perks:</span>
                    {['Pay-as-you-go desk booking', 'Pay-as-you-go meeting rooms', 'No monthly recurring fee'].map((feature) => (
                      <div key={feature} className="flex items-start space-x-2">
                        <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span className="text-slate-600 font-medium">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 grid grid-cols-1 gap-2.5">
                  <Link
                    href="/floor-map"
                    className="w-full py-2.5 rounded-full text-xs font-bold border border-slate-200 text-slate-800 hover:border-slate-300 bg-white shadow-xs flex items-center justify-center gap-1.5"
                  >
                    <MapPin className="w-3.5 h-3.5" />
                    <span>Book Desk</span>
                  </Link>
                  <Link
                    href="/meeting-rooms"
                    className="w-full py-2.5 rounded-full text-xs font-bold border border-slate-200 text-slate-800 hover:border-slate-300 bg-white shadow-xs flex items-center justify-center gap-1.5"
                  >
                    <Building2 className="w-3.5 h-3.5" />
                    <span>Book Meeting Room</span>
                  </Link>
                </div>
              </div>

              {/* Paid Plans */}
              {visiblePlans.map((plan) => {
                const displayPrice = billingMode === 'daily' ? Number(plan.priceDaily || plan.priceMonthly) : Number(plan.priceMonthly || plan.priceDaily);
                const isCurrentPlan = activeMembership?.pricingPlanId === plan.id;
                const requestedBilling = billingMode === 'daily' ? 'daily' : 'monthly';
                const requestedTotal = computePlanTotalWithBilling(plan, requestedBilling as 'daily' | 'monthly');
                let isUpgradeEligible = true;
                let currentTotal = 0;
                if (activeMembership) {
                  const currentBilling = (activeMembership.preferredTimeSlot || '').toLowerCase().includes('daily') ? 'daily' : 'monthly';
                  currentTotal = computePlanTotalWithBilling(activeMembership.pricingPlan, currentBilling as 'daily' | 'monthly');
                  isUpgradeEligible = requestedTotal > currentTotal + 0.009;
                }
                return (
                  <div
                    key={plan.id}
                    className={`bg-white p-6 rounded-2xl space-y-6 flex flex-col justify-between border relative transition-all duration-300 shadow-xs ${
                      plan.isPopular
                        ? 'border-2 border-indigo-600 shadow-md ring-1 ring-indigo-500/30'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {plan.isPopular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-[10px] font-extrabold uppercase tracking-wider text-white shadow-sm">
                        Most Popular Choice
                      </div>
                    )}

                    <div className="space-y-4">
                      <div>
                        <h3 className="text-xl font-extrabold text-slate-900">{plan.name}</h3>
                        <p className="text-xs text-slate-500 mt-1 leading-relaxed">{plan.tagline || 'Flexible coworking membership tier.'}</p>
                      </div>

                      <div className="pt-2 flex items-baseline space-x-1">
                        <span className="text-4xl font-extrabold text-slate-900">₹{displayPrice}</span>
                        <span className="text-xs text-slate-500">{billingMode === 'daily' ? '/ day' : '/ month'}</span>
                      </div>

                      <div className="text-xs text-slate-600 space-y-1 font-medium">
                        <div>Meeting credits: <strong>{plan.meetingCreditsIncluded}</strong></div>
                        <div>Desk credits: <strong>{plan.deskCreditsIncluded}</strong></div>
                      </div>

                      <div className="pt-4 border-t border-slate-100 space-y-2.5 text-xs">
                        <span className="font-bold text-slate-900 block text-[11px] uppercase tracking-wider">Perks:</span>
                        {plan.features?.map((feat) => (
                          <div key={feat.id} className="flex items-start space-x-2">
                            <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                            <span className="text-slate-600 font-medium">{feat.featureText}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="pt-4 space-y-2">
                      <button
                        type="button"
                        onClick={() => handleSubscribe(plan)}
                        disabled={subscribingPlanId === plan.id || (!isUpgradeEligible && Boolean(activeMembership))}
                        className={`w-full py-3 rounded-full text-xs font-bold transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
                          plan.isPopular
                            ? 'text-white bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 shadow-md shadow-pink-500/20 hover:opacity-95'
                            : 'bg-slate-900 text-white hover:bg-slate-800'
                        } disabled:opacity-50`}
                      >
                        <CreditCard className="w-4 h-4" />
                        <span>
                          {isCurrentPlan
                            ? 'Current Plan'
                            : activeMembership
                            ? subscribingPlanId === plan.id
                              ? 'Starting Subscription...'
                              : isUpgradeEligible
                              ? `Upgrade • ₹${requestedTotal}`
                              : 'Membership Active'
                            : subscribingPlanId === plan.id
                            ? 'Starting Subscription...'
                            : 'Subscribe Now'}
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => openTourModal(plan)}
                        className="w-full py-2.5 rounded-full text-xs font-bold border border-slate-200 text-slate-700 hover:bg-slate-50 flex items-center justify-center space-x-1.5 cursor-pointer"
                      >
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Schedule a Tour</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {activeTab === 'desk' && (
          <section className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
              <div className="bg-white p-7 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
                  <Layers className="w-3.5 h-3.5" />
                  <span>Desk Booking Path</span>
                </div>
                <h2 className="text-2xl font-extrabold text-slate-900">Book desks daily or monthly with interactive seat picking</h2>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Use our interactive 2D floor map to pick your exact seat. Desk credits included with your membership tier will be applied automatically.
                </p>
                <Link
                  href="/floor-map"
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-bold shadow-md"
                >
                  <span>Launch Floor Map</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              <div className="bg-white p-7 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                <h3 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100">Membership Desk Perks</h3>
                <div className="space-y-3 text-xs">
                  {visiblePlans.slice(0, 3).map((plan) => (
                    <div key={plan.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="font-bold text-slate-900">{plan.name}</p>
                        <span className="text-indigo-600 font-extrabold">₹{plan.priceMonthly}/mo</span>
                      </div>
                      <p className="text-slate-500">
                        Desk credits: <strong>{plan.deskCreditsIncluded}</strong> | Meeting credits: <strong>{plan.meetingCreditsIncluded}</strong>
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {activeTab === 'meeting' && (
          <section className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
              <div className="bg-white p-7 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold border border-indigo-200">
                  <Building2 className="w-3.5 h-3.5" />
                  <span>Meeting Room Booking Engine</span>
                </div>
                <h2 className="text-2xl font-extrabold text-slate-900">Reserve Executive Suites On-Demand</h2>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Real-time hourly slot selection, flexible credit or wallet checkout, and instant QR entry passes.
                </p>
                <Link
                  href="/meeting-rooms"
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-bold shadow-md"
                >
                  <span>Go to Meeting Rooms</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              <div className="bg-white p-7 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                <h3 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100">Featured Conference Suites</h3>
                {featuredRooms.slice(0, 4).map((room) => (
                  <div key={room.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-slate-900">{room.name}</p>
                      <span className="text-indigo-600 font-extrabold">{room.capacity} Pax</span>
                    </div>
                    <p className="text-xs text-slate-500">
                      ₹{room.hourlyRate}/hr base rate
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {activeTab === 'services' && (
          <section className="space-y-6">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">Workspace Solutions</h2>
                <p className="text-xs text-slate-500">Custom office suites & virtual business addresses.</p>
              </div>
              <Link
                href="/services"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-bold shadow-md"
              >
                <span>View All Services</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredServices.map((service) => (
                <div key={service.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                  <div className="h-40 rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
                    <img
                      src={service.featuredImage || 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=600&q=80'}
                      alt={service.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">{service.name}</h3>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">{service.shortDescription}</p>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-500 border-t border-slate-100 pt-3">
                    <span>Starting from</span>
                    <span className="text-indigo-600 font-extrabold">₹{service.startingPrice}/mo</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Tour Request Modal */}
      {showTourModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white p-6 sm:p-8 rounded-3xl max-w-md w-full border border-slate-200 shadow-2xl space-y-5 relative">
            <button
              type="button"
              onClick={() => setShowTourModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-900 text-sm font-bold p-1 rounded-full bg-slate-100"
            >
              ✕
            </button>

            <div className="space-y-1">
              <h3 className="text-xl font-extrabold text-slate-900">Schedule a Workspace Tour</h3>
              <p className="text-xs text-indigo-600 font-bold">Selected Plan: {selectedPlan?.name}</p>
            </div>

            {quote && (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-xs space-y-1.5">
                <div className="flex items-center justify-between text-slate-700 font-bold">
                  <span>Quote Preview</span>
                  <span className="text-indigo-600">₹{quote.totalAmount}</span>
                </div>
                <div className="flex items-center justify-between text-slate-500">
                  <span>Base Amount</span>
                  <span>₹{quote.baseAmount}</span>
                </div>
                <div className="flex items-center justify-between text-slate-500">
                  <span>Tax (GST)</span>
                  <span>₹{quote.taxAmount}</span>
                </div>
              </div>
            )}

            {loadingQuote && <p className="text-xs text-slate-400">Loading quote preview...</p>}

            {successMsg ? (
              <div className="py-6 text-center space-y-3 text-xs">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <Check className="w-6 h-6" />
                </div>
                <h4 className="text-base font-bold text-slate-900">Tour Requested!</h4>
                <p className="text-slate-600">
                  Our community team will contact you to confirm your visit for {formData.preferredDate}.
                </p>
                <button
                  type="button"
                  onClick={() => setShowTourModal(false)}
                  className="mt-2 px-6 py-2 rounded-full bg-slate-900 text-white font-bold text-xs"
                >
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleTourSubmit} className="space-y-3.5 text-xs">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Your Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.customerName}
                    onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:border-indigo-600 focus:bg-white focus:outline-none"
                  />
                </div>

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

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Preferred Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.preferredDate}
                    onChange={(e) => setFormData({ ...formData, preferredDate: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:border-indigo-600 focus:bg-white focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3.5 rounded-full text-xs font-bold text-white bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 hover:opacity-95 shadow-md flex items-center justify-center space-x-1.5 cursor-pointer"
                >
                  <span>{submitting ? 'Submitting...' : 'Confirm Tour Request'}</span>
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
