'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '@/context/AuthContext';
import { apiClient } from '@/lib/api-client';

export interface NotificationItem {
  id: number;
  userId?: number | null;
  title: string;
  message: string;
  type: 'booking' | 'inquiry' | 'wallet' | 'system' | string;
  link?: string | null;
  isRead: boolean;
  createdAt: string;
}

export function useNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const socketRef = useRef<Socket | null>(null);

  // Fetch from REST API on mount or user change
  const fetchNotifications = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await apiClient.get('/notifications');
      const payload = res.data;
      if (payload?.success && payload.data) {
        setNotifications(payload.data.notifications || []);
        setUnreadCount(payload.data.unreadCount || 0);
      }
    } catch (err) {
      console.warn('Failed to fetch initial notifications:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications, user?.id]);

  // Socket.io Real-time Connection
  useEffect(() => {
    const socketUrl =
      process.env.NEXT_PUBLIC_SOCKET_URL ||
      (process.env.NEXT_PUBLIC_API_URL
        ? process.env.NEXT_PUBLIC_API_URL.replace(/\/api\/v1\/?$/, '')
        : undefined) ||
      (typeof window !== 'undefined'
        ? window.location.origin.replace(':3000', ':4000')
        : 'http://localhost:4000');

    const socket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 8,
      reconnectionDelay: 2000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      socket.emit('subscribe_notifications', { userId: user?.id });
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    // Real-time Notification Received
    socket.on('notification_received', (newNotif: NotificationItem & { unreadCount?: number }) => {
      setNotifications((prev) => {
        if (prev.some((n) => n.id === newNotif.id)) return prev;
        return [newNotif, ...prev];
      });

      if (typeof newNotif.unreadCount === 'number') {
        setUnreadCount(newNotif.unreadCount);
      } else {
        setUnreadCount((prev) => prev + 1);
      }
    });

    // Unread Count Sync
    socket.on('unread_count_updated', (data: { unreadCount: number }) => {
      if (typeof data?.unreadCount === 'number') {
        setUnreadCount(data.unreadCount);
      }
    });

    // Single Notification Marked Read
    socket.on('notification_marked_read', (data: { id: number }) => {
      setNotifications((prev) =>
        prev.map((n) => (n.id === data.id ? { ...n, isRead: true } : n))
      );
    });

    // All Notifications Marked Read
    socket.on('all_notifications_read', () => {
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    });

    return () => {
      if (socket) {
        socket.emit('unsubscribe_notifications', { userId: user?.id });
        socket.disconnect();
      }
    };
  }, [user?.id]);

  // Mark single as read
  const markAsRead = async (id: number) => {
    // Optimistic update
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));

    try {
      await apiClient.patch(`/notifications/${id}/read`);
    } catch (err) {
      console.warn(`Failed to mark notification ${id} as read:`, err);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    // Optimistic update
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);

    try {
      await apiClient.post('/notifications/mark-all-read');
    } catch (err) {
      console.warn('Failed to mark all notifications as read:', err);
    }
  };

  return {
    notifications,
    unreadCount,
    isConnected,
    isLoading,
    markAsRead,
    markAllAsRead,
    refresh: fetchNotifications,
  };
}
