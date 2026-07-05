import type {QueryClient} from '@tanstack/react-query';

import {NOTIFICATIONS_UNREAD_COUNT_QUERY_KEY} from './apiNotification.ts';

export const setNotificationsUnreadCount = (
  queryClient: QueryClient,
  count: number,
) => {
  queryClient.setQueryData(NOTIFICATIONS_UNREAD_COUNT_QUERY_KEY, count);
};

export const decrementNotificationsUnreadCount = (
  queryClient: QueryClient,
  by: number,
) => {
  if (by <= 0) {
    return;
  }

  queryClient.setQueryData<number>(
    NOTIFICATIONS_UNREAD_COUNT_QUERY_KEY,
    current => Math.max(0, (current ?? 0) - by),
  );
};
