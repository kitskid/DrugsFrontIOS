import type {
  MedicationPrescriptionResponseDto,
  UpdateMedicationPrescriptionDto,
} from './apiDrugs.ts';
import {
  buildCreateMedicationPrescriptionPayload,
  type BuildCreateMedicationPrescriptionInput,
} from './buildCreateMedicationPrescriptionPayload.ts';
import {
  mapApiFoodRelationToMealsDraft,
  mapApiPeriodicityToMealsDraft,
  mapApiWeekDayToFrontend,
  resolveLinkedMealSlotIds,
} from './mealsPrescriptionMapping.ts';
import {
  buildReminderSecondsBeforeIntake,
  isReminderEnabledFromSeconds,
  mapReminderSecondsToNotifications,
} from './prescriptionReminderMapping.ts';
import {formatLocalDateIso, parseApiStartDate} from '../../datetime/localDateTime.ts';
import {createInitialMealsState} from '../../redux/drugsCreate/drugsCreateSlice.ts';
import type {
  NotificationsState,
  RegimenDraftState,
  ReleaseDosageState,
  TimeItem,
} from '../../redux/drugsCreate/types.ts';

export type DrugsCreateHydrationState = {
  releaseDosage: ReleaseDosageState;
  regimen: RegimenDraftState;
  notifications: NotificationsState;
  drugName: string;
  note: string;
  isReminderEnabled: boolean;
  medicationId: string | null;
  medicationName: string;
};

const DEFAULT_START_TIME = '08:00';
const DEFAULT_PAUSE_FROM = '00:00';
const DEFAULT_PAUSE_TO = '07:00';
const DEFAULT_DO_NOT_DISTURB_FROM = '00:00';
const DEFAULT_DO_NOT_DISTURB_TO = '07:00';
const EVERY_HOUR_PRESET_HOURS = [2, 4, 6, 8, 12];

type IsoDateTimeParts = {
  year: number;
  month: number;
  day: number;
  hours: number;
  minutes: number;
};

const parseIsoDateTime = (raw: string | null | undefined): IsoDateTimeParts | null => {
  if (!raw) {
    return null;
  }

  const match = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})/.exec(raw.trim());
  if (!match) {
    return null;
  }

  return {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
    hours: Number(match[4]),
    minutes: Number(match[5]),
  };
};

const formatTime = (hours: number, minutes: number): string =>
  `${`${hours}`.padStart(2, '0')}:${`${minutes}`.padStart(2, '0')}`;

const normalizeTimeValue = (value: string): string => {
  const [hoursRaw = '0', minutesRaw = '0'] = value.trim().split(':');
  const hours = Number.parseInt(hoursRaw, 10);
  const minutes = Number.parseInt(minutesRaw, 10);

  return formatTime(Number.isFinite(hours) ? hours : 0, Number.isFinite(minutes) ? minutes : 0);
};

const createTimeItems = (
  times: string[] | undefined,
  startId: number,
): {items: TimeItem[]; nextId: number} => {
  let nextId = startId;
  const items = (times ?? []).map(value => ({id: nextId++, value: normalizeTimeValue(value)}));
  return {items, nextId};
};

const createDefaultWeekDayTimesByDay = (
  defaultTime: string,
  startId: number,
): {timesByDay: Record<number, TimeItem[]>; nextId: number} => {
  let nextId = startId;
  const timesByDay: Record<number, TimeItem[]> = {};
  for (let day = 0; day < 7; day += 1) {
    timesByDay[day] = [{id: nextId++, value: defaultTime}];
  }
  return {timesByDay, nextId};
};

const createDefaultRegimen = (
  startDateIso: string,
  startTime: string,
  daysCount: string,
): RegimenDraftState => {
  const weekDayDefault = createDefaultWeekDayTimesByDay(startTime, 0);

  return {
    regimenType: 'dailyAtTime',
    startDateIso,
    startTime,
    daysCount,
    daily: {times: [], nextTimeId: 1},
    everyHour: {
      selectedPresetKey: '2',
      customHoursValue: '24',
      startPauseTime: DEFAULT_PAUSE_FROM,
      endPauseTime: DEFAULT_PAUSE_TO,
      isIntervalSwitchActive: false,
    },
    weekDay: {
      timesByDay: weekDayDefault.timesByDay,
      selectedDayKeys: [],
      applyToAllSourceDay: null,
      nextTimeId: weekDayDefault.nextId,
    },
    everyDay: {interval: 1},
    individual: {days: [], timesByDay: {}, nextDayId: 0, nextTimeId: 0},
    meals: createInitialMealsState(),
  };
};

