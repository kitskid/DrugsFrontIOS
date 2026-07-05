import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from 'react';

import {
  ToastContext,
  type CreateToastParams,
  type ToastItem as ToastItemModel,
} from '../../features/toasts/useToast';
import {ToastStack} from './ToastStack';

const MAX_TOASTS_COUNT = 5;
const TOAST_AUTO_HIDE_DELAY = 3000;
const createToastId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export const ToastsProvider = ({children}: PropsWithChildren) => {
  const [toasts, setToasts] = useState<ToastItemModel[]>([]);
  const timeoutMapRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const clearToastTimeout = useCallback((id: string) => {
    const timeout = timeoutMapRef.current.get(id);

    if (timeout) {
      clearTimeout(timeout);
      timeoutMapRef.current.delete(id);
    }
  }, []);

  const hideToast = useCallback((id: string) => {
    clearToastTimeout(id);
    setToasts(prevToasts => prevToasts.filter(toast => toast.id !== id));
  }, [clearToastTimeout]);

  const showToast = useCallback((params: CreateToastParams) => {
    const id = createToastId();

    setToasts(prevToasts => {
      const nextToasts = [{id, ...params}, ...prevToasts].slice(0, MAX_TOASTS_COUNT);
      const nextToastIds = new Set(nextToasts.map(toast => toast.id));

      prevToasts.forEach(toast => {
        if (!nextToastIds.has(toast.id)) {
          clearToastTimeout(toast.id);
        }
      });

      return nextToasts;
    });

    timeoutMapRef.current.set(
      id,
      setTimeout(() => {
        hideToast(id);
      }, TOAST_AUTO_HIDE_DELAY),
    );

    return id;
  }, [clearToastTimeout, hideToast]);

  useEffect(() => {
    return () => {
      timeoutMapRef.current.forEach(timeout => clearTimeout(timeout));
      timeoutMapRef.current.clear();
    };
  }, []);

  const contextValue = useMemo(
    () => ({
      toasts,
      showToast,
      hideToast,
    }),
    [toasts, showToast, hideToast],
  );

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <ToastStack toasts={toasts} onClose={hideToast} />
    </ToastContext.Provider>
  );
};
