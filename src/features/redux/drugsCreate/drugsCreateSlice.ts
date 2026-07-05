import {createSlice, type PayloadAction} from '@reduxjs/toolkit';

import {formatLocalDateIso} from '../../datetime/localDateTime.ts';
import type {
  DrugsCreateState,
  NotificationsState,
  RegimenDraftState,
  RegimenMealsDraftState,
  ReleaseDosageState,
  TimeItem,
} from './types';
import {isMealsPeriodicityConfigured} from './mealsRegimenUtils';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

const startOfDay = (date: Date): Date =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());

const isSameCalendarDay = (left: Date, right: Date): boolean =>
  startOfDay(left).getTime() === startOfDay(right).getTime();

const sortCalendarDayRange = (left: Date, right: Date): [Date, Date] => {
  const leftTime = startOfDay(left).getTime();
  const rightTime = startOfDay(right).getTime();
  return leftTime <= rightTime
    ? [startOfDay(left), startOfDay(right)]
    : [startOfDay(right), startOfDay(left)];
};

export type CalendarDrugsCreatePrefill = {
  /** Calendar interval start; null when a single day is selected */
  rangeStartIso: string | null;
  /** Selected day or interval end */
  rangeEndIso: string | null;
};

export const applyCalendarPrefillToRegimen = (
  regimen: RegimenDraftState,
  rangeStart: Date | null,
  rangeEnd: Date | null,
): RegimenDraftState => {
  if (!rangeEnd) {
    return regimen;
  }

  const regimenStart = rangeStart ?? rangeEnd;
  regimen.startDateIso = formatLocalDateIso(startOfDay(regimenStart));

  if (rangeStart && !isSameCalendarDay(rangeStart, rangeEnd)) {
    const [firstDay, lastDay] = sortCalendarDayRange(rangeStart, rangeEnd);
    const inclusiveDays =
      Math.round((lastDay.getTime() - firstDay.getTime()) / MS_PER_DAY) + 1;
    regimen.daysCount = String(Math.max(1, inclusiveDays));
  }

  return regimen;
};

const formatNowTime = () => {
  const now = new Date();
  return `${now.getHours()}`.padStart(2, '0') + ':' + `${now.getMinutes()}`.padStart(2, '0');
};

const createInitialWeekDayTimesByDay = (): Record<number, TimeItem[]> => {
  let nextId = 0;
  const defaultTime = formatNowTime();
  return {
    0: [{id: nextId++, value: defaultTime}],
    1: [{id: nextId++, value: defaultTime}],
    2: [{id: nextId++, value: defaultTime}],
    3: [{id: nextId++, value: defaultTime}],
    4: [{id: nextId++, value: defaultTime}],
    5: [{id: nextId++, value: defaultTime}],
    6: [{id: nextId++, value: defaultTime}],
  };
};

export const createInitialMealsState = (): RegimenMealsDraftState => ({
  periodicity: {
    scheduleType: 'interval',
    intervalDays: 1,
    selectedWeekDayKeys: [],
    dates: [],
    nextDateId: 1,
  },
  selectedMealSlotIds: [],
  hasMealReminderEnabled: false,
  initialHasMealReminderEnabled: null,
  foodRelation: 'before',
  offsetPreset: '5m',
  customOffsetAmount: 2,
  customOffsetUnit: 'hour',
});

const createInitialRegimenState = (): RegimenDraftState => ({
  regimenType: 'dailyAtTime',
  startDateIso: formatLocalDateIso(new Date()),
  startTime: formatNowTime(),
  daysCount: '7',
  daily: {
    times: [],
    nextTimeId: 1,
  },
  everyHour: {
    selectedPresetKey: '2',
    customHoursValue: '24',
    startPauseTime: '00:00',
    endPauseTime: '07:00',
    isIntervalSwitchActive: false,
  },
  weekDay: {
    timesByDay: createInitialWeekDayTimesByDay(),
    selectedDayKeys: [],
    applyToAllSourceDay: null,
    nextTimeId: 7,
  },
  everyDay: {
    interval: 1,
  },
  individual: {
    days: [],
    timesByDay: {},
    nextDayId: 0,
    nextTimeId: 0,
  },
  meals: createInitialMealsState(),
});

const createInitialNotificationsState = (): NotificationsState => ({
  selectedPresetKeys: [],
  customOffsetAmount: 2,
  customOffsetUnit: 'hour',
  isDoNotDisturbEnabled: false,
  doNotDisturbFrom: '00:00',
  doNotDisturbTo: '07:00',
});

