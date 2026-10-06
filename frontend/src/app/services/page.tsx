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
  Landmark,
  Compass,
  ShieldCheck,
  Briefcase,
  Laptop,
  Globe,
  Coffee,
  Users,
  Wifi,
  Video,
  Calendar,
  Layers,
  Info,
} from 'lucide-react';
import { apiClient, getMediaUrl } from '@/lib/api-client';
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
  pricingUnit?: string;
  requiresSeats?: 'required' | 'optional' | 'none';
  requiresDate?: 'required' | 'flexible' | 'none';
}

const ICON_MAP: Record<string, React.ElementType> = {
  Sparkles,
  Armchair,
  Building2,
  MailCheck,
  Landmark,
  Compass,
  ShieldCheck,
  Briefcase,
  Laptop,
  Globe,
  Coffee,
  Users,
  Wifi,
};

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
    pricingUnit: 'month',
    requiresSeats: 'required',
    requiresDate: 'required',
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
    pricingUnit: 'month',
    requiresSeats: 'required',
    requiresDate: 'required',
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
    pricingUnit: 'month',
    requiresSeats: 'required',
    requiresDate: 'required',
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
    pricingUnit: 'month',
    requiresSeats: 'none',
    requiresDate: 'flexible',
  },
  'loan-syndicate': {
    category: 'Debt & Financing',
    badge: 'Fast Approval',
    badgeBg: 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white',
    icon: Landmark,
    defaultImage: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=800&q=80',
    perks: [
      'Working capital & term loans',
      'Multi-bank syndicate liaisons',
      'Complete DPR & financial modeling',
      'Fast-track institutional sanctions',
    ],
    startingPrice: 0,
    pricingUnit: 'quote',
    requiresSeats: 'optional',
    requiresDate: 'flexible',
  },
  'land-promoters': {
    category: 'Real Estate & Land',
    badge: 'Verified Clearances',
    badgeBg: 'bg-gradient-to-r from-amber-600 to-yellow-600 text-white',
    icon: Compass,
    defaultImage: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80',
    perks: [
      'Title due diligence & legal vetting',
      'DTCP / CMDA approved layouts',
      'Commercial & warehouse acquisitions',
      'Joint-venture developer structuring',
    ],
    startingPrice: 2500,
    pricingUnit: 'consultation',
    requiresSeats: 'none',
    requiresDate: 'flexible',
  },
  'tax-experts': {
    category: 'Tax, CA & Audit',
    badge: 'Certified CA',
    badgeBg: 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white',
    icon: ShieldCheck,
    defaultImage: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=800&q=80',
    perks: [
      'Company & LLP incorporation',
      'Monthly GST & TDS compliance returns',
      'Statutory & internal CA audits',
      'Startup India 80IAC tax exemption',
    ],
    startingPrice: 1999,
    pricingUnit: 'consultation',
    requiresSeats: 'optional',
    requiresDate: 'flexible',
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
  if (name.includes('loan') || name.includes('finance') || name.includes('syndicate')) return SERVICE_CATALOG_CONFIG['loan-syndicate'];
  if (name.includes('land') || name.includes('real estate') || name.includes('promoter')) return SERVICE_CATALOG_CONFIG['land-promoters'];
  if (name.includes('tax') || name.includes('ca') || name.includes('audit')) return SERVICE_CATALOG_CONFIG['tax-experts'];

  const isProf = service.category === 'professional';
  const ResolvedIcon = (service.iconClass && ICON_MAP[service.iconClass]) || (isProf ? Briefcase : Building2);

  return {
    category: isProf ? 'Advisory Service' : 'Workspace Solution',
    badge: isProf ? 'Expert Advisory' : 'Flexible Terms',
    badgeBg: isProf ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white' : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white',
    icon: ResolvedIcon,
    defaultImage: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80',
    perks: [
      'Direct partner consultation & advisory',
      'Customized execution plan',
      'Clear documentation & legal compliance',
      'Access to center amenities on appointment',
    ],
    startingPrice: Number(service.startingPrice || 0),
    pricingUnit: service.pricingUnit || (isProf ? 'consultation' : 'month'),
    requiresSeats: service.requiresSeats || (isProf ? 'optional' : 'required'),
    requiresDate: service.requiresDate || (isProf ? 'flexible' : 'required'),
  };
}

