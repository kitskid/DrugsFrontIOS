import type {
  MedicationPrescriptionResponseDto,
  PrescriptionBackgroundImageDto,
} from '../../../features/api/drugs/apiDrugs.ts';
import {DEFAULT_BACKGROUND_IMAGE} from '../../../shared/ui/drugs/drugsCardBackgroundIconRegistry.ts';

const startOfDay = (date: Date): Date =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());

const getMedicationTitle = (item: MedicationPrescriptionResponseDto): string =>
  item.medicationName?.trim() || item.customMedicationName?.trim() || '—';

const isDrugActiveOnDate = (
  item: MedicationPrescriptionResponseDto,
  date: Date,
): boolean => {
  if (item.status != null && item.status !== 'active') {
    return false;
  }

  const dayStart = startOfDay(date).getTime();
  const rangeStart = startOfDay(new Date(item.startDate)).getTime();

  if (dayStart < rangeStart) {
    return false;
  }

  if (item.isIndefinite || !item.endDate) {
    return true;
  }

  const rangeEnd = startOfDay(new Date(item.endDate)).getTime();
  return dayStart <= rangeEnd;
};

const resolveCourseMetrics = (
  item: MedicationPrescriptionResponseDto,
  referenceDay: Date,
): {daysUntilCourseEnd: number; totalCourseDays: number} => {
  const msPerDay = 24 * 60 * 60 * 1000;
  const courseStart = startOfDay(new Date(item.startDate));
  const daysElapsed = Math.max(
    0,
    Math.round((referenceDay.getTime() - courseStart.getTime()) / msPerDay),
  );

  if (item.isIndefinite || !item.endDate) {
    const totalCourseDays = Math.max(1, item.durationDays ?? 1);
    return {
      daysUntilCourseEnd: Math.max(0, totalCourseDays - daysElapsed),
      totalCourseDays,
    };
  }

  const courseEnd = startOfDay(new Date(item.endDate));
  const daysUntilCourseEnd = Math.max(
    0,
    Math.round((courseEnd.getTime() - referenceDay.getTime()) / msPerDay),
  );
  const totalCourseDays = Math.max(
    1,
    Math.round((courseEnd.getTime() - courseStart.getTime()) / msPerDay),
  );

  return {daysUntilCourseEnd, totalCourseDays};
};

export type ActiveDrugMetrics = {
  id: string;
  medicationName: string;
  backgroundImage: PrescriptionBackgroundImageDto;
  dosesRemainingToday: number;
  totalDosesToday: number;
  daysUntilCourseEnd: number;
  totalCourseDays: number;
};

export const mapPrescriptionsToActiveDrugsMetrics = (
  prescriptions: MedicationPrescriptionResponseDto[] | undefined,
  referenceDate: Date = new Date(),
): ActiveDrugMetrics[] => {
  if (!prescriptions) {
    return [];
  }

  const referenceDay = startOfDay(referenceDate);

  return prescriptions
    .filter(item => isDrugActiveOnDate(item, referenceDay))
    .map(item => {
      const {daysUntilCourseEnd, totalCourseDays} = resolveCourseMetrics(
        item,
        referenceDay,
      );

      return {
        id: item.id,
        medicationName: getMedicationTitle(item),
        backgroundImage: item.backgroundImage ?? DEFAULT_BACKGROUND_IMAGE,
        dosesRemainingToday: item.intakesRemainingTodayCount ?? 0,
        totalDosesToday: item.intakesTodayCount ?? 0,
        daysUntilCourseEnd,
        totalCourseDays,
      };
    });
};
