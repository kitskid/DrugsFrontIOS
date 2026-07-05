import type {MealItem} from '../../../features/api/meals/types.ts';

const DEFAULT_MEAL_NAMES = ['Завтрак', 'Обед', 'Ужин', 'Перекус'] as const;

export const getDefaultMealName = (mealsCount: number): string => {
  if (mealsCount < 3) {
    return DEFAULT_MEAL_NAMES[mealsCount];
  }

  return DEFAULT_MEAL_NAMES[3];
};

const DEFAULT_MEAL_TIMES: Record<string, string> = {
  Завтрак: '08:00',
  Обед: '13:00',
  Ужин: '18:00',
};

const formatNowTime = () => {
  const now = new Date();
  return `${`${now.getHours()}`.padStart(2, '0')}:${`${now.getMinutes()}`.padStart(2, '0')}`;
};

export const getDefaultMealTime = (mealName: string) =>
  DEFAULT_MEAL_TIMES[mealName] ?? formatNowTime();

const timeStringToMinutes = (time: string) => {
  const [hours, minutes] = time.split(':').map(Number);
  return (hours ?? 0) * 60 + (minutes ?? 0);
};

export type {MealItem} from '../../../features/api/meals/types.ts';

export const sortMealsByTime = (meals: MealItem[]) =>
  [...meals].sort((left, right) => timeStringToMinutes(left.time) - timeStringToMinutes(right.time));
