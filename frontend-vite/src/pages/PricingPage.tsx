import React, { useState, useEffect } from 'react';
import { Tag, CheckCircle2, Sparkles, Send } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { apiClient } from '@/lib/api-client';

export default function PricingPage() {
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.get('/pricing/plans')
      .then((res) => setPlans(Array.isArray(res.data) ? res.data : (res.data?.data || [])))
      .catch((err) => console.error('Failed to load pricing plans:', err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-28 lg:py-36 w-full">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-bold text-rose-500 uppercase tracking-widest">Flexible Billing</span>
          <h1 className="text-4xl font-black text-slate-900 mt-2">Membership Plans & Tiers</h1>
          <p className="text-xs text-slate-500 mt-2">
            No hidden fees. Inclusive of fiber internet, meeting credits, coffee & lounge privileges.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((p) => (
            <div
              key={p.id}
              className={`rounded-3xl p-8 bg-white border shadow-sm transition-all flex flex-col justify-between ${
                p.isPopular ? 'border-rose-500 ring-2 ring-rose-500/20 shadow-xl' : 'border-slate-100'
              }`}
            >
              <div>
                {p.isPopular && (
                  <span className="px-3 py-1 bg-gradient-to-r from-rose-500 to-purple-600 text-white rounded-full text-[10px] font-extrabold uppercase tracking-wider">
                    Recommended
                  </span>
                )}
                <h3 className="text-xl font-bold text-slate-900 mt-3">{p.name}</h3>
                <p className="text-xs text-slate-400 mt-1">{p.tagline}</p>

                <div className="my-6">
                  <span className="text-4xl font-black text-slate-900">₹{Number(p.priceMonthly).toLocaleString()}</span>
                  <span className="text-xs text-slate-400">/month</span>
                </div>

                <div className="space-y-3 pt-4 border-t border-slate-100 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span><strong>{p.meetingCreditsIncluded}</strong> Meeting Credits / Mo</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span><strong>{p.deskCreditsIncluded}</strong> Desk Pass Credits</span>
                  </div>
                </div>
              </div>

              <button className="w-full mt-8 py-3 bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold rounded-xl transition-all">
                Select Plan
              </button>
            </div>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
}
