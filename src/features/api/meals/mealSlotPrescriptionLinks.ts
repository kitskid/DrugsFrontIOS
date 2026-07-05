import {
  ACTIVE_MEDICATION_PRESCRIPTIONS_LIMIT,
  apiDrugs,
  type MedicationPrescriptionResponseDto,
} from '../drugs/apiDrugs.ts';

export const getLinkedPrescriptionsForMealSlot = async (
  mealSlotId: string,
): Promise<MedicationPrescriptionResponseDto[]> => {
  const response = await apiDrugs.getMedicationPrescriptions({
    isActive: true,
    linkedMealSlotId: mealSlotId,
    limit: ACTIVE_MEDICATION_PRESCRIPTIONS_LIMIT,
    offset: 0,
  });

  return response.data.data;
};
