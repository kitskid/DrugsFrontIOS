import type {
  CalendarEventDto,
  CalendarMedicationIntakeEventDto,
  CalendarResponseDto,
} from '../../../../features/api/apiCalendar.ts';
import {formatApiDate} from '../../../calendarScreen/mapCalendarData.ts';
import {DEFAULT_BACKGROUND_IMAGE} from '../../../../shared/ui/drugs/drugsCardBackgroundIconRegistry.ts';

import type {NotificationReminder} from './notificationTypes.ts';

const isMedicationIntakeEvent = (
  event: CalendarEventDto,
): event is CalendarMedicationIntakeEventDto => event.type === 'medication_intake';

export const getTodayCalendarEvents = (
  days: CalendarResponseDto['days'] | undefined,
): CalendarEventDto[] => {
  if (!days) {
    return [];
  }

  return days[formatApiDate(new Date())] ?? [];
};

export const mapCalendarEventsToNotificationReminders = (
  events: CalendarEventDto[],
): NotificationReminder[] =>
  events
    .filter(isMedicationIntakeEvent)
    .filter(event => event.status !== 'COMPLETED')
    .slice()
    .sort(
      (left, right) =>
        new Date(left.scheduledTime).getTime() - new Date(right.scheduledTime).getTime(),
    )
    .map(event => ({
      id: event.id,
      medicationName: event.medicationName?.trim() || '—',
      scheduledAt: event.scheduledTime,
      backgroundImage: event.backgroundImage ?? DEFAULT_BACKGROUND_IMAGE,
    }));
