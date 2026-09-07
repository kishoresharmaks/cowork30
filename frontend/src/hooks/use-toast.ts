'use client';

import { toast } from 'sonner';
import { useCallback } from 'react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

export function useToast() {
  const showToast = useCallback(
    (message: string, type: ToastType = 'info') => {
      switch (type) {
        case 'success':
          toast.success(message);
          break;
        case 'error':
          toast.error(message);
          break;
        case 'warning':
          toast.warning(message);
          break;
        default:
          toast.info(message);
      }
    },
    [],
  );

  return { showToast };
}