const mapNotifications = (
  response: MedicationPrescriptionResponseDto,
): NotificationsState => {
  const {selectedPresetKeys, customOffsetAmount, customOffsetUnit} =
    mapReminderSecondsToNotifications(response.reminderSecondsBeforeIntake);

  const hasDoNotDisturb = Boolean(response.notificationWindowFrom && response.notificationWindowTo);

  return {
    selectedPresetKeys,
    customOffsetAmount,
    customOffsetUnit,
    isDoNotDisturbEnabled: hasDoNotDisturb,
    doNotDisturbFrom: response.notificationWindowFrom
      ? normalizeTimeValue(response.notificationWindowFrom)
      : DEFAULT_DO_NOT_DISTURB_FROM,
    doNotDisturbTo: response.notificationWindowTo
      ? normalizeTimeValue(response.notificationWindowTo)
      : DEFAULT_DO_NOT_DISTURB_TO,
  };
};

const mapRegimen = (response: MedicationPrescriptionResponseDto): RegimenDraftState => {
  const {dateIso: startDateIso, time: startTime} = parseApiStartDate(response.startDate);
  const daysCount = response.durationDays && response.durationDays > 0
    ? `${response.durationDays}`
    : '7';

  const regimen = createDefaultRegimen(startDateIso, startTime, daysCount);

  switch (response.scheduleType) {
    case 'multiple_times_per_day':
    case 'once':
    case 'as_needed': {
      regimen.regimenType = 'dailyAtTime';
      const fallbackTimes =
        response.intakeTimes && response.intakeTimes.length > 0
          ? response.intakeTimes
          : [startTime];
      const {items, nextId} = createTimeItems(fallbackTimes, 0);
      regimen.daily = {times: items, nextTimeId: nextId};
      break;
    }
    case 'every_n_hours': {
      regimen.regimenType = 'everyNHours';
      const intervalHours = response.intervalHours ?? 2;
      const matchedPreset = EVERY_HOUR_PRESET_HOURS.includes(intervalHours);
      regimen.everyHour = {
        selectedPresetKey: matchedPreset ? `${intervalHours}` : 'custom',
        customHoursValue: `${intervalHours}`,
        startPauseTime: response.noIntakeWindowFrom
          ? normalizeTimeValue(response.noIntakeWindowFrom)
          : DEFAULT_PAUSE_FROM,
        endPauseTime: response.noIntakeWindowTo
          ? normalizeTimeValue(response.noIntakeWindowTo)
          : DEFAULT_PAUSE_TO,
        isIntervalSwitchActive: Boolean(
          response.noIntakeWindowFrom && response.noIntakeWindowTo,
        ),
      };
      break;
    }
    case 'every_n_days': {
      regimen.regimenType = 'everyNDays';
      const intervalDays = response.intervalDays ?? 1;
      regimen.everyDay = {
        interval: Math.min(7, Math.max(1, intervalDays)),
      };
      if (response.intakeTimes?.[0]) {
        const {dateIso, time} = parseApiStartDate(response.startDate);
        regimen.startDateIso = dateIso;
        regimen.startTime = normalizeTimeValue(response.intakeTimes[0]);
      }
      break;
    }
    case 'specific_days_of_week': {
      regimen.regimenType = 'weekDays';
      let nextId = 0;
      const weekDayDefault = createDefaultWeekDayTimesByDay(startTime, nextId);
      const timesByDay = weekDayDefault.timesByDay;
      nextId = weekDayDefault.nextId;

      const intakeTimesByDay = response.intakeTimesByDay ?? [];
      const selectedDayKeys =
        intakeTimesByDay.length > 0
          ? [...new Set(intakeTimesByDay.map(entry => mapApiWeekDayToFrontend(entry.day)))]
          : (response.selectedDays ?? []).map(mapApiWeekDayToFrontend);

      intakeTimesByDay.forEach(entry => {
        const frontendDay = mapApiWeekDayToFrontend(entry.day);
        const {items, nextId: usedNextId} = createTimeItems(entry.intakeTimes, nextId);
        timesByDay[frontendDay] = items;
        nextId = usedNextId;
      });

      regimen.weekDay = {
        timesByDay,
        selectedDayKeys,
        applyToAllSourceDay: null,
        nextTimeId: nextId,
      };
      break;
    }
    case 'custom_schedule': {
      regimen.regimenType = 'individual';
      let nextDayId = 0;
      let nextTimeId = 0;
      const days: Array<{id: number; dateIso: string}> = [];
      const timesByDay: Record<number, TimeItem[]> = {};

      const sortedEntries = [...(response.intakeTimesByDate ?? [])].sort((left, right) =>
        left.date.localeCompare(right.date),
      );

      sortedEntries.forEach(entry => {
        const dateParts = parseIsoDateTime(`${entry.date}T00:00`);
        if (!dateParts) {
          return;
        }
        const dayId = nextDayId++;
        const date = new Date(dateParts.year, dateParts.month - 1, dateParts.day);
        days.push({id: dayId, dateIso: formatLocalDateIso(date)});
        const {items, nextId} = createTimeItems(entry.intakeTimes, nextTimeId);
        timesByDay[dayId] = items;
        nextTimeId = nextId;
      });

      regimen.individual = {days, timesByDay, nextDayId, nextTimeId};
      break;
    }
    case 'meal_linked':
    case 'not_scheduled': {
      regimen.regimenType = 'meals';
      const mealsState = createInitialMealsState();
      const linkedMealSlotIds = resolveLinkedMealSlotIds(response);

      if (linkedMealSlotIds.length > 0) {
        mealsState.selectedMealSlotIds = linkedMealSlotIds;
      }

      Object.assign(
        mealsState,
        mapApiFoodRelationToMealsDraft(response.foodRelation, response.mealOffsetMinutes),
      );
      mealsState.periodicity = mapApiPeriodicityToMealsDraft(response);
      regimen.meals = mealsState;
      break;
    }
    default:
      break;
  }

  return regimen;
};

