import type {PrescriptionBackgroundImageDto} from '../../../../features/api/drugs/apiDrugs.ts';

export type NotificationReminder = {
  id: string;
  medicationName: string;
  scheduledAt: string;
  backgroundImage: PrescriptionBackgroundImageDto;
};
