'use client';

import React from 'react';
import Link from 'next/link';
import {
  Bell,
  CheckCheck,
  QrCode,
  MessageSquare,
  Wallet,
  Sparkles,
  ExternalLink,
  Clock,
  Radio,
} from 'lucide-react';
import { NotificationItem } from '../useNotifications';

interface NotificationsPopoverProps {
  notifications: NotificationItem[];
  unreadCount: number;
  isConnected: boolean;
  isLoading: boolean;
  onMarkAsRead: (id: number) => void;
  onMarkAllAsRead: () => void;
  onClose: () => void;
  align?: 'left' | 'right';
}

function formatRelativeTime(dateStr: string): string {
  try {
    const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  } catch (e) {
    return 'Recent';
  }
}

export function NotificationsPopover({
  notifications,
  unreadCount,
  isConnected,
  isLoading,
  onMarkAsRead,
  onMarkAllAsRead,
  onClose,
  align = 'right',
}: NotificationsPopoverProps) {
  const getCategoryConfig = (type: string) => {
    switch (type) {
      case 'booking':
        return {
          icon: QrCode,
          iconBg: 'bg-purple-100 text-purple-700 border-purple-200',
          cardBg: 'bg-purple-50/70 hover:bg-purple-50 border-purple-100/90',
          badgeText: 'Desk / Meeting',
        };
      case 'inquiry':
        return {
          icon: MessageSquare,
          iconBg: 'bg-indigo-100 text-indigo-700 border-indigo-200',
          cardBg: 'bg-indigo-50/70 hover:bg-indigo-50 border-indigo-100/90',
          badgeText: 'Custom Quote',
        };
      case 'wallet':
        return {
          icon: Wallet,
          iconBg: 'bg-emerald-100 text-emerald-700 border-emerald-200',
          cardBg: 'bg-emerald-50/70 hover:bg-emerald-50 border-emerald-100/90',
          badgeText: 'Wallet Credit',
        };
      default:
        return {
          icon: Sparkles,
          iconBg: 'bg-amber-100 text-amber-700 border-amber-200',
          cardBg: 'bg-amber-50/60 hover:bg-amber-50 border-amber-100/90',
          badgeText: 'Notice',
        };
    }
  };

  return (
    <div
      className={`absolute top-12 ${
        align === 'right' ? 'right-0' : 'left-0'
      } w-80 sm:w-88 bg-white/95 backdrop-blur-2xl rounded-3xl p-3.5 border border-slate-200/90 shadow-2xl space-y-3 text-xs z-50 animate-in fade-in slide-in-from-top-2`}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 px-0.5">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-xl bg-purple-50 text-purple-600">
            <Bell className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="font-black text-slate-900 text-xs tracking-tight">Live Notifications</span>
              {isConnected ? (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full bg-emerald-50 border border-emerald-200/60 text-[8px] font-black text-emerald-600 uppercase tracking-wider" title="Real-time WebSocket Live">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full bg-slate-100 text-[8px] font-semibold text-slate-400 uppercase tracking-wider">
                  Syncing
                </span>
              )}
            </div>
            <p className="text-[10px] text-slate-400 font-medium">Real-time workspace activity</p>
          </div>
        </div>

        <div className="flex items-center space-x-1">
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-purple-100 text-purple-700 tracking-wider">
              {unreadCount} New
            </span>
          )}
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={onMarkAllAsRead}
              className="p-1 rounded-lg text-slate-400 hover:text-purple-700 hover:bg-purple-50 transition-colors"
              title="Mark all as read"
            >
              <CheckCheck className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-2 max-h-72 overflow-y-auto pr-0.5 scrollbar-thin">
        {isLoading && notifications.length === 0 ? (
          <div className="py-8 text-center text-slate-400 space-y-2">
            <div className="w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs font-semibold">Loading live feed...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-8 text-center text-slate-400 space-y-1.5">
            <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
              <Bell className="w-5 h-5 opacity-40" />
            </div>
            <p className="font-bold text-slate-600 text-xs">All caught up!</p>
            <p className="text-[10px] text-slate-400">No new notifications right now.</p>
          </div>
        ) : (
          notifications.map((item) => {
            const config = getCategoryConfig(item.type);
            const Icon = config.icon;

            const content = (
              <div
                key={item.id}
                onClick={() => onMarkAsRead(item.id)}
                className={`p-3 rounded-2xl border transition-all cursor-pointer relative group ${config.cardBg} ${
                  !item.isRead ? 'shadow-xs border-purple-200/80 ring-1 ring-purple-400/20' : 'opacity-85'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 border ${config.iconBg}`}>
                    <Icon className="w-3.5 h-3.5" />
                  </div>

                  <div className="flex-1 min-w-0 space-y-0.5">
                    <div className="flex items-center justify-between gap-1">
                      <p className="font-extrabold text-slate-900 text-[11px] truncate">{item.title}</p>
                      <span className="text-[9px] text-slate-400 shrink-0 font-semibold flex items-center gap-0.5">
                        <Clock className="w-2.5 h-2.5" />
                        {formatRelativeTime(item.createdAt)}
                      </span>
                    </div>

                    <p className="text-[10px] text-slate-600 leading-relaxed line-clamp-2">{item.message}</p>
                  </div>

                  {!item.isRead && (
                    <span className="w-2 h-2 rounded-full bg-purple-600 shrink-0 mt-1 shadow-xs animate-pulse" />
                  )}
                </div>
              </div>
            );

            if (item.link) {
              return (
                <Link
                  key={item.id}
                  href={item.link}
                  onClick={() => {
                    onMarkAsRead(item.id);
                    onClose();
                  }}
                  className="block"
                >
                  {content}
                </Link>
              );
            }

            return content;
          })
        )}
      </div>

      {/* Footer */}
      <div className="pt-1 border-t border-slate-100">
        <Link
          href="/dashboard"
          onClick={onClose}
          className="flex items-center justify-center space-x-1.5 w-full py-2 rounded-xl bg-slate-100 hover:bg-slate-200 font-extrabold text-[11px] text-slate-700 transition-colors"
        >
          <span>View All Activity in Portal</span>
          <ExternalLink className="w-3 h-3 text-slate-500" />
        </Link>
      </div>
    </div>
  );
}