export const isRegimenConfigured = (regimen: RegimenDraftState): boolean =>
  (regimen.regimenType === 'dailyAtTime' && regimen.daily.times.length > 0) ||
  (regimen.regimenType === 'everyNHours' && regimen.everyHour.customHoursValue.trim().length > 0) ||
  (regimen.regimenType === 'weekDays' && regimen.weekDay.selectedDayKeys.length > 0) ||
  (regimen.regimenType === 'everyNDays' && regimen.everyDay.interval > 0) ||
  (regimen.regimenType === 'individual' && regimen.individual.days.length > 0) ||
  (regimen.regimenType === 'meals' &&
    regimen.meals.selectedMealSlotIds.length > 0 &&
    isMealsPeriodicityConfigured(regimen.meals));

export const hasAllFormDosageValues = (releaseDosage: ReleaseDosageState): boolean =>
  Boolean(releaseDosage.releaseForm.trim()) &&
  Boolean(releaseDosage.dosageAmount.trim()) &&
  Boolean(releaseDosage.dosageUnit.trim());

const initialState: DrugsCreateState = {
  releaseDosage: {
    releaseForm: '',
    dosageAmount: '',
    dosageUnit: '',
  },
  regimen: createInitialRegimenState(),
  notifications: createInitialNotificationsState(),
};

const drugsCreateSlice = createSlice({
  name: 'drugsCreate',
  initialState,
  reducers: {
    resetDrugsCreateState() {
      return {
        ...initialState,
        regimen: createInitialRegimenState(),
        notifications: createInitialNotificationsState(),
      };
    },
    resetDrugsCreateStateFromCalendar(
      _state,
      action: PayloadAction<CalendarDrugsCreatePrefill>,
    ) {
      const rangeStart = action.payload.rangeStartIso
        ? new Date(action.payload.rangeStartIso)
        : null;
      const rangeEnd = action.payload.rangeEndIso
        ? new Date(action.payload.rangeEndIso)
        : null;
      const regimen = applyCalendarPrefillToRegimen(
        createInitialRegimenState(),
        rangeStart,
        rangeEnd,
      );

      return {
        ...initialState,
        regimen,
        notifications: createInitialNotificationsState(),
      };
    },
    hydrateDrugsCreateState(
      state,
      action: PayloadAction<{
        releaseDosage: ReleaseDosageState;
        regimen: RegimenDraftState;
        notifications: NotificationsState;
      }>,
    ) {
      state.releaseDosage = action.payload.releaseDosage;
      state.regimen = action.payload.regimen;
      state.notifications = action.payload.notifications;
    },
    setReleaseDosage(state, action: PayloadAction<ReleaseDosageState>) {
      state.releaseDosage = action.payload;
    },
    saveRegimenDraft(state, action: PayloadAction<RegimenDraftState>) {
      const draft = action.payload;
      const nextRegimen = createInitialRegimenState();

      nextRegimen.regimenType = draft.regimenType;
      nextRegimen.startDateIso = draft.startDateIso;
      nextRegimen.startTime = draft.startTime;
      nextRegimen.daysCount = draft.daysCount;

      switch (draft.regimenType) {
        case 'dailyAtTime':
          nextRegimen.daily = draft.daily;
          break;
        case 'everyNHours':
          nextRegimen.everyHour = draft.everyHour;
          break;
        case 'weekDays':
          nextRegimen.weekDay = draft.weekDay;
          break;
        case 'everyNDays':
          nextRegimen.everyDay = draft.everyDay;
          break;
        case 'individual':
          nextRegimen.individual = draft.individual;
          break;
        case 'meals':
          nextRegimen.meals = draft.meals;
          break;
        default:
          break;
      }

      state.regimen = nextRegimen;
    },
    saveNotificationsDraft(state, action: PayloadAction<NotificationsState>) {
      state.notifications = action.payload;
    },
    updateMealsRegimenDraft(state, action: PayloadAction<Partial<RegimenMealsDraftState>>) {
      state.regimen.meals = {
        ...state.regimen.meals,
        ...action.payload,
        periodicity: action.payload.periodicity
          ? {
              ...state.regimen.meals.periodicity,
              ...action.payload.periodicity,
            }
          : state.regimen.meals.periodicity,
      };
    },
  },
});

export const {
  resetDrugsCreateState,
  resetDrugsCreateStateFromCalendar,
  hydrateDrugsCreateState,
  setReleaseDosage,
  saveRegimenDraft,
  saveNotificationsDraft,
  updateMealsRegimenDraft,
} = drugsCreateSlice.actions;

export const drugsCreateReducer = drugsCreateSlice.reducer;
