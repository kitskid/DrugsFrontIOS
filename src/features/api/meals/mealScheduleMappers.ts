import type {MealItem, MealScheduleDto, MealSlotDto, UpsertMealScheduleDto, UpsertMealSlotDto} from './types.ts';

const PRESET_TYPE_TO_NAME: Record<string, string> = {
  breakfast: 'Завтрак',
  lunch: 'Обед',
  dinner: 'Ужин',
  snack: 'Перекус',
};

const PRESET_NAME_TO_TYPE: Record<string, UpsertMealSlotDto['type']> = {
  Завтрак: 'breakfast',
  Обед: 'lunch',
  Ужин: 'dinner',
  Перекус: 'snack',
};

export const normalizeMealTimeToApi = (time: string): string => {
  const [rawHours, rawMinutes] = time.split(':');
  const hours = Number(rawHours);
  const minutes = Number(rawMinutes);

  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
    return time;
  }

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
};

export const formatMealTimeDisplay = (time: string): string => {
  const [rawHours, rawMinutes] = time.split(':');
  const hours = Number(rawHours);
  const minutes = rawMinutes ?? '00';

  if (!Number.isFinite(hours)) {
    return time;
  }

  return `${hours}:${minutes.padStart(2, '0')}`;
};

const slotToMealItem = (slot: MealSlotDto): MealItem => {
  const name =
    slot.type === 'custom'
      ? (slot.label?.trim() ?? '')
      : (PRESET_TYPE_TO_NAME[slot.type] ?? slot.label?.trim() ?? '');

  return {
    id: slot.id,
    serverSlotId: slot.id,
    name,
    time: slot.time,
    slotType: slot.type,
  };
};

const sortMealSlots = (slots: MealSlotDto[]): MealSlotDto[] =>
  [...slots].sort((left, right) => {
    if (left.sortOrder != null && right.sortOrder != null) {
      return left.sortOrder - right.sortOrder;
    }

    return left.time.localeCompare(right.time);
  });

export const mapMealScheduleToMealItems = (schedule: MealScheduleDto | null | undefined): MealItem[] => {
  if (!schedule) {
    return [];
  }

  return sortMealSlots(schedule.mealSlots).map(slotToMealItem);
};

export const buildUpsertMealScheduleDto = (meals: MealItem[]): UpsertMealScheduleDto => ({
  mealSlots: meals.map((meal): UpsertMealSlotDto => {
    const presetType = PRESET_NAME_TO_TYPE[meal.name];
    const base = {
      ...(meal.serverSlotId ? {id: meal.serverSlotId} : {}),
      time: normalizeMealTimeToApi(meal.time),
    };

    if (presetType) {
      return {
        ...base,
        type: presetType,
      };
    }

    return {
      ...base,
      type: 'custom',
      label: meal.name,
    };
  }),
});
