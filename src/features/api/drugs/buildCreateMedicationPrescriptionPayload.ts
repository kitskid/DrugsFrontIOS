import type {CreateMedicationPrescriptionDto, MedicationPrescriptionFileDto} from './apiDrugs.ts';
import {
  formatApiStartDate,
  formatDateOnlyFromStored,
} from '../../datetime/localDateTime.ts';
import type {
  DrugsCreateState,
  NotificationsState,
  RegimenDraftState,
  TimeItem,
} from '../../redux/drugsCreate/types.ts';
import {appendMealsRegimenToPayload} from './mealsPrescriptionMapping.ts';
import {buildReminderSecondsBeforeIntake} from './prescriptionReminderMapping.ts';

const EVERY_HOUR_PRESET_HOURS: Record<string, number> = {
  '2': 2,
  '4': 4,
  '6': 6,
  '8': 8,
  '12': 12,
};

const resolveEveryHourInterval = (regimen: RegimenDraftState): number | null => {
  const presetHours = EVERY_HOUR_PRESET_HOURS[regimen.everyHour.selectedPresetKey];
  if (presetHours != null) {
    return presetHours;
  }

  const parsed = Number.parseInt(regimen.everyHour.customHoursValue.trim(), 10);
  return Number.isFinite(parsed) ? parsed : null;
};

export type BuildCreateMedicationPrescriptionInput = {
  drugName: string;
  note: string;
  isReminderEnabled: boolean;
  releaseDosage: DrugsCreateState['releaseDosage'];
  regimen: RegimenDraftState;
  notifications: NotificationsState;
  files?: MedicationPrescriptionFileDto[];
};

export type BuildCreateMedicationPrescriptionErrorCode =
  | 'invalid_dose_amount'
  | 'invalid_duration_days'
  | 'invalid_interval_hours'
  | 'invalid_interval_days'
  | 'individual_no_times'
  | 'meals_no_slots';

export class BuildCreateMedicationPrescriptionError extends Error {
  readonly code: BuildCreateMedicationPrescriptionErrorCode;

  constructor(code: BuildCreateMedicationPrescriptionErrorCode) {
    super(code);
    this.code = code;
  }
}

const normalizeTime = (value: string): string => {
  const [hoursRaw = '0', minutesRaw = '0'] = value.trim().split(':');
  const hours = Number.parseInt(hoursRaw, 10);
  const minutes = Number.parseInt(minutesRaw, 10);

  return `${`${Number.isFinite(hours) ? hours : 0}`.padStart(2, '0')}:${`${Number.isFinite(minutes) ? minutes : 0}`.padStart(2, '0')}`;
};

const sortTimes = (times: string[]): string[] =>
  [...times].sort((left, right) => {
    const [leftHours = 0, leftMinutes = 0] = left.split(':').map(Number);
    const [rightHours = 0, rightMinutes = 0] = right.split(':').map(Number);
    return leftHours * 60 + leftMinutes - (rightHours * 60 + rightMinutes);
  });

const mapTimes = (items: TimeItem[]): string[] => sortTimes(items.map(item => normalizeTime(item.value)));

const parseDurationDays = (raw: string): number => {
  const parsed = Number.parseInt(raw.trim(), 10);
  if (!Number.isFinite(parsed) || parsed < 1) {
    throw new BuildCreateMedicationPrescriptionError('invalid_duration_days');
  }

  return parsed;
};

const parseDoseAmount = (raw: string): number => {
  const parsed = Number.parseFloat(raw.trim().replace(',', '.'));
  if (!Number.isFinite(parsed)) {
    throw new BuildCreateMedicationPrescriptionError('invalid_dose_amount');
  }

  return parsed;
};

const mapFrontendWeekDayToApi = (frontendDay: number): number => (frontendDay + 1) % 7;

const appendReminderSeconds = (
  payload: CreateMedicationPrescriptionDto,
  notifications: NotificationsState,
  isReminderEnabled: boolean,
): void => {
  const reminderSecondsBeforeIntake = buildReminderSecondsBeforeIntake(
    notifications,
    isReminderEnabled,
  );

  if (reminderSecondsBeforeIntake) {
    payload.reminderSecondsBeforeIntake = reminderSecondsBeforeIntake;
  }
};

const buildIndividualSchedule = (
  regimen: RegimenDraftState,
): Pick<
  CreateMedicationPrescriptionDto,
  'scheduleType' | 'startDate' | 'intakeTimesByDate'
> => {
  if (regimen.individual.days.length === 0) {
    throw new BuildCreateMedicationPrescriptionError('individual_no_times');
  }

  const intakeTimesByDate = regimen.individual.days
    .map(day => {
      const times = mapTimes(regimen.individual.timesByDay[day.id] ?? []);
      if (times.length === 0) {
        return null;
      }

      return {
        date: formatDateOnlyFromStored(day.dateIso),
        intakeTimes: times,
      };
    })
    .filter((entry): entry is NonNullable<typeof entry> => entry != null)
    .sort((left, right) => left.date.localeCompare(right.date));

  if (intakeTimesByDate.length === 0) {
    throw new BuildCreateMedicationPrescriptionError('individual_no_times');
  }

  const [earliestEntry] = intakeTimesByDate;

  return {
    scheduleType: 'custom_schedule',
    startDate: formatApiStartDate(earliestEntry.date, earliestEntry.intakeTimes[0]),
    intakeTimesByDate,
  };
};

