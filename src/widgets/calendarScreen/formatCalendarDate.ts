const MONTH_GENITIVE_KEYS = [
  'jan',
  'feb',
  'mar',
  'apr',
  'may',
  'jun',
  'jul',
  'aug',
  'sep',
  'oct',
  'nov',
  'dec',
] as const;

export const WEEK_DAY_CALENDAR_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const;

export const MONTH_GENITIVE_KEY_LIST = MONTH_GENITIVE_KEYS;

export const formatDateWithMonth = (date: Date, monthNames: string[]): string =>
  `${date.getDate()} ${monthNames[date.getMonth()]}`;

export const formatDateWithMonthAndYear = (date: Date, monthNames: string[]): string =>
  `${formatDateWithMonth(date, monthNames)} ${date.getFullYear()}`;
