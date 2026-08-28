'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Lock, Mail, ShieldCheck, ArrowRight, AlertCircle } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { useAuth } from '@/context/AuthContext';

export default function AdminLoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState('admin@cowork30.com');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      const res = await apiClient.post('/auth/admin/login', { email, password });
      if (res.data?.accessToken && res.data?.user) {
        const user = res.data.user;
        if (user.role !== 'admin') {
          setErrorMsg('Access Denied: Account does not have administrator authorization.');
          return;
        }

        localStorage.setItem('token', res.data.accessToken);
        localStorage.setItem('access_token', res.data.accessToken);
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('user_info', JSON.stringify(user));
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${res.data.accessToken}`;

        router.push('/admin/dashboard');
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Invalid administrator credentials');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = () => {
    setEmail('admin@cowork30.com');
    setPassword('admin123');
  };

  return (
    <div className="min-h-screen bg-[#0F172A] text-[#F8FAFC] flex items-center justify-center p-4 selection:bg-[#6366F1] selection:text-white font-sans relative overflow-hidden">
      <div className="max-w-md w-full bg-[#1E293B] p-8 sm:p-10 rounded-3xl space-y-6 border border-[#334155] relative z-10 shadow-2xl">
        {/* Brand Header */}
        <div className="text-center space-y-3">
          <div className="relative w-44 h-12 mx-auto">
            <Image
              src="/Logo.png"
              alt="Cowork30 Logo"
              fill
              sizes="176px"
              className="object-contain"
              priority
            />
          </div>
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[#6366F1]/10 text-[#6366F1] border border-[#6366F1]/30 text-xs font-bold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Admin Control Portal Authentication</span>
          </div>
        </div>

        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-[#F43F5E]/10 border border-[#F43F5E]/30 text-[#F43F5E] text-xs text-center font-bold flex items-center justify-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs">
          <div className="space-y-1.5">
            <label className="block text-[#CBD5E1] font-semibold">Admin Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@cowork30.com"
                className="w-full bg-[#0F172A] border border-[#334155] rounded-xl pl-10 pr-3 py-2.5 text-[#F8FAFC] focus:border-[#6366F1] focus:outline-none transition-colors"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-[#CBD5E1] font-semibold">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#0F172A] border border-[#334155] rounded-xl pl-10 pr-3 py-2.5 text-[#F8FAFC] focus:border-[#6366F1] focus:outline-none transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-full text-xs font-bold text-white bg-[#6366F1] hover:bg-[#4F46E5] transition-all shadow-md shadow-[#6366F1]/25 flex items-center justify-center space-x-2 cursor-pointer"
          >
            <span>{loading ? 'Authenticating Role...' : 'Sign In to Executive Portal'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Quick Demo Fill Button */}
        <div className="pt-2 text-center">
          <button
            type="button"
            onClick={handleQuickFill}
            className="text-[11px] text-[#94A3B8] hover:text-[#6366F1] underline transition-colors cursor-pointer"
          >
            Auto-Fill Admin Credentials (`admin@cowork30.com`)
          </button>
        </div>
      </div>
    </div>
  );
}
