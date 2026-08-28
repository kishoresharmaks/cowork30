import React, { useState, useEffect } from 'react';
import { Tag, Plus, Edit } from 'lucide-react';
import AdminSidebar from '@/components/layout/AdminSidebar';
import { apiClient } from '@/lib/api-client';

export default function AdminPricingPage() {
  const [plans, setPlans] = useState<any[]>([]);

  useEffect(() => {
    apiClient.get('/pricing/plans')
      .then((res) => setPlans(Array.isArray(res.data) ? res.data : (res.data?.data || [])))
      .catch(() => setPlans([]));
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex font-sans">
      <AdminSidebar />

      <main className="flex-1 p-8 overflow-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-black text-white">Membership Plan & Pricing Manager</h1>
            <p className="text-xs text-slate-400 mt-1">Configure subscription pricing tiers, credit allocations, and feature lists.</p>
          </div>

          <button className="px-4 py-2.5 bg-gradient-to-r from-rose-500 to-purple-600 text-white font-bold text-xs rounded-xl flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add Pricing Tier
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((p) => (
            <div key={p.id} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col justify-between space-y-4">
              <div>
                <h3 className="text-base font-bold text-white mb-1">{p.name}</h3>
                <div className="text-2xl font-black text-rose-500 my-2">₹{p.priceMonthly}/mo</div>
                <p className="text-xs text-slate-400">{p.tagline}</p>
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-400">{p.meetingCreditsIncluded} Meeting Credits</span>
                <button className="p-2 text-slate-400 hover:text-white"><Edit className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
