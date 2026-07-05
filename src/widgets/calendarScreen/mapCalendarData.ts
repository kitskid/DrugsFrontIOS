import type {
  CalendarEventDto,
  CalendarEventStatus,
  CalendarMedicationIntakeEventDto,
  CalendarResponseDto,
} from '../../features/api/apiCalendar.ts';
import type {PrescriptionBackgroundImageDto} from '../../features/api/drugs/apiDrugs.ts';
import {DEFAULT_BACKGROUND_IMAGE} from '../../shared/ui/drugs/drugsCardBackgroundIconRegistry.ts';

export type CalendarCardBackgroundImage = PrescriptionBackgroundImageDto;

export type CalendarCardGroupItem = {
  id: string;
  prescriptionId: string | null;
  medicationName: string;
  notes: string | null;
  intakeTimes: readonly string[];
  status: CalendarEventStatus;
  backgroundImage: CalendarCardBackgroundImage;
};

export type CalendarCardGroup = {
  date: Date;
  items: CalendarCardGroupItem[];
};

export type CalendarPreviewCardItem = {
  id: string;
  medicationName: string;
  backgroundImage: CalendarCardBackgroundImage;
};

export const formatApiDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/** Local calendar day at 00:00:00.000, serialized as ISO-8601 UTC (toISOString). */
export const localDateToIsoString = (date: Date): string =>
  new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    0,
    0,
    0,
    0,
  ).toISOString();

/** Local calendar day at 23:59:59.999, serialized as ISO-8601 UTC (toISOString). */
export const localDateToEndOfDayIsoString = (date: Date): string =>
  new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    23,
    59,
    59,
    999,
  ).toISOString();

export const getMonthRange = (
  year: number,
  monthIndex: number,
): {from: string; to: string} => ({
  from: localDateToIsoString(new Date(year, monthIndex, 1)),
  to: localDateToIsoString(new Date(year, monthIndex + 1, 0)),
});

export const getYearRange = (year: number): {from: string; to: string} => ({
  from: localDateToIsoString(new Date(year, 0, 1)),
  to: localDateToIsoString(new Date(year, 11, 31)),
});

export const CALENDAR_YEAR_MIN = 1980;
export const CALENDAR_YEAR_MAX = 2080;

export const getHomeCalendarRange = (): {from: string; to: string} => {
  const fromDate = new Date();
  const toDate = new Date();
  toDate.setDate(toDate.getDate() + 6);

  return {
    from: localDateToIsoString(fromDate),
    to: localDateToIsoString(toDate),
  };
};

export const mergeCalendarRanges = (
  ranges: Array<{from: string; to: string}>,
): {from: string; to: string} | null => {
  if (ranges.length === 0) {
    return null;
  }

  let from = ranges[0].from;
  let to = ranges[0].to;

  ranges.slice(1).forEach(range => {
    if (range.from < from) {
      from = range.from;
    }
    if (range.to > to) {
      to = range.to;
    }
  });

  return {from, to};
};

const isMedicationIntakeEvent = (
  event: CalendarEventDto,
): event is CalendarMedicationIntakeEventDto =>
  event.type === 'medication_intake';

const parseApiDateKey = (dateKey: string): Date | null => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateKey);
  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]) - 1;
  const day = Number(match[3]);
  const date = new Date(year, month, day);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date;
};

const formatIntakeTime = (scheduledTime: string): string => {
  const date = new Date(scheduledTime);
  if (Number.isNaN(date.getTime())) {
    return '--:--';
  }

  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
};

const resolveBackgroundImage = (
  event: CalendarMedicationIntakeEventDto,
): CalendarCardBackgroundImage => event.backgroundImage ?? DEFAULT_BACKGROUND_IMAGE;

const resolveMedicationName = (event: CalendarMedicationIntakeEventDto): string =>
  event.medicationName?.trim() || '—';

const resolveNotes = (event: CalendarMedicationIntakeEventDto): string | null => {
  if (typeof event.notes !== 'string') {
    return null;
  }

  const trimmed = event.notes.trim();
  return trimmed.length > 0 ? trimmed : null;
};

export const getCalendarDatesWithEvents = (
  days: CalendarResponseDto['days'] | undefined,
): ReadonlySet<string> => {
  if (!days) {
    return new Set<string>();
  }

  return new Set(
    Object.entries(days)
      .filter(([, events]) => events.length > 0)
      .map(([dateKey]) => dateKey),
  );
};