const fallbackProfessionalServices = [
  {
    id: 101,
    slug: 'loan-syndicate',
    name: 'Loan Syndication & Corporate Debt Financing',
    category: 'professional',
    shortDescription: 'Customized business term loans, working capital limits, DPR financial modeling, and multi-bank institutional liaisons.',
    startingPrice: 0,
    pricingUnit: 'quote',
    requiresSeats: 'optional',
    requiresDate: 'flexible',
    featuredImage: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 102,
    slug: 'land-promoters',
    name: 'Real Estate & Land Promoter Liaisons',
    category: 'professional',
    shortDescription: 'Title due diligence, DTCP/CMDA layout approvals, commercial acquisitions, and joint-venture developer structuring.',
    startingPrice: 2500,
    pricingUnit: 'consultation',
    requiresSeats: 'none',
    requiresDate: 'flexible',
    featuredImage: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 103,
    slug: 'tax-experts',
    name: 'CA Tax Compliance, GST & Statutory Audit',
    category: 'professional',
    shortDescription: 'Company incorporation, monthly GST & TDS return filings, statutory CA audits, and Startup India tax exemptions.',
    startingPrice: 1999,
    pricingUnit: 'consultation',
    requiresSeats: 'optional',
    requiresDate: 'flexible',
    featuredImage: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=800&q=80',
  },
];

