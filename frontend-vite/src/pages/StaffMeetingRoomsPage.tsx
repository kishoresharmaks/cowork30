import React, { useState, useEffect } from 'react';
import { Grid, Users, Clock, Plus } from 'lucide-react';
import StaffSidebar from '@/components/layout/StaffSidebar';
import { apiClient } from '@/lib/api-client';

export default function StaffMeetingRoomsPage() {
  const [rooms, setRooms] = useState<any[]>([]);

  useEffect(() => {
    apiClient.get('/meeting-rooms')
      .then((res) => setRooms(Array.isArray(res.data) ? res.data : (res.data?.data || [])))
      .catch(() => setRooms([]));
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex font-sans">
      <StaffSidebar />

      <main className="flex-1 p-8 overflow-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-black text-white">Live Meeting Suite Availability</h1>
            <p className="text-xs text-slate-400 mt-1">Real-time room status override and instant front-desk reservations.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {rooms.map((room) => (
            <div key={room.id} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-base font-bold text-white">{room.name}</h3>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">AVAILABLE</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">{room.description}</p>
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-400">Capacity: <strong className="text-white">{room.capacity} Seats</strong></span>
                <span className="text-indigo-400 font-bold">₹{room.hourlyRate}/hr</span>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
