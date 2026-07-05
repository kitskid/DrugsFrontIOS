import {forwardRef, useImperativeHandle, useRef} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {BottomSheetModal} from '@gorhom/bottom-sheet';
import {useTranslation} from 'react-i18next';

import type {MedicationPrescriptionResponseDto} from '../../../features/api/drugs/apiDrugs.ts';
import i18n from '../../../features/localisation/i18n.ts';
import {ButtonMain} from '../../../shared/ui/ButtonMain.tsx';
import {InfoCard} from '../../../shared/ui/InfoCard.tsx';
import {BottomSheetMain} from '../../../shared/ui/modals/BottomSheetMain.tsx';
import {DrugCard} from '../../drugsScreen/DrugCard.tsx';

type MealDeleteModalProps = {
  prescriptions: MedicationPrescriptionResponseDto[];
  onConfirm: () => void;
  onClose?: () => void;
};

export const MealDeleteModal = forwardRef<BottomSheetModal, MealDeleteModalProps>(
  ({prescriptions, onConfirm, onClose}, ref) => {
    const {t} = useTranslation('profile', {i18n});
    const sheetRef = useRef<BottomSheetModal>(null);

    useImperativeHandle(ref, () => sheetRef.current as BottomSheetModal, []);

    const dismiss = () => {
      sheetRef.current?.dismiss();
    };

    const handleSheetChange = (index: number) => {
      if (index < 0) {
        onClose?.();
      }
    };

    const handleConfirmPress = () => {
      onConfirm();
      dismiss();
    };

    return (
      <BottomSheetMain
        ref={sheetRef}
        contentContainerStyle={styles.content}
        onChange={handleSheetChange}>
        <Text style={styles.title}>{t('meal_delete_modal_title')}</Text>
        <InfoCard
          isWarning
          topText={t('meal_delete_modal_warning_title')}
          text={t('meal_delete_modal_warning_text')}
          style={styles.infoCard}
        />
        <View style={styles.drugsList}>
          {prescriptions.map(prescription => (
            <DrugCard key={prescription.id} drug={prescription} onPress={() => undefined} />
          ))}
        </View>
        <View style={styles.buttonsRow}>
          <ButtonMain
            title={t('meal_delete_modal_no')}
            variant="secondary"
            onPress={dismiss}
            style={styles.button}
          />
          <ButtonMain
            title={t('meal_delete_modal_yes')}
            onPress={handleConfirmPress}
            style={styles.button}
          />
        </View>
      </BottomSheetMain>
    );
  },
);

const styles = StyleSheet.create({
  content: {
    paddingTop: 0,
  },
  title: {
    marginTop: 12,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '500',
    color: 'rgba(29, 26, 73, 1)',
  },
  infoCard: {
    marginTop: 24,
    flex: undefined,
  },
  drugsList: {
    marginTop: 16,
  },
  buttonsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  button: {
    flex: 1,
  },
});
