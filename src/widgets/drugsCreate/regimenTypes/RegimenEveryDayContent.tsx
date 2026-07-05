import {StyleSheet, View} from 'react-native';
import {useTranslation} from 'react-i18next';

import i18n from '../../../features/localisation/i18n';
import {EveryPickerMain} from '../../../shared/ui/timePickers/EveryPickerMain.tsx';

export type RegimenEveryDayContentProps = {
  daysCount: string;
  value: number;
  onChange: (value: number) => void;
};

const EVERY_N_DAYS_MAX_INTERVAL = 7;

export const RegimenEveryDayContent = ({daysCount, value, onChange}: RegimenEveryDayContentProps) => {
  const {t} = useTranslation('drugsCreate', {i18n});
  const amount = EVERY_N_DAYS_MAX_INTERVAL;

  return (
    <View style={styles.card}>
      <EveryPickerMain
        value={value}
        onChange={onChange}
        amount={amount}
        unitShort={t('regimenTypes.everyDay.unitShort')}
        syncKey={daysCount}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(255, 255, 255, 1)',
    borderRadius: 28,
    paddingHorizontal: 12,
  },
});
