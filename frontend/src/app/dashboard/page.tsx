'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import ImageUploader from '@/components/ui/ImageUploader';
import RazorpayGatewayModal from '@/components/ui/RazorpayGatewayModal';
import { loadRazorpayScript } from '@/lib/razorpay';
import {
  User,
  Wallet,
  Calendar,
  Building2,
  CheckCircle2,
  FileText,
  CreditCard,
  Plus,
  QrCode,
  ShieldCheck,
  Save,
  Clock,
  Sparkles,
  ArrowRight,
  Printer,
  ChevronRight,
  Check,
  Tag,
  Receipt,
  Download,
  Armchair,
  Users,
  Search,
  MapPin,
  Eye,
  Info,
  X,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { apiClient } from '@/lib/api-client';
import InquiryChatModal from '@/components/ui/InquiryChatModal';
import MemberSidebar, { MemberTabType } from '@/components/layout/MemberSidebar';
import { MessageSquare } from 'lucide-react';

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

function MemberDashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawTab = searchParams.get('tab');
  const validTabs: MemberTabType[] = ['overview', 'inquiries', 'desks', 'meetings', 'wallet', 'profile'];
  const initialTab: MemberTabType = validTabs.includes(rawTab as any)
    ? (rawTab as MemberTabType)
    : rawTab === 'bookings'
    ? 'desks'
    : 'overview';

  const { user, token, isLoading, logout, updateProfile, refreshProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<MemberTabType>(initialTab);

  useEffect(() => {
    if (rawTab && validTabs.includes(rawTab as any)) {
      setActiveTab(rawTab as MemberTabType);
    }
  }, [rawTab]);

  // My Bookings State
  const [myDeskBookings, setMyDeskBookings] = useState<any[]>([]);
  const [myMeetingBookings, setMyMeetingBookings] = useState<any[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [chatInquiry, setChatInquiry] = useState<any>(null);

  // Filter States for Bookings View
  const [filterType, setFilterType] = useState<'all' | 'desk' | 'meeting'>('all');
  const [deskSearch, setDeskSearch] = useState('');
  const [meetingSearch, setMeetingSearch] = useState('');
  const [deskStatusFilter, setDeskStatusFilter] = useState('');
  const [meetingStatusFilter, setMeetingStatusFilter] = useState('');
  const [selectedPass, setSelectedPass] = useState<any>(null);

  // Pagination States
  const [deskPage, setDeskPage] = useState(1);
  const [meetingPage, setMeetingPage] = useState(1);
  const [txPage, setTxPage] = useState(1);
  const [invPage, setInvPage] = useState(1);
  const pageSize = 5;
  const txPageSize = 5;
  const invPageSize = 5;

  // Wallet Transactions, Invoices & Proof Requests State
  const [transactions, setTransactions] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [myTopupRequests, setMyTopupRequests] = useState<any[]>([]);

  // Dynamic Top-Up Packages State
  const [topupPacks, setTopupPacks] = useState<any[]>([
    { id: '1', amount: 1000, bonus: 0, title: 'Starter Credit Pack', badge: 'Basic', isPopular: false },
    { id: '2', amount: 2500, bonus: 250, title: 'Most Popular Value Pack', badge: 'Best Value', isPopular: true },
    { id: '3', amount: 5000, bonus: 750, title: 'Pro Team Pack', badge: 'Max Savings', isPopular: false },
  ]);

  // Profile Form State
  const [profileForm, setProfileForm] = useState({
    name: '',
    phone: '',
    companyName: '',
    gstin: '',
    avatarUrl: '',
    bio: '',
  });
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState('');

  // Top Up & Gateway Modal State
  const [toppingUp, setToppingUp] = useState(false);
  const [paymentMode, setPaymentMode] = useState<'razorpay' | 'manual'>('razorpay');
  const [razorpayModalData, setRazorpayModalData] = useState<{
    isOpen: boolean;
    amount: number;
    bonus?: number;
    orderId: string;
  }>({ isOpen: false, amount: 0, bonus: 0, orderId: '' });

  // Payment Proof Modal State
  const [proofModalOpen, setProofModalOpen] = useState(false);
  const [selectedPackForProof, setSelectedPackForProof] = useState<any>(null);
  const [proofFormData, setProofFormData] = useState({
    paymentProofUrl: '',
    referenceNumber: '',
    notes: '',
  });
  const [submittingProof, setSubmittingProof] = useState(false);

  useEffect(() => {
    if (!isLoading && !token) {
      router.push('/login');
    }
  }, [token, isLoading, router]);

  useEffect(() => {
    if (user) {
      setProfileForm({
        name: user.name || '',
        phone: user.phone || '',
        companyName: user.companyName || '',
        gstin: user.gstin || '',
        avatarUrl: user.avatarUrl || '',
        bio: user.bio || '',
      });
    }
  }, [user]);

  async function loadMyBookings() {
    if (!token) return;
    setLoadingBookings(true);
    try {
      const res = await apiClient.get('/auth/my-bookings');
      setMyDeskBookings(res.data?.deskBookings || []);
      setMyMeetingBookings(res.data?.meetingBookings || []);
    } catch (err) {
      console.error('Failed to load my bookings', err);
    } finally {
      setLoadingBookings(false);
    }
  }

  async function loadWalletLogs() {
    if (!token) return;
    try {
      const txRes = await apiClient.get('/wallet/transactions');
      const invRes = await apiClient.get('/wallet/invoices');
      const reqRes = await apiClient.get('/wallet/my-topup-requests');

      setTransactions(txRes.data?.transactions || []);
      setInvoices(invRes.data?.invoices || []);
      setMyTopupRequests(reqRes.data?.requests || []);
    } catch (err) {
      console.error('Failed to load wallet transaction logs', err);
    }
  }

  async function loadSettingsPacks() {
    try {
      const res = await apiClient.get('/cms/settings');
      if (res.data?.topupPackages && Array.isArray(res.data.topupPackages)) {
        setTopupPacks(res.data.topupPackages);
      }
    } catch (e) {}
  }

  useEffect(() => {
    if (token) {
      loadMyBookings();
      loadWalletLogs();
      loadSettingsPacks();
    }
  }, [token]);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdatingProfile(true);
    setProfileSuccess('');
    try {
      await updateProfile(profileForm);
      setProfileSuccess('Profile details saved successfully!');
    } catch (err) {
      alert('Failed to update profile');
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handleOpenProofModal = (pack: any) => {
    setSelectedPackForProof(pack);
    setProofFormData({ paymentProofUrl: '', referenceNumber: '', notes: '' });
    setProofModalOpen(true);
  };

  const handleSubmitProof = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPackForProof) return;
    if (!proofFormData.paymentProofUrl) {
      alert('Please upload a valid payment proof receipt image.');
      return;
    }

    setSubmittingProof(true);
    try {
      const res = await apiClient.post('/wallet/request-topup', {
        amount: Number(selectedPackForProof.amount),
        bonus: Number(selectedPackForProof.bonus || 0),
        paymentProofUrl: proofFormData.paymentProofUrl,
        referenceNumber: proofFormData.referenceNumber,
        notes: proofFormData.notes,
      });

      alert(res.data?.message || 'Payment proof submitted! Pending admin verification.');
      setProofModalOpen(false);
      await loadWalletLogs();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to submit payment proof');
    } finally {
      setSubmittingProof(false);
    }
  };

  const handleVerifyPayment = async (data: {
    amount: number;
    bonus?: number;
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
  }) => {
    try {
      const verifyRes = await apiClient.post('/wallet/razorpay/verify-topup', {
        amount: data.amount,
        bonus: data.bonus || 0,
        razorpayOrderId: data.razorpayOrderId,
        razorpayPaymentId: data.razorpayPaymentId,
        razorpaySignature: data.razorpaySignature,
      });

      await refreshProfile();
      await loadWalletLogs();
      alert(verifyRes.data?.message || `₹${(data.amount + (data.bonus || 0)).toLocaleString()} Razorpay Online Payment Verified & Credited!`);
    } catch (vErr: any) {
      alert(vErr.response?.data?.message || 'Razorpay payment verification failed');
    } finally {
      setRazorpayModalData({ isOpen: false, amount: 0, bonus: 0, orderId: '' });
      setToppingUp(false);
    }
  };

  const handleRazorpayTopUp = async (amount: number, bonus = 0) => {
    setToppingUp(true);
    try {
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
              name: 'Cowork30 Ecosystem',
              description: `Wallet Credit Recharge (₹${amount}${bonus > 0 ? ` + ₹${bonus} Bonus` : ''})`,
              image: '/Logo.png',
              order_id: orderId,
              handler: async function (response: any) {
                await handleVerifyPayment({
                  amount,
                  bonus,
                  razorpayOrderId: response.razorpay_order_id,
                  razorpayPaymentId: response.razorpay_payment_id,
                  razorpaySignature: response.razorpay_signature || 'sig_demo_passed',
                });
              },
              prefill: {
                name: user?.name || '',
                email: user?.email || '',
                contact: user?.phone || '',
              },
              theme: { color: '#e11d48' },
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
        bonus,
        orderId,
      });
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to initiate online Razorpay payment');
      setToppingUp(false);
    }
  };

  const handlePayInquiryWithWallet = async (inquiry: any) => {
    const amount = Number(inquiry.totalAmount || 0);
    const userBal = Number(user?.walletBalance || 0);
    if (userBal < amount) {
      alert(`Insufficient Wallet Balance (Available: ₹${userBal.toLocaleString()}, Required: ₹${amount.toLocaleString()}). Please top up your wallet first.`);
      setActiveTab('wallet');
      return;
    }

    if (!confirm(`Confirm paying ₹${amount.toLocaleString()} for Workspace Solution Inquiry ${inquiry.bookingCode}?`)) return;

    try {
      await apiClient.post('/wallet/pay-booking', {
        amount,
        bookingType: 'desk',
        bookingId: inquiry.id,
        paymentMethod: 'wallet',
        description: `Solution Inquiry Payment for ${inquiry.bookingCode}`,
      });

      alert('Payment successful! Membership confirmed and GST Tax Invoice generated.');
      loadMyBookings();
      loadWalletLogs();
      if (refreshProfile) refreshProfile();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to process wallet payment');
    }
  };

  const handleExportCsv = () => {
    const rows = [
      ['Booking Code', 'Type', 'Title / Room', 'Date', 'Time Slot', 'Amount', 'Status'],
      ...myDeskBookings.map((b) => [
        b.bookingCode || `DESK-${b.id}`,
        'Desk Pass',
        b.notes || 'Day Pass Flex Desk',
        b.preferredDate || 'N/A',
        b.preferredTimeSlot || '10:00 AM - 06:00 PM',
        `₹${b.totalAmount || 0}`,
        b.status,
      ]),
      ...myMeetingBookings.map((mb) => [
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
        Loading Member Dashboard...
      </div>
    );
  }

  // Split regular desk bookings and solution inquiries
  const myServiceInquiries = myDeskBookings.filter(
    (b) => b.bookingCode?.startsWith('SRV-') || (b.notes && b.notes.includes('Solution:'))
  );
  const regularDeskBookings = myDeskBookings.filter(
    (b) => !(b.bookingCode?.startsWith('SRV-') || (b.notes && b.notes.includes('Solution:')))
  );

  // Filtered Lists
  const filteredDesks = regularDeskBookings.filter((b) => {
    const matchSearch =
      !deskSearch ||
      (b.bookingCode || '').toLowerCase().includes(deskSearch.toLowerCase()) ||
      (b.notes || '').toLowerCase().includes(deskSearch.toLowerCase());
    const matchStatus = !deskStatusFilter || b.status === deskStatusFilter;
    return matchSearch && matchStatus;
  });

  const filteredMeetings = myMeetingBookings.filter((mb) => {
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

  const totalCount = myDeskBookings.length + myMeetingBookings.length;

  return (
    <div className="min-h-screen bg-[#FAFAFC] text-slate-900 flex flex-col font-sans selection:bg-purple-600 selection:text-white">
      <Navbar />

      <main className="pt-2 sm:pt-4 pb-16 sm:pb-24 max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 w-full flex-grow">
        {/* Main 2-Column Vertical Sidebar Layout */}
        <div className="flex flex-col lg:flex-row items-start gap-6">
          {/* 1. Left Vertical Sidebar Navigation */}
          <MemberSidebar
            activeTab={activeTab}
            onTabChange={(tab) => {
              setActiveTab(tab);
              router.push(`/dashboard?tab=${tab}`, { scroll: false });
            }}
            counts={{
              inquiries: myServiceInquiries.length,
              desks: regularDeskBookings.length,
              meetings: myMeetingBookings.length,
            }}
          />

          {/* 2. Right Dedicated View Panels Container */}
          <div className="flex-1 w-full space-y-6 min-w-0">
            {/* VIEW 1: PORTAL OVERVIEW */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Profile Welcome Header Banner */}
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
                        {user.email}{user.phone ? ` • ${user.phone}` : ''}
                      </p>
                      {(user as any).createdAt && (
                        <p className="text-[11px] text-slate-400">
                          Member since {new Date((user as any).createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full lg:w-auto border-t lg:border-t-0 pt-4 lg:pt-0 border-slate-100">
                    <div className="px-4 py-3 sm:px-5 sm:py-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-left flex items-center justify-between space-x-3">
                      <div>
                        <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider block">Desk Credits</span>
                        <span className="text-lg sm:text-xl font-black text-emerald-600 block">{user.deskCreditsBalance !== undefined ? Number(user.deskCreditsBalance).toFixed(2) : '0.00'}</span>
                      </div>
                      <div className="w-9 h-9 rounded-xl bg-emerald-100/60 text-emerald-600 flex items-center justify-center shrink-0">
                        <Armchair className="w-5 h-5" />
                      </div>
                    </div>

                    <div className="px-4 py-3 sm:px-5 sm:py-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-left flex items-center justify-between space-x-3">
                      <div>
                        <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider block">Meeting Credits</span>
                        <span className="text-lg sm:text-xl font-black text-indigo-600 block">{user.meetingCreditsBalance !== undefined ? Number(user.meetingCreditsBalance).toFixed(2) : '0.00'}</span>
                      </div>
                      <div className="w-9 h-9 rounded-xl bg-indigo-100/60 text-indigo-600 flex items-center justify-center shrink-0">
                        <Users className="w-5 h-5" />
                      </div>
                    </div>

                    <div className="px-4 py-3 sm:px-5 sm:py-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-left flex items-center justify-between space-x-3">
                      <div>
                        <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider block">Wallet Balance</span>
                        <span className="text-lg sm:text-xl font-black text-purple-600 block truncate">₹{Number(user.walletBalance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div className="w-9 h-9 rounded-xl bg-purple-100/60 text-purple-600 flex items-center justify-center shrink-0">
                        <Wallet className="w-5 h-5" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Actions Shortcuts Toolbar */}
                <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs space-y-3">
                  <h3 className="text-sm font-extrabold text-slate-900">Quick Actions</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <Link
                      href="/pricing"
                      className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-purple-300 hover:bg-purple-50/50 transition-all flex flex-col items-center text-center space-y-2 group"
                    >
                      <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Armchair className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-extrabold text-slate-800">Book Desk Pass</span>
                    </Link>

                    <Link
                      href="/meeting-rooms"
                      className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-indigo-300 hover:bg-indigo-50/50 transition-all flex flex-col items-center text-center space-y-2 group"
                    >
                      <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Building2 className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-extrabold text-slate-800">Book Meeting Room</span>
                    </Link>

                    <button
                      onClick={() => setActiveTab('wallet')}
                      className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-emerald-300 hover:bg-emerald-50/50 transition-all flex flex-col items-center text-center space-y-2 group cursor-pointer"
                    >
                      <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Wallet className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-extrabold text-slate-800">Top-Up Wallet</span>
                    </button>

                    <Link
                      href="/services"
                      className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-pink-300 hover:bg-pink-50/50 transition-all flex flex-col items-center text-center space-y-2 group"
                    >
                      <div className="w-9 h-9 rounded-xl bg-pink-100 text-pink-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Sparkles className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-extrabold text-slate-800">Request Custom Quote</span>
                    </Link>
                  </div>
                </div>

                {/* Quick Summary Cards Preview */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div
                    onClick={() => setActiveTab('inquiries')}
                    className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs hover:border-indigo-400 transition-all cursor-pointer space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold text-slate-900">Solution Quotes</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-50 text-indigo-700">
                        {myServiceInquiries.length} Active
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">Corporate team requests, custom pricing & live chat.</p>
                    <div className="text-xs font-bold text-indigo-600 flex items-center space-x-1">
                      <span>Manage Quotes</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </div>
                  </div>

                  <div
                    onClick={() => setActiveTab('desks')}
                    className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs hover:border-purple-400 transition-all cursor-pointer space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold text-slate-900">Desk Passes</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-50 text-purple-700">
                        {regularDeskBookings.length} Passes
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">Dedicated desk, hot desk & cabin passes.</p>
                    <div className="text-xs font-bold text-purple-600 flex items-center space-x-1">
                      <span>View Desk Passes</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </div>
                  </div>

                  <div
                    onClick={() => setActiveTab('meetings')}
                    className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs hover:border-sky-400 transition-all cursor-pointer space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold text-slate-900">Meeting Room Bookings</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-sky-50 text-sky-700">
                        {myMeetingBookings.length} Bookings
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">Hourly & daily conference room reservations.</p>
                    <div className="text-xs font-bold text-sky-600 flex items-center space-x-1">
                      <span>View Meeting Bookings</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* VIEW 2: SOLUTION QUOTES */}
            {activeTab === 'inquiries' && (
              <div className="space-y-4">
                <div className="bg-white rounded-3xl border border-indigo-100 overflow-hidden shadow-xs space-y-4 p-4 sm:p-6 bg-gradient-to-br from-indigo-50/30 via-white to-purple-50/30">
                  <div className="flex items-center space-x-2.5 border-b border-indigo-100 pb-3">
                    <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-md">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base sm:text-lg font-extrabold text-slate-900">
                        Workspace Solution Inquiries & Custom Quotes
                      </h3>
                      <p className="text-xs text-slate-500">
                        Track corporate workspace quotes, team seat requests, and pay confirmed memberships online.
                      </p>
                    </div>
                  </div>

                  {myServiceInquiries.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 text-xs">
                      No corporate solution inquiries found.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {myServiceInquiries.map((inq) => {
                        const isPaid = inq.paymentStatus === 'paid';
                        const isConfirmed = inq.status === 'confirmed' || inq.status === 'completed';
                        const amount = Number(inq.totalAmount || 0);

                        return (
                          <div
                            key={inq.id}
                            className="bg-white border border-slate-200/90 rounded-2xl p-4 space-y-3 shadow-xs hover:border-indigo-400 transition-all text-xs"
                          >
                            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                              <span className="px-2.5 py-0.5 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 font-mono font-extrabold text-xs">
                                {inq.bookingCode}
                              </span>
                              <span
                                className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] border ${
                                  isPaid
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    : isConfirmed
                                    ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                                    : 'bg-amber-50 text-amber-700 border-amber-200'
                                }`}
                              >
                                {isPaid ? 'PAID & ACTIVATED' : isConfirmed ? 'QUOTE CONFIRMED (UNPAID)' : 'PENDING REVIEW'}
                              </span>
                            </div>

                            <div className="space-y-1">
                              <p className="font-extrabold text-slate-900 text-sm">
                                {inq.notes?.split('|')[0] || 'Workspace Solution'}
                              </p>
                              {inq.preferredDate && (
                                <p className="text-slate-500 text-[11px]">
                                  Target Move-In: <strong>{new Date(inq.preferredDate).toLocaleDateString()}</strong>
                                </p>
                              )}
                            </div>

                            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex items-center justify-between">
                              <span className="text-slate-500 font-semibold">Negotiated Quote:</span>
                              <div className="flex items-center space-x-2">
                                <span className="text-base font-black text-emerald-600">₹{amount.toLocaleString()}</span>
                                <button
                                  type="button"
                                  onClick={() => setChatInquiry(inq)}
                                  className="px-2.5 py-1 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold text-xs flex items-center space-x-1 hover:bg-indigo-100 transition-all cursor-pointer"
                                >
                                  <MessageSquare className="w-3.5 h-3.5" />
                                  <span>Live Chat</span>
                                </button>
                              </div>
                            </div>

                            {!isPaid && (
                              <div className="pt-1 flex flex-col sm:flex-row items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => handlePayInquiryWithWallet(inq)}
                                  className="w-full py-2 rounded-xl text-xs font-extrabold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-500/20 transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
                                >
                                  <Wallet className="w-3.5 h-3.5" />
                                  <span>Pay via Wallet (₹{Number(user?.walletBalance || 0).toLocaleString()})</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleRazorpayTopUp(amount)}
                                  className="w-full sm:w-auto px-3 py-2 rounded-xl text-xs font-extrabold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-all flex items-center justify-center space-x-1 shrink-0 cursor-pointer"
                                >
                                  <CreditCard className="w-3.5 h-3.5 text-rose-600" />
                                  <span>Top-Up & Pay</span>
                                </button>
                              </div>
                            )}

                            {isPaid && (
                              <div className="pt-1">
                                <span className="text-[11px] font-bold text-emerald-600 flex items-center space-x-1">
                                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                  <span>Membership Active. GST Invoice generated in Credit Wallet & Invoices.</span>
                                </span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {chatInquiry && (
              <InquiryChatModal
                inquiry={chatInquiry}
                isOpen={!!chatInquiry}
                onClose={() => setChatInquiry(null)}
                currentUserType="customer"
                currentUserName={user?.name || 'Customer'}
                currentUserId={user?.id}
                onInquiryUpdated={() => loadMyBookings()}
                onPayViaWallet={(inq) => handlePayInquiryWithWallet(inq)}
                onPayViaRazorpay={(inq) => handleRazorpayTopUp(Number(inq.totalAmount || 0))}
              />
            )}

            {/* VIEW 3: DESK PASSES */}
            {activeTab === 'desks' && (
              <div className="bg-white rounded-3xl border border-slate-200/90 overflow-hidden shadow-xs space-y-4 p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
                      <Armchair className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base sm:text-lg font-extrabold text-slate-900">Desk & Workspace Reservations</h3>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-50 text-purple-600 border border-purple-100">
                          {filteredDesks.length} Bookings
                        </span>
                      </div>
                    </div>
                  </div>

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

                {loadingBookings ? (
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
                              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border whitespace-nowrap inline-block ${typeBadge.class}`}>
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
                                  <span>{b.branch?.name || b.pricingPlan?.name || 'Active Hub'}</span>
                                </p>
                              </div>
                              <span className="font-black text-slate-900 text-sm">₹{Number(b.totalAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
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
                                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold border whitespace-nowrap inline-block ${typeBadge.class}`}>
                                    {typeBadge.label}
                                  </span>
                                </td>

                                <td className="py-4 px-3">
                                  <p className="font-extrabold text-slate-900">{b.bookingCode || `D-${b.id}`}</p>
                                  <p className="text-[10px] text-slate-500 flex items-center space-x-1 mt-0.5">
                                    <MapPin className="w-3 h-3 text-indigo-500 inline shrink-0" />
                                    <span>{b.branch?.name || b.pricingPlan?.name || 'Active Hub'}</span>
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

            {/* VIEW 4: MEETING ROOM BOOKINGS */}
            {activeTab === 'meetings' && (
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

                {loadingBookings ? (
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
                                <p className="font-extrabold text-slate-900 text-sm">{mb.meetingRoom?.name || 'Meeting Suite'}</p>
                                <p className="text-[11px] text-slate-500 font-mono">{mb.bookingCode}</p>
                                <p className="text-[11px] text-slate-500 flex items-center space-x-1 mt-0.5">
                                  <MapPin className="w-3 h-3 text-indigo-500 inline shrink-0" />
                                  <span>{mb.branch?.name || mb.meetingRoom?.branch?.name || 'Active Hub'}</span>
                                </p>
                              </div>
                              <span className="font-black text-slate-900 text-sm">₹{Number(mb.totalAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
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
                                    <span>{mb.branch?.name || mb.meetingRoom?.branch?.name || 'Active Hub'}</span>
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

            <div className="flex items-center justify-center space-x-1.5 text-xs text-slate-400 text-center pt-2">
              <Info className="w-4 h-4 text-slate-400" />
              <span>All times shown are in your local timezone. For support, contact system administrator.</span>
            </div>
            {/* VIEW 5: CREDIT WALLET & INVOICES */}
            {activeTab === 'wallet' && (
          <div className="space-y-6 sm:space-y-8">
            <div className="bg-white p-5 sm:p-8 rounded-3xl border border-slate-200/90 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                <div>
                  <h3 className="text-base sm:text-lg font-extrabold text-slate-900">Recharge Credit Wallet</h3>
                  <p className="text-xs text-slate-500">Top up credits for instant 1-click meeting room and desk reservations.</p>
                </div>
                <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl text-xs w-full sm:w-fit overflow-x-auto">
                  <button
                    type="button"
                    onClick={() => setPaymentMode('razorpay')}
                    className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer text-xs shrink-0 ${
                      paymentMode === 'razorpay' ? 'bg-white text-purple-600 shadow-xs' : 'text-slate-600'
                    }`}
                  >
                    Razorpay Gateway
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMode('manual')}
                    className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer text-xs shrink-0 ${
                      paymentMode === 'manual' ? 'bg-white text-purple-600 shadow-xs' : 'text-slate-600'
                    }`}
                  >
                    Bank Receipt Proof
                  </button>
                </div>
              </div>

              {/* Dynamic Top-Up Packages Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
                {topupPacks.map((pack) => (
                  <div
                    key={pack.id}
                    className={`p-5 sm:p-6 rounded-3xl border space-y-5 flex flex-col justify-between relative transition-all ${
                      pack.isPopular
                        ? 'border-2 border-purple-600 bg-purple-50/40 shadow-md'
                        : 'border-slate-200 bg-white hover:border-purple-300'
                    }`}
                  >
                    {pack.isPopular && (
                      <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-xs">
                        Best Value Pack
                      </span>
                    )}

                    <div className="space-y-2">
                      <span className="text-[10px] font-extrabold uppercase text-purple-600 tracking-wider block">{pack.badge || 'Pack'}</span>
                      <h4 className="text-base font-extrabold text-slate-900">{pack.title}</h4>
                      <div className="text-2xl sm:text-3xl font-black text-slate-900">
                        ₹{Number(pack.amount).toLocaleString()}
                      </div>
                      {pack.bonus > 0 && (
                        <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200 inline-block mt-1">
                          + ₹{Number(pack.bonus).toLocaleString()} Bonus Credits Included
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      disabled={toppingUp}
                      onClick={() => {
                        if (paymentMode === 'razorpay') {
                          handleRazorpayTopUp(Number(pack.amount), Number(pack.bonus || 0));
                        } else {
                          handleOpenProofModal(pack);
                        }
                      }}
                      className="w-full py-3.5 rounded-full text-xs font-extrabold text-white bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 hover:opacity-95 shadow-md flex items-center justify-center space-x-1.5 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>{paymentMode === 'razorpay' ? `Recharge ₹${pack.amount}` : `Upload Proof for ₹${pack.amount}`}</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Official GST Tax Invoices Section */}
            <div className="bg-white p-5 sm:p-8 rounded-3xl border border-slate-200/90 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">GST Tax Invoices & Billing Receipts</h3>
                  <p className="text-xs text-slate-500">Download official tax invoices for your GST tax filings and accounting.</p>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-50 text-purple-600 border border-purple-100">
                  {invoices.length} Invoices
                </span>
              </div>

              {invoices.length === 0 ? (
                <p className="text-xs text-slate-500 py-6 text-center">No tax invoices generated yet.</p>
              ) : (
                <div className="space-y-4">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                          <th className="pb-3 px-3">Invoice Number</th>
                          <th className="pb-3 px-3">Date</th>
                          <th className="pb-3 px-3">Company / GSTIN</th>
                          <th className="pb-3 px-3 text-right">Tax (CGST+SGST)</th>
                          <th className="pb-3 px-3 text-right">Total Amount</th>
                          <th className="pb-3 px-3 text-right">Download PDF</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {invoices
                          .slice((invPage - 1) * invPageSize, invPage * invPageSize)
                          .map((inv) => {
                            const dateStr = new Date(inv.createdAt).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
                            const totalTax = (Number(inv.cgst || 0) + Number(inv.sgst || 0) + Number(inv.igst || 0)).toFixed(2);
                            const rawApi = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';
                            const apiBase = rawApi.replace(/\/api\/v1\/?$/, '');
                            const pdfLink = inv.pdfUrl ? (inv.pdfUrl.startsWith('http') ? inv.pdfUrl : `${apiBase}${inv.pdfUrl}`) : `/meeting-rooms/receipt/${inv.invoiceNumber}`;

                            return (
                              <tr key={inv.id} className="hover:bg-slate-50">
                                <td className="py-3 px-3 font-mono font-extrabold text-indigo-600">{inv.invoiceNumber}</td>
                                <td className="py-3 px-3 text-slate-600 font-medium whitespace-nowrap">{dateStr}</td>
                                <td className="py-3 px-3">
                                  <p className="font-bold text-slate-900">{inv.companyName || user.companyName || user.name}</p>
                                  <p className="text-[10px] font-mono text-slate-400">{inv.customerGstin || user.gstin || 'Standard B2C'}</p>
                                </td>
                                <td className="py-3 px-3 text-right text-slate-600 font-medium">₹{totalTax}</td>
                                <td className="py-3 px-3 text-right font-black text-slate-900">₹{Number(inv.totalAmount || 0).toFixed(2)}</td>
                                <td className="py-3 px-3 text-right">
                                  <a
                                    href={pdfLink}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="px-3 py-1.5 rounded-full text-[11px] font-extrabold text-purple-600 bg-purple-50 border border-purple-200 hover:bg-purple-100 transition-all inline-flex items-center space-x-1 cursor-pointer"
                                  >
                                    <Download className="w-3 h-3" />
                                    <span>Download PDF</span>
                                  </a>
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>

                  {/* GST Invoices Table Pagination Footer */}
                  {invoices.length > 0 && (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-3 border-t border-slate-100 text-xs">
                      <span className="text-slate-500 font-medium text-center sm:text-left text-[11px]">
                        Showing {(invPage - 1) * invPageSize + 1} to {Math.min(invPage * invPageSize, invoices.length)} of {invoices.length} entries
                      </span>
                      <div className="flex items-center space-x-1">
                        <button
                          type="button"
                          disabled={invPage <= 1}
                          onClick={() => setInvPage((prev) => Math.max(1, prev - 1))}
                          className="px-3 py-1 rounded-lg border border-slate-200 bg-white font-bold text-slate-700 disabled:opacity-40 hover:bg-slate-50 transition-all cursor-pointer text-xs"
                        >
                          ‹ Previous
                        </button>
                        {Array.from({ length: Math.ceil(invoices.length / invPageSize) }, (_, i) => i + 1).map((pageNum) => (
                          <button
                            key={pageNum}
                            type="button"
                            onClick={() => setInvPage(pageNum)}
                            className={`w-7 h-7 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                              invPage === pageNum
                                ? 'bg-purple-600 text-white shadow-xs'
                                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            {pageNum}
                          </button>
                        ))}
                        <button
                          type="button"
                          disabled={invPage >= Math.ceil(invoices.length / invPageSize)}
                          onClick={() => setInvPage((prev) => Math.min(Math.ceil(invoices.length / invPageSize), prev + 1))}
                          className="px-3 py-1 rounded-lg border border-slate-200 bg-white font-bold text-slate-700 disabled:opacity-40 hover:bg-slate-50 transition-all cursor-pointer text-xs"
                        >
                          Next ›
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Wallet Transaction History */}
            <div className="bg-white p-5 sm:p-8 rounded-3xl border border-slate-200/90 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-base font-extrabold text-slate-900">
                  Wallet Statement & Transaction History
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-50 text-indigo-600 border border-indigo-100">
                  {transactions.length} Transactions
                </span>
              </div>

              {transactions.length === 0 ? (
                <p className="text-xs text-slate-500 py-6 text-center">No wallet transactions recorded yet.</p>
              ) : (
                <div className="space-y-4">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                          <th className="pb-3 px-3">Date</th>
                          <th className="pb-3 px-3">Type</th>
                          <th className="pb-3 px-3">Description</th>
                          <th className="pb-3 px-3 text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {transactions
                          .slice((txPage - 1) * txPageSize, txPage * txPageSize)
                          .map((tx) => {
                            const txTypeLower = (tx.type || '').toLowerCase();
                            const isCredit =
                              txTypeLower.includes('credit') ||
                              txTypeLower.includes('topup') ||
                              txTypeLower.includes('refund') ||
                              (Number(tx.amount || 0) > 0 && !txTypeLower.includes('debit'));

                            return (
                              <tr key={tx.id} className="hover:bg-slate-50">
                                <td className="py-3 px-3 text-slate-500 font-medium whitespace-nowrap">
                                  {new Date(tx.createdAt).toLocaleDateString()}
                                </td>
                                <td className="py-3 px-3 font-bold uppercase text-[10px]">
                                  <span
                                    className={`px-2.5 py-0.5 rounded-full border ${
                                      isCredit
                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 font-extrabold'
                                        : 'bg-rose-50 text-rose-700 border-rose-200 font-extrabold'
                                    }`}
                                  >
                                    {tx.type}
                                  </span>
                                </td>
                                <td className="py-3 px-3 text-slate-700 font-medium">{tx.description}</td>
                                <td
                                  className={`py-3 px-3 text-right font-black whitespace-nowrap ${
                                    isCredit ? 'text-emerald-600' : 'text-rose-600'
                                  }`}
                                >
                                  {isCredit ? '+' : '-'}₹{Number(tx.amount).toFixed(2)}
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>

                  {/* Wallet Transactions Table Pagination Footer */}
                  {transactions.length > 0 && (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-3 border-t border-slate-100 text-xs">
                      <span className="text-slate-500 font-medium text-center sm:text-left text-[11px]">
                        Showing {(txPage - 1) * txPageSize + 1} to {Math.min(txPage * txPageSize, transactions.length)} of {transactions.length} entries
                      </span>
                      <div className="flex items-center space-x-1">
                        <button
                          type="button"
                          disabled={txPage <= 1}
                          onClick={() => setTxPage((prev) => Math.max(1, prev - 1))}
                          className="px-3 py-1 rounded-lg border border-slate-200 bg-white font-bold text-slate-700 disabled:opacity-40 hover:bg-slate-50 transition-all cursor-pointer text-xs"
                        >
                          ‹ Previous
                        </button>
                        {Array.from({ length: Math.ceil(transactions.length / txPageSize) }, (_, i) => i + 1).map((pageNum) => (
                          <button
                            key={pageNum}
                            type="button"
                            onClick={() => setTxPage(pageNum)}
                            className={`w-7 h-7 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                              txPage === pageNum
                                ? 'bg-indigo-600 text-white shadow-xs'
                                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            {pageNum}
                          </button>
                        ))}
                        <button
                          type="button"
                          disabled={txPage >= Math.ceil(transactions.length / txPageSize)}
                          onClick={() => setTxPage((prev) => Math.min(Math.ceil(transactions.length / txPageSize), prev + 1))}
                          className="px-3 py-1 rounded-lg border border-slate-200 bg-white font-bold text-slate-700 disabled:opacity-40 hover:bg-slate-50 transition-all cursor-pointer text-xs"
                        >
                          Next ›
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 3: Profile & Tax Settings */}
        {activeTab === 'profile' && (
          <div className="bg-white p-5 sm:p-8 rounded-3xl border border-slate-200/90 shadow-xs max-w-2xl space-y-6">
            <h3 className="text-base sm:text-lg font-extrabold text-slate-900 border-b border-slate-100 pb-3">
              Member Profile & Invoicing Tax Settings
            </h3>

            {profileSuccess && (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold flex items-center space-x-2">
                <Check className="w-4 h-4" />
                <span>{profileSuccess}</span>
              </div>
            )}

            <form onSubmit={handleProfileSubmit} className="space-y-4 text-xs">
              <div className="flex items-center space-x-4 pb-2">
                <ImageUploader
                  value={profileForm.avatarUrl}
                  onChange={(url) => setProfileForm({ ...profileForm, avatarUrl: url })}
                  label="Profile Picture"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 focus:border-purple-600 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Phone Number *</label>
                  <input
                    type="text"
                    required
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 focus:border-purple-600 focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Company Name</label>
                  <input
                    type="text"
                    value={profileForm.companyName}
                    onChange={(e) => setProfileForm({ ...profileForm, companyName: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 focus:border-purple-600 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">GSTIN Number (For Tax Invoices)</label>
                <input
                  type="text"
                  value={profileForm.gstin}
                  onChange={(e) => setProfileForm({ ...profileForm, gstin: e.target.value })}
                  placeholder="22AAAAA0000A1Z5"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 font-mono focus:border-purple-600 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Bio / Profession</label>
                <textarea
                  rows={2}
                  value={profileForm.bio}
                  onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 focus:border-purple-600 focus:bg-white focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={updatingProfile}
                className="py-3.5 px-6 rounded-full text-xs font-extrabold text-white bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 hover:opacity-95 shadow-md flex items-center space-x-2 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>{updatingProfile ? 'Saving Changes...' : 'Save Profile Changes'}</span>
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  </main>

      {/* Manual Cash Payment Proof Upload Modal */}
      {proofModalOpen && selectedPackForProof && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white p-6 sm:p-8 rounded-3xl max-w-md w-full border border-slate-200 shadow-2xl space-y-5 relative max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setProofModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-900 text-sm font-bold p-1 rounded-full bg-slate-100"
            >
              ✕
            </button>

            <div className="space-y-1">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-purple-600">
                Manual Cash / Bank Verification
              </span>
              <h3 className="text-xl font-extrabold text-slate-900">Recharge ₹{selectedPackForProof.amount}</h3>
            </div>

            <form onSubmit={handleSubmitProof} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Upload Payment Receipt Screenshot *</label>
                <ImageUploader
                  value={proofFormData.paymentProofUrl}
                  onChange={(url) => setProofFormData({ ...proofFormData, paymentProofUrl: url })}
                  label="Payment Proof Receipt"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">UPI / Bank Transaction UTR / Ref Number</label>
                <input
                  type="text"
                  required
                  value={proofFormData.referenceNumber}
                  onChange={(e) => setProofFormData({ ...proofFormData, referenceNumber: e.target.value })}
                  placeholder="e.g. UTR123456789"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 font-mono focus:border-purple-600 focus:bg-white focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={submittingProof}
                className="w-full py-3.5 rounded-full text-xs font-extrabold text-white bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 hover:opacity-95 shadow-md flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                <span>{submittingProof ? 'Submitting Receipt...' : 'Submit Payment Proof'}</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* PASS INSPECTOR MODAL */}
      {selectedPass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white p-6 sm:p-8 rounded-3xl max-w-lg w-full border border-slate-200 shadow-2xl space-y-5 relative max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setSelectedPass(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-900 text-sm font-bold p-1.5 rounded-full bg-slate-100 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center space-x-3 border-b border-slate-100 pb-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center font-mono font-black text-lg border border-indigo-100 shadow-md shrink-0">
                <QrCode className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-extrabold uppercase tracking-wider text-indigo-600 truncate">
                    {selectedPass.bookingCode || `#${selectedPass.id}`}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0 ml-2">
                    {(selectedPass.status || 'CONFIRMED').toUpperCase()}
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-extrabold text-slate-900 truncate mt-0.5">
                  {selectedPass.meetingRoom?.name || selectedPass.notes || 'Day Pass Flex Desk'}
                </h3>
              </div>
            </div>

            {/* Digital QR Code Box */}
            <div className="p-4 bg-gradient-to-b from-slate-50 to-indigo-50/30 rounded-2xl border border-slate-200 text-center space-y-2">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
                  selectedPass.qrAccessCode || selectedPass.bookingCode || 'QR-PASS'
                )}`}
                alt="QR Access Code"
                className="w-36 h-36 object-contain mx-auto bg-white p-2.5 rounded-2xl border border-slate-200 shadow-xs"
              />
              <p className="text-xs font-mono font-black text-slate-900 tracking-wider">
                {selectedPass.qrAccessCode || selectedPass.bookingCode}
              </p>
              <p className="text-[10px] text-slate-500">Scan at center turnstile or front desk check-in kiosk</p>
            </div>

            {/* Comprehensive Detail Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-0.5">
                <span className="text-[10px] text-slate-400 font-extrabold block uppercase">Location / Branch</span>
                <p className="font-extrabold text-slate-900 flex items-center space-x-1">
                  <MapPin className="w-3.5 h-3.5 text-indigo-600 inline shrink-0" />
                  <span>{selectedPass.branch?.name || selectedPass.meetingRoom?.branch?.name || selectedPass.pricingPlan?.branch?.name || 'Active Workspace Hub'}</span>
                </p>
                {(selectedPass.branch?.address || selectedPass.branch?.city) && (
                  <p className="text-[10px] text-slate-500">{selectedPass.branch?.address || selectedPass.branch?.city}</p>
                )}
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-0.5">
                <span className="text-[10px] text-slate-400 font-extrabold block uppercase">Pass Category</span>
                <p className="font-extrabold text-slate-900">
                  {selectedPass.meetingRoom?.name || selectedPass.pricingPlan?.name || (selectedPass.notes ? selectedPass.notes.split('|')[0] : 'Flex Desk Pass')}
                </p>
                <p className="text-[10px] text-slate-500">
                  {selectedPass.meetingRoom?.capacity
                    ? `Capacity: ${selectedPass.meetingRoom.capacity} Seats`
                    : selectedPass.notes?.toLowerCase().includes('dedicated')
                    ? '1 Dedicated Desk Assigned'
                    : '1 Seat Pass'}
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-0.5">
                <span className="text-[10px] text-slate-400 font-extrabold block uppercase">Date & Schedule</span>
                <p className="font-extrabold text-slate-900">{formatDateWithDay(selectedPass.bookingDate || selectedPass.preferredDate).date}</p>
                <p className="text-[10px] text-slate-500">
                  {selectedPass.startTime && selectedPass.endTime
                    ? `${selectedPass.startTime} - ${selectedPass.endTime}`
                    : selectedPass.preferredTimeSlot || 'Standard Operating Hours'}
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-0.5">
                <span className="text-[10px] text-slate-400 font-extrabold block uppercase">Total Paid</span>
                <p className="font-extrabold text-emerald-600 text-sm">₹{Number(selectedPass.totalAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                <p className="text-[10px] text-slate-500">
                  {Number(selectedPass.taxAmount || 0) > 0
                    ? `Tax Included (₹${Number(selectedPass.taxAmount).toFixed(2)})`
                    : 'GST Invoice Generated'}
                </p>
              </div>
            </div>

            {/* Member & Pass Details */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <span className="text-[10px] text-slate-500 font-bold uppercase">Pass Holder</span>
                <span className="font-extrabold text-slate-900">{selectedPass.customerName || user?.name}</span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-500">Member Email</span>
                <span className="font-mono font-bold text-slate-800">{selectedPass.customerEmail || user?.email}</span>
              </div>
              {(selectedPass.customerPhone || user?.phone) && (
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-500">Contact Phone</span>
                  <span className="font-mono font-bold text-slate-800">{selectedPass.customerPhone || user?.phone}</span>
                </div>
              )}
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
              <Link
                href={`/meeting-rooms/receipt/${selectedPass.receiptToken || selectedPass.bookingCode}`}
                className="w-full sm:w-auto px-5 py-2.5 rounded-full text-xs font-extrabold text-white bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 hover:opacity-95 shadow-md flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                <QrCode className="w-4 h-4" />
                <span>Print Digital Receipt ↗</span>
              </Link>

              <button
                type="button"
                onClick={() => setSelectedPass(null)}
                className="w-full sm:w-auto px-5 py-2 rounded-full text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Razorpay Gateway Fallback Modal */}
      <RazorpayGatewayModal
        isOpen={razorpayModalData.isOpen}
        amount={razorpayModalData.amount}
        orderId={razorpayModalData.orderId}
        customerName={user.name}
        customerEmail={user.email}
        description={`Credit Wallet Top-Up (₹${razorpayModalData.amount})`}
        onSuccess={() =>
          handleVerifyPayment({
            amount: razorpayModalData.amount,
            bonus: razorpayModalData.bonus || 0,
            razorpayOrderId: razorpayModalData.orderId,
            razorpayPaymentId: 'pay_demo_sandbox_pass',
            razorpaySignature: 'sig_demo_sandbox_pass',
          })
        }
        onClose={() => setRazorpayModalData({ isOpen: false, amount: 0, bonus: 0, orderId: '' })}
      />

      <Footer />
    </div>
  );
}

export default function MemberDashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FAFAFC] flex items-center justify-center text-slate-900 text-xs font-bold">
          Loading Member Dashboard...
        </div>
      }
    >
      <MemberDashboardContent />
    </Suspense>
  );
}
