import {API_BASE} from '@env';

import type {PrescriptionBackgroundImageDto} from './drugs/apiDrugs.ts';
import {apiClient} from './client.ts';

export type InboxNotificationType = 'MEDICATION_REMINDER' | (string & {});

export type InboxNotificationDto = {
  id: string;
  userId: string;
  type: InboxNotificationType;
  title?: string | null;
  body: string;
  dataPayload?: Record<string, unknown> | null;
  prescriptionId?: string | null;
  intakeId?: string | null;
  customMedicationName?: string | null;
  backgroundImage?: PrescriptionBackgroundImageDto | null;
  read: boolean;
  readAt?: string | null;
  createdAt: string;
};

export type InboxPageDto = {
  items: InboxNotificationDto[];
  page: number;
  perPage: number;
  total: number;
};

export type UnreadCountDto = {
  count: number;
};

export type MarkReadResponseDto = {
  markedCount: number;
};

export type GetInboxParams = {
  page?: number;
  perPage?: number;
};

export const INBOX_DEFAULT_PER_PAGE = 20;

export const NOTIFICATIONS_QUERY_KEY = ['notifications'] as const;
export const NOTIFICATIONS_INBOX_QUERY_KEY = [
  ...NOTIFICATIONS_QUERY_KEY,
  'inbox',
] as const;
export const NOTIFICATIONS_UNREAD_COUNT_QUERY_KEY = [
  ...NOTIFICATIONS_QUERY_KEY,
  'unread-count',
] as const;

export const apiNotification = {
  getInbox: async ({page = 1, perPage = INBOX_DEFAULT_PER_PAGE}: GetInboxParams = {}) => {
    return apiClient.get<InboxPageDto>(`${API_BASE}/api/notifications/inbox`, {
      params: {page, per_page: perPage, sort_unread_first: true},
      requiresAuth: true,
    });
  },
  getUnreadCount: async () => {
    return apiClient.get<UnreadCountDto>(
      `${API_BASE}/api/notifications/inbox/unread-count`,
      {
        requiresAuth: true,
      },
    );
  },
  markAsRead: async (ids: string[]) => {
    return apiClient.post<MarkReadResponseDto>(
      `${API_BASE}/api/notifications/inbox/read`,
      {ids},
      {requiresAuth: true},
    );
  },
  markAllAsRead: async () => {
    return apiClient.post<MarkReadResponseDto>(
      `${API_BASE}/api/notifications/inbox/read-all`,
      {},
      {requiresAuth: true},
    );
  },
};
