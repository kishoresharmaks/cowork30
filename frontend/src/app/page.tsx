'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  ChevronLeft,
  Star,
  Shield,
  Mic,
  ListFilter,
  Users,
  X,
  Send,
  Settings,
  CreditCard,
  Check,
  Armchair,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { useAuth } from '@/context/AuthContext';

function WhatsAppIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
    </svg>
  );
}

const professionalSolutions = [
  {
    title: '24/7 Access & Security',
    icon: Shield,
    description: 'Enjoy round-the-clock access to your workspace, giving you complete flexibility to work on your schedule.',
    features: [
      'Biometric / keycard entry system',
      '24/7 on-site security personnel',
      'CCTV surveillance in all common areas',
    ],
    whatsappMsg: 'Hi Cowork30, I am interested in learning more about 24/7 Access & Security.',
  },
  {
    title: 'Podcast / Recording Studio',
    icon: Mic,
    description: 'Soundproof, professionally designed space for high-quality audio and video recording.',
    features: [
      'XLR microphones & mixer',
      'Soundproof walls',
      'Acoustic panels',
    ],
    whatsappMsg: 'Hi Cowork30, I am interested in learning more about the Podcast / Recording Studio.',
  },
  {
    title: 'Event Space',
    icon: Calendar,
    description: 'Spacious, customizable setups to suit everything from corporate sessions to creative events.',
    features: [
      'Built-in sound system',
      'Catering kitchen access',
      'Flexible layout (theatre / classroom / U-shape)',
    ],
    whatsappMsg: 'Hi Cowork30, I am interested in learning more about booking the Event Space.',
  },
  {
    title: 'Virtual Office',
    icon: Building2,
    description: 'Ideal for registering your business and enhancing credibility with a prime commercial address.',
    features: [
      'Prime location address',
      'Mail & parcel handling',
      'Call forwarding (optional) Occasional day pass to coworking',
    ],
    whatsappMsg: 'Hi Cowork30, I am interested in learning more about Virtual Office & GST registration.',
  },
];

const fallbackPlans = [
  {
    id: 1,
    name: 'Day Pass / Flex Desk',
    slug: 'flex-desk-pass',
    tagline: 'Ideal for freelancers and digital nomads needing on-demand desk access.',
    priceMonthly: 199,
    priceDaily: 25,
    meetingCreditsIncluded: 2,
    deskCreditsIncluded: 10,
    isPopular: false,
    badge: 'Flex Starter',
    features: [
      { id: 1, featureText: 'Access to open coworking lounge' },
      { id: 2, featureText: 'Ultra-fast Gigabit Wi-Fi' },
      { id: 3, featureText: 'Unlimited gourmet coffee & tea' },
      { id: 4, featureText: '2 Hours Meeting Room Credits / Month' },
      { id: 5, featureText: 'Dedicated Storage Cabinet' },
    ],
  },
  {
    id: 2,
    name: 'Dedicated Pro Member',
    slug: 'dedicated-pro',
    tagline: 'Designed for full-time professionals needing a permanent assigned seat.',
    priceMonthly: 449,
    priceDaily: 45,
    meetingCreditsIncluded: 8,
    deskCreditsIncluded: 30,
    isPopular: true,
    badge: 'Most Popular',
    features: [
      { id: 6, featureText: 'Assigned permanent ergonomic desk' },
      { id: 7, featureText: 'Personal lockable filing cabinet' },
      { id: 8, featureText: '24/7 Keycard Building Access' },
      { id: 9, featureText: '8 Hours Meeting Room Credits / Month' },
      { id: 10, featureText: 'Official Mail & Address Services' },
    ],
  },
  {
    id: 4,
    name: 'Private Executive Suite',
    slug: 'private-executive-suite',
    tagline: 'Private lockable office suite tailored for growing teams & startups.',
    priceMonthly: 899,
    priceDaily: 89,
    meetingCreditsIncluded: 20,
    deskCreditsIncluded: 60,
    isPopular: false,
    badge: 'Executive Team',
    features: [
      { id: 11, featureText: 'Fully furnished lockable private office' },
      { id: 12, featureText: '24/7 Biometric access & climate control' },
      { id: 13, featureText: '20 Hours Meeting Room Credits / Month' },
      { id: 14, featureText: 'Dedicated high-speed private VLAN' },
      { id: 15, featureText: 'Priority reception & mail forwarding' },
    ],
  },
  {
    id: 5,
    name: 'Virtual Office & GST Pro',
    slug: 'virtual-office-pro',
    tagline: 'Prime business address, mail handling, and official GST compliance.',
    priceMonthly: 99,
    priceDaily: 15,
    meetingCreditsIncluded: 4,
    deskCreditsIncluded: 4,
    isPopular: false,
    badge: 'Virtual Business',
    features: [
      { id: 16, featureText: 'Prestigious commercial business address' },
      { id: 17, featureText: 'Official GST registration & documentation' },
      { id: 18, featureText: 'Daily mail receipt & digital notification' },
      { id: 19, featureText: '4 Hours Meeting Room Credits / Month' },
      { id: 20, featureText: 'Access to community events & networking' },
    ],
  },
];

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

