import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Calendar, Grid, Wallet, FileText, LogOut, UserCheck } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function StaffSidebar() {
  const location = useLocation();
  const { logout } = useAuth();

  const menuItems = [
    { href: '/staff/dashboard', label: 'Reception Dashboard', icon: LayoutDashboard },
    { href: '/staff/bookings', label: 'Desk & Suite Check-in', icon: Calendar },
    { href: '/staff/meeting-rooms', label: 'Suite Availability', icon: Grid },
    { href: '/staff/wallet-requests', label: 'Cash Wallet Approvals', icon: Wallet },
    { href: '/staff/reports', label: 'Reception Reports', icon: FileText },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 min-h-screen p-4 flex flex-col justify-between border-r border-slate-800">
      <div>
        <div className="flex items-center gap-2 px-3 py-4 border-b border-slate-800 mb-4">
          <div className="w-8 h-8 rounded-xl bg-indigo-500 text-white flex items-center justify-center font-bold">
            <UserCheck className="w-4 h-4" />
          </div>
          <div>
            <div className="font-extrabold text-sm text-white">Staff Reception</div>
            <div className="text-[10px] text-indigo-400 font-semibold uppercase">Front Desk Desk</div>
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
                    ? 'bg-indigo-500/10 text-indigo-400 font-bold border border-indigo-500/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-400' : 'text-slate-500'}`} />
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
        <LogOut className="w-4 h-4" /> Log Out Reception
      </button>
    </aside>
  );
}
