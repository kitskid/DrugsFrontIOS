import type {AxiosRequestConfig} from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const SESSION_ID_HEADER = 'X-Session-Id';
export const PASSWORD_RESET_SESSION_ID_HEADER = 'X-Password-Reset-Session-Id';
export const ACCESS_TOKEN_KEY = 'accessToken';
export const REFRESH_TOKEN_KEY = 'refreshToken';
export const REFRESH_TOKEN_HEADER = 'x-refresh-token';
export const ME_STORAGE_KEY = 'me';

export {
  apiClient,
  isAuthSessionInvalidError,
  registerSessionExpiredHandler,
  shouldRetryAuthSync,
} from './client';

export const sessionConfig = async (): Promise<AxiosRequestConfig> => {
  const sessionId = await AsyncStorage.getItem(SESSION_ID_HEADER);

  if (!sessionId) {
    return {};
  }

  return {
    headers: {
      [SESSION_ID_HEADER]: sessionId,
    },
  };
};

export const passwordConfig = async (): Promise<AxiosRequestConfig> => {
  const passwordResetSessionId = await AsyncStorage.getItem(PASSWORD_RESET_SESSION_ID_HEADER);

  if (!passwordResetSessionId) {
    return {};
  }

  return {
    headers: {
      [PASSWORD_RESET_SESSION_ID_HEADER]: passwordResetSessionId,
    },
  };
};

export const getStoredUserId = async (): Promise<string> => {
  const raw = await AsyncStorage.getItem(ME_STORAGE_KEY);

  if (!raw) {
    throw new Error('User not found');
  }

  const me = JSON.parse(raw) as {id?: string};

  if (typeof me.id !== 'string' || me.id.trim().length === 0) {
    throw new Error('User id not found');
  }

  return me.id.trim();
};
