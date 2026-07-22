import {useCallback, useEffect, useRef, useState} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {QueryClient} from '@tanstack/react-query';

import {
  ACCESS_TOKEN_KEY,
  isAuthSessionInvalidError,
  ME_STORAGE_KEY,
  REFRESH_TOKEN_KEY,
  registerSessionExpiredHandler,
  SESSION_ID_HEADER,
  shouldRetryAuthSync,
} from '../features/api';
import {apiAuth} from "../features/api/apiAuth.ts";
import {resetDrugsCreateState} from '../features/redux/drugsCreate/drugsCreateSlice';
import {store} from '../features/redux/store';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Reduce old-generation GC pressure: evict cache entries faster
      // and avoid re-fetching stale-but-unchanged data on every mount.
      // Per-query staleTime: 0 overrides this where fresh data is critical.
      gcTime: 2 * 60 * 1000,   // 2 min instead of default 5 min
      staleTime: 30 * 1000,    // 30 sec instead of default 0
    },
  },
});

const AUTH_SYNC_RETRY_MS = 3000;
const CONNECTIVITY_TOAST_DELAY_MS = 5000;
const WELCOME_SCREEN_DURATION_MS = 3000;

const resetUserScopedAppState = () => {
  queryClient.clear();
  store.dispatch(resetDrugsCreateState());
};

let syncAuthFromStorage: (() => Promise<void>) | null = null;
let isWelcomePending = false;
let setShouldShowWelcomeRef: ((value: boolean) => void) | null = null;
let setConnectivityIssueRef: ((value: boolean) => void) | null = null;

const clearAuthRetryTimer = (timerRef: {current: ReturnType<typeof setTimeout> | null}) => {
  if (timerRef.current != null) {
    clearTimeout(timerRef.current);
    timerRef.current = null;
  }
};

const clearConnectivityToastTimer = (timerRef: {current: ReturnType<typeof setTimeout> | null}) => {
  if (timerRef.current != null) {
    clearTimeout(timerRef.current);
    timerRef.current = null;
  }
};

export const triggerAuthSync = () => {
  void syncAuthFromStorage?.();
};

export const triggerAuthSyncWithWelcome = () => {
  resetUserScopedAppState();
  isWelcomePending = true;
  triggerAuthSync();
};

const clearStoredSession = async () => {
  resetUserScopedAppState();

  await Promise.all([
    AsyncStorage.removeItem(ACCESS_TOKEN_KEY),
    AsyncStorage.removeItem(REFRESH_TOKEN_KEY),
    AsyncStorage.removeItem(ME_STORAGE_KEY),
    AsyncStorage.removeItem(SESSION_ID_HEADER)
  ]);
};

export const logout = async () => {
  await clearStoredSession();
  isWelcomePending = false;
  setShouldShowWelcomeRef?.(false);
  setConnectivityIssueRef?.(false);
  triggerAuthSync();
};

