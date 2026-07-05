import type {
  CreateMedicationPrescriptionDto,
  MealFoodRelation,
  MealLinkedPeriodicity,
  MedicationPrescriptionResponseDto,
} from './apiDrugs.ts';
import {formatDateOnlyFromStored, formatLocalDateIso} from '../../datetime/localDateTime.ts';
import type {
  MealsFoodRelation,
  MealsPeriodicityDraftState,
  MealsPeriodicityScheduleType,
  RegimenMealsDraftState,
} from '../../redux/drugsCreate/types.ts';

const mapFrontendWeekDayToApi = (frontendDay: number): number => (frontendDay + 1) % 7;

export const mapApiWeekDayToFrontend = (apiDay: number): number => (apiDay + 6) % 7;

const formatDateOnly = (dateIso: string): string => formatDateOnlyFromStored(dateIso);

export const mapMealsFoodRelationToApi = (
  foodRelation: MealsFoodRelation,
): MealFoodRelation => {
  switch (foodRelation) {
    case 'during':
      return 'with_meal';
    case 'after':
      return 'after_meal';
    case 'before':
    default:
      return 'before_meal';
  }
};

export const resolveMealsOffsetMinutes = (
  meals: RegimenMealsDraftState,
): number | undefined => {
  if (meals.foodRelation === 'during') {
    return undefined;
  }

  switch (meals.offsetPreset) {
    case '5m':
      return 5;
    case '15m':
      return 15;
    case '30m':
      return 30;
    case '1h':
      return 60;
    case '2h':
      return 120;
    case 'custom': {
      const multiplier = meals.customOffsetUnit === 'hour' ? 60 : 1;
      return meals.customOffsetAmount * multiplier;
    }
    default:
      return 5;
  }
};

const mapUiPeriodicityToApi = (
  periodicity: MealsPeriodicityDraftState,
): Pick<
  CreateMedicationPrescriptionDto,
  'mealLinkedPeriodicity' | 'durationDays' | 'intervalDays' | 'selectedDays' | 'intakeTimesByDate'
> => {
  switch (periodicity.scheduleType) {
    case 'interval':
      if (periodicity.intervalDays <= 1) {
        return {mealLinkedPeriodicity: 'daily'};
      }

      return {
        mealLinkedPeriodicity: 'every_n_days',
        intervalDays: periodicity.intervalDays,
      };
    case 'weekDays':
      return {
        mealLinkedPeriodicity: 'specific_days_of_week',
        selectedDays: periodicity.selectedWeekDayKeys.map(mapFrontendWeekDayToApi),
      };
    case 'dates':
      return {
        mealLinkedPeriodicity: 'specific_dates',
        intakeTimesByDate: [...periodicity.dates]
          .sort((left, right) => left.dateIso.localeCompare(right.dateIso))
          .map(item => ({
            date: formatDateOnly(item.dateIso),
          })),
      };
    default:
      return {mealLinkedPeriodicity: 'daily'};
  }
};

export const appendMealsRegimenToPayload = (
  payload: CreateMedicationPrescriptionDto,
  meals: RegimenMealsDraftState,
  durationDays: number,
): void => {
  payload.scheduleType = 'meal_linked';
  payload.linkedMealSlotIds = [...meals.selectedMealSlotIds];
  payload.foodRelation = mapMealsFoodRelationToApi(meals.foodRelation);

  const mealOffsetMinutes = resolveMealsOffsetMinutes(meals);
  if (mealOffsetMinutes != null) {
    payload.mealOffsetMinutes = mealOffsetMinutes;
  }

  const periodicityFields = mapUiPeriodicityToApi(meals.periodicity);

  payload.mealLinkedPeriodicity = periodicityFields.mealLinkedPeriodicity;

  if (periodicityFields.mealLinkedPeriodicity !== 'specific_dates') {
    payload.durationDays = durationDays;
  }

  if (periodicityFields.intervalDays != null) {
    payload.intervalDays = periodicityFields.intervalDays;
  }

  if (periodicityFields.selectedDays != null) {
    payload.selectedDays = periodicityFields.selectedDays;
  }

  if (periodicityFields.intakeTimesByDate != null) {
    payload.intakeTimesByDate = periodicityFields.intakeTimesByDate;
  }
};