export default function HomePage() {
  const { user } = useAuth();
  const [homepageData, setHomepageData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Dynamic Workspace Solutions Catalog state
  const [services, setServices] = useState<any[]>([]);
  const [servicesLoading, setServicesLoading] = useState(true);

  // Dynamic Membership Pricing Plans state
  const [plans, setPlans] = useState<any[]>([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'daily'>('monthly');
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const sliderRef = useRef<HTMLDivElement>(null);

  // Modal State for Solution Reservation
  const [selectedService, setSelectedService] = useState<any>(null);
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

    async function fetchServices() {
      try {
        setServicesLoading(true);
        const res = await apiClient.get('/services');
        setServices(res.data || []);
      } catch (err) {
        console.error('Failed to load services on homepage:', err);
      } finally {
        setServicesLoading(false);
      }
    }
    fetchServices();

    async function fetchPlans() {
      try {
        setPlansLoading(true);
        const res = await apiClient.get('/pricing/plans');
        const activeList = Array.isArray(res.data)
          ? res.data.filter((p: any) => p.isActive)
          : [];
        setPlans(activeList);
      } catch (err) {
        console.error('Failed to load pricing plans on homepage:', err);
      } finally {
        setPlansLoading(false);
      }
    }
    fetchPlans();
  }, []);

  const displayedPlans = plans.length > 0 ? plans : fallbackPlans;

  const updateScrollButtons = () => {
    if (!sliderRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = sliderRef.current;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);

    const firstCard = sliderRef.current.querySelector('[data-plan-card]') as HTMLElement | null;
    const step = firstCard ? firstCard.offsetWidth + 24 : 360;
    const index = Math.round(scrollLeft / step);
    const maxIdx = displayedPlans.length - 1;
    setActiveSlideIndex(Math.max(0, Math.min(index, maxIdx)));
  };

  useEffect(() => {
    updateScrollButtons();
    const handleResize = () => updateScrollButtons();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [plans]);

  const scrollSlider = (direction: 'left' | 'right') => {
    if (!sliderRef.current) return;
    const firstCard = sliderRef.current.querySelector('[data-plan-card]') as HTMLElement | null;
    const step = firstCard ? firstCard.offsetWidth + 24 : 360;
    sliderRef.current.scrollBy({
      left: direction === 'left' ? -step : step,
      behavior: 'smooth',
    });
  };

  const scrollToSlide = (index: number) => {
    if (!sliderRef.current) return;
    const firstCard = sliderRef.current.querySelector('[data-plan-card]') as HTMLElement | null;
    const step = firstCard ? firstCard.offsetWidth + 24 : 360;
    sliderRef.current.scrollTo({
      left: index * step,
      behavior: 'smooth',
    });
  };

  const handleSliderScroll = () => {
    updateScrollButtons();
  };

  const openReservationModal = (service: any) => {
    setSelectedService(service);
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

  const handleServiceSubmit = async (e: React.FormEvent) => {
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

      {/* Hero Section */}
      <section className="relative pt-6 pb-16 md:pt-10 md:pb-28 overflow-hidden">
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

      {/* 1. Professional Workspace Solutions Section (Matching Reference 1) */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
          <div className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full bg-pink-50 text-pink-600 text-xs font-bold border border-pink-100 uppercase tracking-wider shadow-xs">
            <Settings className="w-3.5 h-3.5 text-pink-500" />
            <span>OUR SOLUTIONS</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
            Professional{' '}
            <span className="relative inline-block text-transparent bg-clip-text bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 pb-1">
              Workspace
              <span className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full" />
            </span>{' '}
            Solutions
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 max-w-2xl mx-auto leading-relaxed">
            Explore our range of premium services designed to boost your productivity and business growth.
          </p>
        </div>

        {/* 4 Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {professionalSolutions.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-lg hover:border-pink-200 transition-all duration-300 flex flex-col justify-between group"
              >
                <div>
                  {/* Magenta/Purple Icon Container */}
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-pink-600 to-purple-600 text-white flex items-center justify-center shadow-md shadow-pink-500/20 mb-4 group-hover:scale-110 transition-transform">
                    <Icon className="w-6 h-6" />
                  </div>

                  <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-2">{item.title}</h3>

                  <p className="text-xs text-slate-500 leading-relaxed mb-5">{item.description}</p>

                  <ul className="space-y-2.5 mb-6 text-xs text-slate-600">
                    {item.features.map((feat, fIdx) => (
                      <li key={fIdx} className="flex items-start space-x-2">
                        <CheckCircle2 className="w-4 h-4 text-pink-500 shrink-0 mt-0.5" />
                        <span className="leading-tight">{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <a
                  href={`https://wa.me/?text=${encodeURIComponent(item.whatsappMsg)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 hover:opacity-95 text-white text-xs font-bold shadow-md shadow-pink-500/20 transition-all flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <WhatsAppIcon className="w-3.5 h-3.5 fill-current" />
                  <span>Learn More →</span>
                </a>
              </div>
            );
          })}
        </div>

        {/* View All Services Outline Button */}
        <div className="pt-10 flex justify-center">
          <Link
            href="/services"
            className="px-6 py-2.5 rounded-xl border border-pink-500 hover:border-pink-600 bg-white hover:bg-pink-50/50 text-pink-600 text-xs font-bold transition-all shadow-xs inline-flex items-center space-x-2 cursor-pointer"
          >
            <ListFilter className="w-4 h-4" />
            <span>View All Services</span>
          </Link>
        </div>
      </section>

      {/* 2. Tailored Workspace Offerings Section (Matching Reference 2) */}
      <section className="py-20 bg-slate-50/60 border-y border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center max-w-3xl mx-auto mb-14 space-y-3">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white border border-slate-200 text-xs font-bold text-indigo-600 shadow-xs">
              <Building2 className="w-3.5 h-3.5" />
              <span>Flexible Workspace Solutions</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
              Tailored Workspace Offerings
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              From flexible day passes to enterprise private office suites, discover workspace solutions built for speed, privacy, and team collaboration.
            </p>
          </div>

          {/* Dynamic Services Cards */}
          {servicesLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-white rounded-3xl border border-slate-200 shadow-xs h-[460px] animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {(services.length > 0 ? services.slice(0, 8) : []).map((service, idx) => {
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
                          <p className="text-xs text-slate-500 leading-relaxed line-clamp-2 mt-1.5 font-normal">
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
        </div>
      </section>

      {/* 3. Flexible Membership Pricing Plans Slider / Carousel Section */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        {/* Header & Controls */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full bg-purple-50 text-purple-700 text-xs font-bold border border-purple-200 uppercase tracking-wider shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-purple-600" />
              <span>MEMBERSHIP TIERS</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
              Flexible{' '}
              <span className="relative inline-block text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 pb-1">
                Pricing Plans
                <span className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full" />
              </span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
              Choose the ideal coworking membership tier for you or your team. Scale freely between on-demand passes, dedicated desks, and private cabins with included meeting room credits and automated GST invoicing.
            </p>
          </div>

          {/* Controls: Billing Period Toggle & Prev/Next Arrow Buttons */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            {/* Billing Switcher */}
            <div className="flex items-center gap-1.5 bg-white p-1 rounded-full border border-slate-200 shadow-xs text-xs">
              <button
                type="button"
                onClick={() => setBillingPeriod('monthly')}
                className={`px-4 py-1.5 rounded-full font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  billingPeriod === 'monthly'
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>Monthly</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${
                    billingPeriod === 'monthly' ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-700'
                  }`}
                >
                  Save ~20%
                </span>
              </button>
              <button
                type="button"
                onClick={() => setBillingPeriod('daily')}
                className={`px-4 py-1.5 rounded-full font-bold transition-all cursor-pointer ${
                  billingPeriod === 'daily'
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Daily Pass
              </button>
            </div>

            {/* Slider Arrow Buttons (Desktop & Tablet) */}
            <div className="hidden sm:flex items-center gap-2">
              <button
                type="button"
                onClick={() => scrollSlider('left')}
                disabled={!canScrollLeft}
                aria-label="Previous plans"
                className="w-10 h-10 rounded-full bg-white border border-slate-200 hover:border-purple-300 hover:bg-purple-50 text-slate-700 disabled:opacity-40 disabled:hover:bg-white disabled:hover:border-slate-200 transition-all flex items-center justify-center shadow-xs cursor-pointer disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={() => scrollSlider('right')}
                disabled={!canScrollRight}
                aria-label="Next plans"
                className="w-10 h-10 rounded-full bg-white border border-slate-200 hover:border-purple-300 hover:bg-purple-50 text-slate-700 disabled:opacity-40 disabled:hover:bg-white disabled:hover:border-slate-200 transition-all flex items-center justify-center shadow-xs cursor-pointer disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Slider Carousel Container */}
        <div className="relative">
          <div
            ref={sliderRef}
            onScroll={handleSliderScroll}
            className="flex gap-6 overflow-x-auto snap-x snap-mandatory scroll-smooth no-scrollbar py-4 px-1"
          >
            {displayedPlans.map((plan: any, idx: number) => {
              const displayPrice =
                billingPeriod === 'daily'
                  ? Number(plan.priceDaily || plan.priceMonthly)
                  : Number(plan.priceMonthly || plan.priceDaily);

              return (
                <div
                  key={plan.id || idx}
                  data-plan-card
                  className={`w-[86vw] sm:w-[350px] md:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)] shrink-0 snap-center md:snap-start bg-white rounded-3xl p-6 sm:p-7 border relative transition-all duration-300 flex flex-col justify-between group shadow-xs hover:shadow-xl ${
                    plan.isPopular
                      ? 'border-2 border-purple-500 ring-4 ring-purple-500/10 hover:border-purple-600'
                      : 'border-slate-200/90 hover:border-purple-200'
                  }`}
                >
                  {/* Top Ribbon / Badge */}
                  {plan.isPopular ? (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 text-[11px] font-extrabold uppercase tracking-wider text-white shadow-md flex items-center gap-1.5 whitespace-nowrap">
                      <Sparkles className="w-3.5 h-3.5 fill-white" />
                      <span>Most Popular Choice</span>
                    </div>
                  ) : (
                    <div className="absolute -top-3 left-6 px-3 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                      {plan.badge || 'Membership Tier'}
                    </div>
                  )}

                  {/* Plan Details Top */}
                  <div className="space-y-5 pt-2">
                    <div>
                      <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">{plan.name}</h3>
                      <p className="text-xs text-slate-500 mt-1 min-h-[38px] leading-relaxed">
                        {plan.tagline || 'Flexible workspace plan with full amenities access.'}
                      </p>
                    </div>

                    {/* Pricing Display */}
                    <div className="pt-2 border-t border-slate-100">
                      <div className="flex items-baseline gap-1">
                        <span className="text-sm font-bold text-slate-400">₹</span>
                        <span className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
                          {displayPrice.toLocaleString('en-IN')}
                        </span>
                        <span className="text-xs font-semibold text-slate-500">
                          {billingPeriod === 'daily' ? '/ day' : '/ month'}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <span>Includes 18% GST invoicing & instant credits</span>
                      </div>
                    </div>

                    {/* Credits Allowance Box */}
                    <div className="grid grid-cols-2 gap-2.5 p-3 rounded-2xl bg-slate-50/80 border border-slate-100 text-xs">
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-purple-600" />
                          <span>Meeting Suite</span>
                        </span>
                        <strong className="text-slate-900 font-extrabold block text-sm">
                          {plan.meetingCreditsIncluded > 0 ? `${plan.meetingCreditsIncluded} hrs/mo` : 'On-Demand'}
                        </strong>
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                          <Laptop className="w-3 h-3 text-pink-600" />
                          <span>Desk Access</span>
                        </span>
                        <strong className="text-slate-900 font-extrabold block text-sm">
                          {plan.deskCreditsIncluded > 0 ? `${plan.deskCreditsIncluded} Passes` : 'Unlimited'}
                        </strong>
                      </div>
                    </div>

                    {/* Features List */}
                    <div className="space-y-2.5 pt-2 border-t border-slate-100 text-xs">
                      <span className="font-bold text-slate-900 block text-[11px] uppercase tracking-wider">
                        What’s Included:
                      </span>
                      <ul className="space-y-2 text-slate-600">
                        {(plan.features && plan.features.length > 0 ? plan.features : []).slice(0, 5).map((feat: any, fIdx: number) => (
                          <li key={fIdx} className="flex items-start gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                            <span className="leading-tight">{typeof feat === 'string' ? feat : feat.featureText}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Bottom Actions */}
                  <div className="pt-6 border-t border-slate-100 space-y-2.5">
                    <Link
                      href={`/pricing?plan=${plan.slug}&billing=${billingPeriod}`}
                      className={`w-full py-3 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                        plan.isPopular
                          ? 'bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 hover:opacity-95 text-white shadow-md shadow-pink-500/20'
                          : 'bg-slate-900 hover:bg-slate-800 text-white shadow-xs'
                      }`}
                    >
                      <span>Get Started</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                    <Link
                      href="/pricing?tab=membership#tour"
                      className="w-full py-2 px-4 rounded-xl text-[11px] font-semibold border border-slate-200 hover:border-slate-300 text-slate-600 hover:text-slate-900 bg-white transition-all flex items-center justify-center gap-1.5"
                    >
                      <Calendar className="w-3.5 h-3.5 text-purple-600" />
                      <span>Schedule a Free Tour</span>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Mobile Navigation Arrows & Dot Indicators */}
          <div className="pt-4 flex items-center justify-between sm:justify-center gap-4">
            <button
              type="button"
              onClick={() => scrollSlider('left')}
              disabled={!canScrollLeft}
              aria-label="Previous plan"
              className="sm:hidden w-8 h-8 rounded-full bg-white border border-slate-200 text-slate-700 disabled:opacity-40 flex items-center justify-center shadow-xs"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Dots Indicator */}
            <div className="flex items-center gap-2">
              {displayedPlans.map((_: any, dotIdx: number) => (
                <button
                  key={dotIdx}
                  type="button"
                  onClick={() => scrollToSlide(dotIdx)}
                  aria-label={`Go to slide ${dotIdx + 1}`}
                  className={`transition-all duration-300 cursor-pointer ${
                    activeSlideIndex === dotIdx
                      ? 'w-7 h-2 rounded-full bg-gradient-to-r from-purple-600 to-pink-600'
                      : 'w-2 h-2 rounded-full bg-slate-300 hover:bg-slate-400'
                  }`}
                />
              ))}
            </div>

            <button
              type="button"
              onClick={() => scrollSlider('right')}
              disabled={!canScrollRight}
              aria-label="Next plan"
              className="sm:hidden w-8 h-8 rounded-full bg-white border border-slate-200 text-slate-700 disabled:opacity-40 flex items-center justify-center shadow-xs"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Bottom Comparison Link */}
          <div className="pt-8 text-center">
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 text-xs font-bold text-purple-600 hover:text-pink-600 transition-colors"
            >
              <span>Compare all membership tiers, credits & enterprise add-ons</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
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

      {/* Workspace Solution Reservation Modal */}
      {showModal && selectedService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white p-6 sm:p-8 rounded-3xl max-w-lg w-full border border-slate-200 shadow-2xl space-y-5 relative max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-900 text-sm font-bold p-1 rounded-full bg-slate-100 hover:bg-slate-200 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">
                Workspace Solution Reservation
              </span>
              <h3 className="text-xl font-extrabold text-slate-900">{selectedService.name}</h3>
            </div>

            {submittedRef ? (
              <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h4 className="text-base font-bold text-emerald-950">Inquiry Confirmed</h4>
                <p className="text-xs text-emerald-800">
                  Your reservation request reference: <strong className="font-mono text-indigo-700">#{submittedRef}</strong>. Our enterprise team will contact you shortly with your custom quote.
                </p>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-6 py-2.5 rounded-full bg-emerald-600 text-white font-bold text-xs shadow hover:bg-emerald-700 transition-all cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleServiceSubmit} className="space-y-4 text-xs">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.customerName}
                    onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                    placeholder="John Doe"
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-indigo-600 font-medium text-slate-900"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Email *</label>
                    <input
                      type="email"
                      required
                      value={formData.customerEmail}
                      onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                      placeholder="john@example.com"
                      className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-indigo-600 font-medium text-slate-900"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Phone *</label>
                    <input
                      type="tel"
                      required
                      value={formData.customerPhone}
                      onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                      placeholder="+91 9876543210"
                      className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-indigo-600 font-medium text-slate-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Company Name</label>
                    <input
                      type="text"
                      value={formData.companyName}
                      onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                      placeholder="Acme Corp"
                      className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-indigo-600 font-medium text-slate-900"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Required Team Seats *</label>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      required
                      value={formData.seatsCount}
                      onChange={(e) => setFormData({ ...formData, seatsCount: Number(e.target.value) })}
                      className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-indigo-600 font-medium text-slate-900"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Preferred Start Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.preferredDate}
                    onChange={(e) => setFormData({ ...formData, preferredDate: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-indigo-600 font-medium text-slate-900"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Custom Requirements / Notes</label>
                  <textarea
                    rows={3}
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Tell us about your team setup, preferred branch, or special requirements..."
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-indigo-600 font-medium text-slate-900"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 rounded-full bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 text-xs font-bold text-white shadow-md hover:opacity-95 transition-all flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{submitting ? 'Submitting Reservation...' : 'Confirm Solution Reservation'}</span>
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