export default function CustomerServicesPage() {
  const { user } = useAuth();
  const { activeBranch } = useBranch();
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'loan' | 'land' | 'tax'>('all');

  // Modal State
  const [selectedService, setSelectedService] = useState<any>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<string>('');
  const [showModal, setShowModal] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    companyName: '',
    isSeatNeeded: false,
    seatsCount: 0,
    isDateFlexible: true,
    preferredDate: new Date().toISOString().split('T')[0],
    consultationType: 'in_person',
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
        const fetched = Array.isArray(res.data) ? res.data : [];
        const profOnly = fetched.filter((s: any) => s.category === 'professional');
        setServices(profOnly.length > 0 ? profOnly : fallbackProfessionalServices);
      } catch (err) {
        console.error('Failed to load professional services', err);
        setServices(fallbackProfessionalServices);
      } finally {
        setLoading(false);
      }
    }
    loadServices();
  }, [activeBranch]);

  const openReservationModal = (service: any) => {
    const config = getServiceConfig(service, 0);
    const reqSeats = service.requiresSeats || config.requiresSeats || 'optional';
    const reqDate = service.requiresDate || config.requiresDate || 'flexible';

    setSelectedService(service);
    setSelectedPhoto(service.featuredImage || service.imageUrl || config.defaultImage);
    setSubmittedRef(null);
    setFormData({
      customerName: user?.name || '',
      customerEmail: user?.email || '',
      customerPhone: user?.phone || '',
      companyName: user?.companyName || '',
      isSeatNeeded: false,
      seatsCount: 0,
      isDateFlexible: reqDate === 'flexible',
      preferredDate: new Date().toISOString().split('T')[0],
      consultationType: 'in_person',
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
        serviceId: selectedService?.id,
        serviceName: selectedService?.name,
        userId: user?.id,
      });
      if (res.data?.booking?.bookingCode) {
        setSubmittedRef(res.data.booking.bookingCode);
      }
    } catch (err) {
      alert('Failed to submit advisory inquiry');
    } finally {
      setSubmitting(false);
    }
  };

  // Filtered Professional Services List
  const filteredServices = services.filter((s) => {
    if (activeTab === 'all') return true;
    const slug = (s.slug || s.name || '').toLowerCase();
    if (activeTab === 'loan') return slug.includes('loan') || slug.includes('finance') || slug.includes('syndicate');
    if (activeTab === 'land') return slug.includes('land') || slug.includes('promoter') || slug.includes('real');
    if (activeTab === 'tax') return slug.includes('tax') || slug.includes('ca') || slug.includes('audit');
    return true;
  });

  return (
    <div className="min-h-screen bg-[#FAFAFC] text-slate-900 flex flex-col font-sans selection:bg-indigo-600 selection:text-white">
      <Navbar />

      <main className="pt-6 sm:pt-8 pb-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex-grow space-y-8 sm:space-y-10">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-xs font-bold text-blue-700 shadow-xs">
            <Briefcase className="w-3.5 h-3.5" />
            <span>Professional & Advisory Hub</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
            Professional &amp; Advisory Services
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-2xl mx-auto">
            Corporate debt financing &amp; loan syndication, land promoter liaisons, certified CA tax compliance, GST returns, and corporate legal advisory.
          </p>
        </div>

        {/* Category Filter Tabs */}
        <div className="flex items-center justify-center">
          <div className="inline-flex p-1.5 rounded-2xl bg-white border border-slate-200 shadow-xs gap-1">
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'all'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              All Professional Services ({services.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('loan')}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'loan'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Landmark className="w-3.5 h-3.5" />
              <span>Debt &amp; Financing</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('land')}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'land'
                  ? 'bg-gradient-to-r from-amber-600 to-yellow-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Land &amp; Real Estate</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('tax')}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'tax'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>CA Tax &amp; Audit</span>
            </button>
          </div>
        </div>

        {/* Services Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white rounded-3xl border border-slate-200 shadow-xs h-[460px] animate-pulse" />
            ))}
          </div>
        ) : filteredServices.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-md mx-auto space-y-3">
            <Info className="w-8 h-8 text-slate-400 mx-auto" />
            <h3 className="text-base font-bold text-slate-800">No Services Found</h3>
            <p className="text-xs text-slate-500">There are no services in this category currently available for the selected center.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredServices.map((service, idx) => {
              const config = getServiceConfig(service, idx);
              const IconComp = (service.iconClass && ICON_MAP[service.iconClass]) || config.icon;
              const isLocalBroken =
                !service.featuredImage ||
                service.featuredImage.startsWith('/images/') ||
                service.featuredImage.includes('img-1787582127214');
              const displayImage = isLocalBroken ? config.defaultImage : service.featuredImage;
              const price = Number(service.startingPrice || config.startingPrice);
              const pricingUnit = service.pricingUnit || config.pricingUnit || 'month';
              const isProfessional = service.category === 'professional';

              return (
                <div
                  key={service.id || idx}
                  className="group relative flex flex-col justify-between rounded-3xl bg-white border border-slate-200/90 shadow-xs hover:shadow-xl hover:border-purple-200 transition-all duration-300 overflow-hidden hover:-translate-y-1.5"
                >
                  <div>
                    {/* Image Header with Ambient Gradient & Badges */}
                    <div className="relative h-48 sm:h-52 w-full overflow-hidden bg-slate-100">
                      <img
                        src={getMediaUrl(displayImage)}
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
                        {pricingUnit === 'quote' || price === 0 ? (
                          <div className="inline-flex items-center px-3 py-1 rounded-xl bg-slate-900/85 backdrop-blur-md border border-white/10 text-white shadow-lg">
                            <span className="text-xs sm:text-sm font-extrabold text-amber-300 tracking-tight">
                              Custom Quote
                            </span>
                          </div>
                        ) : (
                          <div className="inline-flex items-baseline gap-1 px-3 py-1 rounded-xl bg-slate-900/85 backdrop-blur-md border border-white/10 text-white shadow-lg">
                            {pricingUnit === 'consultation' ? null : (
                              <span className="text-[10px] font-semibold text-slate-300 uppercase tracking-wide">Starting</span>
                            )}
                            <span className="text-sm sm:text-base font-extrabold text-white tracking-tight">
                              ₹{price.toLocaleString('en-IN')}
                            </span>
                            <span className="text-[10px] font-medium text-slate-400">
                              /{pricingUnit === 'day' ? 'day' : pricingUnit === 'consultation' ? 'consultation' : 'mo'}
                            </span>
                          </div>
                        )}

                        <span className="text-[10px] font-semibold text-white/90 bg-white/15 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/20">
                          {isProfessional ? 'Advisory Hub' : 'Flexible Terms'}
                        </span>
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className="p-5 sm:p-6 space-y-4">
                      <div>
                        <h3 className="text-base sm:text-lg font-extrabold text-slate-900 group-hover:text-purple-600 transition-colors tracking-tight leading-snug">
                          {service.name}
                        </h3>
                        <p className="text-xs text-slate-500 leading-relaxed mt-1.5 font-normal">
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
                              <span className="text-xs text-slate-600 leading-normal">{perk}</span>
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
                        className={`w-full py-2.5 px-4 rounded-xl text-white text-xs font-bold shadow-md transition-all flex items-center justify-center space-x-2 cursor-pointer group/btn ${
                          isProfessional
                            ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 shadow-blue-500/20 hover:shadow-indigo-500/30'
                            : 'bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 hover:from-purple-700 hover:via-pink-700 hover:to-rose-700 shadow-purple-500/20 hover:shadow-pink-500/30'
                        }`}
                      >
                        <span>{isProfessional ? 'Book Consultation & Advisory' : 'Reserve Solution'}</span>
                        <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-1 transition-transform" />
                      </button>
                      <p className="text-[10px] text-center text-slate-400 mt-2">
                        {isProfessional ? 'Direct specialist connect • NDA protected' : 'Instant inquiry • Zero brokerage'}
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
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-900 text-sm font-bold p-1 rounded-full bg-slate-100 hover:bg-slate-200 cursor-pointer"
            >
              ✕
            </button>

            <div className="space-y-1">
              <span className={`text-[10px] font-bold uppercase tracking-wider ${
                selectedService.category === 'professional' ? 'text-blue-600' : 'text-indigo-600'
              }`}>
                {selectedService.category === 'professional' ? 'Professional Service Advisory' : 'Workspace Solution Reservation'}
              </span>
              <h3 className="text-xl font-extrabold text-slate-900">{selectedService.name}</h3>
            </div>

            {/* Interactive Photo Gallery Viewer */}
            <div className="space-y-2">
              <div className="h-40 w-full rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
                <img
                  src={getMediaUrl(selectedPhoto || selectedService.featuredImage)}
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
                    <img src={getMediaUrl(selectedService.featuredImage)} alt="Cover" className="w-full h-full object-cover" />
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
                      <img src={getMediaUrl(photoUrl)} alt={`Gallery ${idx + 1}`} className="w-full h-full object-cover" />
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
                <h4 className="text-base font-bold text-slate-900">Inquiry Submitted Successfully!</h4>
                <p className="text-xs text-slate-600">
                  Reference Code: <strong className="text-emerald-700 font-mono">{submittedRef}</strong>
                </p>
                <p className="text-[11px] text-slate-500">
                  Our specialist lead will review your requirements and contact you promptly.
                </p>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-6 py-2 rounded-full bg-slate-900 text-xs text-white font-bold cursor-pointer hover:bg-slate-800"
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
                      placeholder="+91 9820431183"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:border-indigo-600 focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Company / Organization</label>
                  <input
                    type="text"
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    placeholder="Acme Enterprises Pvt Ltd"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:border-indigo-600 focus:bg-white focus:outline-none"
                  />
                </div>

                {/* Consultation Type (For Professional Services) */}
                {selectedService.category === 'professional' && (
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1.5">Consultation Preference</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, consultationType: 'in_person' })}
                        className={`flex items-center justify-center space-x-1.5 py-2 px-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                          formData.consultationType === 'in_person'
                            ? 'bg-blue-50 border-blue-600 text-blue-700 shadow-xs'
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <Building2 className="w-3.5 h-3.5" />
                        <span>Center In-Person</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, consultationType: 'virtual' })}
                        className={`flex items-center justify-center space-x-1.5 py-2 px-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                          formData.consultationType === 'virtual'
                            ? 'bg-blue-50 border-blue-600 text-blue-700 shadow-xs'
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <Video className="w-3.5 h-3.5" />
                        <span>Online Video Call</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Dynamic Seat Requirement Section */}
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                  {selectedService.requiresSeats === 'none' ? (
                    <div className="flex items-center space-x-2 text-slate-600">
                      <Info className="w-4 h-4 text-indigo-500 shrink-0" />
                      <span className="text-[11px]">
                        <strong>No Physical Seats Required:</strong> This service is delivered as direct advisory or corporate documentation.
                      </span>
                    </div>
                  ) : selectedService.requiresSeats === 'optional' ? (
                    <div className="space-y-2">
                      <label className="block text-slate-800 font-bold text-xs">
                        Do you also need workspace seating at Cowork30?
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, isSeatNeeded: false, seatsCount: 0 })}
                          className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all text-center cursor-pointer ${
                            !formData.isSeatNeeded
                              ? 'bg-white border-indigo-600 text-indigo-700 ring-2 ring-indigo-500/20 shadow-xs'
                              : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-white'
                          }`}
                        >
                          Advisory Only (No Desks)
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, isSeatNeeded: true, seatsCount: Math.max(1, formData.seatsCount) })}
                          className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all text-center cursor-pointer ${
                            formData.isSeatNeeded
                              ? 'bg-white border-indigo-600 text-indigo-700 ring-2 ring-indigo-500/20 shadow-xs'
                              : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-white'
                          }`}
                        >
                          Include Desks / Cabins
                        </button>
                      </div>

                      {formData.isSeatNeeded && (
                        <div className="pt-2">
                          <label className="block text-slate-700 font-semibold mb-1">Seats Needed</label>
                          <input
                            type="number"
                            min={1}
                            max={50}
                            value={formData.seatsCount}
                            onChange={(e) => setFormData({ ...formData, seatsCount: Number(e.target.value) })}
                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-slate-900 focus:border-indigo-600 focus:outline-none"
                          />
                        </div>
                      )}
                    </div>
                  ) : (
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">Seats Needed *</label>
                      <input
                        type="number"
                        required
                        min={1}
                        max={100}
                        value={formData.seatsCount}
                        onChange={(e) => setFormData({ ...formData, seatsCount: Number(e.target.value), isSeatNeeded: true })}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:border-indigo-600 focus:outline-none"
                      />
                    </div>
                  )}
                </div>

                {/* Preferred Date & Flexible Toggle */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-slate-700 font-semibold">
                      {selectedService.category === 'professional' ? 'Preferred Consultation Date' : 'Preferred Move-In / Start Date'}
                    </label>
                    <label className="inline-flex items-center space-x-1.5 text-[11px] text-indigo-600 font-semibold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.isDateFlexible}
                        onChange={(e) => setFormData({ ...formData, isDateFlexible: e.target.checked })}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span>Flexible / Earliest Available</span>
                    </label>
                  </div>

                  {!formData.isDateFlexible ? (
                    <input
                      type="date"
                      required
                      value={formData.preferredDate}
                      onChange={(e) => setFormData({ ...formData, preferredDate: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:border-indigo-600 focus:bg-white focus:outline-none"
                    />
                  ) : (
                    <div className="py-2 px-3 rounded-xl bg-indigo-50/60 border border-indigo-200 text-indigo-700 text-[11px] flex items-center space-x-2">
                      <Calendar className="w-3.5 h-3.5 shrink-0" />
                      <span>No fixed date required — Our team will schedule at your earliest convenience.</span>
                    </div>
                  )}
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    {selectedService.category === 'professional' ? 'Project / Service Details' : 'Notes / Special Requests'}
                  </label>
                  <textarea
                    rows={2}
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder={
                      selectedService.slug === 'loan-syndicate'
                        ? 'e.g., Working capital funding requirement, target loan amount...'
                        : selectedService.slug === 'tax-experts'
                        ? 'e.g., Quarterly GST filing, company incorporation, trademark...'
                        : selectedService.slug === 'land-promoters'
                        ? 'e.g., Commercial plot requirements, preferred square footage...'
                        : 'Any specific questions or custom requirements...'
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:border-indigo-600 focus:bg-white focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className={`w-full py-3.5 rounded-full text-xs font-bold text-white shadow-md flex items-center justify-center space-x-2 cursor-pointer transition-opacity ${
                    selectedService.category === 'professional'
                      ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:opacity-95'
                      : 'bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 hover:opacity-95'
                  }`}
                >
                  <Send className="w-4 h-4" />
                  <span>
                    {submitting
                      ? 'Submitting...'
                      : selectedService.category === 'professional'
                      ? 'Submit Advisory Inquiry'
                      : 'Submit Solution Reservation'}
                  </span>
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
