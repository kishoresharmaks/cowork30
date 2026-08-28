'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Calendar,
  Building2,
  CreditCard,
  LogOut,
  AlertTriangle,
  UserCheck,
  BarChart3,
  Menu,
  X,
  Globe,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function StaffSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, token, logout, isLoading } = useAuth();
  const [authorized, setAuthorized] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      const storedToken = token || localStorage.getItem('token') || localStorage.getItem('access_token');
      const userStr = localStorage.getItem('user') || localStorage.getItem('user_info');
      let currentUser = user;

      if (!currentUser && userStr) {
        try {
          currentUser = JSON.parse(userStr);
        } catch (e) {}
      }

      if (!storedToken || !currentUser || (currentUser.role !== 'staff' && currentUser.role !== 'admin')) {
        setAuthorized(false);
        if (pathname !== '/staff/login') {
          router.push('/staff/login');
        }
      } else {
        setAuthorized(true);
      }
    }
  }, [user, token, isLoading, pathname, router]);

  const handleLogout = () => {
    logout();
    if (typeof window !== 'undefined') {
      localStorage.removeItem('access_token');
      localStorage.removeItem('user_info');
    }
    router.push('/staff/login');
  };

  const navItems = [
    { label: 'Staff Dashboard', href: '/staff/dashboard', icon: LayoutDashboard },
    { label: 'Wallet Proof Approvals', href: '/staff/wallet-requests', icon: CreditCard },
    { label: 'Meeting Rooms Engine', href: '/staff/meeting-rooms', icon: Building2 },
    { label: 'Desk & Tour Bookings', href: '/staff/bookings', icon: Calendar },
    { label: 'Reports & Analytics', href: '/staff/reports', icon: BarChart3 },
  ];

  if (!authorized && pathname !== '/staff/login') {
    return (
      <aside className="w-64 bg-[#0F172A] border-r border-[#334155] p-6 flex flex-col items-center justify-center space-y-4 shrink-0 min-h-screen text-center">
        <AlertTriangle className="w-8 h-8 text-[#F59E0B]" />
        <p className="text-xs font-bold text-[#F8FAFC]">Verifying Staff Permissions...</p>
      </aside>
    );
  }

  return (
    <>
      {/* Mobile Header Bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-[#0F172A] border-b border-[#334155] px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="relative w-28 h-8">
            <Image
              src="/Logo.png"
              alt="Cowork30 Logo"
              fill
              sizes="112px"
              className="object-contain object-left"
              priority
            />
          </div>
          <span className="text-[10px] font-bold text-[#6366F1] px-2 py-0.5 rounded-full bg-[#6366F1]/10 border border-[#6366F1]/30">
            STAFF
          </span>
        </div>

        <button
          type="button"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 rounded-xl bg-[#1E293B] border border-[#334155] text-[#94A3B8] hover:text-[#F8FAFC]"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Drawer Backdrop */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/80 backdrop-blur-xs"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`w-64 bg-[#0F172A] border-r border-[#334155] p-6 flex flex-col justify-between shrink-0 min-h-screen z-50 fixed md:sticky top-0 transition-transform duration-300 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="space-y-8">
          {/* Brand Logo & Pill */}
          <div className="space-y-2">
            <div className="relative w-36 h-10">
              <Image
                src="/Logo.png"
                alt="Cowork30 Staff Logo"
                fill
                sizes="144px"
                className="object-contain object-left"
                priority
              />
            </div>
            <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-[#6366F1]/10 text-[10px] font-bold text-[#6366F1] border border-[#6366F1]/30">
              <UserCheck className="w-3 h-3" />
              <span>Staff Operations Portal</span>
            </div>
          </div>

          {/* User Info Card */}
          {user && (
            <div className="p-3 rounded-2xl bg-[#1E293B] border border-[#334155] flex items-center space-x-3 text-xs">
              <div className="w-9 h-9 rounded-xl bg-[#6366F1]/10 border border-[#6366F1]/30 text-[#6366F1] flex items-center justify-center font-extrabold text-sm">
                {user.name ? user.name.charAt(0).toUpperCase() : 'S'}
              </div>
              <div className="truncate">
                <p className="font-extrabold text-[#F8FAFC] truncate">{user.name || 'Staff Member'}</p>
                <p className="text-[10px] text-[#6366F1] font-mono font-bold uppercase truncate">{user.role} Account</p>
              </div>
            </div>
          )}

          {/* Navigation Items */}
          <nav className="space-y-1 text-xs font-semibold">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center space-x-3 px-3.5 py-2.5 rounded-xl transition-all ${
                    isActive
                      ? 'bg-[#6366F1] text-white font-bold shadow-md shadow-[#6366F1]/20'
                      : 'text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#1E293B]'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-[#94A3B8]'}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-[#334155] space-y-2">
          <Link
            href="/"
            className="flex items-center space-x-2 text-xs text-[#94A3B8] hover:text-[#F8FAFC] transition-colors px-2 py-1 font-semibold"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>View Public Site</span>
          </Link>

          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center space-x-2 text-xs text-[#F43F5E] hover:text-rose-300 hover:bg-[#F43F5E]/10 p-2 rounded-xl transition-colors font-bold cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out Staff</span>
          </button>
        </div>
      </aside>
    </>
  );
}
