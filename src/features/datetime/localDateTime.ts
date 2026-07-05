type DateParts = {
  year: number;
  month: number;
  day: number;
};

const pad2 = (value: number): string => `${value}`.padStart(2, '0');

const hasAbsoluteTimezoneSuffix = (raw: string): boolean =>
  /(?:Z|[+-]\d{2}:\d{2})$/i.test(raw.trim());

export const formatLocalDateIso = (date: Date): string =>
  `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;

export const parseStoredDateIso = (dateIso: string | null | undefined): DateParts | null => {
  if (!dateIso) {
    return null;
  }

  const dateOnlyMatch = /^(\d{4})-(\d{2})-(\d{2})/.exec(dateIso.trim());
  if (!dateOnlyMatch) {
    return null;
  }

  return {
    year: Number(dateOnlyMatch[1]),
    month: Number(dateOnlyMatch[2]),
    day: Number(dateOnlyMatch[3]),
  };
};

export const localDateIsoToDate = (dateIso: string | null | undefined): Date | null => {
  const parts = parseStoredDateIso(dateIso);
  if (!parts) {
    return null;
  }

  return new Date(parts.year, parts.month - 1, parts.day);
};

export const normalizeTimeValue = (time: string): string => {
  const [hoursRaw = '0', minutesRaw = '0'] = time.trim().split(':');
  const hours = Number.parseInt(hoursRaw, 10);
  const minutes = Number.parseInt(minutesRaw, 10);

  return `${pad2(Number.isFinite(hours) ? hours : 0)}:${pad2(Number.isFinite(minutes) ? minutes : 0)}`;
};

export const buildLocalDateTime = (dateIso: string | null | undefined, time: string): Date => {
  const normalizedTime = normalizeTimeValue(time);
  const [hoursRaw, minutesRaw] = normalizedTime.split(':');
  const hours = Number.parseInt(hoursRaw, 10);
  const minutes = Number.parseInt(minutesRaw, 10);
  const dateParts = parseStoredDateIso(dateIso);

  if (dateParts) {
    return new Date(dateParts.year, dateParts.month - 1, dateParts.day, hours, minutes, 0, 0);
  }

  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes, 0, 0);
};

const formatTimezoneOffset = (date: Date): string => {
  const offsetMinutes = -date.getTimezoneOffset();
  const sign = offsetMinutes >= 0 ? '+' : '-';
  const absoluteMinutes = Math.abs(offsetMinutes);
  const hours = Math.floor(absoluteMinutes / 60);
  const minutes = absoluteMinutes % 60;

  return `${sign}${pad2(hours)}:${pad2(minutes)}`;
};

const parseWallClockDateTime = (
  raw: string,
): {
  dateIso: string;
  time: string;
} | null => {
  const match = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2}))?/.exec(raw.trim());
  if (!match) {
    return null;
  }

  return {
    dateIso: `${match[1]}-${match[2]}-${match[3]}`,
    time: match[4] != null && match[5] != null ? `${match[4]}:${match[5]}` : '08:00',
  };
};

export const formatApiStartDate = (dateIso: string | null | undefined, time: string): string => {
  const localDateTime = buildLocalDateTime(dateIso, time);
  const dateParts = parseStoredDateIso(dateIso) ?? {
    year: localDateTime.getFullYear(),
    month: localDateTime.getMonth() + 1,
    day: localDateTime.getDate(),
  };
  const normalizedTime = normalizeTimeValue(time);
  const offset = formatTimezoneOffset(localDateTime);

  return `${dateParts.year}-${pad2(dateParts.month)}-${pad2(dateParts.day)}T${normalizedTime}:00${offset}`;
};

export const parseApiStartDate = (
  raw: string,
): {
  dateIso: string;
  time: string;
} => {
  const trimmed = raw.trim();

  if (hasAbsoluteTimezoneSuffix(trimmed)) {
    const date = new Date(trimmed);
    if (!Number.isNaN(date.getTime())) {
      return {
        dateIso: formatLocalDateIso(date),
        time: `${pad2(date.getHours())}:${pad2(date.getMinutes())}`,
      };
    }
  }

  const wallClock = parseWallClockDateTime(trimmed);
  if (wallClock) {
    return wallClock;
  }

  const now = new Date();
  return {
    dateIso: formatLocalDateIso(now),
    time: '08:00',
  };
};

export const formatDateOnlyFromStored = (dateIso: string): string => {
  const parts = parseStoredDateIso(dateIso);
  if (!parts) {
    return dateIso.slice(0, 10);
  }

  return `${parts.year}-${pad2(parts.month)}-${pad2(parts.day)}`;
};
