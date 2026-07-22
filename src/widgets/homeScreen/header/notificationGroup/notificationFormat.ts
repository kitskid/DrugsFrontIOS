import type {TFunction} from 'i18next';

const MOSCOW_TIME_ZONE = 'Europe/Moscow';

const getLocale = (language: string): string => (language === 'en' ? 'en-US' : 'ru-RU');

export const formatScheduledTimeMoscow = (scheduledAt: string, language: string): string => {
  const date = new Date(scheduledAt);
  return date.toLocaleTimeString(getLocale(language), {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: MOSCOW_TIME_ZONE,
  });
};

export const formatThroughUntilIntake = (
  remainingMs: number,
  t: TFunction<'home'>,
): string => {
  if (remainingMs <= 0) {
    return t('notifications.timeToTake');
  }

  const totalSeconds = Math.ceil(remainingMs / 1000);
  let hours = Math.floor(totalSeconds / 3600);
  let minutes = Math.floor((totalSeconds % 3600) / 60) + 1;

  if (minutes >= 60) {
    hours += Math.floor(minutes / 60);
    minutes %= 60;
  }

  if (hours === 0) {
    return t('notifications.inMinutes', {count: minutes});
  }

  if (minutes === 0) {
    return t('notifications.inHours', {count: hours});
  }

  return t('notifications.inHoursMinutes', {
    hours,
    minutes,
    hoursWord: t('notifications.hoursUnit', {count: hours}),
    minutesWord: t('notifications.minutesUnit', {count: minutes}),
  });
};

export const formatCountdownUntilIntake = (remainingMs: number): string => {
  const totalSeconds = Math.max(0, Math.floor(remainingMs / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (value: number) => String(value).padStart(2, '0');

  if (hours > 0) {
    return `${hours}:${pad(minutes)}:${pad(seconds)}`;
  }

  return `${pad(minutes)}:${pad(seconds)}`;
};

export const getRemainingMsUntilIntake = (scheduledAt: string, nowMs = Date.now()): number =>
  new Date(scheduledAt).getTime() - nowMs;
