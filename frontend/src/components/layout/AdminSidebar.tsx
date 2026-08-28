'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Calendar,
  Compass,
  FileText,
  Building2,
  Camera,
  Settings,
  LogOut,
  ShieldCheck,
  Users,
  AlertTriangle,
  CreditCard,
  Menu,
  X,
  ExternalLink,
  MapPin,
  Briefcase,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function AdminSidebar() {
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

      if (!storedToken || !currentUser || currentUser.role !== 'admin') {
        setAuthorized(false);
        if (pathname !== '/admin/login') {
          router.push('/admin/login');
        }
      } else {
        setAuthorized(true);
      }
    }
  }, [user, token, isLoading, pathname, router]);

  // Close mobile sidebar drawer when pathname changes
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const handleLogout = () => {
    logout();
    if (typeof window !== 'undefined') {
      localStorage.removeItem('access_token');
      localStorage.removeItem('user_info');
    }
    router.push('/admin/login');
  };

  const navItems = [
    { label: 'Executive Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'Branch Locations', href: '/admin/branches', icon: MapPin },
    { label: 'User Directory & Wallet', href: '/admin/users', icon: Users },
    { label: 'Wallet Proof Approvals', href: '/admin/wallet-requests', icon: CreditCard },
    { label: 'Desk & Tour Bookings', href: '/admin/bookings', icon: Calendar },
    { label: 'Meeting Rooms Engine', href: '/admin/meeting-rooms', icon: Building2 },
    { label: 'Floor Map & Desks', href: '/admin/floor-map', icon: Compass },
    { label: 'Workspace Services', href: '/admin/services', icon: FileText },
    { label: 'Service Inquiries', href: '/admin/service-inquiries', icon: Briefcase },
    { label: 'Pricing Tiers', href: '/admin/pricing', icon: ShieldCheck },
    { label: 'Photo Gallery', href: '/admin/gallery', icon: Camera },
    { label: 'Branding & Settings', href: '/admin/settings', icon: Settings },
  ];

  if (!authorized && pathname !== '/admin/login') {
    return (
      <aside className="w-64 bg-[#020617] border-r border-[#334155] p-6 flex flex-col items-center justify-center space-y-4 shrink-0 min-h-screen text-center">
        <AlertTriangle className="w-8 h-8 text-amber-400" />
        <p className="text-xs font-bold text-[#F8FAFC]">Verifying Admin Credentials...</p>
      </aside>
    );
  }

  return (
    <>
      {/* Mobile Top Navigation Header (< 768px) */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-[#020617]/95 border-b border-[#334155] backdrop-blur-md px-4 py-3 flex items-center justify-between shadow-md">
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="p-2 rounded-xl bg-[#1E293B] border border-[#334155] text-[#CBD5E1] hover:text-[#F8FAFC] cursor-pointer"
          >
            <Menu className="w-5 h-5" />
          </button>

          <Link href="/admin/dashboard" className="relative w-28 h-8 block">
            <Image
              src="/Logo.png"
              alt="Cowork30 Admin Logo"
              fill
              sizes="112px"
              className="object-contain object-left"
              priority
            />
          </Link>
        </div>

        <div className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-[#6366F1]/10 text-[10px] font-bold text-[#6366F1] border border-[#6366F1]/30">
          <ShieldCheck className="w-3 h-3" />
          <span>Admin Portal</span>
        </div>
      </div>

      {/* Mobile Slide-Over Sidebar Drawer (< 768px) */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-[#0F172A]/80 backdrop-blur-xs" onClick={() => setMobileOpen(false)} />

          <div className="relative w-72 max-w-xs bg-[#020617] border-r border-[#334155] p-5 flex flex-col justify-between z-10 space-y-6 shadow-2xl h-full">
            <div className="space-y-6 overflow-y-auto">
              <div className="flex items-center justify-between border-b border-[#334155] pb-4">
                <div className="relative w-32 h-9">
                  <Image
                    src="/Logo.png"
                    alt="Cowork30 Logo"
                    fill
                    sizes="128px"
                    className="object-contain object-left"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  className="p-1.5 rounded-lg bg-[#1E293B] text-[#94A3B8] hover:text-[#F8FAFC]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* User Info Pill */}
              {user && (
                <div className="p-3 rounded-xl bg-[#1E293B] border border-[#334155] flex items-center space-x-3 text-xs">
                  <div className="w-8 h-8 rounded-full bg-[#6366F1] flex items-center justify-center text-white font-bold shrink-0">
                    {user.name ? user.name.charAt(0).toUpperCase() : 'A'}
                  </div>
                  <div className="truncate">
                    <p className="font-bold text-[#F8FAFC] truncate">{user.name || 'System Admin'}</p>
                    <p className="text-[10px] text-[#F59E0B] font-mono font-bold uppercase truncate">{user.role} Account</p>
                  </div>
                </div>
              )}

              <nav className="space-y-1 text-xs font-medium">
                {navItems.map((item) => {
                  const isActive = pathname === item.href;
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl transition-all ${
                        isActive
                          ? 'bg-[#6366F1] text-white font-bold shadow-md shadow-[#6366F1]/30'
                          : 'text-[#CBD5E1] hover:text-[#F8FAFC] hover:bg-[#1E293B]'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-[#94A3B8]'}`} />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>

            <div className="pt-4 border-t border-[#334155] space-y-2">
              <Link
                href="/"
                className="flex items-center space-x-2 text-xs text-[#94A3B8] hover:text-[#F8FAFC] px-2 py-1"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>View Public Member Site</span>
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center space-x-2 text-xs text-[#F43F5E] hover:bg-[#F43F5E]/10 p-2 rounded-xl transition-colors font-bold cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out Admin</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Permanent Sidebar (>= 768px) */}
      <aside className="w-64 bg-[#020617] border-r border-[#334155] p-6 flex-col justify-between hidden md:flex shrink-0 min-h-screen">
        <div className="space-y-6">
          {/* Brand Logo */}
          <div className="space-y-2">
            <div className="relative w-36 h-10">
              <Image
                src="/Logo.png"
                alt="Cowork30 Admin Logo"
                fill
                sizes="144px"
                className="object-contain object-left"
                priority
              />
            </div>
            <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-[#6366F1]/10 text-[10px] font-bold text-[#6366F1] border border-[#6366F1]/30">
              <ShieldCheck className="w-3 h-3" />
              <span>Admin Control Portal</span>
            </div>
          </div>

          {/* User Info Card */}
          {user && (
            <div className="p-3 rounded-xl bg-[#1E293B] border border-[#334155] flex items-center space-x-3 text-xs">
              <div className="w-8 h-8 rounded-full bg-[#6366F1] flex items-center justify-center text-white font-bold shrink-0">
                {user.name ? user.name.charAt(0).toUpperCase() : 'A'}
              </div>
              <div className="truncate">
                <p className="font-bold text-[#F8FAFC] truncate">{user.name || 'System Admin'}</p>
                <p className="text-[10px] text-[#F59E0B] font-mono font-bold uppercase truncate">{user.role} Account</p>
              </div>
            </div>
          )}

          {/* Navigation Items */}
          <nav className="space-y-1 text-xs font-medium">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl transition-all ${
                    isActive
                      ? 'bg-[#6366F1] text-white font-bold shadow-md shadow-[#6366F1]/25'
                      : 'text-[#CBD5E1] hover:text-[#F8FAFC] hover:bg-[#1E293B]'
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
            className="flex items-center space-x-2 text-xs text-[#94A3B8] hover:text-[#F8FAFC] transition-colors px-2 py-1"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>View Public Member Site</span>
          </Link>

          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center space-x-2 text-xs text-[#F43F5E] hover:bg-[#F43F5E]/10 p-2 rounded-xl transition-colors font-bold cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out Admin</span>
          </button>
        </div>
      </aside>
    </>
  );
}
