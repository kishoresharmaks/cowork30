import React, { useState, useEffect } from 'react';
import { Grid, Plus, Edit, Trash2, Users } from 'lucide-react';
import AdminSidebar from '@/components/layout/AdminSidebar';
import { apiClient } from '@/lib/api-client';

export default function AdminMeetingRoomsPage() {
  const [rooms, setRooms] = useState<any[]>([]);

  useEffect(() => {
    apiClient.get('/meeting-rooms')
      .then((res) => setRooms(Array.isArray(res.data) ? res.data : (res.data?.data || [])))
      .catch(() => setRooms([]));
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex font-sans">
      <AdminSidebar />

      <main className="flex-1 p-8 overflow-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-black text-white">Meeting Suite & Boardroom Manager</h1>
            <p className="text-xs text-slate-400 mt-1">Configure hourly pricing, capacities, and AV amenity specifications.</p>
          </div>

          <button className="px-4 py-2.5 bg-gradient-to-r from-rose-500 to-purple-600 hover:from-rose-600 hover:to-purple-700 text-white font-bold text-xs rounded-xl flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add Meeting Room
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {rooms.map((r) => (
            <div key={r.id} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-base font-bold text-white">{r.name}</h3>
                  <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 text-[10px] font-bold">{r.capacity} SEATS</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">{r.description}</p>
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-xs">
                <span className="text-rose-400 font-bold">₹{r.hourlyRate}/hr</span>
                <button className="p-2 text-slate-400 hover:text-white"><Edit className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
