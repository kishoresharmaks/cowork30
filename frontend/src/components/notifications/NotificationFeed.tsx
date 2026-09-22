'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Bell,
  Check,
  CheckCheck,
  Calendar,
  Building2,
  Wallet,
  ShieldAlert,
  MessageSquare,
  ExternalLink,
  X,
  Info,
} from 'lucide-react';
import { useNotifications, NotificationItem } from '@/features/notifications/useNotifications';

export default function NotificationFeed() {
  const router = useRouter();
  const { notifications, unreadCount, markAsRead, markAllAsRead, refresh } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleItemClick = (item: NotificationItem) => {
    if (!item.isRead) {
      markAsRead(item.id);
    }
    if (item.link) {
      setIsOpen(false);
      router.push(item.link);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'meeting':
        return <Building2 className="w-4 h-4 text-emerald-400 shrink-0" />;
      case 'booking':
        return <Calendar className="w-4 h-4 text-indigo-400 shrink-0" />;
      case 'wallet':
        return <Wallet className="w-4 h-4 text-amber-400 shrink-0" />;
      case 'inquiry':
        return <MessageSquare className="w-4 h-4 text-cyan-400 shrink-0" />;
      case 'warning':
      case 'system':
        return <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />;
      default:
        return <Info className="w-4 h-4 text-slate-400 shrink-0" />;
    }
  };

  function formatTimeAgo(dateString: string) {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Action Button */}
      <button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) refresh();
        }}
        className="relative p-2.5 text-slate-300 hover:text-white bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 rounded-xl transition-all focus:outline-none"
        title="In-App Notifications"
      >
        <Bell className="w-5 h-5" />

        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 flex items-center justify-center min-w-[20px] h-[20px] px-1 bg-indigo-600 text-white font-bold text-[10px] rounded-full border-2 border-[#020617] shadow-lg animate-in zoom-in-50">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Popover */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-slate-900/95 border border-slate-800 rounded-2xl shadow-2xl backdrop-blur-md z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
          {/* Header */}
          <div className="px-4 py-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-bold text-white">Notifications</h3>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 font-bold text-[10px] rounded-full">
                  {unreadCount} unread
                </span>
              )}
            </div>

            <div className="flex items-center space-x-2">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllAsRead}
                  className="text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 flex items-center space-x-1 transition-colors"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span>Mark all read</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Notifications Scroll List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/60">
            {notifications.length === 0 ? (
              <div className="py-10 text-center text-xs text-slate-500">
                <Bell className="w-8 h-8 mx-auto mb-2 text-slate-700" />
                No notifications yet.
              </div>
            ) : (
              notifications.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleItemClick(item)}
                  className={`p-4 flex items-start space-x-3 cursor-pointer transition-colors ${
                    !item.isRead ? 'bg-indigo-950/20 hover:bg-indigo-950/30' : 'hover:bg-slate-800/40'
                  }`}
                >
                  <div className="p-2 bg-slate-950 border border-slate-800 rounded-xl mt-0.5">
                    {getNotificationIcon(item.type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className={`text-xs font-bold truncate ${!item.isRead ? 'text-white' : 'text-slate-300'}`}>
                        {item.title}
                      </p>
                      <span className="text-[10px] text-slate-500 shrink-0">
                        {formatTimeAgo(item.createdAt)}
                      </span>
                    </div>

                    <p className="text-xs text-slate-400 mt-1 leading-relaxed line-clamp-2">
                      {item.message}
                    </p>

                    {item.link && (
                      <span className="inline-flex items-center text-[10px] font-semibold text-indigo-400 mt-1.5 hover:underline">
                        <span>View details</span>
                        <ExternalLink className="w-2.5 h-2.5 ml-1" />
                      </span>
                    )}
                  </div>

                  {!item.isRead && (
                    <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0 mt-1" />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
