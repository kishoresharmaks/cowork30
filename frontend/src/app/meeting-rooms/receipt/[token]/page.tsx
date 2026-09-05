'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { QrCode, Calendar, Clock, MapPin, CheckCircle2, Printer, ArrowLeft, ShieldAlert, LogIn } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

function formatUtcTimeSlot(isoString: string) {
  if (!isoString) return '';
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return isoString;
  const hours = d.getUTCHours();
  const period = hours >= 12 ? 'PM' : 'AM';
  const h12 = hours % 12 === 0 ? 12 : hours % 12;
  const mins = d.getUTCMinutes().toString().padStart(2, '0');
  return `${h12}:${mins} ${period}`;
}

export default function ReceiptPage() {
  const params = useParams();
  const router = useRouter();
  const token = params?.token as string;
  const { user, token: authToken, isLoading: authLoading } = useAuth();

  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [errorStatus, setErrorStatus] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [taxRate, setTaxRate] = useState<number>(0.18);

  useEffect(() => {
    if (authLoading) return;

    if (!authToken) {
      setErrorStatus(401);
      setErrorMessage('Sign in required to access member booking receipts.');
      setLoading(false);
      return;
    }

    async function fetchReceipt() {
      try {
        const res = await apiClient.get(`/meeting-rooms/receipt/${token}`);
        setBooking(res.data?.booking || res.data);
        try {
          const s = await apiClient.get('/cms/settings');
          if (s.data?.taxRate !== undefined) setTaxRate(Number(s.data.taxRate));
        } catch (e) {}
      } catch (err: any) {
        const status = err.response?.status || 500;
        setErrorStatus(status);
        setErrorMessage(err.response?.data?.message || 'Failed to fetch receipt details');
      } finally {
        setLoading(false);
      }
    }

    fetchReceipt();
  }, [token, authToken, authLoading]);

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-[#FAFAFC] text-slate-900 flex items-center justify-center text-xs font-bold">
        Verifying digital entry pass credentials...
      </div>
    );
  }

  // 401 Unauthorized Screen
  if (errorStatus === 401) {
    return (
      <div className="min-h-screen bg-[#FAFAFC] text-slate-900 flex flex-col justify-between font-sans">
        <Navbar />
        <main className="pt-32 pb-24 max-w-md mx-auto px-4 w-full text-center space-y-6">
          <div className="w-16 h-16 rounded-3xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto shadow-sm">
            <LogIn className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h2 className="text-2xl font-extrabold text-slate-900">Sign In Required</h2>
            <p className="text-xs text-slate-600">
              For privacy and security protection, booking receipts can only be accessed by authenticated account owners.
            </p>
          </div>
          <Link
            href={`/login?redirect=/meeting-rooms/receipt/${token}`}
            className="w-full py-3.5 rounded-full text-xs font-bold text-white bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 shadow-md flex items-center justify-center space-x-2"
          >
            <LogIn className="w-4 h-4" />
            <span>Sign In to View Pass</span>
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  // 403 Forbidden Screen
  if (errorStatus === 403) {
    return (
      <div className="min-h-screen bg-[#FAFAFC] text-slate-900 flex flex-col justify-between font-sans">
        <Navbar />
        <main className="pt-32 pb-24 max-w-md mx-auto px-4 w-full text-center space-y-6">
          <div className="w-16 h-16 rounded-3xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto shadow-sm">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h2 className="text-2xl font-extrabold text-slate-900">Access Denied</h2>
            <p className="text-xs text-slate-600">
              {errorMessage || 'You do not have authorization to view this receipt pass.'}
            </p>
          </div>
          <Link
            href="/dashboard"
            className="w-full py-3 rounded-full text-xs font-bold text-slate-800 bg-white border border-slate-200 shadow-xs flex items-center justify-center space-x-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>View My Member Bookings</span>
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  if (!booking || !booking.bookingCode) {
    return (
      <div className="min-h-screen bg-[#FAFAFC] text-slate-900 flex flex-col justify-between">
        <Navbar />
        <div className="text-center py-32 space-y-3">
          <h2 className="text-2xl font-bold text-slate-900">Receipt Not Found</h2>
          <p className="text-xs text-slate-500">The requested booking receipt token is invalid or has expired.</p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFC] text-slate-900 flex flex-col font-sans selection:bg-indigo-600 selection:text-white print:min-h-0 print:bg-white print:p-0">
      {/* Global Print Media Styles */}
      <style jsx global>{`
        @media print {
          @page {
            margin: 10mm;
            size: auto;
          }
          html, body {
            background-color: #ffffff !important;
            background: #ffffff !important;
            color: #0f172a !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          nav, footer, header, .print\\:hidden, #mobile-bottom-nav, aside {
            display: none !important;
          }
          main {
            padding: 0 !important;
            margin: 0 auto !important;
            max-width: 100% !important;
            width: 100% !important;
          }
        }
      `}</style>

      <div className="print:hidden">
        <Navbar />
      </div>

      <main className="pt-24 pb-24 max-w-3xl mx-auto px-4 w-full flex-grow space-y-6 print:pt-0 print:pb-0 print:max-w-none print:px-0 print:space-y-0 print:w-full">
        {/* Action Header */}
        <div className="flex items-center justify-between print:hidden">
          <Link
            href="/dashboard"
            className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center space-x-1"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Member Dashboard</span>
          </Link>

          <button
            type="button"
            onClick={handlePrint}
            className="px-4 py-2 rounded-full bg-white border border-slate-200 text-indigo-600 hover:bg-slate-50 text-xs font-bold shadow-xs transition-all flex items-center space-x-1.5 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print Pass / Save PDF</span>
          </button>
        </div>

        {/* Digital Pass Card */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/90 shadow-sm space-y-6 relative overflow-hidden print:p-6 print:rounded-2xl print:border print:border-slate-300 print:shadow-none print:max-w-xl print:mx-auto print:space-y-5">
          {/* Header Brand Banner (Visible in Print Mode Only) */}
          <div className="hidden print:flex items-center justify-between border-b border-slate-200 pb-3">
            <div className="flex items-center space-x-2">
              <span className="text-xl font-black tracking-tight text-slate-900">
                COWORK<span className="text-rose-600">30</span>
              </span>
              <span className="text-[10px] text-slate-500 font-semibold pl-2 border-l border-slate-300 uppercase tracking-wider">
                Digital Entry Pass & Invoice
              </span>
            </div>
            <div className="text-right">
              <span className="text-[9px] font-mono text-slate-400 block font-bold uppercase">Pass Reference</span>
              <span className="text-xs font-mono font-bold text-indigo-600">#{booking.bookingCode}</span>
            </div>
          </div>

          {/* Header Badge & Title */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 print:border-slate-200 pb-4">
            <div className="space-y-1">
              <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold uppercase">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                <span>Reservation Confirmed & Paid</span>
              </div>
              <h1 className="text-2xl font-black text-slate-900">{booking.meetingRoom?.name || 'Executive Conference Suite'}</h1>
              <p className="text-xs text-slate-500 flex items-center space-x-2 font-medium">
                <MapPin className="w-3.5 h-3.5 text-rose-500" />
                <span>{booking.branch?.name || 'Downtown Main Hub'}, {booking.branch?.city || 'Downtown'}</span>
              </p>
            </div>

            <div className="text-right space-y-0.5 print:hidden">
              <span className="text-[10px] font-mono uppercase text-slate-400 block font-bold">Booking Code</span>
              <span className="text-lg font-mono font-extrabold text-indigo-600">{booking.bookingCode}</span>
            </div>
          </div>

          {/* QR Pass Entry Hero */}
          <div className="p-5 rounded-2xl bg-indigo-50/70 border border-indigo-100 flex flex-col sm:flex-row items-center justify-between gap-6 print:bg-slate-50 print:border-slate-200 print:p-4">
            <div className="space-y-2 text-center sm:text-left">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-600 block">Digital Access Pass</span>
              <h3 className="text-lg font-extrabold text-slate-900">{booking.meetingRoom?.name}</h3>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-xs text-slate-600 font-medium">
                <span className="flex items-center space-x-1">
                  <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                  <span>{new Date(booking.bookingDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
                </span>
                <span className="flex items-center space-x-1">
                  <Clock className="w-3.5 h-3.5 text-indigo-600" />
                  <span className="font-semibold text-slate-900">
                    {formatUtcTimeSlot(booking.startTime)} - {formatUtcTimeSlot(booking.endTime)} ({Number(booking.totalHours) === 0.5 ? '30 Mins' : `${Number(booking.totalHours)} Hr${Number(booking.totalHours) === 1 ? '' : 's'}`})
                  </span>
                </span>
              </div>
            </div>

            {/* Dynamic Scannable QR Pass Display */}
            <div className="p-3 bg-white rounded-2xl border border-indigo-200 shadow-sm text-center shrink-0 min-w-[130px] print:border-slate-300">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
                  booking.qrAccessCode || booking.bookingCode || 'QR-PASS'
                )}`}
                alt={`QR Access Pass ${booking.qrAccessCode || booking.bookingCode}`}
                className="w-24 h-24 object-contain mx-auto rounded-lg"
              />
              <span className="text-[9px] font-mono text-indigo-950 font-bold block mt-1 tracking-wider uppercase">
                {booking.qrAccessCode || booking.bookingCode}
              </span>
              <span className="text-[8px] font-extrabold text-indigo-600 block uppercase tracking-widest mt-0.5">
                Scan at Entrance
              </span>
            </div>
          </div>

          {/* Reservation Breakdown */}
          <div className="space-y-3 text-xs">
            <h4 className="font-extrabold text-slate-900 border-b border-slate-100 print:border-slate-200 pb-2">Reservation Breakdown</h4>

            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-0.5">
                <span className="text-[11px] text-slate-400 block font-medium">Guest Name</span>
                <span className="font-bold text-slate-900">{booking.customerName}</span>
              </div>
              <div className="space-y-0.5">
                <span className="text-[11px] text-slate-400 block font-medium">Guest Email</span>
                <span className="font-bold text-slate-900">{booking.customerEmail}</span>
              </div>
              {booking.customerPhone && (
                <div className="space-y-0.5">
                  <span className="text-[11px] text-slate-400 block font-medium">Guest Phone</span>
                  <span className="font-bold text-slate-900">{booking.customerPhone}</span>
                </div>
              )}
              {booking.companyName && (
                <div className="space-y-0.5">
                  <span className="text-[11px] text-slate-400 block font-medium">Company Name</span>
                  <span className="font-bold text-slate-900">{booking.companyName}</span>
                </div>
              )}
              <div className="space-y-0.5">
                <span className="text-[11px] text-slate-400 block font-medium">Payment Method</span>
                <span className="font-bold text-slate-900 uppercase">{booking.paymentMethod || 'Wallet'}</span>
              </div>
              <div className="space-y-0.5">
                <span className="text-[11px] text-slate-400 block font-medium">Total Paid (incl. GST)</span>
                <span className="font-extrabold text-indigo-600 text-sm">₹{Number(booking.totalAmount || 0).toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Print Footer Note */}
          <div className="hidden print:block pt-3 border-t border-slate-200 text-center space-y-1">
            <p className="text-[10px] text-slate-500 font-medium">
              Please present this pass or scan the QR code at the turnstile / reception entrance scanner.
            </p>
            <p className="text-[9px] text-slate-400">
              Need assistance? Contact support@cowork30.com or speak with our on-site community manager.
            </p>
          </div>
        </div>
      </main>

      <div className="print:hidden">
        <Footer />
      </div>
    </div>
  );
}