export const mapPrescriptionToDrugsCreateState = (
  response: MedicationPrescriptionResponseDto,
): DrugsCreateHydrationState => {
  const releaseDosage: ReleaseDosageState = {
    releaseForm: response.doseForm ? `${response.doseForm}`.trim() : '',
    dosageAmount: response.doseAmount != null ? `${response.doseAmount}` : '',
    dosageUnit: response.doseUnit ? `${response.doseUnit}`.trim() : '',
  };

  const medicationName = response.medicationName?.trim() ?? '';
  const customName = response.customMedicationName?.trim() ?? '';
  const drugName = medicationName || customName;

  return {
    releaseDosage,
    regimen: mapRegimen(response),
    notifications: mapNotifications(response),
    drugName,
    note: response.notes ? `${response.notes}`.trim() : '',
    isReminderEnabled: isReminderEnabledFromSeconds(response.reminderSecondsBeforeIntake),
    medicationId: response.medication?.id ?? null,
    medicationName,
  };
};

export type BuildUpdatePayloadInput = BuildCreateMedicationPrescriptionInput & {
  medicationId: string | null;
  medicationName: string;
};

const omitMealLinkedFields = (payload: UpdateMedicationPrescriptionDto): void => {
  delete payload.foodRelation;
  delete payload.mealLinkedPeriodicity;
  delete payload.linkedMealSlotIds;
  delete payload.mealOffsetMinutes;
};

const omitNonMealLinkedScheduleFields = (payload: UpdateMedicationPrescriptionDto): void => {
  delete payload.intakeTimes;
  delete payload.intervalHours;
  delete payload.noIntakeWindowFrom;
  delete payload.noIntakeWindowTo;
  delete payload.intakeTimesByDay;
  delete payload.selectedDays;
};

const sanitizeScheduleSpecificFields = (payload: UpdateMedicationPrescriptionDto): void => {
  if (payload.scheduleType === 'specific_days_of_week') {
    delete payload.selectedDays;
  }

  if (payload.scheduleType === 'custom_schedule') {
    delete payload.durationDays;
  }
};

export const buildUpdateMedicationPrescriptionPayload = (
  input: BuildUpdatePayloadInput,
): UpdateMedicationPrescriptionDto => {
  const {medicationId, medicationName, ...createInput} = input;
  const payload: UpdateMedicationPrescriptionDto = buildCreateMedicationPrescriptionPayload(createInput);

  payload.reminderSecondsBeforeIntake =
    buildReminderSecondsBeforeIntake(createInput.notifications, createInput.isReminderEnabled) ?? [];

  if (payload.scheduleType === 'meal_linked') {
    omitNonMealLinkedScheduleFields(payload);
  } else {
    omitMealLinkedFields(payload);
  }

  sanitizeScheduleSpecificFields(payload);

  const keepsLibraryMedication =
    medicationId != null && input.drugName.trim() === medicationName.trim();

  if (keepsLibraryMedication) {
    payload.medicationId = medicationId;
    delete payload.customMedicationName;
  }

  return payload;
};
