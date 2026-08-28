import React, { useState, useEffect } from 'react';
import { MapPin, Plus, Edit, Trash2, ShieldCheck } from 'lucide-react';
import AdminSidebar from '@/components/layout/AdminSidebar';
import { apiClient } from '@/lib/api-client';

export default function AdminBranchesPage() {
  const [branches, setBranches] = useState<any[]>([]);

  useEffect(() => {
    apiClient.get('/branches')
      .then((res) => setBranches(Array.isArray(res.data) ? res.data : (res.data?.data || [])))
      .catch(() => setBranches([]));
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex font-sans">
      <AdminSidebar />

      <main className="flex-1 p-8 overflow-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-black text-white">Branch Location Manager</h1>
            <p className="text-xs text-slate-400 mt-1">Configure coworking hub locations, addresses, and operational hours.</p>
          </div>

          <button className="px-4 py-2.5 bg-gradient-to-r from-rose-500 to-purple-600 hover:from-rose-600 hover:to-purple-700 text-white font-bold text-xs rounded-xl flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add New Branch Hub
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {branches.map((b) => (
            <div key={b.id} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-base font-bold text-white">{b.name}</h3>
                  <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 text-[10px] font-bold">ACTIVE HUB</span>
                </div>
                <div className="text-xs text-slate-400 flex items-center gap-1.5 mt-1">
                  <MapPin className="w-3.5 h-3.5 text-rose-500" /> {b.address}, {b.city}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-400">{b.phone || '+1 555-000-2026'}</span>
                <button className="p-2 text-slate-400 hover:text-white"><Edit className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
