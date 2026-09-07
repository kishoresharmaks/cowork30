'use client';

import React, { useEffect, useState } from 'react';
import AdminSidebar from '@/components/layout/AdminSidebar';
import { Plus, Edit2, Trash2, Power, Star, Check, CreditCard } from 'lucide-react';
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
  sortOrder: 0,
  isPopular: false,
  isActive: true,
  featuresText: '24/7 Access\nHigh-Speed Fiber Wi-Fi\nCommunity Lounge Access',
};

export default function AdminPricingPage() {
  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<PricingPlan | null>(null);
  const [formData, setFormData] = useState<PricingFormState>(defaultFormState);
  const [submitting, setSubmitting] = useState(false);

  async function loadPlans() {
    setLoading(true);
    try {
      const res = await apiClient.get('/pricing/plans?all=true');
      setPlans(res.data || []);
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
    setFormData(defaultFormState);
    setShowModal(true);
  };

  const openEditModal = (plan: PricingPlan) => {
    setEditingPlan(plan);
    setFormData({
      name: plan.name,
      slug: plan.slug,
      tagline: plan.tagline || '',
      billingPeriod: plan.billingPeriod || 'Monthly',
      priceMonthly: Number(plan.priceMonthly || 0),
      priceDaily: Number(plan.priceDaily || 0),
      meetingCreditsIncluded: Number(plan.meetingCreditsIncluded || 0),
      deskCreditsIncluded: Number(plan.deskCreditsIncluded || 0),
      sortOrder: Number(plan.sortOrder || 0),
      isPopular: plan.isPopular ?? false,
      isActive: plan.isActive ?? true,
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
      slug: formData.slug || undefined,
      tagline: formData.tagline || undefined,
      billingPeriod: formData.billingPeriod,
      priceMonthly: formData.priceMonthly,
      priceDaily: formData.priceDaily,
      meetingCreditsIncluded: formData.meetingCreditsIncluded,
      deskCreditsIncluded: formData.deskCreditsIncluded,
      sortOrder: formData.sortOrder,
      isPopular: formData.isPopular,
      isActive: formData.isActive,
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
    } catch (err) {
      alert('Failed to save pricing plan');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex font-sans">
      <AdminSidebar />

      <main className="grow p-6 sm:p-10 space-y-8 overflow-y-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400">Admin Control</span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Membership Plans & Pricing Manager</h1>
          </div>

          <button
            onClick={openCreateModal}
            className="px-4 py-2 rounded-full bg-gradient-brand text-xs font-semibold text-white flex items-center space-x-2 w-fit shadow-lg shadow-rose-500/20"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Pricing Plan</span>
          </button>
        </div>

        {loading ? (
          <div className="text-sm text-slate-400">Loading pricing plans...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className={`glass-panel p-6 sm:p-8 rounded-3xl space-y-5 border relative transition-all flex flex-col justify-between ${
                  plan.isPopular
                    ? 'border-rose-500 ring-2 ring-rose-500/20 bg-rose-950/10'
                    : plan.isActive
                      ? 'border-slate-800'
                      : 'border-rose-900/40 opacity-70 bg-slate-900/40'
                }`}
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-xl font-extrabold text-white">{plan.name}</h3>
                      <p className="text-[11px] text-slate-400 mt-1">{plan.slug}</p>
                    </div>

                    <div className="flex items-center space-x-1.5">
                      <button
                        onClick={() => handleTogglePopular(plan)}
                        className={`p-1.5 rounded-lg border transition-colors ${
                          plan.isPopular
                            ? 'bg-amber-500/20 border-amber-500 text-amber-400'
                            : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-white'
                        }`}
                        title="Toggle Popular Highlight"
                      >
                        <Star className="w-3.5 h-3.5 fill-current" />
                      </button>

                      <button
                        onClick={() => handleToggleActive(plan)}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase transition-colors flex items-center space-x-1 ${
                          plan.isActive
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                            : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                        }`}
                        title="Toggle Active Status"
                      >
                        <Power className="w-3 h-3" />
                        <span>{plan.isActive ? 'Active' : 'Inactive'}</span>
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-slate-400 leading-relaxed">{plan.tagline || 'No tagline added yet.'}</p>

                  <div className="pt-2 space-y-1.5">
                    <span className="text-3xl sm:text-4xl font-extrabold text-white">₹{plan.priceMonthly}</span>
                    <span className="text-xs text-slate-400"> / month</span>
                    <p className="text-[11px] text-slate-400 pt-1">Daily: ₹{plan.priceDaily} | Billing: {plan.billingPeriod || 'Monthly'}</p>
                    <p className="text-[11px] text-slate-400">Meeting credits: {plan.meetingCreditsIncluded} | Desk credits: {plan.deskCreditsIncluded}</p>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-slate-800/60">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Features Included:</span>
                    {plan.features?.map((feature) => (
                      <div key={feature.id} className="flex items-center space-x-2 text-xs text-slate-300">
                        <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>{feature.featureText}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-800 flex items-center justify-between">
                  <button
                    onClick={() => openEditModal(plan)}
                    className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-200 hover:border-rose-500 transition-colors flex items-center space-x-1.5"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-rose-400" />
                    <span>Edit Plan</span>
                  </button>

                  <button
                    onClick={() => handleDelete(plan.id)}
                    className="p-2 rounded-xl bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white border border-rose-500/20 transition-all"
                    title="Delete Plan"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="glass-panel p-6 sm:p-8 rounded-3xl max-w-2xl w-full border border-purple-500/40 space-y-6 relative max-h-[90vh] overflow-y-auto">
            <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white text-sm">
              ✕
            </button>

            <h3 className="text-lg font-bold text-white">
              {editingPlan ? `Edit Plan: ${editingPlan.name}` : 'Add New Pricing Plan'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Plan Title *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Dedicated Desk Pro"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white focus:border-rose-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Slug</label>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    placeholder="auto-generated if empty"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white focus:border-rose-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Tagline</label>
                <input
                  type="text"
                  value={formData.tagline}
                  onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                  placeholder="Best for teams that need a fixed seat"
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white focus:border-rose-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Monthly (₹) *</label>
                  <input
                    type="number"
                    required
                    value={formData.priceMonthly}
                    onChange={(e) => setFormData({ ...formData, priceMonthly: Number(e.target.value) })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white focus:border-rose-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Daily (₹)</label>
                  <input
                    type="number"
                    value={formData.priceDaily}
                    onChange={(e) => setFormData({ ...formData, priceDaily: Number(e.target.value) })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white focus:border-rose-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Meeting Credits</label>
                  <input
                    type="number"
                    value={formData.meetingCreditsIncluded}
                    onChange={(e) => setFormData({ ...formData, meetingCreditsIncluded: Number(e.target.value) })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white focus:border-rose-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Desk Credits</label>
                  <input
                    type="number"
                    value={formData.deskCreditsIncluded}
                    onChange={(e) => setFormData({ ...formData, deskCreditsIncluded: Number(e.target.value) })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white focus:border-rose-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Billing Period</label>
                  <select
                    value={formData.billingPeriod}
                    onChange={(e) => setFormData({ ...formData, billingPeriod: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white focus:border-rose-500 focus:outline-none"
                  >
                    <option value="Monthly">Monthly</option>
                    <option value="Daily">Daily</option>
                    <option value="Annual">Annual</option>
                    <option value="Custom">Custom</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Sort Order</label>
                  <input
                    type="number"
                    value={formData.sortOrder}
                    onChange={(e) => setFormData({ ...formData, sortOrder: Number(e.target.value) })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white focus:border-rose-500 focus:outline-none"
                  />
                </div>

                <div className="flex items-end gap-4 text-slate-300">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isPopular}
                      onChange={(e) => setFormData({ ...formData, isPopular: e.target.checked })}
                      className="w-4 h-4 text-amber-500 rounded bg-slate-900 border-slate-800"
                    />
                    <span>Popular</span>
                  </label>

                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="w-4 h-4 text-emerald-500 rounded bg-slate-900 border-slate-800"
                    />
                    <span>Active</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Feature Bullets (1 per line) *</label>
                <textarea
                  rows={5}
                  required
                  value={formData.featuresText}
                  onChange={(e) => setFormData({ ...formData, featuresText: e.target.value })}
                  placeholder="24/7 Access\nDedicated Desk\nConference Room Credits"
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white font-sans focus:border-rose-500 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-full border border-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-full bg-gradient-brand text-white text-xs font-semibold flex items-center space-x-2"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>{submitting ? 'Saving...' : 'Save Plan'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
