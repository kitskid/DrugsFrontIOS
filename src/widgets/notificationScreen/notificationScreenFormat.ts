import type {TFunction} from 'i18next';

import type {InboxNotificationDto} from '../../features/api/apiNotification.ts';
import {
  type DrugsCardBackgroundImage,
  DEFAULT_BACKGROUND_IMAGE,
} from '../../shared/ui/drugs/drugsCardBackgroundIconRegistry.ts';

const MOSCOW_TIME_ZONE = 'Europe/Moscow';
const HOUR_MS = 60 * 60 * 1000;
const MINUTE_MS = 60 * 1000;

const KNOWN_NOTIFICATION_TYPES = new Set([
  'MEDICATION_REMINDER',
  'APPOINTMENT_REMINDER',
  'REMINDER_UPDATED',
  'REMINDER_DELETED',
]);

const EVENT_TIME_KEYS = [
  'scheduledTime',
  'scheduledAt',
  'scheduledFor',
  'reminderTime',
  'intakeTime',
  'eventTime',
  'time',
] as const;

export type NotificationCardItem = {
  id: string;
  name: string;
  typeLabel: string;
  backgroundImage: DrugsCardBackgroundImage;
  eventTime: string;
  read: boolean;
  prescriptionId: string | null;
  intakeId: string | null;
};

const getLocale = (language: string): string => (language === 'en' ? 'en-US' : 'ru-RU');

const getPayload = (
  notification: InboxNotificationDto,
): Record<string, unknown> => {
  const {dataPayload} = notification;
  return dataPayload && typeof dataPayload === 'object' ? dataPayload : {};
};

const readString = (value: unknown): string | undefined =>
  typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;

const getNotificationTypeLabel = (
  notification: InboxNotificationDto,
  t: TFunction<'notifications'>,
): string => {
  if (KNOWN_NOTIFICATION_TYPES.has(notification.type)) {
    return t(`types.${notification.type}`);
  }

  return readString(notification.body) ?? t('defaults.notification');
};

const getNotificationName = (
  notification: InboxNotificationDto,
  t: TFunction<'notifications'>,
): string => {
  const payload = getPayload(notification);
  return (
    readString(notification.customMedicationName) ??
    readString(payload.customMedicationName) ??
    readString(payload.medicationName) ??
    readString(notification.title) ??
    readString(notification.body) ??
    t('defaults.notification')
  );
};

const isBackgroundImage = (value: unknown): value is DrugsCardBackgroundImage => {
  if (value == null || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.form === 'number' &&
    typeof candidate.reverse === 'number' &&
    typeof candidate.color === 'number' &&
    typeof candidate.gradientDirection === 'number'
  );
};

const getNotificationBackgroundImage = (
  notification: InboxNotificationDto,
): DrugsCardBackgroundImage => {
  if (isBackgroundImage(notification.backgroundImage)) {
    return notification.backgroundImage;
  }

  const payload = getPayload(notification);
  const candidate = payload.backgroundImage;
  return isBackgroundImage(candidate) ? candidate : DEFAULT_BACKGROUND_IMAGE;
};

const getNotificationPrescriptionId = (
  notification: InboxNotificationDto,
): string | null => {
  const payload = getPayload(notification);
  return (
    readString(notification.prescriptionId) ??
    readString(payload.prescriptionId) ??
    readString(payload.recordId) ??
    null
  );
};

const getNotificationIntakeId = (
  notification: InboxNotificationDto,
): string | null => {
  const payload = getPayload(notification);
  return (
    readString(notification.intakeId) ??
    readString(payload.intakeId) ??
    null
  );
};

const getNotificationEventTime = (
  notification: InboxNotificationDto,
): string => {
  const payload = getPayload(notification);

  for (const key of EVENT_TIME_KEYS) {
    const value = readString(payload[key]);
    if (value) {
      return value;
    }
  }

  return notification.createdAt;
};

export const mapInboxNotificationToCardItem = (
  notification: InboxNotificationDto,
  t: TFunction<'notifications'>,
): NotificationCardItem => ({
  id: notification.id,
  name: getNotificationName(notification, t),
  typeLabel: getNotificationTypeLabel(notification, t),
  backgroundImage: getNotificationBackgroundImage(notification),
  eventTime: getNotificationEventTime(notification),
  read: notification.read,
  prescriptionId: getNotificationPrescriptionId(notification),
  intakeId: getNotificationIntakeId(notification),
});

export const formatNotificationRelativeTime = (
  eventTime: string,
  t: TFunction<'notifications'>,
  language: string,
  nowMs: number = Date.now(),
): string => {
  const eventMs = new Date(eventTime).getTime();

  if (Number.isNaN(eventMs)) {
    return '';
  }

  const diffMs = eventMs - nowMs;
  const absMs = Math.abs(diffMs);

  if (absMs >= HOUR_MS) {
    return new Date(eventMs).toLocaleTimeString(getLocale(language), {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: MOSCOW_TIME_ZONE,
    });
  }

  const minutes = Math.max(0, Math.round(absMs / MINUTE_MS));

  if (minutes === 0) {
    return t('relativeTime.justNow');
  }

  if (diffMs >= 0) {
    return t('relativeTime.inMinutes', {count: minutes});
  }

  return t('relativeTime.minutesAgo', {count: minutes});
};
