'use client';

import { createContext, useContext } from 'react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

type Toast = {
  id: number;
  message: string;
  type: ToastType;
};

type ToastContextValue = {
  toasts: Toast[];
  addToast: (message: string, type?: ToastType) => void;
  removeToast: (id: number) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  // Simple implementation - in production, use sonner or react-hot-toast
  // This is a placeholder that prevents the app from crashing
  return <>{children}</>;
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    return {
      toasts: [],
      addToast: (message: string, type: ToastType = 'info') => {
        console.log(`[Toast ${type}]: ${message}`);
      },
      removeToast: () => {},
    };
  }
  return context;
}
