import React, { useState, useEffect } from 'react';
import { Wallet, Calendar, CreditCard, Sparkles, Plus, Clock, CheckCircle2 } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { useAuth } from '@/context/AuthContext';
import { apiClient } from '@/lib/api-client';

export default function DashboardPage() {
  const { user, refreshUser } = useAuth();
  const [bookings, setBookings] = useState<any[]>([]);
  const [topupAmount, setTopupAmount] = useState(1000);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    apiClient.get('/bookings/my-bookings')
      .then((res) => setBookings(Array.isArray(res.data) ? res.data : (res.data?.data || [])))
      .catch(() => setBookings([]));
  }, []);

  const handleTopup = async () => {
    setLoading(true);
    try {
      await apiClient.post('/wallet/topup', { amount: topupAmount });
      alert('Wallet top-up request submitted successfully!');
      refreshUser();
    } catch (err) {
      alert('Failed to process wallet top-up.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-28 lg:py-36 w-full">
        <div className="mb-8">
          <h1 className="text-3xl font-black text-slate-900">Welcome, {user?.name || 'Member'}</h1>
          <p className="text-xs text-slate-500 mt-1">Manage your wallet balance, desk credits, and active workspace passes.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-400 font-bold uppercase">Wallet Balance</div>
              <div className="text-2xl font-black text-rose-600 mt-1">₹{user?.walletBalance || 0}</div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center">
              <Wallet className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-400 font-bold uppercase">Meeting Credits</div>
              <div className="text-2xl font-black text-purple-600 mt-1">{user?.meetingCreditsBalance || 0} Hrs</div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Clock className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-400 font-bold uppercase">Desk Credits</div>
              <div className="text-2xl font-black text-emerald-600 mt-1">{user?.deskCreditsBalance || 0} Passes</div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Quick Top-up Form */}
        <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm mb-10">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Quick Wallet Top-Up</h3>
          <div className="flex items-center gap-4">
            <input
              type="number"
              value={topupAmount}
              onChange={(e) => setTopupAmount(Number(e.target.value))}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs w-48 font-bold"
            />
            <button
              onClick={handleTopup}
              disabled={loading}
              className="py-2.5 px-6 bg-gradient-to-r from-rose-500 to-purple-600 text-white rounded-xl text-xs font-bold shadow-md shadow-rose-500/20"
            >
              Add ₹{topupAmount} Funds
            </button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
