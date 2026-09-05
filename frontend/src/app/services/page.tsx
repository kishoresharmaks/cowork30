'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import {
  Building2,
  CheckCircle2,
  ArrowRight,
  Send,
  Sparkles,
  Armchair,
  MailCheck,
  Check,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { useAuth } from '@/context/AuthContext';
import { useBranch } from '@/context/BranchContext';

interface ServiceConfig {
  category: string;
  badge: string;
  badgeBg: string;
  icon: React.ElementType;
  defaultImage: string;
  perks: string[];
  startingPrice: number;
}

const SERVICE_CATALOG_CONFIG: Record<string, ServiceConfig> = {
  'hot-desk': {
    category: 'Flexible Seating',
    badge: 'Most Popular',
    badgeBg: 'bg-gradient-to-r from-pink-500 to-rose-500 text-white',
    icon: Sparkles,
    defaultImage: 'https://images.unsplash.com/photo-1527192491265-7e15c55b1ed2?auto=format&fit=crop&w=800&q=80',
    perks: [
      'Open ergonomic lounge seating',
      'Ultra-fast 1 Gbps fiber Wi-Fi',
      'Unlimited specialty coffee & tea',
      'Community mixers & weekly events',
    ],
    startingPrice: 4999,
  },
  'dedicated-desk': {
    category: 'Permanent Desk',
    badge: '24/7 Access',
    badgeBg: 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white',
    icon: Armchair,
    defaultImage: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=800&q=80',
    perks: [
      'Personal lockable storage cabinet',
      'Ergonomic Herman Miller setup',
      '24/7 biometric keycard access',
      '4h free monthly meeting credits',
    ],
    startingPrice: 7999,
  },
  'private-cabin': {
    category: 'Private Office',
    badge: 'Executive Suite',
    badgeBg: 'bg-gradient-to-r from-amber-500 to-orange-500 text-white',
    icon: Building2,
    defaultImage: 'https://images.unsplash.com/photo-1497215842964-222b430dc094?auto=format&fit=crop&w=800&q=80',
    perks: [
      'Acoustic soundproof glass cabins',
      'Custom company branding plaque',
      'Biometric keycard security',
      'Dedicated conference room hours',
    ],
    startingPrice: 14999,
  },
  'virtual-office': {
    category: 'Corporate Presence',
    badge: 'Instant Setup',
    badgeBg: 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white',
    icon: MailCheck,
    defaultImage: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80',
    perks: [
      'Prestigious prime business address',
      'Official GST & MCA registration',
      'Daily mail receipt & digital scans',
      'On-demand boardroom credits',
    ],
    startingPrice: 1999,
  },
};

function getServiceConfig(service: any, idx: number): ServiceConfig {
  const slug = (service?.slug || '').toLowerCase();
  if (SERVICE_CATALOG_CONFIG[slug]) return SERVICE_CATALOG_CONFIG[slug];

  const name = (service?.name || '').toLowerCase();
  if (name.includes('hot') || name.includes('flex')) return SERVICE_CATALOG_CONFIG['hot-desk'];
  if (name.includes('dedicat')) return SERVICE_CATALOG_CONFIG['dedicated-desk'];
  if (name.includes('cabin') || name.includes('private') || name.includes('suite')) return SERVICE_CATALOG_CONFIG['private-cabin'];
  if (name.includes('virtual') || name.includes('gst')) return SERVICE_CATALOG_CONFIG['virtual-office'];

  const keys = Object.keys(SERVICE_CATALOG_CONFIG);
  return SERVICE_CATALOG_CONFIG[keys[idx % keys.length]];
}