export const mapCalendarToCardGroups = (
  days: CalendarResponseDto['days'] | undefined,
): CalendarCardGroup[] => {
  if (!days) {
    return [];
  }

  const groupedMap = new Map<string, CalendarCardGroup>();

  Object.entries(days).forEach(([dateKey, events]) => {
    const date = parseApiDateKey(dateKey);
    if (!date) {
      return;
    }

    events.forEach(event => {
      if (!isMedicationIntakeEvent(event)) {
        return;
      }

      const cardItem: CalendarCardGroupItem = {
        id: event.id,
        prescriptionId: event.parentId?.trim() || null,
        medicationName: resolveMedicationName(event),
        notes: resolveNotes(event),
        intakeTimes: [formatIntakeTime(event.scheduledTime)],
        status: event.status,
        backgroundImage: resolveBackgroundImage(event),
      };

      const grouped = groupedMap.get(dateKey);
      if (grouped) {
        grouped.items.push(cardItem);
        return;
      }

      groupedMap.set(dateKey, {
        date,
        items: [cardItem],
      });
    });
  });

  return Array.from(groupedMap.values())
    .map(group => ({
      ...group,
      items: group.items.sort((left, right) =>
        (left.intakeTimes[0] ?? '').localeCompare(right.intakeTimes[0] ?? ''),
      ),
    }))
    .sort((left, right) => left.date.getTime() - right.date.getTime());
};

const buildPreviewDedupeKey = (event: CalendarMedicationIntakeEventDto): string =>
  event.parentId?.trim() || event.id;

export const mapCalendarToPreviewCardsByMonth = (
  days: CalendarResponseDto['days'] | undefined,
): Record<string, CalendarPreviewCardItem[]> => {
  if (!days) {
    return {};
  }

  const grouped = new Map<string, Map<string, CalendarPreviewCardItem>>();

  Object.entries(days).forEach(([dateKey, events]) => {
    const date = parseApiDateKey(dateKey);
    if (!date) {
      return;
    }

    const monthKey = `${date.getFullYear()}-${date.getMonth()}`;

    events.forEach(event => {
      if (!isMedicationIntakeEvent(event)) {
        return;
      }

      const dedupeKey = buildPreviewDedupeKey(event);
      const monthBucket = grouped.get(monthKey) ?? new Map<string, CalendarPreviewCardItem>();

      if (!monthBucket.has(dedupeKey)) {
        monthBucket.set(dedupeKey, {
          id: dedupeKey,
          medicationName: resolveMedicationName(event),
          backgroundImage: resolveBackgroundImage(event),
        });
      }

      grouped.set(monthKey, monthBucket);
    });
  });

  return Object.fromEntries(
    Array.from(grouped.entries()).map(([monthKey, itemsMap]) => [
      monthKey,
      Array.from(itemsMap.values()),
    ]),
  );
};

export const mapCalendarToPreviewCardsByYearMap = (
  days: CalendarResponseDto['days'] | undefined,
): Record<number, CalendarPreviewCardItem[]> => {
  if (!days) {
    return {};
  }

  const grouped = new Map<number, Map<string, CalendarPreviewCardItem>>();

  Object.entries(days).forEach(([dateKey, events]) => {
    const date = parseApiDateKey(dateKey);
    if (!date) {
      return;
    }

    const year = date.getFullYear();

    events.forEach(event => {
      if (!isMedicationIntakeEvent(event)) {
        return;
      }

      const dedupeKey = buildPreviewDedupeKey(event);
      const yearBucket =
        grouped.get(year) ?? new Map<string, CalendarPreviewCardItem>();

      if (!yearBucket.has(dedupeKey)) {
        yearBucket.set(dedupeKey, {
          id: dedupeKey,
          medicationName: resolveMedicationName(event),
          backgroundImage: resolveBackgroundImage(event),
        });
      }

      grouped.set(year, yearBucket);
    });
  });

  const result: Record<number, CalendarPreviewCardItem[]> = {};
  grouped.forEach((itemsMap, year) => {
    result[year] = Array.from(itemsMap.values());
  });
  return result;
};

export const mapCalendarToPreviewCardsByYear = (
  days: CalendarResponseDto['days'] | undefined,
): CalendarPreviewCardItem[] => {
  if (!days) {
    return [];
  }

  const itemsMap = new Map<string, CalendarPreviewCardItem>();

  Object.values(days).forEach(events => {
    events.forEach(event => {
      if (!isMedicationIntakeEvent(event)) {
        return;
      }

      const dedupeKey = buildPreviewDedupeKey(event);
      if (itemsMap.has(dedupeKey)) {
        return;
      }

      itemsMap.set(dedupeKey, {
        id: dedupeKey,
        medicationName: resolveMedicationName(event),
        backgroundImage: resolveBackgroundImage(event),
      });
    });
  });

  return Array.from(itemsMap.values());
};
