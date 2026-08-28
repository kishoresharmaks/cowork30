import React, { useState, useEffect } from 'react';
import { Calendar, Search, CheckCircle2, XCircle } from 'lucide-react';
import AdminSidebar from '@/components/layout/AdminSidebar';
import { apiClient } from '@/lib/api-client';

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<any[]>([]);

  useEffect(() => {
    apiClient.get('/bookings')
      .then((res) => setBookings(Array.isArray(res.data) ? res.data : (res.data?.data || [])))
      .catch(() => setBookings([]));
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex font-sans">
      <AdminSidebar />

      <main className="flex-1 p-8 overflow-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-black text-white">All Reservation & Booking Records</h1>
            <p className="text-xs text-slate-400 mt-1">Audit executive suite bookings, payments, and cancellation requests.</p>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-slate-400 uppercase font-bold text-[10px] border-b border-slate-800">
              <tr>
                <th className="p-4">Booking ID</th>
                <th className="p-4">Customer</th>
                <th className="p-4">Resource</th>
                <th className="p-4">Amount</th>
                <th className="p-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {bookings.map((b) => (
                <tr key={b.id} className="hover:bg-slate-800/40">
                  <td className="p-4 font-bold text-white">#{b.id}</td>
                  <td className="p-4 font-bold text-white">{b.user?.name || b.customerName || 'Guest User'}</td>
                  <td className="p-4 font-semibold text-indigo-400">{b.meetingRoom?.name || b.desk?.deskNumber || 'Workspace Pass'}</td>
                  <td className="p-4 font-bold text-emerald-400">₹{Number(b.totalAmount || b.amount || 0).toLocaleString()}</td>
                  <td className="p-4">
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                      {b.status.toUpperCase()}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
