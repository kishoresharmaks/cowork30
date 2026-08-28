import React, { useState, useEffect } from 'react';
import { Layers, CheckCircle2, ChevronRight, Zap } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { apiClient } from '@/lib/api-client';

export default function ServicesPage() {
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.get('/services')
      .then((res) => setServices(Array.isArray(res.data) ? res.data : (res.data?.data || [])))
      .catch((err) => console.error('Failed to load services:', err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-28 lg:py-36 w-full">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-bold text-rose-500 uppercase tracking-widest">Enterprise Solutions</span>
          <h1 className="text-4xl font-black text-slate-900 mt-2">Workspace Services Catalog</h1>
          <p className="text-xs text-slate-500 mt-2 leading-relaxed">
            From virtual corporate addresses to dedicated desk passes and corporate event hosting.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {services.map((s) => (
            <div key={s.id} className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm hover:shadow-xl transition-all">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center mb-6">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">{s.name}</h3>
              <p className="text-xs text-slate-500 leading-relaxed mb-6">{s.detailedDescription}</p>

              <div className="flex items-center justify-between pt-6 border-t border-slate-100">
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-bold">Starting From</div>
                  <div className="text-xl font-black text-rose-600">₹{Number(s.startingPrice).toLocaleString()}/mo</div>
                </div>

                <button className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors">
                  Inquire Now
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
}
