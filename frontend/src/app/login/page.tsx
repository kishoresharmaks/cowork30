'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Mail, Lock, ArrowRight, AlertCircle, Sparkles, UserPlus } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { apiClient } from '@/lib/api-client';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [welcomeBonus, setWelcomeBonus] = useState<number | null>(null);
  const [welcomeBonusLoading, setWelcomeBonusLoading] = useState(true);

  useEffect(() => {
    async function fetchBonus() {
      try {
        const res = await apiClient.get('/cms/settings');
        if (res.data?.welcomeBonusAmount !== undefined) {
          setWelcomeBonus(Number(res.data.welcomeBonusAmount));
        }
      } catch (e) {
        setWelcomeBonus(0);
      } finally {
        setWelcomeBonusLoading(false);
      }
    }
    fetchBonus();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await login(email, password);
      if (res?.user?.role === 'admin') {
        router.push('/admin/dashboard');
      } else {
        router.push('/dashboard');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFC] text-slate-900 flex flex-col justify-center items-center px-4 font-sans selection:bg-indigo-600 selection:text-white relative overflow-hidden">
      <div className="w-full max-w-md space-y-6 relative z-10 my-12">
        {/* Logo */}
        <div className="flex flex-col items-center text-center space-y-2">
          <Link href="/" className="relative w-44 h-11">
            <Image
              src="/Logo.png"
              alt="Cowork30 Logo"
              fill
              sizes="200px"
              className="object-contain"
              priority
            />
          </Link>
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-3 py-0.5 rounded-full border border-indigo-100">
            Member Portal Sign In
          </span>
        </div>

        {/* Login Card */}
        <div className="bg-white p-8 rounded-3xl border border-slate-200/90 shadow-sm space-y-5">
          <div className="space-y-1">
            <h2 className="text-xl font-extrabold text-slate-900">Welcome Back</h2>
            <p className="text-xs text-slate-500">
              Enter your credentials to access your active bookings & wallet balance.
            </p>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="member@company.com"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-slate-900 focus:border-indigo-600 focus:bg-white focus:outline-none transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-slate-900 focus:border-indigo-600 focus:bg-white focus:outline-none transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-full text-xs font-bold text-white bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 hover:opacity-95 shadow-md shadow-pink-500/20 transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In to Dashboard'}</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>
          </form>

          {/* Registration Link */}
          <div className="pt-3 border-t border-slate-100 text-center space-y-2">
            <p className="text-[11px] text-slate-500 font-medium">Don't have an account yet?</p>
            <Link
              href="/register"
              className="inline-flex items-center space-x-1.5 text-xs font-bold text-indigo-600 hover:underline"
            >
              {welcomeBonus > 0 ? (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Register Account & Get ₹{welcomeBonus.toLocaleString()} Welcome Credit</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Create New Member Account</span>
                </>
              )}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
