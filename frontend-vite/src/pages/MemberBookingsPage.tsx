import React, { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, CheckCircle2, XCircle, AlertCircle, Shield, QrCode } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { apiClient } from '@/lib/api-client';

export default function MemberBookingsPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.get('/bookings/my-bookings')
      .then((res) => setBookings(Array.isArray(res.data) ? res.data : (res.data?.data || [])))
      .catch((err) => console.error('Failed to load bookings:', err))
      .finally(() => setLoading(false));
  }, []);

  const handleCancel = async (id: number) => {
    if (!confirm('Are you sure you want to cancel this booking?')) return;
    try {
      await apiClient.post(`/bookings/${id}/cancel`);
      alert('Booking cancelled successfully.');
      setBookings(bookings.map((b) => (b.id === id ? { ...b, status: 'cancelled' } : b)));
    } catch (err) {
      alert('Failed to cancel booking.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-28 lg:py-36 w-full">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black text-slate-900">My Workspace Reservations</h1>
            <p className="text-xs text-slate-500 mt-1">View active digital access passes, meeting suite receipts, and past history.</p>
          </div>
        </div>

        {bookings.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 border border-slate-100 text-center space-y-3">
            <Calendar className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="text-base font-bold text-slate-800">No Active Reservations Found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">You have no active meeting suite or desk reservations. Book a suite to get started!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((b) => (
              <div key={b.id} className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center font-bold text-sm">
                    #{b.id}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">{b.meetingRoom?.name || b.desk?.deskNumber || 'Workspace Booking'}</h3>
                    <div className="text-xs text-slate-400 flex items-center gap-2 mt-1">
                      <Clock className="w-3.5 h-3.5" /> {new Date(b.startTime).toLocaleString()} - {new Date(b.endTime).toLocaleTimeString()}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    b.status === 'confirmed' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {b.status.toUpperCase()}
                  </span>

                  <span className="text-base font-black text-rose-600">₹{Number(b.totalAmount || b.amount || 0).toLocaleString()}</span>

                  {b.status === 'confirmed' && (
                    <button
                      onClick={() => handleCancel(b.id)}
                      className="px-3 py-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-xl text-xs font-bold transition-colors"
                    >
                      Cancel Pass
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
