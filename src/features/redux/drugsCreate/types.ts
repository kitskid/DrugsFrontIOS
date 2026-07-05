export type RegimenTypeKey =
  | 'dailyAtTime'
  | 'everyNHours'
  | 'weekDays'
  | 'everyNDays'
  | 'individual'
  | 'meals';

export type NotificationPresetKey = '5m' | '15m' | '30m' | '1h' | '1d' | 'custom';
export type NotificationCustomOffsetUnit = 'minute' | 'hour' | 'day';

export type ReleaseDosageState = {
  releaseForm: string;
  dosageAmount: string;
  dosageUnit: string;
};

export type TimeItem = {id: number; value: string};

export type RegimenDailyDraftState = {
  times: TimeItem[];
  nextTimeId: number;
};

export type RegimenEveryHourDraftState = {
  selectedPresetKey: string;
  customHoursValue: string;
  startPauseTime: string;
  endPauseTime: string;
  isIntervalSwitchActive: boolean;
};

export type RegimenWeekDayDraftState = {
  timesByDay: Record<number, TimeItem[]>;
  selectedDayKeys: number[];
  applyToAllSourceDay: number | null;
  nextTimeId: number;
};

export type RegimenEveryDayDraftState = {
  interval: number;
};

export type RegimenIndividualDraftState = {
  days: Array<{id: number; dateIso: string}>;
  timesByDay: Record<number, TimeItem[]>;
  nextDayId: number;
  nextTimeId: number;
};

export type MealsPeriodicityScheduleType = 'interval' | 'weekDays' | 'dates';

export type MealsFoodRelation = 'before' | 'during' | 'after';

export type MealsOffsetPresetKey = '5m' | '15m' | '30m' | '1h' | '2h' | 'custom';

export type MealsPeriodicityDateDraft = {
  id: number;
  dateIso: string;
};

export type MealsPeriodicityDraftState = {
  scheduleType: MealsPeriodicityScheduleType;
  intervalDays: number;
  selectedWeekDayKeys: number[];
  dates: MealsPeriodicityDateDraft[];
  nextDateId: number;
};

export type RegimenMealsDraftState = {
  periodicity: MealsPeriodicityDraftState;
  selectedMealSlotIds: string[];
  hasMealReminderEnabled: boolean;
  /** Snapshot from server; PATCH reminders only when this differs from hasMealReminderEnabled */
  initialHasMealReminderEnabled: boolean | null;
  foodRelation: MealsFoodRelation;
  offsetPreset: MealsOffsetPresetKey;
  customOffsetAmount: number;
  customOffsetUnit: Extract<NotificationCustomOffsetUnit, 'minute' | 'hour'>;
};

export type RegimenDraftState = {
  regimenType: RegimenTypeKey;
  startDateIso: string | null;
  startTime: string;
  daysCount: string;
  daily: RegimenDailyDraftState;
  everyHour: RegimenEveryHourDraftState;
  weekDay: RegimenWeekDayDraftState;
  everyDay: RegimenEveryDayDraftState;
  individual: RegimenIndividualDraftState;
  meals: RegimenMealsDraftState;
};

export type NotificationsState = {
  selectedPresetKeys: NotificationPresetKey[];
  customOffsetAmount: number;
  customOffsetUnit: NotificationCustomOffsetUnit;
  isDoNotDisturbEnabled: boolean;
  doNotDisturbFrom: string;
  doNotDisturbTo: string;
};

export type DrugsCreateState = {
  releaseDosage: ReleaseDosageState;
  regimen: RegimenDraftState;
  notifications: NotificationsState;
};
