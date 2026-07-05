import {mockDrugsData} from '../../../../../mockDrugsData.ts';

import type {HomeEventRowItem} from './homeEventTypes.ts';

type MockDrugItem = (typeof mockDrugsData.data)[number];

const startOfDay = (date: Date): Date =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());

const buildScheduledIso = (date: Date, time: string): string => {
  const [hours, minutes] = time.split(':');
  const scheduled = new Date(date);
  scheduled.setHours(Number(hours), Number(minutes), 0, 0);
  return scheduled.toISOString();
};

const getMedicationTitle = (item: MockDrugItem): string =>
  item.medicationName?.trim() || item.customMedicationName?.trim() || '—';

const isDayScheduled = (item: MockDrugItem, date: Date): boolean => {
  if (
    item.scheduleType === 'specific_days_of_week' &&
    item.selectedDays &&
    item.selectedDays.length > 0
  ) {
    return item.selectedDays.some(day => day === date.getDay());
  }

  return true;
};

const getTimesForDay = (item: MockDrugItem, date: Date): string[] => {
  if (item.intakeTimesByDay && item.intakeTimesByDay.length > 0) {
    const daySchedule = item.intakeTimesByDay.find(
      schedule => schedule.day === date.getDay(),
    );
    return daySchedule ? [...daySchedule.intakeTimes] : [];
  }

  return item.intakeTimes ? [...item.intakeTimes] : [];
};

export const mapHomeEventsFromMockDrugs = (): HomeEventRowItem[] => {
  const events: HomeEventRowItem[] = [];

  mockDrugsData.data.forEach(item => {
    const title = getMedicationTitle(item);
    const rangeStart = startOfDay(new Date(item.startDate));
    const rangeEnd = startOfDay(new Date(item.endDate));

    if (Number.isNaN(rangeStart.getTime()) || Number.isNaN(rangeEnd.getTime())) {
      return;
    }

    const cursor = new Date(rangeStart);

    while (cursor.getTime() <= rangeEnd.getTime()) {
      if (isDayScheduled(item, cursor)) {
        getTimesForDay(item, cursor).forEach(time => {
          events.push({
            key: `${item.id}-${cursor.toISOString()}-${time}`,
            time: buildScheduledIso(cursor, time),
            title,
          });
        });
      }

      cursor.setDate(cursor.getDate() + 1);
    }
  });

  return events;
};
