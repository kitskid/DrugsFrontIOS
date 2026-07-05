import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {useTranslation} from 'react-i18next';

import i18n from '../../../features/localisation/i18n.ts';
import {DrugsCardIconNameMapper} from '../../../shared/ui/drugs/DrugsCardIconNameMapper.tsx';
import {IconMapper} from '../../../shared/ui/IconMapper.tsx';
import type {ActiveDrugMetrics} from './activeDrugsMetrics.ts';
import {ActiveDrugsProgressBar} from './ActiveDrugsProgressBar.tsx';

type ActiveDrugCardProps = {
  drug: ActiveDrugMetrics;
  onPress: () => void;
};

export const ActiveDrugCard = ({drug, onPress}: ActiveDrugCardProps) => {
  const {t} = useTranslation('home', {i18n});
  const dosesProgress =
    drug.totalDosesToday > 0
      ? (drug.totalDosesToday - drug.dosesRemainingToday) / drug.totalDosesToday
      : 1;
  const courseProgress =
    drug.totalCourseDays > 0
      ? drug.daysUntilCourseEnd / drug.totalCourseDays
      : 0;

  return (
    <TouchableOpacity activeOpacity={0.75} onPress={onPress} style={styles.container}>
      <View style={styles.topRow}>
        <DrugsCardIconNameMapper
          backgroundImage={drug.backgroundImage}
          medicationName={drug.medicationName}
          size={36}
        />
        <Text style={styles.medicationName} numberOfLines={1} ellipsizeMode="tail">
          {drug.medicationName}
        </Text>
        <View style={styles.chevronWrap}>
          <IconMapper
            icon="chevron-right"
            size={24}
            color="rgba(199, 198, 217, 1)"
            weight={1.5}
          />
        </View>
      </View>

      <View style={styles.progressRow}>
        <ActiveDrugsProgressBar
          label={t('activeDrugs.dosesRemainingLabel')}
          value={String(drug.dosesRemainingToday)}
          progress={dosesProgress}
        />
        <View style={styles.progressGap} />
        <ActiveDrugsProgressBar
          label={t('activeDrugs.courseRemainingLabel')}
          value={t('activeDrugs.daysShort', {count: drug.daysUntilCourseEnd})}
          progress={courseProgress}
        />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20
  },
  topRow: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
  },
  medicationName: {
    flex: 1,
    marginLeft: 10,
    color: 'rgba(29, 26, 73, 1)',
    fontSize: 16,
    fontWeight: '500',
  },
  chevronWrap: {
    marginRight: 12,
  },
  progressRow: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressGap: {
    width: 12,
  },
});
