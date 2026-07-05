import type {
  NotificationCustomOffsetUnit,
  NotificationPresetKey,
  NotificationsState,
} from '../../redux/drugsCreate/types.ts';

const PRESET_SECONDS: Record<Exclude<NotificationPresetKey, 'custom'>, number> = {
  '5m': 300,
  '15m': 900,
  '30m': 1800,
  '1h': 3600,
  '1d': 86400,
};

const mapCustomOffsetToSeconds = (
  unit: NotificationCustomOffsetUnit,
  amount: number,
): number => {
  if (unit === 'minute') {
    return amount * 60;
  }

  if (unit === 'hour') {
    return amount * 3600;
  }

  return amount * 86400;
};

export const isReminderEnabledFromSeconds = (
  reminderSecondsBeforeIntake: number[] | null | undefined,
): boolean => Boolean(reminderSecondsBeforeIntake && reminderSecondsBeforeIntake.length > 0);

export const buildReminderSecondsBeforeIntake = (
  notifications: NotificationsState,
  isReminderEnabled: boolean,
): number[] | undefined => {
  if (!isReminderEnabled) {
    return undefined;
  }

  const seconds = new Set<number>([0]);

  notifications.selectedPresetKeys.forEach(key => {
    if (key === 'custom') {
      seconds.add(
        mapCustomOffsetToSeconds(notifications.customOffsetUnit, notifications.customOffsetAmount),
      );
      return;
    }

    seconds.add(PRESET_SECONDS[key]);
  });

  return [...seconds].filter(value => value >= 0).sort((left, right) => left - right);
};

const findPresetKeyForSeconds = (value: number): NotificationPresetKey | null => {
  const entry = Object.entries(PRESET_SECONDS).find(([, seconds]) => seconds === value);
  return entry ? (entry[0] as NotificationPresetKey) : null;
};

export const mapReminderSecondsToNotifications = (
  reminderSecondsBeforeIntake: number[] | null | undefined,
): Pick<
  NotificationsState,
  'selectedPresetKeys' | 'customOffsetAmount' | 'customOffsetUnit'
> => {
  const selectedPresetKeys: NotificationPresetKey[] = [];
  let customOffsetAmount = 2;
  let customOffsetUnit: NotificationCustomOffsetUnit = 'hour';

  (reminderSecondsBeforeIntake ?? []).forEach(seconds => {
    if (seconds === 0) {
      return;
    }

    if (seconds < 1) {
      return;
    }

    const presetKey = findPresetKeyForSeconds(seconds);
    if (presetKey) {
      selectedPresetKeys.push(presetKey);
      return;
    }

    if (seconds % 86400 === 0) {
      selectedPresetKeys.push('custom');
      customOffsetAmount = seconds / 86400;
      customOffsetUnit = 'day';
      return;
    }

    if (seconds % 3600 === 0) {
      selectedPresetKeys.push('custom');
      customOffsetAmount = seconds / 3600;
      customOffsetUnit = 'hour';
      return;
    }

    selectedPresetKeys.push('custom');
    customOffsetAmount = seconds / 60;
    customOffsetUnit = 'minute';
  });

  return {selectedPresetKeys, customOffsetAmount, customOffsetUnit};
};
