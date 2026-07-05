import axios, {type AxiosError, type InternalAxiosRequestConfig} from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {API_BASE} from '@env';

import {
  ACCESS_TOKEN_KEY,
  REFRESH_TOKEN_HEADER,
  REFRESH_TOKEN_KEY,
} from './index';

const AUTH_SESSION_ERROR_MESSAGES = new Set([
  'No refresh token',
  'No access token after refresh',
]);

export const isAuthSessionInvalidError = (error: unknown): boolean => {
  if (error instanceof Error && !axios.isAxiosError(error)) {
    return AUTH_SESSION_ERROR_MESSAGES.has(error.message);
  }

  if (!axios.isAxiosError(error)) {
    return false;
  }

  const status = error.response?.status;
  return status === 401 || status === 403 || (status != null && status >= 500 && status < 600);
};

const isTransientApiError = (error: unknown): boolean => {
  if (isAuthSessionInvalidError(error)) {
    return false;
  }

  if (!axios.isAxiosError(error)) {
    return false;
  }

  if (error.response?.status != null) {
    return false;
  }

  const code = error.code;
  return (
    code === 'ERR_NETWORK' ||
    code === 'ECONNABORTED' ||
    code === 'ETIMEDOUT' ||
    code === 'ERR_CANCELED' ||
    error.message === 'Network Error'
  );
};

export const shouldRetryAuthSync = (error: unknown): boolean => {
  if (isAuthSessionInvalidError(error)) {
    return false;
  }

  if (isTransientApiError(error)) {
    return true;
  }

  return !axios.isAxiosError(error) || error.response == null;
};

type SessionExpiredHandler = () => void;

let sessionExpiredHandler: SessionExpiredHandler | null = null;

export const registerSessionExpiredHandler = (handler: SessionExpiredHandler | null) => {
  sessionExpiredHandler = handler;
};

const notifySessionExpired = () => {
  sessionExpiredHandler?.();
};

declare module 'axios' {
  interface AxiosRequestConfig {
    requiresAuth?: boolean;
    skipAuthRefresh?: boolean;
    _retry?: boolean;
  }
}

export const apiClient = axios.create();

const persistTokenPair = async (data: unknown): Promise<void> => {
  if (data == null || typeof data !== 'object') {
    return;
  }

  const {accessToken, refreshToken} = data as {
    accessToken?: unknown;
    refreshToken?: unknown;
  };

  if (typeof accessToken === 'string' && accessToken.trim().length > 0) {
    await AsyncStorage.setItem(ACCESS_TOKEN_KEY, accessToken.trim());
  }

  if (typeof refreshToken === 'string' && refreshToken.trim().length > 0) {
    await AsyncStorage.setItem(REFRESH_TOKEN_KEY, refreshToken.trim());
  }
};

const setAuthorizationHeader = (
  config: InternalAxiosRequestConfig,
  accessToken: string,
): void => {
  const value = `Bearer ${accessToken}`;

  if (typeof config.headers?.set === 'function') {
    config.headers.set('Authorization', value);
    return;
  }

  config.headers = config.headers ?? {};
  (config.headers as Record<string, string>).Authorization = value;
};

let refreshPromise: Promise<string> | null = null;

const refreshAccessToken = async (): Promise<string> => {
  const refreshToken = await AsyncStorage.getItem(REFRESH_TOKEN_KEY);

  if (typeof refreshToken !== 'string' || refreshToken.trim().length === 0) {
    throw new Error('No refresh token');
  }

  const response = await apiClient.post(
    `${API_BASE}/api/auth/session/refresh`,
    {},
    {
      skipAuthRefresh: true,
      headers: {
        [REFRESH_TOKEN_HEADER]: refreshToken.trim(),
      },
    },
  );

  await persistTokenPair(response.data);

  const accessToken = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);

  if (typeof accessToken !== 'string' || accessToken.trim().length === 0) {
    throw new Error('No access token after refresh');
  }

  return accessToken.trim();
};

const getRefreshAccessTokenPromise = (): Promise<string> => {
  if (!refreshPromise) {
    refreshPromise = refreshAccessToken().finally(() => {
      refreshPromise = null;
    });
  }

  return refreshPromise;
};

apiClient.interceptors.request.use(async (config) => {
  if (!config.requiresAuth) {
    return config;
  }

  const accessToken = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);

  if (typeof accessToken === 'string' && accessToken.trim().length > 0) {
    setAuthorizationHeader(config, accessToken.trim());
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config;

    if (
      error.response?.status !== 401 ||
      originalRequest == null ||
      originalRequest.skipAuthRefresh ||
      originalRequest._retry ||
      !originalRequest.requiresAuth
    ) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      const accessToken = await getRefreshAccessTokenPromise();
      setAuthorizationHeader(originalRequest, accessToken);
      return apiClient(originalRequest);
    } catch (refreshError) {
      if (isAuthSessionInvalidError(refreshError)) {
        notifySessionExpired();
      }

      return Promise.reject(refreshError);
    }
  },
);
