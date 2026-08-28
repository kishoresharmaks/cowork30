'use client';

import React, { useEffect, useState } from 'react';
import AdminSidebar from '@/components/layout/AdminSidebar';
import { Plus, Edit2, Trash2, Power, Star, Check, ShieldCheck, Search, X, Sparkles, Tag, DollarSign } from 'lucide-react';
import { apiClient } from '@/lib/api-client';

type PricingFeature = {
  id: number;
  featureText: string;
  isIncluded: boolean;
  sortOrder: number;
};

type PricingPlan = {
  id: number;
  name: string;
  slug: string;
  tagline?: string | null;
  billingPeriod?: string | null;
  priceMonthly: number;
  priceDaily: number;
  meetingCreditsIncluded: number;
  deskCreditsIncluded: number;
  isPopular: boolean;
  isActive: boolean;
  sortOrder: number;
  features?: PricingFeature[];
};

type PricingFormState = {
  name: string;
  slug: string;
  tagline: string;
  billingPeriod: string;
  priceMonthly: number;
  priceDaily: number;
  meetingCreditsIncluded: number;
  deskCreditsIncluded: number;
  sortOrder: number;
  isPopular: boolean;
  isActive: boolean;
  featuresText: string;
};

const defaultFormState: PricingFormState = {
  name: '',
  slug: '',
  tagline: '',
  billingPeriod: 'Monthly',
  priceMonthly: 6000,
  priceDaily: 600,
  meetingCreditsIncluded: 0,
  deskCreditsIncluded: 0,
  sortOrder: 1,
  isPopular: false,
  isActive: true,
  featuresText: '24/7 Access\nHigh-Speed Fiber Wi-Fi\nCommunity Lounge Access\nComplimentary Coffee & Tea',
};

