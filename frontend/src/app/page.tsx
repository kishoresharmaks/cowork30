'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import {
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Calendar,
  Compass,
  Building2,
  Laptop,
  MailCheck,
  ShieldCheck,
  Zap,
  Coffee,
  Wifi,
  Clock,
  ChevronRight,
  Star,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';

export default function HomePage() {
  const [homepageData, setHomepageData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchHomepage() {
      try {
        const res = await apiClient.get('/cms/homepage');
        setHomepageData(res.data);
      } catch (err) {
        console.error('Failed to fetch homepage data:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchHomepage();
  }, []);

  return (
    <div className="min-h-screen bg-[#FAFAFC] text-slate-900 flex flex-col font-sans selection:bg-indigo-600 selection:text-white">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-28 pb-20 md:pt-40 md:pb-32 overflow-hidden">
        {/* Subtle Gradient Backdrops */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute top-1/3 right-10 w-[400px] h-[400px] bg-pink-500/10 rounded-full blur-[140px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-4xl mx-auto space-y-6">
            {/* Badge */}
            <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-white border border-slate-200/90 text-xs font-bold text-indigo-600 shadow-xs backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>Next-Gen Coworking Ecosystem</span>
              <span className="w-1.5 h-1.5 rounded-full bg-pink-500 animate-pulse" />
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.1] text-slate-900">
              Elevate Your Work at <br />
              <span className="bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 bg-clip-text text-transparent">
                Cowork30
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
              Your on-demand business solution partner. On-demand desks, private executive suites, real-time meeting rooms, and vibrant professional community.
            </p>

            {/* Action Buttons */}
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/meeting-rooms"
                className="w-full sm:w-auto px-8 py-4 text-xs sm:text-sm font-bold rounded-full text-white bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 hover:opacity-95 transition-all shadow-xl shadow-pink-500/25 flex items-center justify-center space-x-2 group"
              >
                <Calendar className="w-4 h-4" />
                <span>Reserve Meeting Suite</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>

              <Link
                href="/floor-map"
                className="w-full sm:w-auto px-8 py-4 text-xs sm:text-sm font-bold rounded-full bg-white border border-slate-200 hover:border-slate-300 transition-all text-slate-700 hover:text-slate-900 flex items-center justify-center space-x-2 shadow-xs"
              >
                <Compass className="w-4 h-4 text-purple-600" />
                <span>Explore Interactive Floor Map</span>
              </Link>
            </div>

            {/* Trust Perks */}
            <div className="pt-8 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs font-semibold text-slate-600 max-w-3xl mx-auto">
              <div className="flex items-center justify-center space-x-2 px-3 py-2.5 rounded-xl bg-white border border-slate-200/90 shadow-xs">
                <Wifi className="w-4 h-4 text-rose-500" />
                <span>1 Gbps Fiber Wi-Fi</span>
              </div>
              <div className="flex items-center justify-center space-x-2 px-3 py-2.5 rounded-xl bg-white border border-slate-200/90 shadow-xs">
                <Clock className="w-4 h-4 text-purple-600" />
                <span>24/7 Access</span>
              </div>
              <div className="flex items-center justify-center space-x-2 px-3 py-2.5 rounded-xl bg-white border border-slate-200/90 shadow-xs">
                <Coffee className="w-4 h-4 text-rose-500" />
                <span>Artisanal Espresso Bar</span>
              </div>
              <div className="flex items-center justify-center space-x-2 px-3 py-2.5 rounded-xl bg-white border border-slate-200/90 shadow-xs">
                <ShieldCheck className="w-4 h-4 text-purple-600" />
                <span>GST Tax Invoicing</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Counter Section */}
      <section className="py-12 bg-white border-y border-slate-200/90">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div className="space-y-1">
              <div className="text-3xl sm:text-4xl font-extrabold text-indigo-600">150+</div>
              <div className="text-xs text-slate-500 uppercase tracking-wider font-bold">Available Desks</div>
            </div>
            <div className="space-y-1">
              <div className="text-3xl sm:text-4xl font-extrabold text-indigo-600">12+</div>
              <div className="text-xs text-slate-500 uppercase tracking-wider font-bold">Meeting Rooms</div>
            </div>
            <div className="space-y-1">
              <div className="text-3xl sm:text-4xl font-extrabold text-indigo-600">500+</div>
              <div className="text-xs text-slate-500 uppercase tracking-wider font-bold">Active Members</div>
            </div>
            <div className="space-y-1">
              <div className="text-3xl sm:text-4xl font-extrabold text-indigo-600">99.9%</div>
              <div className="text-xs text-slate-500 uppercase tracking-wider font-bold">Uptime & Satisfaction</div>
            </div>
          </div>
        </div>
      </section>

      {/* Workspace Services Bento Grid */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14 space-y-2">
          <h2 className="text-xs font-bold uppercase tracking-widest text-indigo-600">Tailored Workspaces</h2>
          <p className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
            Designed for Modern Professionals & Teams
          </p>
          <p className="text-xs sm:text-sm text-slate-500">
            Choose from flexible lounge seats to fully private executive office suites.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1 */}
          <div className="bg-white p-6 rounded-2xl space-y-4 border border-slate-200/90 shadow-xs hover:shadow-md hover:border-indigo-300 transition-all duration-300 group">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
              <Laptop className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Hot Desk Flex</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Flexible seating in our high-energy open lounge. Grab any available desk and start working instantly.
            </p>
            <div className="pt-2 text-xs font-bold text-indigo-600 flex items-center space-x-1 group-hover:translate-x-1 transition-transform">
              <span>From ₹499 / day</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Card 2 */}
          <div className="bg-white p-6 rounded-2xl space-y-4 border-2 border-indigo-500/80 shadow-md transition-all duration-300 group relative">
            <span className="absolute -top-3 right-4 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-xs">
              Most Popular
            </span>
            <div className="w-12 h-12 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 group-hover:scale-110 transition-transform">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Dedicated Pro Desk</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Your permanent reserved desk with lockable cabinet, dual-monitor setup, and 24/7 keycard access.
            </p>
            <div className="pt-2 text-xs font-bold text-purple-600 flex items-center space-x-1 group-hover:translate-x-1 transition-transform">
              <span>From ₹8,999 / month</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Card 3 */}
          <div className="bg-white p-6 rounded-2xl space-y-4 border border-slate-200/90 shadow-xs hover:shadow-md hover:border-indigo-300 transition-all duration-300 group">
            <div className="w-12 h-12 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 group-hover:scale-110 transition-transform">
              <Building2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Private Office Suites</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Soundproof private cabins for growing teams of 2 to 20. Fully furnished with executive desks & branding.
            </p>
            <div className="pt-2 text-xs font-bold text-rose-600 flex items-center space-x-1 group-hover:translate-x-1 transition-transform">
              <span>Custom Suite Rates</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Card 4 */}
          <div className="bg-white p-6 rounded-2xl space-y-4 border border-slate-200/90 shadow-xs hover:shadow-md hover:border-indigo-300 transition-all duration-300 group">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
              <MailCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Virtual Office Address</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Prime business address, official mail receipt, phone answering, and GST compliance registration.
            </p>
            <div className="pt-2 text-xs font-bold text-indigo-600 flex items-center space-x-1 group-hover:translate-x-1 transition-transform">
              <span>From ₹1,999 / month</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Floor Map Callout Section */}
      <section className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="bg-white rounded-3xl p-8 sm:p-12 relative overflow-hidden border border-slate-200/90 shadow-sm">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center relative z-10">
            <div className="space-y-5">
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-purple-50 text-purple-700 text-xs font-bold border border-purple-200">
                <Compass className="w-3.5 h-3.5 text-purple-600" />
                <span>Live 2D Interactive Desk Picker</span>
              </div>
              <h3 className="text-3xl sm:text-4xl font-extrabold text-slate-900 leading-tight">
                Pick Your Exact Seat Before You Arrive
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Experience our real-time interactive floor map. View current desk occupation status (🟢 Available, 🔴 Occupied, 🟡 Reserved), check window views, inspect power outlets, and reserve instantly.
              </p>
              <div className="pt-2">
                <Link
                  href="/floor-map"
                  className="px-6 py-3 text-xs font-bold rounded-full text-white bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 hover:opacity-95 transition-all shadow-md inline-flex items-center space-x-2"
                >
                  <span>Launch Floor Map</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* Mock Map Card */}
            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <span className="text-xs font-bold text-slate-900">Ground Floor Innovation Map</span>
                <div className="flex items-center space-x-3 text-[10px] font-semibold">
                  <span className="flex items-center space-x-1 text-emerald-700"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Available</span>
                  <span className="flex items-center space-x-1 text-rose-700"><span className="w-2 h-2 rounded-full bg-rose-500" /> Occupied</span>
                  <span className="flex items-center space-x-1 text-amber-700"><span className="w-2 h-2 rounded-full bg-amber-500" /> Reserved</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 pt-1">
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-center space-y-1">
                  <span className="text-xs font-bold text-emerald-800">Desk A-101</span>
                  <span className="block text-[10px] font-semibold text-emerald-600">Available</span>
                </div>
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-center space-y-1">
                  <span className="text-xs font-bold text-rose-800">Desk A-102</span>
                  <span className="block text-[10px] font-semibold text-rose-600">Occupied</span>
                </div>
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-center space-y-1">
                  <span className="text-xs font-bold text-amber-800">Cabin C-301</span>
                  <span className="block text-[10px] font-semibold text-amber-600">Reserved</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-10">
        <div className="space-y-2">
          <h2 className="text-xs font-bold uppercase tracking-widest text-indigo-600">Member Testimonials</h2>
          <p className="text-3xl font-extrabold text-slate-900">Loved by Founders & Digital Nomads</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          <div className="bg-white p-6 rounded-2xl space-y-3 border border-slate-200/90 shadow-xs">
            <div className="flex items-center space-x-1 text-amber-400">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-amber-400" />
              ))}
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              "The instant meeting room booking and 1 Gbps fiber Wi-Fi has transformed how our remote engineering team conducts sprint reviews."
            </p>
            <div className="pt-2">
              <p className="text-xs font-bold text-slate-900">Sarah Jenkins</p>
              <p className="text-[10px] text-slate-400">CTO, CloudScale Tech</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl space-y-3 border border-slate-200/90 shadow-xs">
            <div className="flex items-center space-x-1 text-amber-400">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-amber-400" />
              ))}
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              "Cowork30’s interactive floor map allowed me to lock in my favorite window desk before flying into town. The GST invoices are completely automated."
            </p>
            <div className="pt-2">
              <p className="text-xs font-bold text-slate-900">Marcus Vance</p>
              <p className="text-[10px] text-slate-400">Founder, Nomad Design</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl space-y-3 border border-slate-200/90 shadow-xs">
            <div className="flex items-center space-x-1 text-amber-400">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-amber-400" />
              ))}
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              "The community atmosphere and executive private cabins are top tier. Best coworking experience in the region."
            </p>
            <div className="pt-2">
              <p className="text-xs font-bold text-slate-900">Elena Rostova</p>
              <p className="text-[10px] text-slate-400">Managing Partner, Rostova Legal</p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
