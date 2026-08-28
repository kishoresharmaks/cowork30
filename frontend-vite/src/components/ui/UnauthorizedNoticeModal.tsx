import React from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, Lock, LogIn, UserPlus, CreditCard, X } from 'lucide-react';

interface UnauthorizedNoticeModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
  returnUrl?: string;
}

export default function UnauthorizedNoticeModal({
  isOpen,
  onClose,
  title = 'Authentication Required (401)',
  message = 'You must be logged in to proceed with booking checkout or wallet operations.',
  returnUrl = '/meeting-rooms',
}: UnauthorizedNoticeModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-md w-full p-6 relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center mb-4">
          <Lock className="w-6 h-6 text-rose-500" />
        </div>

        <h3 className="text-lg font-bold text-slate-900">{title}</h3>
        <p className="text-xs text-slate-500 mt-1 leading-relaxed">{message}</p>

        <div className="mt-6 space-y-2">
          <Link
            to={`/login?returnUrl=${encodeURIComponent(returnUrl)}`}
            onClick={onClose}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-gradient-to-r from-rose-500 to-purple-600 hover:from-rose-600 hover:to-purple-700 text-white rounded-xl text-xs font-bold shadow-lg shadow-rose-500/20 transition-all"
          >
            <LogIn className="w-4 h-4" /> Sign In to Account
          </Link>

          <Link
            to="/register"
            onClick={onClose}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
          >
            <UserPlus className="w-4 h-4" /> Create New Account
          </Link>

          <button
            onClick={onClose}
            className="w-full text-center py-2 text-xs font-medium text-slate-400 hover:text-slate-600"
          >
            Continue as Guest / Pay at Reception
          </button>
        </div>
      </div>
    </div>
  );
}
