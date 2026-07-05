import {createContext, useContext} from 'react';

export type ToastVariant = 'success' | 'error' | 'warning';

export type CreateToastParams = {
  variant: ToastVariant;
  text: string;
};

export type ToastItem = CreateToastParams & {
  id: string;
};

export type ToastContextValue = {
  toasts: ToastItem[];
  showToast: (params: CreateToastParams) => string;
  hideToast: (id: string) => void;
};

export const ToastContext = createContext<ToastContextValue | null>(null);

export const useToast = () => {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error('useToast must be used inside ToastsProvider');
  }

  return context;
};
