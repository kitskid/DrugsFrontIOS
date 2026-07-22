import {API_BASE} from '@env';

import type {
  CalendarEventStatus,
  ManualCalendarEventStatus,
} from '../apiCalendar.ts';
import {apiClient} from '../client.ts';

export type MedicationIntakeStatusResponseDto = {
  id: string;
  status: CalendarEventStatus;
};

export type UpdateMedicationIntakeStatusPayload = {
  status: ManualCalendarEventStatus;
  /** Optional for COMPLETED; server uses current time when omitted. */
  actualTime?: string;
};

export type MedicationScheduleType =
  | 'multiple_times_per_day'
  | 'every_n_hours'
  | 'every_n_days'
  | 'specific_days_of_week'
  | 'once'
  | 'as_needed'
  | 'custom_schedule'
  | 'meal_linked'
  | 'not_scheduled';

export type MealLinkedPeriodicity =
  | 'daily'
  | 'specific_days_of_week'
  | 'every_n_days'
  | 'specific_dates';

export type IntakeTimesByDayDto = {
  day: number;
  intakeTimes: string[];
};

export type IntakeTimesByDateDto = {
  date: string;
  intakeTimes?: string[];
};

export type MedicationPrescriptionFileDto = {
  fileId: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
};

export type MealFoodRelation = 'before_meal' | 'with_meal' | 'after_meal';

export type FoodRelation = MealFoodRelation | null;

export type CreateMedicationPrescriptionDto = {
  medicationId?: string;
  customMedicationName?: string;
  doseForm: string;
  doseAmount: number;
  doseUnit: string;
  scheduleType: MedicationScheduleType;
  startDate: string;
  intakeTimes?: string[];
  intervalHours?: number;
  intervalDays?: number;
  noIntakeWindowFrom?: string;
  noIntakeWindowTo?: string;
  selectedDays?: number[];
  intakeTimesByDay?: IntakeTimesByDayDto[];
  intakeTimesByDate?: IntakeTimesByDateDto[];
  durationDays?: number;
  endDate?: string;
  isIndefinite?: boolean;
  notes?: string;
  reminderSecondsBeforeIntake?: number[];
  files?: MedicationPrescriptionFileDto[];
  foodRelation?: FoodRelation;
  mealLinkedPeriodicity?: MealLinkedPeriodicity | null;
  linkedMealSlotIds?: string[];
  mealOffsetMinutes?: number | null;
};

export type MedicationPrescriptionStatus =
  | 'draft'
  | 'active'
  | 'paused'
  | 'completed'
  | 'cancelled'
  | 'expired';

export type PrescriptionBackgroundImageDto = {
  form: number;
  reverse: number;
  color: number;
  gradientDirection: number;
};

export type NotificationSettingsDto = {
  repeatCount?: number | null;
  repeatInterval?: number;
};

export type MedicationInfoDto = {
  id: string;
  tradeName: string;
  activeSubstance?: string | null;
  form?: string | null;
  dosage?: string | null;
};

export type PrescriptionDocumentDto = {
  id: string;
  patientId: string;
  fileId: string;
  folderId?: string | null;
  status?: string;
  type?: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  uploadDate?: string;
  description?: string | null;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
};

export type MedicationPrescriptionResponseDto = {
  id: string;
  patientId: string;
  prescriptionEventId?: string | null;
  doseForm: string;
  doseAmount: number;
  doseUnit: string;
  medicationName: string;
  scheduleType: MedicationScheduleType;
  intakeTimes?: string[];
  intervalHours?: number | null;
  intervalDays?: number | null;
  notificationWindowFrom?: string | null;
  notificationWindowTo?: string | null;
  noIntakeWindowFrom?: string | null;
  noIntakeWindowTo?: string | null;
  selectedDays?: number[];
  intakeTimesByDay?: IntakeTimesByDayDto[];
  intakeTimesByDate?: IntakeTimesByDateDto[];
  durationDays?: number | null;
  startDate: string;
  endDate?: string | null;
  status?: MedicationPrescriptionStatus;
  notes?: string | null;
  medication?: MedicationInfoDto | null;
  customMedicationName?: string | null;
  isIndefinite: boolean;
  createdAt: string;
  updatedAt: string;
  reminderSecondsBeforeIntake?: number[] | null;
  notificationSettings?: NotificationSettingsDto | null;
  scheduleDisplay: string;
  intakesTodayCount?: number;
  intakesRemainingTodayCount?: number;
  intakesRemainingTotalCount?: number;
  documents?: PrescriptionDocumentDto[];
  backgroundImage?: PrescriptionBackgroundImageDto;
  foodRelation?: FoodRelation | null;
  mealLinkedPeriodicity?: MealLinkedPeriodicity | null;
  linkedMealSlotIds?: string[];
  mealOffsetMinutes?: number | null;
  linkedMealLabel?: string | null;
};