export default function CustomerServicesPage() {
  const { user } = useAuth();
  const { activeBranch } = useBranch();
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [selectedService, setSelectedService] = useState<any>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<string>('');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    companyName: '',
    seatsCount: 2,
    preferredDate: new Date().toISOString().split('T')[0],
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [submittedRef, setSubmittedRef] = useState<string | null>(null);

  useEffect(() => {
    async function loadServices() {
      try {
        setLoading(true);
        const url = activeBranch ? `/services?branchId=${activeBranch.id}` : '/services';
        const res = await apiClient.get(url);
        setServices(res.data || []);
      } catch (err) {
        console.error('Failed to load services', err);
      } finally {
        setLoading(false);
      }
    }
    loadServices();
  }, [activeBranch]);

  const openReservationModal = (service: any) => {
    setSelectedService(service);
    setSelectedPhoto(service.featuredImage || service.imageUrl);
    setSubmittedRef(null);
    setFormData({
      customerName: user?.name || '',
      customerEmail: user?.email || '',
      customerPhone: user?.phone || '',
      companyName: user?.companyName || '',
      seatsCount: 2,
      preferredDate: new Date().toISOString().split('T')[0],
      notes: '',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await apiClient.post('/services/inquiry', {
        ...formData,
        userId: user?.id,
        serviceName: selectedService?.name,
      });
      if (res.data?.booking?.bookingCode) {
        setSubmittedRef(res.data.booking.bookingCode);
      }
    } catch (err) {
      alert('Failed to submit workspace solution reservation');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFC] text-slate-900 flex flex-col font-sans selection:bg-indigo-600 selection:text-white">
      <Navbar />

      <main className="pt-6 sm:pt-8 pb-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex-grow space-y-10 sm:space-y-12">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white border border-slate-200 text-xs font-bold text-indigo-600 shadow-xs">
            <Building2 className="w-3.5 h-3.5" />
            <span>Flexible Workspace Solutions</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900">
            Tailored Workspace Offerings
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            From flexible day passes to enterprise private office suites, discover workspace solutions built for speed, privacy, and team collaboration.
          </p>
        </div>

        {/* Services Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white rounded-3xl border border-slate-200 shadow-xs h-[460px] animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {services.map((service, idx) => {
              const config = getServiceConfig(service, idx);
              const IconComp = config.icon;
              const isLocalBroken =
                !service.featuredImage ||
                service.featuredImage.startsWith('/images/') ||
                service.featuredImage.includes('img-1787582127214');
              const displayImage = isLocalBroken ? config.defaultImage : service.featuredImage;
              const price = Number(service.startingPrice || config.startingPrice);

              return (
                <div
                  key={service.id || idx}
                  className="group relative flex flex-col justify-between rounded-3xl bg-white border border-slate-200/90 shadow-xs hover:shadow-xl hover:border-purple-200 transition-all duration-300 overflow-hidden hover:-translate-y-1.5"
                >
                  <div>
                    {/* Image Header with Ambient Gradient & Badges */}
                    <div className="relative h-48 sm:h-52 w-full overflow-hidden bg-slate-100">
                      <img
                        src={displayImage}
                        alt={service.name}
                        className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-700 ease-out"
                        onError={(e) => {
                          const target = e.currentTarget;
                          if (target.src !== config.defaultImage) {
                            target.src = config.defaultImage;
                          }
                        }}
                      />

                      {/* Ambient gradient overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/25 to-transparent pointer-events-none" />

                      {/* Top floating badges */}
                      <div className="absolute top-3 inset-x-3 flex items-center justify-between pointer-events-none">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/95 backdrop-blur-md text-slate-800 text-[11px] font-bold shadow-xs border border-white/60">
                          <IconComp className="w-3.5 h-3.5 text-purple-600" />
                          <span>{config.category}</span>
                        </span>

                        {config.badge && (
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider shadow-xs ${config.badgeBg}`}
                          >
                            {config.badge}
                          </span>
                        )}
                      </div>

                      {/* Bottom Floating Price Tag */}
                      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between pointer-events-none">
                        <div className="inline-flex items-baseline gap-1 px-3 py-1 rounded-xl bg-slate-900/85 backdrop-blur-md border border-white/10 text-white shadow-lg">
                          <span className="text-[10px] font-semibold text-slate-300 uppercase tracking-wide">Starting</span>
                          <span className="text-sm sm:text-base font-extrabold text-white tracking-tight">
                            ₹{price.toLocaleString('en-IN')}
                          </span>
                          <span className="text-[10px] font-medium text-slate-400">/mo</span>
                        </div>

                        <span className="text-[10px] font-semibold text-white/90 bg-white/15 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/20">
                          Flexible Terms
                        </span>
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className="p-5 sm:p-6 space-y-4">
                      <div>
                        <h3 className="text-base sm:text-lg font-extrabold text-slate-900 group-hover:text-purple-600 transition-colors tracking-tight line-clamp-1">
                          {service.name}
                        </h3>
                        <p className="text-xs text-slate-500 leading-relaxed line-clamp-2 mt-1 font-normal">
                          {service.shortDescription}
                        </p>
                      </div>

                      {/* Key Inclusions Checklist */}
                      <div className="pt-3 border-t border-slate-100">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2.5 flex items-center gap-1">
                          <span>Key Inclusions</span>
                        </p>
                        <ul className="space-y-2 text-xs">
                          {config.perks.map((perk, pIdx) => (
                            <li key={pIdx} className="flex items-start space-x-2 text-slate-600">
                              <div className="w-4 h-4 rounded-full bg-pink-50 text-pink-600 flex items-center justify-center shrink-0 mt-0.5">
                                <Check className="w-2.5 h-2.5 stroke-[3]" />
                              </div>
                              <span className="text-xs text-slate-600 leading-tight line-clamp-1">{perk}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Footer / CTA Action */}
                  <div className="p-5 sm:p-6 pt-0">
                    <div className="pt-3 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => openReservationModal(service)}
                        className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 hover:from-purple-700 hover:via-pink-700 hover:to-rose-700 text-white text-xs font-bold shadow-md shadow-purple-500/20 hover:shadow-lg hover:shadow-pink-500/30 transition-all flex items-center justify-center space-x-2 cursor-pointer group/btn"
                      >
                        <span>Reserve Solution</span>
                        <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-1 transition-transform" />
                      </button>
                      <p className="text-[10px] text-center text-slate-400 mt-2">
                        Instant inquiry • Zero brokerage
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Reservation & Multi-Photo Gallery Modal */}
      {showModal && selectedService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white p-6 sm:p-8 rounded-3xl max-w-lg w-full border border-slate-200 shadow-2xl space-y-5 relative max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-900 text-sm font-bold p-1 rounded-full bg-slate-100 hover:bg-slate-200"
            >
              ✕
            </button>

            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">
                Workspace Solution Reservation
              </span>
              <h3 className="text-xl font-extrabold text-slate-900">{selectedService.name}</h3>
            </div>

            {/* Interactive Photo Gallery Viewer */}
            <div className="space-y-2">
              <div className="h-44 w-full rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
                <img
                  src={selectedPhoto || selectedService.featuredImage}
                  alt={selectedService.name}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Gallery Thumbnails */}
              {Array.isArray(selectedService.galleryImages) && selectedService.galleryImages.length > 0 && (
                <div className="flex items-center space-x-2 overflow-x-auto pt-1 pb-2">
                  <button
                    type="button"
                    onClick={() => setSelectedPhoto(selectedService.featuredImage)}
                    className={`w-14 h-10 rounded-lg overflow-hidden border shrink-0 ${
                      selectedPhoto === selectedService.featuredImage ? 'border-indigo-600 ring-2 ring-indigo-500/40' : 'border-slate-200 opacity-70'
                    }`}
                  >
                    <img src={selectedService.featuredImage} alt="Cover" className="w-full h-full object-cover" />
                  </button>

                  {selectedService.galleryImages.map((photoUrl: string, idx: number) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedPhoto(photoUrl)}
                      className={`w-14 h-10 rounded-lg overflow-hidden border shrink-0 ${
                        selectedPhoto === photoUrl ? 'border-indigo-600 ring-2 ring-indigo-500/40' : 'border-slate-200 opacity-70'
                      }`}
                    >
                      <img src={photoUrl} alt={`Gallery ${idx + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {submittedRef ? (
              <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h4 className="text-base font-bold text-slate-900">Solution Inquiry Submitted!</h4>
                <p className="text-xs text-slate-600">
                  Reference Code: <strong className="text-emerald-700 font-mono">{submittedRef}</strong>
                </p>
                <p className="text-[11px] text-slate-500">
                  Our Community Lead will contact you shortly to confirm your setup and visit.
                </p>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-6 py-2 rounded-full bg-slate-900 text-xs text-white font-bold"
                >
                  Close Window
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.customerName}
                    onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                    placeholder="John Founder"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:border-indigo-600 focus:bg-white focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Email *</label>
                    <input
                      type="email"
                      required
                      value={formData.customerEmail}
                      onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                      placeholder="john@company.com"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:border-indigo-600 focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Phone *</label>
                    <input
                      type="text"
                      required
                      value={formData.customerPhone}
                      onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                      placeholder="+91 98765 43210"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:border-indigo-600 focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Company</label>
                    <input
                      type="text"
                      value={formData.companyName}
                      onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                      placeholder="Acme Tech"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:border-indigo-600 focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Seats Needed</label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={formData.seatsCount}
                      onChange={(e) => setFormData({ ...formData, seatsCount: Number(e.target.value) })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:border-indigo-600 focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Preferred Start / Move-In Date *
                  </label>
                  <span className="block text-[11px] text-slate-500 mb-1">
                    When would you like to move in or activate your workspace solution?
                  </span>
                  <input
                    type="date"
                    required
                    value={formData.preferredDate}
                    onChange={(e) => setFormData({ ...formData, preferredDate: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:border-indigo-600 focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Notes / Requirements</label>
                  <textarea
                    rows={2}
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Dual monitor setup, 24/7 access pass..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:border-indigo-600 focus:bg-white focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3.5 rounded-full text-xs font-bold text-white bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 hover:opacity-95 shadow-md flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>{submitting ? 'Submitting...' : 'Submit Solution Inquiry'}</span>
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