export default function AdminPricingPage() {
  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<PricingPlan | null>(null);
  const [formData, setFormData] = useState<PricingFormState>(defaultFormState);
  const [submitting, setSubmitting] = useState(false);

  async function loadPlans() {
    setLoading(true);
    try {
      const res = await apiClient.get('/pricing/plans?all=true');
      const list = Array.isArray(res.data) ? res.data : (res.data?.data || []);
      setPlans(list);
    } catch (err) {
      console.error('Failed to load pricing plans', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPlans();
  }, []);

  const openCreateModal = () => {
    setEditingPlan(null);
    setFormData({
      ...defaultFormState,
      sortOrder: plans.length + 1,
    });
    setShowModal(true);
  };

  const openEditModal = (plan: PricingPlan) => {
    setEditingPlan(plan);
    setFormData({
      name: plan.name || '',
      slug: plan.slug || '',
      tagline: plan.tagline || '',
      billingPeriod: plan.billingPeriod || 'Monthly',
      priceMonthly: Number(plan.priceMonthly || 0),
      priceDaily: Number(plan.priceDaily || 0),
      meetingCreditsIncluded: Number(plan.meetingCreditsIncluded || 0),
      deskCreditsIncluded: Number(plan.deskCreditsIncluded || 0),
      sortOrder: Number(plan.sortOrder || 1),
      isPopular: Boolean(plan.isPopular),
      isActive: Boolean(plan.isActive ?? true),
      featuresText: plan.features?.map((feature) => feature.featureText).join('\n') || '',
    });
    setShowModal(true);
  };

  const handleToggleActive = async (plan: PricingPlan) => {
    try {
      await apiClient.put(`/pricing/plans/${plan.id}`, { isActive: !plan.isActive });
      loadPlans();
    } catch (err) {
      alert('Failed to toggle plan active status');
    }
  };

  const handleTogglePopular = async (plan: PricingPlan) => {
    try {
      await apiClient.put(`/pricing/plans/${plan.id}`, { isPopular: !plan.isPopular });
      loadPlans();
    } catch (err) {
      alert('Failed to toggle popular highlight');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this pricing plan?')) return;
    try {
      await apiClient.delete(`/pricing/plans/${id}`);
      setShowModal(false);
      loadPlans();
    } catch (err) {
      alert('Failed to delete pricing plan');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const featuresList = formData.featuresText
      .split('\n')
      .map((feature) => feature.trim())
      .filter((feature) => feature.length > 0);

    const payload = {
      name: formData.name,
      slug: formData.slug || formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''),
      tagline: formData.tagline || undefined,
      billingPeriod: formData.billingPeriod || 'Monthly',
      priceMonthly: Number(formData.priceMonthly),
      priceDaily: Number(formData.priceDaily),
      meetingCreditsIncluded: Number(formData.meetingCreditsIncluded),
      deskCreditsIncluded: Number(formData.deskCreditsIncluded),
      sortOrder: Number(formData.sortOrder),
      isPopular: Boolean(formData.isPopular),
      isActive: Boolean(formData.isActive),
      featuresList,
    };

    try {
      if (editingPlan) {
        await apiClient.put(`/pricing/plans/${editingPlan.id}`, payload);
      } else {
        await apiClient.post('/pricing/plans', payload);
      }
      setShowModal(false);
      loadPlans();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to save pricing plan');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredPlans = plans.filter((plan) => {
    const matchesSearch =
      !searchQuery.trim() ||
      plan.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (plan.tagline && plan.tagline.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' ? plan.isActive : !plan.isActive);

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-[#0F172A] text-[#F8FAFC] flex font-sans selection:bg-[#6366F1] selection:text-white">
      <AdminSidebar />

      <main className="flex-1 p-4 sm:p-8 max-w-7xl mx-auto space-y-6 overflow-x-hidden pt-16 md:pt-8">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#334155] pb-5">
          <div>
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[#6366F1]/10 border border-[#6366F1]/30 text-xs font-bold text-[#6366F1] mb-2">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Membership Tier & Rates Manager</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#F8FAFC]">Membership Plans & Pricing Configurator</h1>
            <p className="text-xs text-[#94A3B8]">
              Manage pricing tiers (₹), billing periods, meeting & desk credits, feature checklists, and popular badges.
            </p>
          </div>

          <button
            type="button"
            onClick={openCreateModal}
            className="px-5 py-2.5 rounded-full bg-[#6366F1] hover:bg-[#4F46E5] text-xs font-bold text-white flex items-center space-x-2 w-fit shadow-md cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Add Pricing Plan</span>
          </button>
        </div>

        {/* SEARCH & FILTERS BAR */}
        <div className="bg-[#1E293B] p-4 rounded-2xl border border-[#334155] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow-xs text-xs">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search plans by title or tagline..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#0F172A] border border-[#334155] rounded-xl pl-9 pr-3 py-2 text-[#F8FAFC] focus:border-[#6366F1] focus:outline-none"
            />
          </div>

          <div className="flex items-center space-x-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-[#0F172A] border border-[#334155] text-[#CBD5E1] rounded-xl px-3 py-2 font-semibold focus:border-[#6366F1] focus:outline-none cursor-pointer"
            >
              <option value="all">All Statuses ({plans.length})</option>
              <option value="active">Active Only ({plans.filter((p) => p.isActive).length})</option>
              <option value="draft">Draft / Inactive ({plans.filter((p) => !p.isActive).length})</option>
            </select>
          </div>
        </div>

        {/* Plans Grid Showcase */}
        {loading ? (
          <div className="py-20 text-center text-xs font-semibold text-[#94A3B8]">Loading pricing tiers...</div>
        ) : filteredPlans.length === 0 ? (
          <div className="py-20 text-center space-y-3 bg-[#1E293B] rounded-3xl border border-[#334155]">
            <ShieldCheck className="w-10 h-10 text-[#6366F1] mx-auto" />
            <h3 className="text-base font-bold text-[#F8FAFC]">No Pricing Plans Found</h3>
            <p className="text-xs text-[#94A3B8]">No membership plans match your search filter criteria.</p>
            <button
              type="button"
              onClick={openCreateModal}
              className="px-4 py-2 rounded-full bg-[#6366F1] text-white text-xs font-bold shadow-md cursor-pointer inline-flex items-center space-x-1"
            >
              <Plus className="w-4 h-4" />
              <span>Add Pricing Plan</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPlans.map((plan) => (
              <div
                key={plan.id}
                className={`bg-[#1E293B] p-6 rounded-3xl border transition-all flex flex-col justify-between space-y-5 relative shadow-xs ${
                  plan.isPopular
                    ? 'border-[#6366F1] ring-2 ring-[#6366F1]/30 shadow-[#6366F1]/10'
                    : plan.isActive
                    ? 'border-[#334155]'
                    : 'border-[#F43F5E]/40 bg-[#F43F5E]/5'
                }`}
              >
                {/* Header Highlights Badges */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#0F172A] text-[#6366F1] border border-[#6366F1]/30">
                      Order #{plan.sortOrder || 1}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#0F172A] text-[#38BDF8] border border-[#38BDF8]/30">
                      {plan.billingPeriod || 'Monthly'}
                    </span>
                  </div>

                  {plan.isPopular && (
                    <span className="inline-flex items-center space-x-1 text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-[#F59E0B]/20 text-[#F59E0B] border border-[#F59E0B]/40">
                      <Star className="w-3 h-3 fill-[#F59E0B]" />
                      <span>Most Popular</span>
                    </span>
                  )}
                </div>

                <div className="space-y-4 flex-grow">
                  <div className="space-y-1">
                    <h3 className="text-xl font-extrabold text-[#F8FAFC]">{plan.name}</h3>
                    {plan.tagline && <p className="text-xs text-[#94A3B8] italic">{plan.tagline}</p>}
                  </div>

                  <div className="flex items-baseline space-x-1">
                    <span className="text-3xl font-extrabold text-[#F8FAFC]">₹{plan.priceMonthly}</span>
                    <span className="text-xs text-[#94A3B8]">/ month</span>
                    <span className="text-xs text-[#10B981] ml-2 font-semibold font-mono">(Daily: ₹{plan.priceDaily})</span>
                  </div>

                  {/* Credits Breakdown */}
                  <div className="grid grid-cols-2 gap-2 text-xs bg-[#0F172A] p-3 rounded-xl border border-[#334155]">
                    <div>
                      <span className="text-[10px] text-[#94A3B8] font-semibold block">Meeting Credits</span>
                      <span className="font-extrabold text-[#6366F1]">{plan.meetingCreditsIncluded} Hrs/mo</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#94A3B8] font-semibold block">Desk Credits</span>
                      <span className="font-extrabold text-[#38BDF8]">{plan.deskCreditsIncluded} Days/mo</span>
                    </div>
                  </div>

                  {/* Features List */}
                  {plan.features && plan.features.length > 0 && (
                    <div className="pt-2 space-y-2 text-xs">
                      <span className="font-bold text-[#F8FAFC] block text-[11px] uppercase tracking-wider">Included Perks ({plan.features.length}):</span>
                      <div className="space-y-1.5">
                        {plan.features.map((feat) => (
                          <div key={feat.id} className="flex items-start space-x-2">
                            <Check className="w-3.5 h-3.5 text-[#10B981] shrink-0 mt-0.5" />
                            <span className="text-[#CBD5E1] font-medium text-[11px]">{feat.featureText}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Card Action Controls */}
                <div className="pt-4 border-t border-[#334155] space-y-3">
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => handleTogglePopular(plan)}
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase transition-colors flex items-center space-x-1 cursor-pointer ${
                        plan.isPopular
                          ? 'bg-[#F59E0B]/20 text-[#F59E0B] border border-[#F59E0B]/40'
                          : 'bg-[#0F172A] text-[#94A3B8] border border-[#334155]'
                      }`}
                    >
                      <Star className="w-3 h-3" />
                      <span>{plan.isPopular ? 'Featured' : 'Mark Popular'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleToggleActive(plan)}
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase transition-colors flex items-center space-x-1 cursor-pointer ${
                        plan.isActive
                          ? 'bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/40'
                          : 'bg-[#F43F5E]/20 text-[#F43F5E] border border-[#F43F5E]/40'
                      }`}
                    >
                      <Power className="w-3 h-3" />
                      <span>{plan.isActive ? 'Active' : 'Draft'}</span>
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => openEditModal(plan)}
                      className="px-3.5 py-1.5 rounded-xl bg-[#0F172A] border border-[#334155] text-xs font-bold text-[#CBD5E1] hover:text-[#F8FAFC] hover:border-[#6366F1] flex items-center space-x-1.5 cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Edit Plan Specs</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(plan.id)}
                      className="p-1.5 rounded-xl bg-[#0F172A] border border-[#334155] text-[#F43F5E] hover:bg-[#F43F5E]/10 cursor-pointer"
                      title="Delete Plan"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* FULLY POPULATED ADD / EDIT PLAN MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F172A]/80 backdrop-blur-xs">
          <div className="bg-[#1E293B] border border-[#334155] rounded-3xl max-w-xl w-full p-6 space-y-4 text-[#F8FAFC] shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-[#94A3B8] hover:text-[#F8FAFC] p-1 rounded-full bg-[#0F172A]"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="border-b border-[#334155] pb-3">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#6366F1]">
                {editingPlan ? 'Plan Configurator' : 'Create Membership Plan'}
              </span>
              <h3 className="text-xl font-extrabold text-[#F8FAFC]">
                {editingPlan ? `Edit Pricing Plan: ${editingPlan.name}` : 'Add New Pricing Plan'}
              </h3>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {/* Title & Slug */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#CBD5E1] font-semibold mb-1">Plan Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Dedicated Pro Member"
                    className="w-full bg-[#0F172A] border border-[#334155] rounded-xl px-3 py-2 text-[#F8FAFC] focus:border-[#6366F1] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[#CBD5E1] font-semibold mb-1">URL Slug</label>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    placeholder="e.g. dedicated-pro"
                    className="w-full bg-[#0F172A] border border-[#334155] rounded-xl px-3 py-2 text-[#F8FAFC] font-mono focus:border-[#6366F1] focus:outline-none"
                  />
                </div>
              </div>

              {/* Tagline & Billing Period */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-[#CBD5E1] font-semibold mb-1">Tagline / Subtitle</label>
                  <input
                    type="text"
                    value={formData.tagline}
                    onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                    placeholder="e.g. Ideal for freelancers and digital nomads needing on-demand desk access"
                    className="w-full bg-[#0F172A] border border-[#334155] rounded-xl px-3 py-2 text-[#F8FAFC] focus:border-[#6366F1] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[#CBD5E1] font-semibold mb-1">Billing Frequency</label>
                  <select
                    value={formData.billingPeriod}
                    onChange={(e) => setFormData({ ...formData, billingPeriod: e.target.value })}
                    className="w-full bg-[#0F172A] border border-[#334155] rounded-xl px-3 py-2 text-[#F8FAFC] font-semibold focus:border-[#6366F1] focus:outline-none cursor-pointer"
                  >
                    <option value="Monthly">Monthly</option>
                    <option value="Quarterly">Quarterly</option>
                    <option value="Yearly">Yearly</option>
                    <option value="Daily">Daily Pass</option>
                  </select>
                </div>
              </div>

              {/* Rates & Order */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[#CBD5E1] font-semibold mb-1">Monthly Price (₹) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.priceMonthly}
                    onChange={(e) => setFormData({ ...formData, priceMonthly: Number(e.target.value) })}
                    className="w-full bg-[#0F172A] border border-[#334155] rounded-xl px-3 py-2 text-[#F8FAFC] font-mono focus:border-[#6366F1] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[#CBD5E1] font-semibold mb-1">Daily Access Rate (₹) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.priceDaily}
                    onChange={(e) => setFormData({ ...formData, priceDaily: Number(e.target.value) })}
                    className="w-full bg-[#0F172A] border border-[#334155] rounded-xl px-3 py-2 text-[#F8FAFC] font-mono focus:border-[#6366F1] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[#CBD5E1] font-semibold mb-1">Display Sort Order</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formData.sortOrder}
                    onChange={(e) => setFormData({ ...formData, sortOrder: Number(e.target.value) })}
                    className="w-full bg-[#0F172A] border border-[#334155] rounded-xl px-3 py-2 text-[#F8FAFC] font-mono focus:border-[#6366F1] focus:outline-none"
                  />
                </div>
              </div>

              {/* Credits Allocation */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-2xl bg-[#0F172A] border border-[#334155]">
                <div>
                  <label className="block text-[#CBD5E1] font-semibold mb-1">Meeting Credits Included (Hrs) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.meetingCreditsIncluded}
                    onChange={(e) => setFormData({ ...formData, meetingCreditsIncluded: Number(e.target.value) })}
                    className="w-full bg-[#1E293B] border border-[#334155] rounded-xl px-3 py-2 text-[#F8FAFC] font-mono focus:border-[#6366F1] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[#CBD5E1] font-semibold mb-1">Desk Credits Included (Days) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.deskCreditsIncluded}
                    onChange={(e) => setFormData({ ...formData, deskCreditsIncluded: Number(e.target.value) })}
                    className="w-full bg-[#1E293B] border border-[#334155] rounded-xl px-3 py-2 text-[#F8FAFC] font-mono focus:border-[#6366F1] focus:outline-none"
                  />
                </div>
              </div>

              {/* Features List */}
              <div>
                <label className="block text-[#CBD5E1] font-semibold mb-1">Included Features & Perks (One per line)</label>
                <textarea
                  rows={5}
                  value={formData.featuresText}
                  onChange={(e) => setFormData({ ...formData, featuresText: e.target.value })}
                  placeholder="Access to open coworking lounge&#10;Ultra-fast Gigabit Wi-Fi&#10;Unlimited gourmet coffee & tea&#10;2 Hours Meeting Room Credits / Month&#10;Dedicated Storage Cabinet"
                  className="w-full bg-[#0F172A] border border-[#334155] rounded-xl p-3 text-[#F8FAFC] focus:border-[#6366F1] focus:outline-none font-mono text-[11px]"
                />
              </div>

              {/* Toggles */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <label className="flex items-center space-x-2 p-3 rounded-xl bg-[#0F172A] border border-[#334155] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isPopular}
                    onChange={(e) => setFormData({ ...formData, isPopular: e.target.checked })}
                    className="w-4 h-4 rounded text-[#6366F1] accent-[#6366F1]"
                  />
                  <div className="space-y-0.5">
                    <span className="font-bold text-[#F8FAFC] block flex items-center space-x-1">
                      <Star className="w-3.5 h-3.5 text-[#F59E0B]" />
                      <span>Most Popular Highlight</span>
                    </span>
                    <span className="text-[10px] text-[#94A3B8]">Featured badge & glow on pricing page</span>
                  </div>
                </label>

                <label className="flex items-center space-x-2 p-3 rounded-xl bg-[#0F172A] border border-[#334155] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-4 h-4 rounded text-[#6366F1] accent-[#6366F1]"
                  />
                  <div className="space-y-0.5">
                    <span className="font-bold text-[#F8FAFC] block">Publish Active Status</span>
                    <span className="text-[10px] text-[#94A3B8]">Visible on public site & member checkout</span>
                  </div>
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-2 border-t border-[#334155]">
                {editingPlan ? (
                  <button
                    type="button"
                    onClick={() => handleDelete(editingPlan.id)}
                    className="px-4 py-2.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500/20 text-xs font-bold flex items-center space-x-1 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Delete Plan</span>
                  </button>
                ) : (
                  <div></div>
                )}

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2.5 rounded-full bg-[#0F172A] border border-[#334155] text-[#CBD5E1] text-xs font-bold hover:text-[#F8FAFC]"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-2.5 rounded-full text-xs font-bold text-white bg-[#6366F1] hover:bg-[#4F46E5] shadow-md flex items-center space-x-1.5 cursor-pointer"
                  >
                    <span>{submitting ? 'Saving Plan...' : 'Save Pricing Plan'}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
