import type {TFunction} from 'i18next';

import type {RegimenMealsDraftState} from './types.ts';

export const formatMealsPeriodicityLabel = (
  periodicity: RegimenMealsDraftState['periodicity'],
  weekDayShortLabels: string[],
  t: TFunction<'drugsCreate'>,
): string => {
  switch (periodicity.scheduleType) {
    case 'interval': {
      const days = periodicity.intervalDays;
      if (days === 1) {
        return t('meals.periodicityLabel.everyDay');
      }
      return t('meals.periodicityLabel.everyNDays', {count: days});
    }
    case 'weekDays': {
      const sortedDayKeys = [...periodicity.selectedWeekDayKeys].sort((left, right) => left - right);
      return sortedDayKeys.map(dayKey => weekDayShortLabels[dayKey] ?? '').filter(Boolean).join(', ');
    }
    case 'dates':
      return t('meals.periodicityLabel.individualDates');
    default:
      return t('meals.periodicityLabel.everyDay');
  }
};

export const isMealsPeriodicityConfigured = (meals: RegimenMealsDraftState): boolean => {
  switch (meals.periodicity.scheduleType) {
    case 'interval':
      return meals.periodicity.intervalDays >= 1;
    case 'weekDays':
      return meals.periodicity.selectedWeekDayKeys.length > 0;
    case 'dates':
      return meals.periodicity.dates.length > 0;
    default:
      return false;
  }
};
