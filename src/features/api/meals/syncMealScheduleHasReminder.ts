import {apiProfile} from '../apiProfile.ts';
import type {MealScheduleDto} from './types.ts';

export const syncMealScheduleHasReminderIfChanged = async (
  nextHasReminder: boolean,
  initialHasReminder: boolean,
): Promise<MealScheduleDto | null> => {
  if (initialHasReminder === nextHasReminder) {
    return null;
  }

  const response = await apiProfile.meals.patchReminders();

  return response.data;
};
