import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  MapPin,
  Calendar,
  Grid,
  ShieldCheck,
  ChevronRight,
  Star,
  Users,
  CheckCircle2,
  Zap,
} from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { apiClient } from '@/lib/api-client';
import { useBranch } from '@/context/BranchContext';

export default function HomePage() {
  const { activeBranch, branches } = useBranch();
  const [cmsData, setCmsData] = useState<any>(null);
  const [services, setServices] = useState<any[]>([]);
  const [pricingPlans, setPricingPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiClient.get('/cms/homepage').catch(() => ({ data: {} })),
      apiClient.get('/services').catch(() => ({ data: [] })),
      apiClient.get('/pricing/plans').catch(() => ({ data: [] })),
    ]).then(([cmsRes, serviceRes, pricingRes]) => {
      setCmsData(cmsRes.data?.data || cmsRes.data || {});
      setServices(Array.isArray(serviceRes.data) ? serviceRes.data : (serviceRes.data?.data || []));
      setPricingPlans(Array.isArray(pricingRes.data) ? pricingRes.data : (pricingRes.data?.data || []));
    }).finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      <Navbar />

      {/* Hero Banner Section */}
      <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-32 overflow-hidden bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-rose-500/20 via-purple-600/10 to-transparent blur-3xl" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" /> Next-Gen Coworking Ecosystem
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight">
                Your Flexible Work Environment at <span className="text-gradient-brand">Cowork30</span>
              </h1>

              <p className="text-base text-slate-300 max-w-2xl leading-relaxed">
                Book hourly executive boardrooms, dedicated desks, and private cabins across premium tech hubs with real-time floor availability and seamless wallet checkout.
              </p>

              {/* Quick Branch & Action Bar */}
              <div className="pt-4 flex flex-wrap items-center gap-4">
                <Link
                  to="/meeting-rooms"
                  className="px-6 py-3.5 bg-gradient-to-r from-rose-500 to-purple-600 hover:from-rose-600 hover:to-purple-700 text-white rounded-2xl text-xs font-bold shadow-xl shadow-rose-500/25 transition-all flex items-center gap-2"
                >
                  Book Meeting Suite <ChevronRight className="w-4 h-4" />
                </Link>

                <Link
                  to="/floor-map"
                  className="px-6 py-3.5 bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-slate-200 rounded-2xl text-xs font-bold transition-all flex items-center gap-2"
                >
                  <Grid className="w-4 h-4 text-rose-400" /> Interactive 2D Seat Map
                </Link>
              </div>

              {/* Feature Chips */}
              <div className="pt-6 border-t border-slate-800/80 grid grid-cols-3 gap-4 text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" /> 1 Gbps Fiber Wi-Fi
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" /> 24/7 Keycard Access
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Free Beverage Lounge
                </div>
              </div>
            </div>

            {/* Hero Image Card */}
            <div className="lg:col-span-5 relative">
              <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-slate-800 bg-slate-800/50 backdrop-blur-md">
                <img
                  src="https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80"
                  alt="Cowork30 Hub Environment"
                  className="w-full h-80 lg:h-96 object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80" />
                <div className="absolute bottom-6 left-6 right-6 p-4 rounded-2xl bg-slate-900/90 backdrop-blur-md border border-slate-800 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-white">{activeBranch ? activeBranch.name : 'Downtown Main Hub'}</div>
                    <div className="text-slate-400 text-[11px]">{activeBranch ? activeBranch.address : '100 Innovation Blvd, Tech City'}</div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-[10px]">
                    ● Active Hub
                  </span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold text-rose-500 uppercase tracking-widest">Tailored Workspaces</span>
            <h2 className="text-3xl font-black text-slate-900 mt-2">Flexible Workspace Solutions</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {services.slice(0, 3).map((s) => (
              <div key={s.id} className="bg-slate-50 rounded-3xl p-6 border border-slate-100 hover:shadow-xl transition-all group">
                <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Zap className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">{s.name}</h3>
                <p className="text-xs text-slate-500 leading-relaxed mb-4">{s.shortDescription}</p>
                <div className="flex items-center justify-between pt-4 border-t border-slate-200/60">
                  <span className="text-xs font-bold text-slate-900">Starting ₹{s.startingPrice?.toLocaleString()}/mo</span>
                  <Link to="/services" className="text-xs font-bold text-rose-600 flex items-center gap-1 hover:gap-2 transition-all">
                    Explore <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section className="py-20 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold text-rose-400 uppercase tracking-widest">Transparent Membership</span>
            <h2 className="text-3xl font-black mt-2">Workspace Membership Tiers</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {pricingPlans.map((plan) => (
              <div
                key={plan.id}
                className={`rounded-3xl p-8 border transition-all ${
                  plan.isPopular
                    ? 'bg-gradient-to-b from-slate-800 to-slate-900 border-rose-500/50 shadow-2xl ring-2 ring-rose-500/20'
                    : 'bg-slate-800/40 border-slate-800'
                }`}
              >
                {plan.isPopular && (
                  <span className="px-3 py-1 bg-gradient-to-r from-rose-500 to-purple-600 text-white rounded-full text-[10px] font-extrabold uppercase tracking-wider">
                    Most Popular
                  </span>
                )}
                <h3 className="text-xl font-bold mt-4">{plan.name}</h3>
                <p className="text-xs text-slate-400 mt-1">{plan.tagline}</p>
                
                <div className="my-6">
                  <span className="text-4xl font-black text-white">₹{plan.priceMonthly?.toLocaleString()}</span>
                  <span className="text-xs text-slate-400">/month</span>
                </div>

                <Link
                  to="/pricing"
                  className="w-full py-3 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold flex items-center justify-center gap-1 transition-all"
                >
                  Choose Plan
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