export const useAuth = () => {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [shouldShowWelcome, setShouldShowWelcome] = useState(false);
  const [connectivityIssue, setConnectivityIssue] = useState(false);

  const authRetryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const connectivityToastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const syncInFlightRef = useRef<Promise<void> | null>(null);
  const syncIsAuthorizedRef = useRef<(() => Promise<void>) | null>(null);
  const isAuthReadyRef = useRef(isAuthReady);

  useEffect(() => {
    isAuthReadyRef.current = isAuthReady;
  }, [isAuthReady]);

  const clearSession = useCallback(async () => {
    clearAuthRetryTimer(authRetryTimerRef);
    clearConnectivityToastTimer(connectivityToastTimerRef);
    setConnectivityIssue(false);

    await clearStoredSession();
    isWelcomePending = false;
    setShouldShowWelcome(false);
    setIsAuthorized(false);
    setIsAuthReady(true);
  }, []);

  const scheduleAuthRetry = useCallback(() => {
    if (authRetryTimerRef.current != null) {
      return;
    }

    authRetryTimerRef.current = setTimeout(() => {
      authRetryTimerRef.current = null;
      void syncIsAuthorizedRef.current?.();
    }, AUTH_SYNC_RETRY_MS);
  }, []);

  const scheduleConnectivityToast = useCallback(() => {
    clearConnectivityToastTimer(connectivityToastTimerRef);

    connectivityToastTimerRef.current = setTimeout(() => {
      connectivityToastTimerRef.current = null;

      if (!isAuthReadyRef.current) {
        setConnectivityIssue(true);
      }
    }, CONNECTIVITY_TOAST_DELAY_MS);
  }, []);

  const completeAuthSync = useCallback(() => {
    clearAuthRetryTimer(authRetryTimerRef);
    clearConnectivityToastTimer(connectivityToastTimerRef);
    setConnectivityIssue(false);
    setIsAuthReady(true);
  }, []);

  const syncIsAuthorized = useCallback(async () => {
    if (syncInFlightRef.current) {
      return syncInFlightRef.current;
    }

    const syncPromise = (async () => {
      const accessToken = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
      const hasAccessToken = typeof accessToken === 'string' && accessToken.trim().length > 0;

      if (!hasAccessToken) {
        clearAuthRetryTimer(authRetryTimerRef);
        clearConnectivityToastTimer(connectivityToastTimerRef);
        setConnectivityIssue(false);
        await AsyncStorage.removeItem(ME_STORAGE_KEY);
        isWelcomePending = false;
        setShouldShowWelcome(false);
        setIsAuthorized(false);
        setIsAuthReady(true);
        return;
      }

      setIsAuthReady(false);
      scheduleConnectivityToast();

      try {
        const response = await apiAuth.me();
        const meData = response.data;

        if (meData == null || typeof meData !== 'object') {
          throw new Error('Invalid me response');
        }

        await AsyncStorage.setItem(ME_STORAGE_KEY, JSON.stringify(meData));

        if (isWelcomePending) {
          isWelcomePending = false;
          setShouldShowWelcome(true);
        }

        setIsAuthorized(true);
        completeAuthSync();
      } catch (error) {
        if (isAuthSessionInvalidError(error)) {
          await clearSession();
          completeAuthSync();
          return;
        }

        if (shouldRetryAuthSync(error)) {
          setIsAuthorized(false);
          setIsAuthReady(false);
          scheduleAuthRetry();
          return;
        }

        await clearSession();
        completeAuthSync();
      }
    })();

    syncInFlightRef.current = syncPromise.finally(() => {
      syncInFlightRef.current = null;
    });

    return syncInFlightRef.current;
  }, [clearSession, completeAuthSync, scheduleAuthRetry, scheduleConnectivityToast]);

  useEffect(() => {
    syncIsAuthorizedRef.current = () => syncIsAuthorized();
  }, [syncIsAuthorized]);

  const dismissWelcome = useCallback(() => {
    setShouldShowWelcome(false);
  }, []);

  useEffect(() => {
    registerSessionExpiredHandler(() => {
      void clearSession();
    });

    return () => {
      registerSessionExpiredHandler(null);
    };
  }, [clearSession]);

  useEffect(() => {
    setConnectivityIssueRef = setConnectivityIssue;

    void syncIsAuthorized();
    syncAuthFromStorage = syncIsAuthorized;
    setShouldShowWelcomeRef = setShouldShowWelcome;

    return () => {
      syncAuthFromStorage = null;
      setShouldShowWelcomeRef = null;
      setConnectivityIssueRef = null;
      clearAuthRetryTimer(authRetryTimerRef);
      clearConnectivityToastTimer(connectivityToastTimerRef);
    };
  }, [syncIsAuthorized]);

  useEffect(() => {
    if (!shouldShowWelcome) {
      return;
    }

    const timeoutId = setTimeout(() => {
      dismissWelcome();
    }, WELCOME_SCREEN_DURATION_MS);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [shouldShowWelcome, dismissWelcome]);

  return {isAuthorized, isAuthReady, shouldShowWelcome, connectivityIssue};
};
