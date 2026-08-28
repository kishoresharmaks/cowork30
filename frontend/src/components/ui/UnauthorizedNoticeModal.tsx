'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldAlert, LogIn, UserPlus, ArrowRight, X, Sparkles, Building2 } from 'lucide-react';

interface UnauthorizedNoticeModalProps {
  isOpen: boolean;
  title?: string;
  reason?: string;
  returnUrl?: string;
  onClose?: () => void;
  onContinueAsGuest?: () => void;
  guestOptionLabel?: string;
}

export default function UnauthorizedNoticeModal({
  isOpen,
  title = 'Authentication & Permission Required',
  reason = 'You are attempting to access a member-restricted feature (such as Credit Wallet, Member Perks, or Member Receipts) that requires an active signed-in member session.',
  returnUrl = '/dashboard',
  onClose,
  onContinueAsGuest,
  guestOptionLabel = 'Continue as Guest (Pay Online / Reception)',
}: UnauthorizedNoticeModalProps) {
  if (!isOpen) return null;

  const encodedReturnUrl = encodeURIComponent(returnUrl);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-100 space-y-6 relative overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Top Decorative Banner */}
        <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600" />

        {/* Close Button if closable */}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Header Icon & Title */}
        <div className="flex items-start space-x-4 pt-1">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200/80 text-amber-600 flex items-center justify-center shrink-0 shadow-xs">
            <ShieldAlert className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <h3 className="text-xl font-extrabold text-slate-900 leading-tight">{title}</h3>
            <p className="text-xs font-bold text-amber-700 bg-amber-50/80 px-2.5 py-0.5 rounded-md inline-block mt-1 border border-amber-200/60">
              HTTP 401: Unauthorized Access Notice
            </p>
          </div>
        </div>

        {/* Reason Box */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs text-slate-600">
          <span className="font-extrabold text-slate-800 uppercase tracking-wider text-[10px] block">
            Why you are seeing this:
          </span>
          <p className="leading-relaxed text-slate-700 font-medium">{reason}</p>
        </div>

        {/* Action Solutions & Redirect Buttons */}
        <div className="space-y-2.5 pt-1">
          {/* Solution 1: Sign In Redirect */}
          <Link
            href={`/login?returnUrl=${encodedReturnUrl}`}
            className="w-full py-3.5 px-5 rounded-2xl font-extrabold text-xs text-white bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 hover:opacity-95 shadow-md shadow-pink-500/20 flex items-center justify-between transition-all cursor-pointer group"
          >
            <div className="flex items-center space-x-2.5">
              <LogIn className="w-4 h-4" />
              <span>Sign In to Member Account</span>
            </div>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Link>

          {/* Solution 2: Register New Account */}
          <Link
            href={`/register?returnUrl=${encodedReturnUrl}`}
            className="w-full py-3 px-5 rounded-2xl font-extrabold text-xs text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-200/80 flex items-center justify-between transition-all cursor-pointer group"
          >
            <div className="flex items-center space-x-2.5">
              <UserPlus className="w-4 h-4 text-purple-600" />
              <span>Create Free Member Account</span>
            </div>
            <Sparkles className="w-4 h-4 text-purple-600" />
          </Link>

          {/* Solution 3: Optional Guest Continuation */}
          {onContinueAsGuest && (
            <button
              type="button"
              onClick={onContinueAsGuest}
              className="w-full py-3 px-5 rounded-2xl font-extrabold text-xs text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/80 flex items-center justify-between transition-all cursor-pointer"
            >
              <div className="flex items-center space-x-2.5">
                <Building2 className="w-4 h-4 text-indigo-600" />
                <span>{guestOptionLabel}</span>
              </div>
              <ArrowRight className="w-4 h-4 text-indigo-600" />
            </button>
          )}

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="w-full py-2 text-center text-xs text-slate-400 font-bold hover:text-slate-600 transition-colors"
            >
              Dismiss Notice
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
