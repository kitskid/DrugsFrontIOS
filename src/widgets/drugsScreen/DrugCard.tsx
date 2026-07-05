import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';

import type {MedicationPrescriptionResponseDto} from '../../features/api/drugs/apiDrugs.ts';
import {DEFAULT_BACKGROUND_IMAGE} from '../../shared/ui/drugs/drugsCardBackgroundIconRegistry.ts';
import {DrugsCardIconNameMapper} from '../../shared/ui/drugs/DrugsCardIconNameMapper.tsx';

type DrugCardProps = {
  drug: MedicationPrescriptionResponseDto;
  onPress?: () => void;
};

const getMedicationTitle = (drug: MedicationPrescriptionResponseDto): string =>
  drug.medicationName?.trim() || drug.customMedicationName?.trim() || '—';

const formatDosageSubtitle = (drug: MedicationPrescriptionResponseDto): string | null => {
  const parts: string[] = [];

  if (drug.doseAmount != null && drug.doseUnit) {
    parts.push(`${drug.doseAmount} ${drug.doseUnit}`);
  }

  if (drug.doseForm) {
    const formLabel = String(drug.doseForm);
    parts.push(formLabel.charAt(0).toLowerCase() + formLabel.slice(1));
  }

  return parts.length > 0 ? parts.join(', ') : null;
};

export const DrugCard = ({drug, onPress}: DrugCardProps) => {
  const medicationName = getMedicationTitle(drug);
  const dosageSubtitle = formatDosageSubtitle(drug);

  return (
    <TouchableOpacity activeOpacity={0.75} onPress={onPress} style={styles.container}>
      <DrugsCardIconNameMapper
        backgroundImage={drug.backgroundImage ?? DEFAULT_BACKGROUND_IMAGE}
        medicationName={medicationName}
        size={48}
      />
      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={2} ellipsizeMode="tail">
            {medicationName}
          </Text>
          {drug.scheduleDisplay ? (
            <Text style={styles.schedule}>{drug.scheduleDisplay}</Text>
          ) : null}
        </View>
        {dosageSubtitle ? <Text style={styles.subtitle}>{dosageSubtitle}</Text> : null}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  content: {
    flex: 1,
    marginLeft: 10,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  title: {
    flex: 1,
    color: 'rgba(29, 26, 73, 1)',
    fontSize: 16,
    fontWeight: '500',
  },
  schedule: {
    marginLeft: 8,
    color: 'rgba(134, 132, 168, 1)',
    fontSize: 13,
  },
  subtitle: {
    marginTop: 2,
    color: 'rgba(134, 132, 168, 1)',
    fontSize: 13,
  },
});
