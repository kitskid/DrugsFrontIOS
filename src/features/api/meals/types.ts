export type MealSlotType = 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'custom';

export type MealItem = {
  id: string;
  serverSlotId?: string;
  name: string;
  time: string;
  slotType?: MealSlotType;
};

export const MEAL_SCHEDULE_QUERY_KEY = ['meal-schedule', 'me'] as const;

export type MealSlotDto = {
  id: string;
  type: MealSlotType;
  time: string;
  label?: string | null;
  sortOrder?: number;
};

export type MealScheduleDto = {
  id: string;
  patientId: string;
  remindersEnabled: string | null;
  mealSlots: MealSlotDto[];
};

export type UpsertMealSlotDto = {
  id?: string;
  type: MealSlotType;
  time: string;
  label?: string;
};

export type UpsertMealScheduleDto = {
  mealSlots: UpsertMealSlotDto[];
};

export const areMealRemindersEnabled = (
  schedule: MealScheduleDto | null | undefined,
): boolean => schedule?.remindersEnabled != null;
