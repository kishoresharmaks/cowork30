'use client';

import React from 'react';
import Link from 'next/link';
import {
  LayoutDashboard,
  Sparkles,
  Armchair,
  Users,
  Wallet,
  User,
  ShieldCheck,
  ChevronRight,
  LogOut,
  CreditCard,
  Building2,
  Calendar,
  FileText,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export type MemberTabType =
  | 'overview'
  | 'inquiries'
  | 'desks'
  | 'meetings'
  | 'wallet'
  | 'profile';

interface MemberSidebarProps {
  activeTab: MemberTabType;
  onTabChange: (tab: MemberTabType) => void;
  counts?: {
    inquiries: number;
    desks: number;
    meetings: number;
  };
}

export default function MemberSidebar({
  activeTab,
  onTabChange,
  counts = { inquiries: 0, desks: 0, meetings: 0 },
}: MemberSidebarProps) {
  const { user, logout } = useAuth();

  const menuItems = [
    {
      id: 'overview' as MemberTabType,
      label: 'Portal Overview',
      icon: LayoutDashboard,
      badge: null,
      description: 'Account summary & quick actions',
    },
    {
      id: 'inquiries' as MemberTabType,
      label: 'Solution Quotes',
      icon: Sparkles,
      badge: counts.inquiries > 0 ? counts.inquiries : null,
      badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      description: 'Corporate team quotes & live chat',
    },
    {
      id: 'desks' as MemberTabType,
      label: 'Desk Passes',
      icon: Armchair,
      badge: counts.desks > 0 ? counts.desks : null,
      badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
      description: 'Dedicated, Hot & Cabin desk passes',
    },
    {
      id: 'meetings' as MemberTabType,
      label: 'Meeting Bookings',
      icon: Users,
      badge: counts.meetings > 0 ? counts.meetings : null,
      badgeColor: 'bg-sky-50 text-sky-700 border-sky-200',
      description: 'Conference & hourly meeting rooms',
    },
    {
      id: 'wallet' as MemberTabType,
      label: 'Wallet & Billing',
      icon: Wallet,
      badge: null,
      description: 'Top-up, credits & GST tax invoices',
    },
    {
      id: 'profile' as MemberTabType,
      label: 'Profile & Settings',
      icon: User,
      badge: null,
      description: 'Personal, company & GSTIN settings',
    },
  ];

  return (
    <aside className="w-full lg:w-72 shrink-0 bg-white border border-slate-200/90 rounded-3xl p-4 sm:p-5 shadow-xs space-y-6 flex flex-col justify-between">
      <div className="space-y-5">
        {/* User Mini Profile Header */}
        {user && (
          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white space-y-3 shadow-md relative overflow-hidden">
            <div className="flex items-center space-x-3">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center font-black text-lg text-white shadow-inner border border-white/20 shrink-0">
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.name}
                    className="w-full h-full object-cover rounded-xl"
                  />
                ) : (
                  user.name.charAt(0).toUpperCase()
                )}
              </div>
              <div className="truncate">
                <div className="flex items-center space-x-1.5 truncate">
                  <h4 className="font-extrabold text-sm truncate text-slate-100">{user.name}</h4>
                </div>
                <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
                <span className="inline-flex items-center space-x-1 mt-1 px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  <ShieldCheck className="w-2.5 h-2.5" />
                  <span>Member Portal</span>
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Vertical Navigation Items */}
        <div className="space-y-1">
          <p className="px-3 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 pb-1">
            Navigation Menu
          </p>

          <nav className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onTabChange(item.id)}
                  className={`w-full flex items-center justify-between p-3 rounded-2xl text-xs font-bold transition-all group cursor-pointer ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20 translate-x-1'
                      : 'text-slate-700 hover:bg-slate-50 hover:text-indigo-600'
                  }`}
                >
                  <div className="flex items-center space-x-3 truncate">
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : 'bg-slate-100 text-slate-600 group-hover:bg-indigo-50 group-hover:text-indigo-600'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="text-left truncate">
                      <p className="font-extrabold leading-tight">{item.label}</p>
                      <p
                        className={`text-[10px] font-medium leading-tight truncate ${
                          isActive ? 'text-indigo-100' : 'text-slate-400'
                        }`}
                      >
                        {item.description}
                      </p>
                    </div>
                  </div>

                  {item.badge !== null && (
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border shrink-0 ${
                        isActive
                          ? 'bg-white/20 text-white border-white/30'
                          : item.badgeColor || 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Sidebar Footer Wallet Quick Info */}
      {user && (
        <div className="pt-4 border-t border-slate-100 space-y-3">
          <div className="bg-slate-50 border border-slate-200/80 p-3.5 rounded-2xl flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Wallet Credit</span>
              <span className="text-sm font-black text-emerald-600">
                ₹{user.walletBalance ? Number(user.walletBalance).toLocaleString() : '0'}
              </span>
            </div>
            <button
              onClick={() => onTabChange('wallet')}
              className="px-2.5 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-[10px] transition-all cursor-pointer"
            >
              Top Up
            </button>
          </div>

          <button
            onClick={() => logout()}
            className="w-full flex items-center justify-center space-x-2 py-2 text-xs font-extrabold text-rose-600 hover:bg-rose-50 rounded-xl transition-all cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      )}
    </aside>
  );
}
