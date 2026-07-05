import {API_BASE} from '@env';

import type {PrescriptionBackgroundImageDto} from './drugs/apiDrugs.ts';
import {apiClient} from './client.ts';

export type CalendarEventStatus = 'SCHEDULED' | 'COMPLETED' | 'MISSED';

export type CalendarMedicationIntakeEventDto = {
  type: 'medication_intake';
  id: string;
  status: CalendarEventStatus;
  scheduledTime: string;
  medicationName: string;
  parentId?: string;
  notes?: string | null;
  doseAmount?: number;
  doseForm?: string;
  doseUnit?: string;
  scheduleText?: string;
  periodText?: string;
  hasReminder?: boolean;
  backgroundImage?: PrescriptionBackgroundImageDto;
};

export type CalendarEventDto = CalendarMedicationIntakeEventDto;

export type CalendarResponseDto = {
  from: string;
  to: string;
  days: Record<string, CalendarEventDto[]>;
};

export type GetCalendarParams = {
  from: string;
  to: string;
  search?: string;
  eventStatuses?: CalendarEventStatus[];
};

export const CALENDAR_QUERY_KEY = ['calendar'] as const;

export const apiCalendar = {
  getCalendar: async (params: GetCalendarParams) => {
    return apiClient.get<CalendarResponseDto>(
      `${API_BASE}/api/medicines/patients/calendar`,
      {
        params,
        requiresAuth: true,
      },
    );
  },
};
