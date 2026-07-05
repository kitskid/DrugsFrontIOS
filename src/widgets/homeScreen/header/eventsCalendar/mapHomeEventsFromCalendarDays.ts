import type {CalendarResponseDto} from '../../../../features/api/apiCalendar.ts';

import type {HomeEventRowItem} from './homeEventTypes.ts';

export const mapHomeEventsFromCalendarDays = (
  days: CalendarResponseDto['days'] | undefined,
): HomeEventRowItem[] => {
  if (!days) {
    return [];
  }

  return Object.values(days)
    .flat()
    .filter(event => event.type === 'medication_intake')
    .map(event => ({
      key: event.id,
      time: event.scheduledTime,
      title: event.medicationName?.trim() || '—',
    }));
};
