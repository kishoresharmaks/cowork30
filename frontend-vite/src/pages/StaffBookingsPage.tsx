import React, { useState, useEffect } from 'react';
import { Calendar, UserCheck, Search, CheckCircle2, Clock } from 'lucide-react';
import StaffSidebar from '@/components/layout/StaffSidebar';
import { apiClient } from '@/lib/api-client';

export default function StaffBookingsPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    apiClient.get('/bookings')
      .then((res) => setBookings(Array.isArray(res.data) ? res.data : (res.data?.data || [])))
      .catch(() => setBookings([]));
  }, []);

  const handleCheckIn = async (id: number) => {
    try {
      await apiClient.post(`/bookings/${id}/check-in`);
      alert('Guest checked in successfully!');
      setBookings(bookings.map((b) => (b.id === id ? { ...b, checkedIn: true } : b)));
    } catch (err) {
      alert('Failed to process check-in.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex font-sans">
      <StaffSidebar />

      <main className="flex-1 p-8 overflow-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-black text-white">Desk & Meeting Suite Guest Check-In</h1>
            <p className="text-xs text-slate-400 mt-1">Verify digital access passes and check in arriving members and guests.</p>
          </div>

          <div className="relative w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search guest name or code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-slate-400 uppercase font-bold text-[10px] border-b border-slate-800">
              <tr>
                <th className="p-4">ID</th>
                <th className="p-4">Guest Details</th>
                <th className="p-4">Resource</th>
                <th className="p-4">Time Slot</th>
                <th className="p-4">Status</th>
                <th className="p-4">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {bookings.map((b) => (
                <tr key={b.id} className="hover:bg-slate-800/40">
                  <td className="p-4 font-bold text-white">#{b.id}</td>
                  <td className="p-4">
                    <div className="font-bold text-white">{b.user?.name || b.customerName || 'Guest User'}</div>
                    <div className="text-[11px] text-slate-400">{b.user?.email || b.customerEmail}</div>
                  </td>
                  <td className="p-4 font-semibold text-indigo-400">{b.meetingRoom?.name || b.desk?.deskNumber || 'Desk Pass'}</td>
                  <td className="p-4 text-slate-400">{new Date(b.startTime).toLocaleString()}</td>
                  <td className="p-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${b.checkedIn ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-300'}`}>
                      {b.checkedIn ? 'CHECKED IN' : 'CONFIRMED'}
                    </span>
                  </td>
                  <td className="p-4">
                    {!b.checkedIn && (
                      <button
                        onClick={() => handleCheckIn(b.id)}
                        className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] rounded-lg transition-colors"
                      >
                        Check-In Guest
                      </button>
                    )}
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
