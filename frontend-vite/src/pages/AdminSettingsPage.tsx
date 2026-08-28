import React, { useState } from 'react';
import { Settings, Save, ShieldCheck } from 'lucide-react';
import AdminSidebar from '@/components/layout/AdminSidebar';

export default function AdminSettingsPage() {
  const [gstRate, setGstRate] = useState('18');
  const [companyName, setCompanyName] = useState('Cowork30 Enterprise Platform');
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex font-sans">
      <AdminSidebar />

      <main className="flex-1 p-8 overflow-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-black text-white">Platform Site Settings & Dynamic Branding</h1>
            <p className="text-xs text-slate-400 mt-1">Configure company details, logo uploads, and default GST tax rates.</p>
          </div>
        </div>

        {saved && (
          <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-2xl flex items-center gap-2">
            <ShieldCheck className="w-4 h-4" /> Settings updated successfully!
          </div>
        )}

        <form onSubmit={handleSave} className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-xl space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1">Company Legal Name</label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white outline-none focus:border-rose-500"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1">Default GST Rate (%)</label>
            <input
              type="number"
              value={gstRate}
              onChange={(e) => setGstRate(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white outline-none focus:border-rose-500"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-gradient-to-r from-rose-500 to-purple-600 text-white font-bold rounded-xl text-xs shadow-lg shadow-rose-500/20"
          >
            Save Site Settings
          </button>
        </form>
      </main>
    </div>
  );
}
