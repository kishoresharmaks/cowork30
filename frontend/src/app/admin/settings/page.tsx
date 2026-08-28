'use client';

import React, { useState, useEffect } from 'react';
import AdminSidebar from '@/components/layout/AdminSidebar';
import { Settings, Save, CheckCircle2, Gift, Plus, Trash2, Sparkles } from 'lucide-react';
import { apiClient } from '@/lib/api-client';

export interface TopupPackage {
  id: string;
  amount: number;
  bonus: number;
  title: string;
  badge: string;
  isPopular: boolean;
}

export default function AdminSettingsPage() {
  const [welcomeBonusAmount, setWelcomeBonusAmount] = useState<number>(500);
  const [topupPackages, setTopupPackages] = useState<TopupPackage[]>([
    { id: '1', amount: 1000, bonus: 0, title: 'Starter Credit Pack', badge: 'Basic', isPopular: false },
    { id: '2', amount: 2500, bonus: 250, title: 'Most Popular Value Pack', badge: 'Best Value', isPopular: true },
    { id: '3', amount: 5000, bonus: 750, title: 'Pro Team Pack', badge: 'Max Savings', isPopular: false },
  ]);

  const [settings, setSettings] = useState({
    companyName: 'Enterprise Workspace Solutions Pvt. Ltd.',
    companyAddress: 'A-39, Downtown Hub, New Delhi, India',
    companyGstin: '07AAAAA0000A1Z5',
    tagline: 'Your On-Demand Business Solution Partner',
    contactEmail: 'contact@cowork30.com',
    contactPhone: '+91 98765 43210',
    brandPrimaryColor: '#6366F1',
    brandSecondaryColor: '#9333EA',
    smtpHost: 'smtp.gmail.com',
    smtpPort: 587,
    smtpUser: 'hello@cowork30.com',
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [taxRatePercent, setTaxRatePercent] = useState<number>(18);

  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await apiClient.get('/cms/settings');
        if (res.data?.welcomeBonusAmount !== undefined) {
          setWelcomeBonusAmount(res.data.welcomeBonusAmount);
        }
        if (res.data?.topupPackages && Array.isArray(res.data.topupPackages)) {
          setTopupPackages(res.data.topupPackages);
        }
        if (res.data?.siteInfo) {
          setSettings((prev) => ({ ...prev, ...res.data.siteInfo }));
        }
        if (res.data?.taxRate !== undefined) {
          const pct = Number(res.data.taxRate) * 100;
          setTaxRatePercent(Number.isFinite(pct) ? pct : 18);
        }
      } catch (err) {
        console.error('Failed to load settings', err);
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  const handleAddPackage = () => {
    const newPack: TopupPackage = {
      id: Date.now().toString(),
      amount: 3000,
      bonus: 300,
      title: 'Custom Topup Pack',
      badge: 'Bonus Credit',
      isPopular: false,
    };
    setTopupPackages([...topupPackages, newPack]);
  };

  const handleUpdatePackage = (index: number, field: keyof TopupPackage, value: any) => {
    const updated = [...topupPackages];
    updated[index] = { ...updated[index], [field]: value };
    setTopupPackages(updated);
  };

  const handleDeletePackage = (index: number) => {
    if (topupPackages.length <= 1) {
      alert('You must keep at least 1 top-up package active.');
      return;
    }
    setTopupPackages(topupPackages.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await apiClient.put('/cms/settings', {
        welcomeBonusAmount: Number(welcomeBonusAmount),
        topupPackages,
        siteInfo: settings,
        taxRate: Number((Number(taxRatePercent) / 100).toFixed(4)),
      });

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to save platform settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0F172A] text-[#F8FAFC] flex font-sans selection:bg-[#6366F1] selection:text-white">
      <AdminSidebar />

      <main className="flex-1 p-4 sm:p-8 max-w-5xl space-y-6 overflow-x-hidden pt-16 md:pt-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#334155] pb-5">
          <div>
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[#6366F1]/10 border border-[#6366F1]/30 text-xs font-bold text-[#6366F1] mb-2">
              <Settings className="w-3.5 h-3.5" />
              <span>Platform Branding & Configuration Control</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#F8FAFC]">Platform Branding & Settings Engine</h1>
            <p className="text-xs text-[#94A3B8]">Configure welcome registration bonus credits, wallet top-up packages, tax GST rates, and company metadata.</p>
          </div>

          {saved && (
            <div className="flex items-center space-x-2 text-xs font-bold text-[#10B981] bg-[#10B981]/10 border border-[#10B981]/30 px-3 py-1.5 rounded-full shrink-0">
              <CheckCircle2 className="w-4 h-4" />
              <span>Settings Saved Successfully!</span>
            </div>
          )}
        </div>

        {loading ? (
          <div className="py-20 text-center text-xs text-[#94A3B8]">Loading system configuration...</div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6 text-xs">
            {/* Dynamic Welcome Bonus Card */}
            <div className="bg-[#1E293B] p-6 rounded-2xl border border-[#334155] space-y-4 shadow-xs">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-extrabold text-[#F8FAFC] flex items-center space-x-2">
                  <Gift className="w-5 h-5 text-[#10B981]" />
                  <span>New Member Registration Welcome Bonus</span>
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30">
                  Auto Wallet Credit
                </span>
              </div>
              <p className="text-[#CBD5E1] text-xs">
                Configure the credit wallet bonus automatically credited to new members upon registering an account. Set to 0 to disable.
              </p>

              <div className="max-w-md pt-1">
                <label className="block text-[#CBD5E1] font-semibold mb-1">Welcome Bonus Credit Amount (₹ INR) *</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-extrabold text-[#10B981]">₹</span>
                  <input
                    type="number"
                    step="50"
                    min="0"
                    required
                    value={welcomeBonusAmount}
                    onChange={(e) => setWelcomeBonusAmount(Number(e.target.value))}
                    placeholder="500"
                    className="w-full bg-[#0F172A] border border-[#334155] rounded-xl pl-8 pr-4 py-2.5 text-[#F8FAFC] font-mono text-sm font-extrabold focus:border-[#6366F1] focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Tax / GST Settings */}
            <div className="bg-[#1E293B] p-6 rounded-2xl border border-[#334155] space-y-4 shadow-xs">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-extrabold text-[#F8FAFC] flex items-center space-x-2">
                  <Sparkles className="w-5 h-5 text-[#6366F1]" />
                  <span>GST Tax & Corporate Billing Configuration</span>
                </h3>
              </div>
              <p className="text-[#CBD5E1] text-xs">
                Configure your corporate business entity details, GSTIN tax number, registered address, and default GST rate for invoice generation.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div>
                  <label className="block text-[#CBD5E1] font-semibold mb-1">Corporate Entity Name *</label>
                  <input
                    type="text"
                    required
                    value={settings.companyName}
                    onChange={(e) => setSettings({ ...settings, companyName: e.target.value })}
                    placeholder="Enterprise Workspace Solutions Pvt. Ltd."
                    className="w-full bg-[#0F172A] border border-[#334155] rounded-xl px-3 py-2 text-[#F8FAFC] text-xs font-bold focus:border-[#6366F1] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[#CBD5E1] font-semibold mb-1">Corporate GSTIN Number *</label>
                  <input
                    type="text"
                    required
                    value={settings.companyGstin || '07AAAAA0000A1Z5'}
                    onChange={(e) => setSettings({ ...settings, companyGstin: e.target.value })}
                    placeholder="07AAAAA0000A1Z5"
                    className="w-full bg-[#0F172A] border border-[#334155] rounded-xl px-3 py-2 text-[#F8FAFC] font-mono text-xs font-bold focus:border-[#6366F1] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[#CBD5E1] font-semibold mb-1">Corporate Registered Address *</label>
                  <input
                    type="text"
                    required
                    value={settings.companyAddress || 'A-39, Downtown Hub, New Delhi, India'}
                    onChange={(e) => setSettings({ ...settings, companyAddress: e.target.value })}
                    placeholder="A-39, Downtown Hub, New Delhi, India"
                    className="w-full bg-[#0F172A] border border-[#334155] rounded-xl px-3 py-2 text-[#F8FAFC] text-xs font-bold focus:border-[#6366F1] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[#CBD5E1] font-semibold mb-1">Tax / GST Rate (%) *</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    required
                    value={taxRatePercent}
                    onChange={(e) => setTaxRatePercent(Number(e.target.value))}
                    placeholder="18"
                    className="w-full bg-[#0F172A] border border-[#334155] rounded-xl px-3 py-2 text-[#F8FAFC] font-mono text-xs font-bold focus:border-[#6366F1] focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Wallet Recharge Packages Config */}
            <div className="bg-[#1E293B] p-6 rounded-2xl border border-[#334155] space-y-4 shadow-xs">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-extrabold text-[#F8FAFC]">Recharge Bonus Packs Configuration</h3>
                <button
                  type="button"
                  onClick={handleAddPackage}
                  className="px-3.5 py-1.5 rounded-xl bg-[#6366F1] text-white text-xs font-bold flex items-center space-x-1 hover:bg-[#4F46E5] cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Pack</span>
                </button>
              </div>

              <div className="space-y-3">
                {topupPackages.map((pack, idx) => (
                  <div key={pack.id || idx} className="p-4 rounded-xl bg-[#0F172A] border border-[#334155] space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                      <div>
                        <label className="block text-[10px] text-[#94A3B8] font-semibold mb-1">Title</label>
                        <input
                          type="text"
                          value={pack.title}
                          onChange={(e) => handleUpdatePackage(idx, 'title', e.target.value)}
                          className="w-full bg-[#1E293B] border border-[#334155] rounded-lg px-2.5 py-1.5 text-xs text-[#F8FAFC]"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-[#94A3B8] font-semibold mb-1">Amount (₹)</label>
                        <input
                          type="number"
                          value={pack.amount}
                          onChange={(e) => handleUpdatePackage(idx, 'amount', Number(e.target.value))}
                          className="w-full bg-[#1E293B] border border-[#334155] rounded-lg px-2.5 py-1.5 text-xs text-[#F8FAFC] font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-[#94A3B8] font-semibold mb-1">Bonus Credit (₹)</label>
                        <input
                          type="number"
                          value={pack.bonus}
                          onChange={(e) => handleUpdatePackage(idx, 'bonus', Number(e.target.value))}
                          className="w-full bg-[#1E293B] border border-[#334155] rounded-lg px-2.5 py-1.5 text-xs text-[#10B981] font-mono font-bold"
                        />
                      </div>
                      <div className="flex items-end justify-between gap-2">
                        <div className="flex-1">
                          <label className="block text-[10px] text-[#94A3B8] font-semibold mb-1">Badge</label>
                          <input
                            type="text"
                            value={pack.badge}
                            onChange={(e) => handleUpdatePackage(idx, 'badge', e.target.value)}
                            className="w-full bg-[#1E293B] border border-[#334155] rounded-lg px-2.5 py-1.5 text-xs text-[#F8FAFC]"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeletePackage(idx)}
                          className="p-2 rounded-lg bg-[#F43F5E]/20 text-[#F43F5E] hover:bg-[#F43F5E]/30"
                          title="Delete Package"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Save Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={saving}
                className="px-8 py-3.5 rounded-full text-xs font-extrabold text-white bg-[#6366F1] hover:bg-[#4F46E5] shadow-md flex items-center space-x-2 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Saving System Settings...' : 'Save All Platform Settings'}</span>
              </button>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}
