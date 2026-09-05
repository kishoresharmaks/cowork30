'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  MapPin,
  Calendar,
  CalendarCheck,
  Compass,
  Menu,
  X,
  User,
  LogOut,
  LayoutDashboard,
  Wallet,
  ChevronDown,
  Sparkles,
  Briefcase,
  Crown,
  Presentation,
  Map,
  Aperture,
  ShieldAlert,
  Bell,
  Home,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useBranch } from '@/context/BranchContext';
import { useNotifications, NotificationsPopover } from '@/features/notifications';

export default function Navbar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { branches, activeBranch, setActiveBranch } = useBranch();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [branchDropdownOpen, setBranchDropdownOpen] = useState(false);
  const [mobileBranchOpen, setMobileBranchOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [desktopNotificationsOpen, setDesktopNotificationsOpen] = useState(false);

  const {
    notifications,
    unreadCount,
    isConnected,
    isLoading: notificationsLoading,
    markAsRead,
    markAllAsRead,
  } = useNotifications();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { href: '/services', label: 'Services', icon: Briefcase },
    { href: '/pricing', label: 'Pricing Plans', icon: Crown },
    { href: '/meeting-rooms', label: 'Meeting Rooms', icon: Presentation },
    { href: '/floor-map', label: 'Interactive Map', icon: Map },
    { href: '/gallery', label: 'Gallery', icon: Aperture },
  ];

  const getBranchTitleParts = (name: string, city?: string) => {
    const parts = name.split(' ');
    if (parts.length > 1) {
      return { main: parts[0], sub: parts.slice(1).join(' ') };
    }
    return { main: name, sub: city || 'Branch' };
  };

  const branchTitle = activeBranch
    ? getBranchTitleParts(activeBranch.name, activeBranch.city)
    : { main: 'Select', sub: 'Location' };

  return (
    <>
      {/* Spacer div so page content isn't covered by fixed navbar */}
      <div className="h-16 sm:h-20 lg:h-24" />

      {/* Desktop & Mobile Header Container */}
      <header className="fixed top-0 left-0 right-0 z-50 px-2 sm:px-4 lg:px-8 py-2.5 transition-all">
        <div className="max-w-[1340px] mx-auto">
          {/* DESKTOP NAVBAR (lg:flex) - Floating Curved Dock Bar */}
          <div
            className={`hidden lg:flex items-center justify-between px-6 py-2.5 rounded-[26px] transition-all duration-300 ${
              scrolled
                ? 'bg-white/95 backdrop-blur-2xl border border-slate-200/90 shadow-lg shadow-purple-950/5'
                : 'bg-white/95 backdrop-blur-xl border border-slate-100 shadow-md shadow-purple-950/5'
            }`}
          >
            {/* 1. Brand Logo & Location Selector Pill */}
            <div className="flex items-center space-x-4">
              <Link href="/" className="flex items-center space-x-2 group shrink-0">
                <div className="relative w-36 h-9 transition-transform group-hover:scale-105">
                  <Image
                    src="/Logo.png"
                    alt="Cowork30 Logo"
                    fill
                    sizes="150px"
                    className="object-contain object-left"
                    priority
                  />
                </div>
              </Link>

              {/* Dynamic Location Selector */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setBranchDropdownOpen(!branchDropdownOpen)}
                  className="flex items-center space-x-2 px-3.5 py-1.5 rounded-2xl bg-[#FDF4F8] hover:bg-pink-100/60 border border-pink-100/80 transition-all text-left group cursor-pointer"
                >
                  <div className="w-6 h-6 rounded-xl bg-pink-100 text-pink-600 flex items-center justify-center shrink-0">
                    <MapPin className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <p className="text-[11px] font-extrabold text-slate-900 leading-tight">{branchTitle.main}</p>
                    <p className="text-[9px] font-semibold text-slate-500 leading-tight">{branchTitle.sub}</p>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 ml-1" />
                </button>

                {branchDropdownOpen && (
                  <div className="absolute left-0 mt-2 w-64 bg-white rounded-2xl p-2 border border-slate-200 shadow-xl space-y-1 text-xs z-50 animate-in fade-in slide-in-from-top-2 max-h-72 overflow-y-auto">
                    <div className="px-3 py-1.5 text-[10px] font-bold uppercase text-slate-400">Select Active Branch</div>
                    {branches.map((branch) => {
                      const isSelected = activeBranch?.id === branch.id;
                      return (
                        <button
                          key={branch.id}
                          type="button"
                          onClick={() => {
                            setActiveBranch(branch);
                            setBranchDropdownOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition-all ${
                            isSelected
                              ? 'bg-pink-50 text-pink-700 font-extrabold border border-pink-100'
                              : 'hover:bg-slate-50 text-slate-700 font-semibold'
                          }`}
                        >
                          <div className="flex items-center space-x-2 truncate">
                            <MapPin className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-pink-600' : 'text-slate-400'}`} />
                            <div className="truncate">
                              <p className="truncate leading-tight font-bold">{branch.name}</p>
                              <p className="text-[9px] font-normal text-slate-500 truncate leading-tight">{branch.city}, {branch.state}</p>
                            </div>
                          </div>
                          {isSelected && <span className="w-2 h-2 rounded-full bg-pink-600 shrink-0 ml-1" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* 2. Center Navigation Links (Vertical Icon on Top + Label Below) */}
            <nav className="flex items-center space-x-1 sm:space-x-1.5">
              {navLinks.map((link, idx) => {
                const Icon = link.icon;
                const isActive = pathname === link.href;

                return (
                  <Link
                    key={`${link.href}-${idx}`}
                    href={link.href}
                    className={`relative flex flex-col items-center justify-center px-3.5 py-1.5 rounded-2xl transition-all duration-200 group ${
                      isActive
                        ? 'bg-purple-100/70 text-purple-700 font-extrabold'
                        : 'hover:bg-slate-50 text-slate-600 hover:text-slate-900 font-bold'
                    }`}
                  >
                    <Icon
                      className={`w-[19px] h-[19px] transition-all duration-200 group-hover:scale-115 ${
                        isActive ? 'text-purple-700 stroke-[2.2]' : 'text-slate-500 group-hover:text-purple-600 stroke-[1.9]'
                      }`}
                    />
                    <span className="text-[11px] leading-tight mt-0.5 whitespace-nowrap">{link.label}</span>

                    {/* Active Underline Indicator Bar */}
                    {isActive && (
                      <span className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 w-7 h-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full shadow-xs" />
                    )}
                  </Link>
                );
              })}

              {user && (
                <Link
                  href="/bookings"
                  className={`relative flex flex-col items-center justify-center px-3.5 py-1.5 rounded-2xl transition-all duration-200 group ${
                    pathname === '/bookings'
                      ? 'bg-purple-100/70 text-purple-700 font-extrabold'
                      : 'hover:bg-slate-50 text-slate-600 hover:text-slate-900 font-bold'
                  }`}
                >
                  <CalendarCheck
                    className={`w-[19px] h-[19px] transition-all duration-200 group-hover:scale-115 ${
                      pathname === '/bookings' ? 'text-purple-700 stroke-[2.2]' : 'text-slate-500 group-hover:text-purple-600 stroke-[1.9]'
                    }`}
                  />
                  <span className="text-[11px] leading-tight mt-0.5 whitespace-nowrap">My Bookings</span>

                  {pathname === '/bookings' && (
                    <span className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 w-7 h-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full shadow-xs" />
                  )}
                </Link>
              )}
            </nav>

            {/* 3. User & Wallet Action Section (Right Side) */}
            <div className="flex items-center space-x-2.5">
              {/* Desktop Live Notifications Bell */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setDesktopNotificationsOpen(!desktopNotificationsOpen);
                    setUserDropdownOpen(false);
                    setBranchDropdownOpen(false);
                  }}
                  className="relative p-2 rounded-2xl bg-slate-100/90 hover:bg-purple-50 text-slate-700 hover:text-purple-700 transition-all cursor-pointer shadow-2xs"
                  title="Live Notifications"
                >
                  <Bell className="w-4 h-4" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[17px] h-[17px] px-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-[9px] font-black rounded-full flex items-center justify-center shadow-xs animate-pulse ring-2 ring-white">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                {desktopNotificationsOpen && (
                  <NotificationsPopover
                    notifications={notifications}
                    unreadCount={unreadCount}
                    isConnected={isConnected}
                    isLoading={notificationsLoading}
                    onMarkAsRead={markAsRead}
                    onMarkAllAsRead={markAllAsRead}
                    onClose={() => setDesktopNotificationsOpen(false)}
                    align="right"
                  />
                )}
              </div>

              {user ? (
                <div className="relative flex items-center space-x-2">
                  {/* User Profile Pill */}
                  <button
                    type="button"
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    className="flex items-center space-x-2 px-3 py-1.5 rounded-2xl bg-slate-100/80 hover:bg-slate-200/80 transition-all text-xs font-extrabold text-slate-900 cursor-pointer"
                  >
                    <div className="w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center font-black text-xs shadow-2xs">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="max-w-[80px] truncate">{user.name.split(' ')[0]}</span>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                  </button>

                  {/* Wallet Balance Pill */}
                  <Link
                    href="/dashboard?tab=wallet"
                    className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-2xl bg-[#ECFDF5] hover:bg-emerald-100/80 border border-emerald-200/80 transition-all text-emerald-700 text-xs font-black cursor-pointer shadow-2xs"
                  >
                    <Wallet className="w-3.5 h-3.5 text-emerald-600" />
                    <span>₹{Number(user.walletBalance || 0).toLocaleString()}</span>
                  </Link>

                  {/* User Dropdown Menu */}
                  {userDropdownOpen && (
                    <div className="absolute right-0 top-12 w-60 bg-white/98 backdrop-blur-2xl rounded-2xl p-2 border border-slate-200 shadow-2xl space-y-1 text-xs z-50 animate-in fade-in slide-in-from-top-2">
                      <div className="px-3 py-2 border-b border-slate-100 bg-slate-50/60 rounded-xl mb-1">
                        <div className="flex items-center justify-between">
                          <p className="font-black text-slate-900 truncate">{user.name}</p>
                          <span className="px-2 py-0.2 rounded-full text-[9px] font-black uppercase bg-purple-100 text-purple-700">
                            {user.role || 'Member'}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 truncate mt-0.5">{user.email}</p>
                      </div>

                      <Link
                        href="/dashboard"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center space-x-2.5 px-3 py-2 rounded-xl text-slate-700 hover:bg-purple-50 hover:text-purple-700 transition-colors font-bold"
                      >
                        <LayoutDashboard className="w-4 h-4 text-purple-600" />
                        <span>Member Dashboard</span>
                      </Link>

                      <Link
                        href="/bookings"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center space-x-2.5 px-3 py-2 rounded-xl text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors font-bold"
                      >
                        <Calendar className="w-4 h-4 text-indigo-600" />
                        <span>My Reservations</span>
                      </Link>

                      <Link
                        href="/dashboard?tab=wallet"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center space-x-2.5 px-3 py-2 rounded-xl text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors font-bold"
                      >
                        <Wallet className="w-4 h-4 text-emerald-600" />
                        <span>Wallet & Invoices</span>
                      </Link>

                      <Link
                        href="/dashboard?tab=profile"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center space-x-2.5 px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors font-bold"
                      >
                        <User className="w-4 h-4 text-slate-500" />
                        <span>Profile Settings</span>
                      </Link>

                      {(user.role === 'admin' || user.role === 'staff') && (
                        <Link
                          href={user.role === 'admin' ? '/admin/dashboard' : '/staff/dashboard'}
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center space-x-2.5 px-3 py-2 rounded-xl text-amber-800 bg-amber-50 border border-amber-200/80 font-extrabold my-1"
                        >
                          <ShieldAlert className="w-4 h-4 text-amber-600" />
                          <span>{user.role === 'admin' ? 'Admin Portal' : 'Staff Dashboard'}</span>
                        </Link>
                      )}

                      <div className="pt-1 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => {
                            setUserDropdownOpen(false);
                            logout();
                          }}
                          className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-rose-600 hover:bg-rose-50 transition-colors text-left font-bold cursor-pointer"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Sign Out Account</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Link
                    href="/login"
                    className="px-4 py-2 text-xs font-extrabold rounded-2xl border border-slate-200/90 bg-white hover:bg-slate-50 transition-all text-slate-700 hover:text-slate-900 shadow-2xs"
                  >
                    Sign In
                  </Link>

                  <Link
                    href="/register"
                    className="px-4.5 py-2 text-xs font-extrabold rounded-2xl text-white bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 hover:opacity-95 transition-all shadow-md shadow-pink-500/20 flex items-center space-x-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Register Free</span>
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* MOBILE TOP HEADER BAR (Dynamic Island Style - Pure Frosted Glass) */}
          <div className="lg:hidden relative">
            <div className="bg-white/85 backdrop-blur-2xl rounded-full px-3 py-1.5 border border-white/80 shadow-[0_4px_20px_rgba(0,0,0,0.05)] flex items-center justify-between gap-2">
              {/* Left: Brand Logo + Interactive Branch Chip Cluster */}
              <div className="flex items-center gap-2 shrink-0">
                <Link href="/" className="flex items-center shrink-0">
                  <div className="relative w-[48px] h-7">
                    <Image src="/Logo.png" alt="Cowork30 Logo" fill sizes="60px" className="object-contain" priority />
                  </div>
                </Link>

                <button
                  type="button"
                  onClick={() => {
                    setMobileBranchOpen(!mobileBranchOpen);
                    setNotificationsOpen(false);
                  }}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100/90 hover:bg-purple-50 active:bg-purple-100 border border-slate-200/80 text-slate-800 transition-all cursor-pointer text-[11px] font-extrabold max-w-[125px] truncate shadow-2xs"
                >
                  <MapPin className="w-3.5 h-3.5 text-pink-600 shrink-0" />
                  <span className="truncate">{activeBranch?.name ? activeBranch.name.replace(' Branch', '').replace(' Coworking', '') : 'Downtown'}</span>
                  <ChevronDown className={`w-3 h-3 text-slate-400 shrink-0 transition-transform ${mobileBranchOpen ? 'rotate-180' : ''}`} />
                </button>
              </div>

              {/* Right: User / Wallet or Sign In + Hamburger Toggle */}
              <div className="flex items-center gap-1.5 shrink-0">
                {user ? (
                  <div className="flex items-center gap-1.5">
                    {/* Quick Wallet Pill */}
                    <Link
                      href="/dashboard?tab=wallet"
                      className="hidden xs:flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-700 text-[10px] font-black"
                    >
                      <Wallet className="w-3 h-3 text-emerald-600" />
                      <span>₹{Number(user.walletBalance || 0).toLocaleString('en-IN')}</span>
                    </Link>

                    {/* Member Notifications Icon */}
                    <button
                      type="button"
                      onClick={() => {
                        setNotificationsOpen(!notificationsOpen);
                        setMobileBranchOpen(false);
                      }}
                      className="relative p-1.5 rounded-full bg-slate-100 hover:bg-slate-200/80 text-slate-700 transition-all cursor-pointer"
                      title="Live Notifications"
                    >
                      <Bell className="w-3.5 h-3.5" />
                      {unreadCount > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 min-w-[15px] h-[15px] px-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-[8px] font-black rounded-full flex items-center justify-center shadow-xs animate-pulse ring-1 ring-white">
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                      )}
                    </button>

                    {/* User Avatar Circle */}
                    <Link
                      href="/dashboard"
                      className="w-7 h-7 rounded-full bg-gradient-to-tr from-purple-600 to-pink-600 text-white flex items-center justify-center font-black text-xs shadow-xs"
                      title={user.name}
                    >
                      {user.name.charAt(0).toUpperCase()}
                    </Link>
                  </div>
                ) : (
                  <Link
                    href="/login"
                    className="px-3 py-1 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-white text-[11px] font-bold shadow-xs hover:opacity-95 transition-all"
                  >
                    Sign In
                  </Link>
                )}

                {/* Modern Circular Menu Toggle Button */}
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(!mobileMenuOpen);
                    setMobileBranchOpen(false);
                    setNotificationsOpen(false);
                  }}
                  className={`w-7 h-7 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                    mobileMenuOpen
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                  aria-label="Toggle Navigation Menu"
                >
                  {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Quick Floating Branch Selector Dropdown from the Dynamic Island */}
            {mobileBranchOpen && (
              <div className="absolute top-12 left-1/2 -translate-x-1/2 w-[92vw] max-w-sm bg-white/98 backdrop-blur-2xl rounded-2xl p-2.5 border border-slate-200 shadow-2xl space-y-1.5 text-xs z-50 animate-in fade-in slide-in-from-top-2">
                <div className="px-3 py-1.5 border-b border-slate-100 flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Select Branch Location</span>
                  <button
                    type="button"
                    onClick={() => setMobileBranchOpen(false)}
                    className="text-slate-400 hover:text-slate-700 text-xs font-bold"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-1 max-h-56 overflow-y-auto">
                  {branches.map((branch) => {
                    const isSelected = activeBranch?.id === branch.id;
                    return (
                      <button
                        key={branch.id}
                        type="button"
                        onClick={() => {
                          setActiveBranch(branch);
                          setMobileBranchOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-all ${
                          isSelected
                            ? 'bg-purple-50 text-purple-700 font-extrabold border border-purple-100 shadow-2xs'
                            : 'hover:bg-slate-50 text-slate-700 font-medium'
                        }`}
                      >
                        <div className="flex items-center space-x-2.5 truncate">
                          <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${isSelected ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                            <MapPin className="w-3.5 h-3.5" />
                          </div>
                          <div className="truncate">
                            <p className="truncate font-bold text-xs">{branch.name}</p>
                            <p className="text-[10px] text-slate-400 truncate">{branch.city}, {branch.state}</p>
                          </div>
                        </div>
                        {isSelected && <span className="w-2 h-2 rounded-full bg-purple-600 shrink-0 ml-1.5" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Real-time Notifications Popover for Mobile */}
            {notificationsOpen && (
              <NotificationsPopover
                notifications={notifications}
                unreadCount={unreadCount}
                isConnected={isConnected}
                isLoading={notificationsLoading}
                onMarkAsRead={markAsRead}
                onMarkAllAsRead={markAllAsRead}
                onClose={() => setNotificationsOpen(false)}
                align="right"
              />
            )}
          </div>
        </div>
      </header>

      {/* MOBILE DRAWER OVERLAY & GRID MENU (lg:hidden) */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-x-0 top-16 z-40 bg-white/98 backdrop-blur-2xl border-b border-slate-200/90 px-4 pt-4 pb-8 space-y-4 shadow-2xl animate-in slide-in-from-top-3 max-h-[85vh] overflow-y-auto">
          {/* Mobile Location Selector Bar */}
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => setMobileBranchOpen(!mobileBranchOpen)}
              className="w-full flex items-center justify-between p-3 rounded-2xl bg-[#FDF4F8] border border-pink-100/90 hover:bg-pink-100/60 transition-all text-left cursor-pointer"
            >
              <div className="flex items-center space-x-2.5">
                <div className="w-7 h-7 rounded-xl bg-pink-100 text-pink-600 flex items-center justify-center shrink-0">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-extrabold text-slate-900 leading-tight">{branchTitle.main}</p>
                  <p className="text-[10px] font-semibold text-slate-500 leading-tight">{branchTitle.sub}</p>
                </div>
              </div>
              <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${mobileBranchOpen ? 'rotate-180' : ''}`} />
            </button>

            {mobileBranchOpen && (
              <div className="p-2 rounded-2xl bg-white border border-slate-200 shadow-md space-y-1 text-xs">
                <div className="px-3 py-1 text-[10px] font-bold uppercase text-slate-400">Select Active Branch</div>
                {branches.map((branch) => {
                  const isSelected = activeBranch?.id === branch.id;
                  return (
                    <button
                      key={branch.id}
                      type="button"
                      onClick={() => {
                        setActiveBranch(branch);
                        setMobileBranchOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition-all ${
                        isSelected
                          ? 'bg-pink-50 text-pink-700 font-extrabold border border-pink-100'
                          : 'hover:bg-slate-50 text-slate-700 font-semibold'
                      }`}
                    >
                      <div className="flex items-center space-x-2 truncate">
                        <MapPin className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-pink-600' : 'text-slate-400'}`} />
                        <div className="truncate">
                          <p className="truncate font-bold">{branch.name}</p>
                          <p className="text-[9px] font-normal text-slate-500 truncate">{branch.city}, {branch.state}</p>
                        </div>
                      </div>
                      {isSelected && <span className="w-2 h-2 rounded-full bg-pink-600 shrink-0 ml-1" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Grid View of Navigation Links (2-Column Grid as in Mockup) */}
          <div className="grid grid-cols-2 gap-2.5">
            {navLinks.map((link, idx) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;

              return (
                <Link
                  key={`mobile-${link.href}-${idx}`}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center space-x-3 p-3 rounded-2xl transition-all font-bold text-xs ${
                    isActive
                      ? 'bg-purple-100/80 text-purple-700 border border-purple-200/80 font-extrabold'
                      : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-100'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${isActive ? 'bg-purple-600 text-white' : 'bg-white text-slate-600 border border-slate-200'}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span>{link.label}</span>
                </Link>
              );
            })}

            {user && (
              <Link
                href="/bookings"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center space-x-3 p-3 rounded-2xl transition-all font-bold text-xs ${
                  pathname === '/bookings'
                    ? 'bg-purple-100/80 text-purple-700 border border-purple-200/80 font-extrabold'
                    : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-100'
                }`}
              >
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${pathname === '/bookings' ? 'bg-purple-600 text-white' : 'bg-white text-slate-600 border border-slate-200'}`}>
                  <CalendarCheck className="w-4 h-4" />
                </div>
                <span>My Bookings</span>
              </Link>
            )}
          </div>

          {/* User Account & Wallet Card in Drawer */}
          <div className="pt-3 border-t border-slate-100 space-y-2">
            {user ? (
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-7 h-7 rounded-full bg-purple-600 text-white flex items-center justify-center font-black text-xs">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-extrabold text-slate-900 text-xs">{user.name}</span>
                  </div>
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#ECFDF5] border border-emerald-200/80 text-emerald-800 text-xs font-black">
                  <div className="flex items-center space-x-1.5">
                    <Wallet className="w-4 h-4 text-emerald-600" />
                    <span>Wallet Balance</span>
                  </div>
                  <span>₹{Number(user.walletBalance || 0).toLocaleString()}</span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <Link
                    href="/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="py-2 text-center text-xs font-extrabold rounded-xl bg-purple-600 text-white shadow-xs"
                  >
                    Dashboard
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      logout();
                    }}
                    className="py-2 text-center text-xs font-bold rounded-xl border border-rose-200 bg-rose-50 text-rose-600"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-2.5 text-center text-xs font-extrabold rounded-xl border border-slate-200 text-slate-800 bg-white"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-2.5 text-center text-xs font-extrabold rounded-xl text-white bg-gradient-to-r from-purple-600 to-pink-600 shadow-md"
                >
                  Register Free
                </Link>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MOBILE BOTTOM FLOATING NAVIGATION BAR (Pure Frosted Glass Theme) */}
      <div className="lg:hidden fixed bottom-3 inset-x-3 max-w-md mx-auto z-40 pointer-events-none">
        <div className="pointer-events-auto bg-white/75 backdrop-blur-2xl rounded-full px-2.5 py-1.5 border border-white/80 shadow-[0_8px_32px_rgba(0,0,0,0.08)] flex items-center justify-around">
          {[
            pathname === '/services'
              ? { href: '/services', label: 'Services', icon: Briefcase }
              : { href: '/', label: 'Home', icon: Home },
            { href: '/pricing', label: 'Pricing', icon: Crown },
            { href: '/floor-map', label: 'Floor Map', icon: Map },
            { href: '/meeting-rooms', label: 'Rooms', icon: Presentation },
            { href: user ? '/bookings' : '/login', label: user ? 'Bookings' : 'Sign In', icon: user ? CalendarCheck : User },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive =
              tab.href === '/'
                ? pathname === '/'
                : pathname.startsWith(tab.href);

            return (
              <Link
                key={tab.href}
                href={tab.href}
                className="relative flex flex-col items-center justify-center py-1 px-2.5 rounded-2xl transition-all duration-200 group cursor-pointer"
              >
                {/* Icon Container with Frosted Glass Active Tile */}
                <div
                  className={`p-2 rounded-2xl transition-all duration-200 flex items-center justify-center ${
                    isActive
                      ? 'bg-white/95 text-purple-700 shadow-sm border border-slate-200/70 scale-105'
                      : 'text-slate-400 group-hover:text-slate-700 group-hover:bg-white/50'
                  }`}
                >
                  <Icon className={`w-4.5 h-4.5 ${isActive ? 'stroke-[2.3]' : 'stroke-[1.9]'}`} />
                </div>

                {/* Label */}
                <span
                  className={`text-[10px] tracking-tight mt-0.5 transition-colors ${
                    isActive ? 'font-extrabold text-slate-900' : 'font-semibold text-slate-500 group-hover:text-slate-700'
                  }`}
                >
                  {tab.label}
                </span>

                {/* Subtle active pip */}
                {isActive && (
                  <span className="w-1 h-1 rounded-full bg-purple-600 mt-0.5" />
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}
