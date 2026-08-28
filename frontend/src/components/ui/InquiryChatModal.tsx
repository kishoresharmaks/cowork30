'use client';

import React, { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { apiClient } from '@/lib/api-client';
import {
  X,
  Send,
  Sparkles,
  ShieldCheck,
  User,
  CreditCard,
  Wallet,
  Clock,
  CheckCircle2,
  DollarSign,
  MessageSquare,
  AlertCircle,
  Lock,
} from 'lucide-react';

interface InquiryMessage {
  id: number;
  bookingId: number;
  senderType: 'customer' | 'admin' | 'system';
  senderId?: number;
  senderName: string;
  message: string;
  createdAt: string;
}

interface InquiryChatModalProps {
  inquiry: {
    id: number;
    bookingCode: string;
    customerName: string;
    customerEmail: string;
    status: string;
    paymentStatus: string;
    totalAmount: string | number;
    notes?: string;
    branch?: { name: string };
  };
  isOpen: boolean;
  onClose: () => void;
  currentUserType: 'customer' | 'admin';
  currentUserName?: string;
  currentUserId?: number;
  onInquiryUpdated?: () => void;
  onPayViaWallet?: (inquiry: any) => void;
  onPayViaRazorpay?: (inquiry: any) => void;
}

export default function InquiryChatModal({
  inquiry,
  isOpen,
  onClose,
  currentUserType,
  currentUserName = 'User',
  currentUserId,
  onInquiryUpdated,
  onPayViaWallet,
  onPayViaRazorpay,
}: InquiryChatModalProps) {
  const [messages, setMessages] = useState<InquiryMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [currentInquiryState, setCurrentInquiryState] = useState(inquiry);

  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCurrentInquiryState(inquiry);
  }, [inquiry]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Fetch Message History & Setup Socket
  useEffect(() => {
    if (!isOpen || !inquiry?.id) return;

    setLoading(true);

    // 1. Load History
    apiClient
      .get(`/services/inquiries/${inquiry.id}/messages`)
      .then((res) => {
        if (res.data?.messages) {
          setMessages(res.data.messages);
        }
      })
      .catch((err) => console.error('Failed to load inquiry messages:', err))
      .finally(() => setLoading(false));

    // 2. Socket Connection
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL
      || (process.env.NEXT_PUBLIC_API_URL ? process.env.NEXT_PUBLIC_API_URL.replace(/\/api\/v1\/?$/, '') : undefined)
      || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:4000');

    const socket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      socket.emit('join_inquiry_room', { inquiryId: inquiry.id });
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('new_inquiry_message', (msg: InquiryMessage) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
      setTimeout(scrollToBottom, 100);
    });

    socket.on('inquiry_status_updated', (data: any) => {
      if (data?.inquiry) {
        setCurrentInquiryState(data.inquiry);
        if (onInquiryUpdated) onInquiryUpdated();
      }
    });

    return () => {
      socket.emit('leave_inquiry_room', { inquiryId: inquiry.id });
      socket.disconnect();
    };
  }, [isOpen, inquiry?.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  if (!isOpen) return null;

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputMessage.trim() || sending) return;

    const textToSend = inputMessage.trim();
    setInputMessage('');
    setSending(true);

    try {
      const payload = {
        senderType: currentUserType,
        senderName: currentUserName,
        message: textToSend,
        senderId: currentUserId,
      };

      const res = await apiClient.post(`/services/inquiries/${inquiry.id}/messages`, payload);
      if (res.data?.message) {
        const newMsg = res.data.message;
        setMessages((prev) => {
          if (prev.some((m) => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });
      }
    } catch (err) {
      alert('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleAdminUpdateQuote = async () => {
    const val = prompt(
      'Enter negotiated custom quote price (₹):',
      String(currentInquiryState.totalAmount || 0),
    );
    if (val !== null && !isNaN(Number(val))) {
      try {
        await apiClient.put(`/services/admin/inquiries/${inquiry.id}/status`, {
          totalAmount: Number(val),
        });
        if (onInquiryUpdated) onInquiryUpdated();
      } catch (err) {
        alert('Failed to update quote price');
      }
    }
  };

  const handleAdminStatusChange = async (status: string) => {
    try {
      await apiClient.put(`/services/admin/inquiries/${inquiry.id}/status`, { status });
      if (onInquiryUpdated) onInquiryUpdated();
    } catch (err) {
      alert('Failed to update status');
    }
  };

  const handleAdminPaymentStatusChange = async (paymentStatus: string) => {
    try {
      await apiClient.put(`/services/admin/inquiries/${inquiry.id}/status`, { paymentStatus });
      if (onInquiryUpdated) onInquiryUpdated();
    } catch (err) {
      alert('Failed to update payment status');
    }
  };

  const isPaid = currentInquiryState.paymentStatus === 'paid';
  const isConfirmed =
    currentInquiryState.status === 'confirmed' || currentInquiryState.status === 'completed';
  const amount = Number(currentInquiryState.totalAmount || 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl h-[90vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-slate-900/90 border-b border-slate-800 flex flex-col space-y-3 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center font-bold">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="font-extrabold text-sm sm:text-base text-white">
                    {currentInquiryState.bookingCode}
                  </h3>
                  <span
                    className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${
                      isConnected
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'
                      }`}
                    />
                    <span>{isConnected ? 'Live Chat' : 'Connecting'}</span>
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  {currentUserType === 'admin'
                    ? `Client: ${currentInquiryState.customerName} (${currentInquiryState.customerEmail})`
                    : 'Real-time Discussion with Coworking Operations Manager'}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Inquiry Summary Pill Bar */}
          <div className="flex flex-wrap items-center justify-between bg-slate-950/70 border border-slate-800 p-3 rounded-2xl gap-2 text-xs">
            <div className="flex items-center space-x-3">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Quote</span>
                <span className="font-extrabold text-emerald-400 text-sm">
                  ₹{amount.toLocaleString()}
                </span>
              </div>
              <div className="h-6 border-r border-slate-800" />
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Status</span>
                <span className="font-bold text-indigo-300 capitalize">
                  {currentInquiryState.status}
                </span>
              </div>
              <div className="h-6 border-r border-slate-800" />
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Payment</span>
                <span
                  className={`font-bold uppercase text-[11px] ${
                    isPaid ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {isPaid ? 'Paid' : 'Unpaid'}
                </span>
              </div>
            </div>

            {/* Admin Toolbar Controls */}
            {currentUserType === 'admin' && (
              <div className="flex items-center space-x-2 shrink-0">
                <button
                  onClick={handleAdminUpdateQuote}
                  className="px-2.5 py-1 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-300 hover:bg-indigo-600/30 font-bold text-[11px] flex items-center space-x-1"
                >
                  <DollarSign className="w-3 h-3" />
                  <span>Edit Quote</span>
                </button>

                <select
                  value={currentInquiryState.status}
                  onChange={(e) => handleAdminStatusChange(e.target.value)}
                  className="px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-700 text-indigo-300 text-[11px] font-bold cursor-pointer"
                >
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>

                <select
                  value={currentInquiryState.paymentStatus || 'unpaid'}
                  onChange={(e) => handleAdminPaymentStatusChange(e.target.value)}
                  className={`px-2.5 py-1 rounded-xl bg-slate-900 border text-[11px] font-bold cursor-pointer ${
                    isPaid ? 'border-emerald-500/40 text-emerald-400' : 'border-rose-500/40 text-rose-400'
                  }`}
                >
                  <option value="unpaid">Unpaid</option>
                  <option value="paid">Paid</option>
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Message Feed Area */}
        <div className="flex-1 p-4 sm:p-5 overflow-y-auto space-y-4 bg-slate-950/40">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-500 space-y-2">
              <Sparkles className="w-6 h-6 animate-spin text-indigo-400" />
              <p className="text-xs">Loading message thread...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-3 text-slate-500">
              <div className="w-12 h-12 rounded-full bg-slate-800/60 flex items-center justify-center text-slate-400">
                <MessageSquare className="w-6 h-6" />
              </div>
              <div>
                <p className="font-semibold text-slate-300 text-sm">No messages yet</p>
                <p className="text-xs max-w-xs">
                  Start the conversation to discuss pricing, custom seating layout, or move-in schedule.
                </p>
              </div>
            </div>
          ) : (
            messages.map((msg) => {
              if (msg.senderType === 'system') {
                return (
                  <div key={msg.id} className="flex justify-center my-3">
                    <div className="px-3.5 py-1.5 rounded-full bg-indigo-950/50 border border-indigo-500/30 text-indigo-300 text-[11px] font-medium flex items-center space-x-1.5 shadow-sm">
                      <Sparkles className="w-3 h-3 text-indigo-400 shrink-0" />
                      <span>{msg.message}</span>
                    </div>
                  </div>
                );
              }

              const isMe =
                (currentUserType === 'admin' && msg.senderType === 'admin') ||
                (currentUserType === 'customer' && msg.senderType === 'customer');

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} space-y-1`}
                >
                  <div className="flex items-center space-x-1.5 px-1 text-[10px] text-slate-400">
                    <span className="font-bold text-slate-300">{msg.senderName}</span>
                    <span>•</span>
                    <span className="capitalize text-slate-500">({msg.senderType})</span>
                    <span>•</span>
                    <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>

                  <div
                    className={`max-w-[85%] sm:max-w-[75%] p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-sm ${
                      isMe
                        ? 'bg-indigo-600 text-white rounded-tr-xs'
                        : msg.senderType === 'admin'
                        ? 'bg-slate-800 border border-purple-500/30 text-slate-100 rounded-tl-xs'
                        : 'bg-slate-800 border border-slate-700 text-slate-100 rounded-tl-xs'
                    }`}
                  >
                    {msg.message}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Footer Payment Banner for Customer */}
        {currentUserType === 'customer' && isConfirmed && !isPaid && amount > 0 && (
          <div className="p-3 bg-gradient-to-r from-indigo-950/80 via-slate-900 to-purple-950/80 border-t border-indigo-500/30 shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center space-x-1.5 text-emerald-400 font-bold text-xs">
                <CheckCircle2 className="w-4 h-4" />
                <span>Quote Confirmed by Operations Team!</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Final Amount: <strong className="text-white">₹{amount.toLocaleString()}</strong>. Complete payment to activate workspace.
              </p>
            </div>

            <div className="flex items-center space-x-2 shrink-0">
              {onPayViaWallet && (
                <button
                  onClick={() => onPayViaWallet(currentInquiryState)}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center space-x-1.5 transition-all shadow-md"
                >
                  <Wallet className="w-3.5 h-3.5" />
                  <span>Pay via Wallet</span>
                </button>
              )}

              {onPayViaRazorpay && (
                <button
                  onClick={() => onPayViaRazorpay(currentInquiryState)}
                  className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center space-x-1.5 transition-all shadow-md"
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Pay Razorpay</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Input Bar or Closed Discussion Banner */}
        {isPaid ? (
          <div className="p-4 bg-slate-950/80 border-t border-slate-800 flex items-center justify-center space-x-2 text-xs text-slate-300 font-semibold shrink-0">
            <Lock className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Discussion Closed: Payment has been completed and workspace membership is active.</span>
          </div>
        ) : (
          <form
            onSubmit={handleSendMessage}
            className="p-3 sm:p-4 bg-slate-900 border-t border-slate-800 flex items-center space-x-2 shrink-0"
          >
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Type your message or quote discussion..."
              className="flex-1 bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-indigo-500 transition-all"
            />
            <button
              type="submit"
              disabled={!inputMessage.trim() || sending}
              className="p-2.5 sm:px-4 sm:py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center space-x-1.5 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md"
            >
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline">Send</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
