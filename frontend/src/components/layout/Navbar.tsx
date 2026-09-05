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
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useBranch } from '@/context/BranchContext';

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
      <div className="h-20 lg:h-24" />

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

          {/* MOBILE TOP HEADER BAR (lg:hidden) */}
          <div className="lg:hidden bg-white/95 backdrop-blur-xl rounded-2xl px-4 py-2.5 border border-slate-200/80 shadow-md flex items-center justify-between">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-slate-700 hover:bg-slate-100 border border-slate-200/80 cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <Link href="/" className="flex items-center">
              <div className="relative w-32 h-8">
                <Image src="/Logo.png" alt="Cowork30 Logo" fill sizes="130px" className="object-contain" priority />
              </div>
            </Link>

            <div className="flex items-center space-x-2">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setNotificationsOpen(!notificationsOpen)}
                  className="relative p-2 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-700 transition-all cursor-pointer"
                  title="Member Notifications"
                >
                  <Bell className="w-4 h-4" />
                  <span className="absolute top-1 right-1 w-2 h-2 bg-purple-600 rounded-full animate-pulse" />
                </button>

                {notificationsOpen && (
                  <div className="absolute right-0 top-11 w-72 bg-white rounded-2xl p-3 border border-slate-200 shadow-2xl space-y-2 text-xs z-50 animate-in fade-in slide-in-from-top-2">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <span className="font-extrabold text-slate-900 flex items-center space-x-1.5">
                        <Bell className="w-3.5 h-3.5 text-purple-600" />
                        <span>Live Notifications</span>
                      </span>
                      <span className="px-2 py-0.2 rounded-full text-[9px] font-black uppercase bg-purple-100 text-purple-700">
                        New
                      </span>
                    </div>

                    <div className="space-y-1.5 max-h-60 overflow-y-auto">
                      <div className="p-2.5 rounded-xl bg-purple-50/60 border border-purple-100 space-y-0.5">
                        <p className="font-extrabold text-slate-900 text-[11px]">Desk Pass Active</p>
                        <p className="text-[10px] text-slate-500">Your QR pass is ready for Downtown Hub check-in.</p>
                      </div>

                      <div className="p-2.5 rounded-xl bg-indigo-50/60 border border-indigo-100 space-y-0.5">
                        <p className="font-extrabold text-slate-900 text-[11px]">Custom Quote Update</p>
                        <p className="text-[10px] text-slate-500">Center manager updated your corporate team inquiry quote.</p>
                      </div>

                      <div className="p-2.5 rounded-xl bg-emerald-50/60 border border-emerald-100 space-y-0.5">
                        <p className="font-extrabold text-slate-900 text-[11px]">Wallet Recharge Ready</p>
                        <p className="text-[10px] text-slate-500">Use instant 1-click booking with your wallet credits.</p>
                      </div>
                    </div>

                    <Link
                      href="/dashboard"
                      onClick={() => setNotificationsOpen(false)}
                      className="block text-center w-full py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 font-extrabold text-[11px] text-slate-700 transition-colors mt-1"
                    >
                      View All Activity in Portal ↗
                    </Link>
                  </div>
                )}
              </div>

              {user && (
                <div className="w-7 h-7 rounded-full bg-purple-600 text-white flex items-center justify-center font-black text-xs">
                  {user.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
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

      {/* MOBILE BOTTOM FLOATING NAVIGATION BAR (lg:hidden) - iOS Dock Style */}
      <div className="lg:hidden fixed bottom-3 left-4 right-4 z-40">
        <div className="bg-white/95 backdrop-blur-2xl rounded-full px-3 py-2 border border-slate-200/90 shadow-2xl flex items-center justify-around">
          <Link
            href="/services"
            className={`flex flex-col items-center justify-center space-y-0.5 ${
              pathname === '/services' ? 'text-purple-600 font-black' : 'text-slate-500 font-bold'
            }`}
          >
            <Briefcase className="w-5 h-5" strokeWidth={2} />
            <span className="text-[10px]">Services</span>
          </Link>

          <Link
            href="/pricing"
            className={`flex flex-col items-center justify-center space-y-0.5 ${
              pathname === '/pricing' ? 'text-purple-600 font-black' : 'text-slate-500 font-bold'
            }`}
          >
            <Crown className="w-5 h-5" strokeWidth={2} />
            <span className="text-[10px]">Pricing</span>
          </Link>

          <Link
            href="/meeting-rooms"
            className={`flex flex-col items-center justify-center space-y-0.5 ${
              pathname === '/meeting-rooms' ? 'text-purple-600 font-black' : 'text-slate-500 font-bold'
            }`}
          >
            <Presentation className="w-5 h-5" strokeWidth={2} />
            <span className="text-[10px]">Rooms</span>
          </Link>

          {/* Highlighted Prominent Center Action Button (Floor Map) */}
          <Link
            href="/floor-map"
            className="flex flex-col items-center justify-center -translate-y-3"
          >
            <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-purple-600 via-indigo-600 to-pink-600 text-white flex items-center justify-center shadow-lg shadow-purple-600/40 border-2 border-white">
              <Map className="w-6 h-6" strokeWidth={2.2} />
            </div>
            <span className="text-[10px] font-black text-purple-700 mt-0.5">Floor Map</span>
          </Link>

          <Link
            href={user ? '/bookings' : '/login'}
            className={`flex flex-col items-center justify-center space-y-0.5 ${
              pathname === '/bookings' ? 'text-purple-600 font-black' : 'text-slate-500 font-bold'
            }`}
          >
            <CalendarCheck className="w-5 h-5" strokeWidth={2} />
            <span className="text-[10px]">Bookings</span>
          </Link>
        </div>
      </div>
    </>
  );
}