export type UpdateMedicationPrescriptionDto = Partial<CreateMedicationPrescriptionDto> & {
  notificationSettings?: NotificationSettingsDto | null;
};

export type PaginationMetaDto = {
  total: number;
  offset: number;
  limit: number;
  page: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
};

export type MedicationPrescriptionsPaginatedResponseDto = {
  data: MedicationPrescriptionResponseDto[];
  meta: PaginationMetaDto;
};

export type GetMedicationPrescriptionsParams = {
  offset?: number;
  limit?: number;
  isIndefinite?: boolean;
  customMedicationName?: string;
  isActive?: boolean;
  linkedMealSlotId?: string;
};

export const MEDICATION_PRESCRIPTIONS_QUERY_KEY = ['medicationPrescriptions'] as const;

export const DRUGS_LIST_PRESCRIPTIONS_QUERY_KEY = [
  ...MEDICATION_PRESCRIPTIONS_QUERY_KEY,
  'list',
] as const;

export const ACTIVE_MEDICATION_PRESCRIPTIONS_LIMIT = 100;

export const ACTIVE_MEDICATION_PRESCRIPTIONS_PARAMS: GetMedicationPrescriptionsParams = {
  offset: 0,
  limit: ACTIVE_MEDICATION_PRESCRIPTIONS_LIMIT,
  isActive: true,
};

export const ACTIVE_MEDICATION_PRESCRIPTIONS_QUERY_KEY = [
  ...MEDICATION_PRESCRIPTIONS_QUERY_KEY,
  {isActive: true},
] as const;

export const apiDrugs = {
  getMedicationPrescriptions: async (params: GetMedicationPrescriptionsParams = {}) => {
    return apiClient.get<MedicationPrescriptionsPaginatedResponseDto>(
      `${API_BASE}/api/medicines/medication-prescriptions`,
      {
        params,
        requiresAuth: true,
      },
    );
  },
  getMedicationPrescriptionById: async (id: string) => {
    return apiClient.get<MedicationPrescriptionResponseDto>(
      `${API_BASE}/api/medicines/medication-prescriptions/${id}`,
      {requiresAuth: true},
    );
  },
  createDrugPrescriptions: async (payload: CreateMedicationPrescriptionDto) => {
    return apiClient.post<MedicationPrescriptionResponseDto>(
      `${API_BASE}/api/medicines/medication-prescriptions`,
      payload,
      {requiresAuth: true},
    );
  },
  updateDrugPrescription: async (
    id: string,
    payload: UpdateMedicationPrescriptionDto,
  ) => {
    return apiClient.patch<MedicationPrescriptionResponseDto>(
      `${API_BASE}/api/medicines/medication-prescriptions/${id}`,
      payload,
      {requiresAuth: true},
    );
  },
  removeDrugPrescriptionAttachment: async (id: string, documentId: string) => {
    return apiClient.delete<MedicationPrescriptionResponseDto>(
      `${API_BASE}/api/medicines/medication-prescriptions/${id}/attachments/${documentId}`,
      {requiresAuth: true},
    );
  },
  deleteDrugPrescription: async (id: string, options?: {signal?: AbortSignal}) => {
    return apiClient.delete<MedicationPrescriptionResponseDto>(
      `${API_BASE}/api/medicines/medication-prescriptions/${id}`,
      {
        requiresAuth: true,
        signal: options?.signal,
      },
    );
  },
  updateMedicationIntakeStatus: async (
    id: string,
    payload: UpdateMedicationIntakeStatusPayload | ManualCalendarEventStatus,
  ) => {
    const body: UpdateMedicationIntakeStatusPayload =
      typeof payload === 'string' ? {status: payload} : payload;

    return apiClient.patch<MedicationIntakeStatusResponseDto>(
      `${API_BASE}/api/medicines/medication-intakes/${id}/status`,
      body,
      {requiresAuth: true},
    );
  },
};