const buildMealsPrescriptionPayload = (
  input: BuildCreateMedicationPrescriptionInput,
): CreateMedicationPrescriptionDto => {
  if (input.regimen.regimenType !== 'meals') {
    throw new BuildCreateMedicationPrescriptionError('meals_no_slots');
  }

  const selectedSlotIds = input.regimen.meals.selectedMealSlotIds;
  if (selectedSlotIds.length === 0) {
    throw new BuildCreateMedicationPrescriptionError('meals_no_slots');
  }

  const {drugName, note, isReminderEnabled, releaseDosage, regimen, notifications, files} = input;
  const trimmedNote = note.trim();
  const meals = regimen.meals;
  const durationDays = parseDurationDays(regimen.daysCount);

  let startDateIso = regimen.startDateIso;
  if (meals.periodicity.scheduleType === 'dates' && meals.periodicity.dates.length > 0) {
    const [firstDate] = [...meals.periodicity.dates].sort((left, right) =>
      left.dateIso.localeCompare(right.dateIso),
    );
    startDateIso = firstDate.dateIso;
  }

  const payload: CreateMedicationPrescriptionDto = {
    customMedicationName: drugName.trim(),
    doseForm: releaseDosage.releaseForm.trim(),
    doseAmount: parseDoseAmount(releaseDosage.dosageAmount),
    doseUnit: releaseDosage.dosageUnit.trim(),
    scheduleType: 'meal_linked',
    startDate: formatApiStartDate(startDateIso, regimen.startTime),
  };

  if (trimmedNote) {
    payload.notes = trimmedNote;
  }

  if (files && files.length > 0) {
    payload.files = files;
  }

  appendMealsRegimenToPayload(payload, regimen.meals, durationDays);
  appendReminderSeconds(payload, notifications, isReminderEnabled);

  return payload;
};

export const buildCreateMedicationPrescriptionPayload = (
  input: BuildCreateMedicationPrescriptionInput,
): CreateMedicationPrescriptionDto => {
  const {drugName, note, isReminderEnabled, releaseDosage, regimen, notifications, files} = input;
  const trimmedNote = note.trim();
  const isIndividualRegimen = regimen.regimenType === 'individual';
  const isMealsRegimen = regimen.regimenType === 'meals';

  if (isMealsRegimen) {
    return buildMealsPrescriptionPayload(input);
  }

  const payload: CreateMedicationPrescriptionDto = {
    customMedicationName: drugName.trim(),
    doseForm: releaseDosage.releaseForm.trim(),
    doseAmount: parseDoseAmount(releaseDosage.dosageAmount),
    doseUnit: releaseDosage.dosageUnit.trim(),
    scheduleType: 'multiple_times_per_day',
    startDate: formatApiStartDate(regimen.startDateIso, regimen.startTime),
    ...(isIndividualRegimen ? {} : {durationDays: parseDurationDays(regimen.daysCount)}),
  };

  if (trimmedNote) {
    payload.notes = trimmedNote;
  }

  if (files && files.length > 0) {
    payload.files = files;
  }

  switch (regimen.regimenType) {
    case 'dailyAtTime':
      payload.scheduleType = 'multiple_times_per_day';
      payload.intakeTimes = mapTimes(regimen.daily.times);
      break;
    case 'everyNHours': {
      const intervalHours = resolveEveryHourInterval(regimen);

      if (intervalHours == null || intervalHours < 1 || intervalHours > 24) {
        throw new BuildCreateMedicationPrescriptionError('invalid_interval_hours');
      }

      payload.scheduleType = 'every_n_hours';
      payload.intervalHours = intervalHours;

      if (regimen.everyHour.isIntervalSwitchActive) {
        payload.noIntakeWindowFrom = normalizeTime(regimen.everyHour.startPauseTime);
        payload.noIntakeWindowTo = normalizeTime(regimen.everyHour.endPauseTime);
      }

      break;
    }
    case 'weekDays':
      payload.scheduleType = 'specific_days_of_week';
      payload.intakeTimesByDay = regimen.weekDay.selectedDayKeys.map(dayKey => ({
        day: mapFrontendWeekDayToApi(dayKey),
        intakeTimes: mapTimes(regimen.weekDay.timesByDay[dayKey] ?? []),
      }));
      break;
    case 'everyNDays': {
      const intervalDays = regimen.everyDay.interval;
      if (intervalDays < 1 || intervalDays > 7) {
        throw new BuildCreateMedicationPrescriptionError('invalid_interval_days');
      }

      payload.scheduleType = 'every_n_days';
      payload.intervalDays = intervalDays;
      payload.intakeTimes = [normalizeTime(regimen.startTime)];
      break;
    }
    case 'individual': {
      const individualSchedule = buildIndividualSchedule(regimen);
      Object.assign(payload, individualSchedule);
      delete payload.durationDays;
      break;
    }
    default:
      break;
  }

  appendReminderSeconds(payload, notifications, isReminderEnabled);

  return payload;
};
