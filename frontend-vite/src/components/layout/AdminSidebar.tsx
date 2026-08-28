import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  MapPin,
  Grid,
  Layers,
  Tag,
  Users,
  Calendar,
  Wallet,
  MessageSquare,
  Image as ImageIcon,
  Settings,
  Shield,
  LogOut,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function AdminSidebar() {
  const location = useLocation();
  const { logout } = useAuth();

  const menuItems = [
    { href: '/admin/dashboard', label: 'Analytics Dashboard', icon: LayoutDashboard },
    { href: '/admin/branches', label: 'Branch Locations', icon: MapPin },
    { href: '/admin/meeting-rooms', label: 'Meeting Suites', icon: Grid },
    { href: '/admin/services', label: 'Services Catalog', icon: Layers },
    { href: '/admin/pricing', label: 'Pricing Plans', icon: Tag },
    { href: '/admin/users', label: 'User Directory', icon: Users },
    { href: '/admin/bookings', label: 'All Bookings', icon: Calendar },
    { href: '/admin/wallet-requests', label: 'Wallet Top-ups', icon: Wallet },
    { href: '/admin/service-inquiries', label: 'Live Support Chat', icon: MessageSquare },
    { href: '/admin/gallery', label: 'CMS Gallery', icon: ImageIcon },
    { href: '/admin/settings', label: 'Site Settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 min-h-screen p-4 flex flex-col justify-between border-r border-slate-800">
      <div>
        <div className="flex items-center gap-2 px-3 py-4 border-b border-slate-800 mb-4">
          <div className="w-8 h-8 rounded-xl bg-rose-500 text-white flex items-center justify-center font-bold">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <div className="font-extrabold text-sm text-white">Admin Control</div>
            <div className="text-[10px] text-rose-400 font-semibold uppercase">Enterprise Platform</div>
          </div>
        </div>

        <nav className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.href}
                to={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
                  isActive
                    ? 'bg-rose-500/10 text-rose-400 font-bold border border-rose-500/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-rose-400' : 'text-slate-500'}`} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <button
        onClick={logout}
        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-rose-400 hover:bg-rose-500/10 transition-colors border border-rose-500/20"
      >
        <LogOut className="w-4 h-4" /> Sign Out Admin
      </button>
    </aside>
  );
}
