import type {TFunction} from 'i18next';

import type {
  NotificationCustomOffsetUnit,
  NotificationPresetKey,
  NotificationsState,
} from '../../redux/drugsCreate/types.ts';

const NOTIFY_SUMMARY_ORDER: NotificationPresetKey[] = ['5m', '15m', '30m', '1h', '1d', 'custom'];

const resolveCustomUnitLabel = (
  t: TFunction<'drugsCreate'>,
  amount: number,
  unit: NotificationCustomOffsetUnit,
  language: string,
) => {
  if (language === 'en') {
    return amount === 1
      ? t(`notifications.summary.customUnits.${unit}.one`)
      : t(`notifications.summary.customUnits.${unit}.many`);
  }

  const mod10 = amount % 10;
  const mod100 = amount % 100;
  if (mod10 === 1 && mod100 !== 11) {
    return t(`notifications.summary.customUnits.${unit}.one`);
  }
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
    return t(`notifications.summary.customUnits.${unit}.few`);
  }

  return t(`notifications.summary.customUnits.${unit}.many`);
};

export const formatNotificationsSummary = (
  notifications: NotificationsState,
  isReminderEnabled: boolean,
  t: TFunction<'drugsCreate'>,
  language: string,
): string => {
  if (!isReminderEnabled) {
    return '';
  }

  if (notifications.selectedPresetKeys.length === 0) {
    return t('notifications.summary.atIntakeOnly');
  }

  return NOTIFY_SUMMARY_ORDER.filter(key => notifications.selectedPresetKeys.includes(key))
    .map(key => {
      if (key === 'custom') {
        return `${t('notifications.summary.customPrefix')} ${notifications.customOffsetAmount} ${resolveCustomUnitLabel(
          t,
          notifications.customOffsetAmount,
          notifications.customOffsetUnit,
          language,
        )}`;
      }

      return t(`notifications.summary.${key}`);
    })
    .join(', ');
};