const resolveOffsetPresetFromMinutes = (
  minutes: number,
): Pick<RegimenMealsDraftState, 'offsetPreset' | 'customOffsetAmount' | 'customOffsetUnit'> => {
  switch (minutes) {
    case 5:
      return {offsetPreset: '5m', customOffsetAmount: 2, customOffsetUnit: 'hour'};
    case 15:
      return {offsetPreset: '15m', customOffsetAmount: 2, customOffsetUnit: 'hour'};
    case 30:
      return {offsetPreset: '30m', customOffsetAmount: 2, customOffsetUnit: 'hour'};
    case 60:
      return {offsetPreset: '1h', customOffsetAmount: 2, customOffsetUnit: 'hour'};
    case 120:
      return {offsetPreset: '2h', customOffsetAmount: 2, customOffsetUnit: 'hour'};
    default:
      if (minutes % 60 === 0) {
        return {
          offsetPreset: 'custom',
          customOffsetAmount: minutes / 60,
          customOffsetUnit: 'hour',
        };
      }

      return {
        offsetPreset: 'custom',
        customOffsetAmount: minutes,
        customOffsetUnit: 'minute',
      };
  }
};

export const mapApiFoodRelationToMealsDraft = (
  foodRelation: MealFoodRelation | null | undefined,
  mealOffsetMinutes: number | null | undefined,
): Pick<
  RegimenMealsDraftState,
  'foodRelation' | 'offsetPreset' | 'customOffsetAmount' | 'customOffsetUnit'
> => {
  if (foodRelation === 'with_meal') {
    return {
      foodRelation: 'during',
      offsetPreset: '5m',
      customOffsetAmount: 2,
      customOffsetUnit: 'hour',
    };
  }

  if (foodRelation === 'after_meal') {
    return {
      foodRelation: 'after',
      ...resolveOffsetPresetFromMinutes(Math.abs(mealOffsetMinutes ?? 15)),
    };
  }

  return {
    foodRelation: 'before',
    ...resolveOffsetPresetFromMinutes(Math.abs(mealOffsetMinutes ?? 5)),
  };
};

const mapApiPeriodicityToScheduleType = (
  mealLinkedPeriodicity: MealLinkedPeriodicity | null | undefined,
  response: MedicationPrescriptionResponseDto,
): MealsPeriodicityScheduleType => {
  if (mealLinkedPeriodicity === 'specific_dates') {
    return 'dates';
  }

  if (mealLinkedPeriodicity === 'specific_days_of_week') {
    return 'weekDays';
  }

  if (mealLinkedPeriodicity === 'every_n_days') {
    return 'interval';
  }

  if (mealLinkedPeriodicity === 'daily') {
    return 'interval';
  }

  if (response.intakeTimesByDate && response.intakeTimesByDate.length > 0) {
    return 'dates';
  }

  if (response.selectedDays && response.selectedDays.length > 0) {
    return 'weekDays';
  }

  if (response.intervalDays && response.intervalDays > 1) {
    return 'interval';
  }

  return 'interval';
};

export const mapApiPeriodicityToMealsDraft = (
  response: MedicationPrescriptionResponseDto,
): MealsPeriodicityDraftState => {
  const scheduleType = mapApiPeriodicityToScheduleType(response.mealLinkedPeriodicity, response);
  const defaultState: MealsPeriodicityDraftState = {
    scheduleType,
    intervalDays: 1,
    selectedWeekDayKeys: [],
    dates: [],
    nextDateId: 1,
  };

  if (scheduleType === 'dates') {
    const datesSource = response.intakeTimesByDate ?? [];

    return {
      ...defaultState,
      dates: datesSource.map((entry, index) => {
        const dateParts = entry.date.split('-').map(Number);
        const [year = 0, month = 1, day = 1] = dateParts;

        return {
          id: index + 1,
          dateIso: formatLocalDateIso(new Date(year, month - 1, day)),
        };
      }),
      nextDateId: datesSource.length + 1,
    };
  }

  if (scheduleType === 'weekDays') {
    return {
      ...defaultState,
      selectedWeekDayKeys: (response.selectedDays ?? []).map(mapApiWeekDayToFrontend),
    };
  }

  return {
    ...defaultState,
    intervalDays:
      response.mealLinkedPeriodicity === 'every_n_days'
        ? response.intervalDays ?? 2
        : 1,
  };
};

export const resolveLinkedMealSlotIds = (
  response: MedicationPrescriptionResponseDto,
): string[] => response.linkedMealSlotIds ?? [];
