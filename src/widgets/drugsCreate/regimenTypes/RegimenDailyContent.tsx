import {useState} from 'react';
import {StyleSheet, Text} from 'react-native';
import {useTranslation} from 'react-i18next';
import Animated, {FadeIn, LinearTransition} from 'react-native-reanimated';

import i18n from '../../../features/localisation/i18n';
import {CircleIconButton} from '../../../shared/ui/CircleIconButton.tsx';
import {TimePickerMain} from '../../../shared/ui/timePickers/TimePickerMain.tsx';
import {TimePickerModal} from '../../../shared/ui/timePickers/TimePickerModal.tsx';
import {InfoCard} from '../../../shared/ui/InfoCard.tsx';

const formatNowTime = () => {
  const now = new Date();
  return `${now.getHours()}`.padStart(2, '0') + ':' + `${now.getMinutes()}`.padStart(2, '0');
};

const timeStringToMinutes = (time: string) => {
  const [h, m] = time.split(':').map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
};

const sortTimesAscending = (items: Array<{id: number; value: string}>) =>
  [...items].sort((a, b) => timeStringToMinutes(a.value) - timeStringToMinutes(b.value));
const hasTimeValue = (items: Array<{id: number; value: string}>, value: string) =>
  items.some(item => item.value === value);

type RegimenDailyContentProps = {
  dailyTimes: Array<{id: number; value: string}>;
  onDailyTimesChange: (value: Array<{id: number; value: string}>) => void;
  onDailyTimeIdUsed: () => number;
};

export const RegimenDailyContent = ({
  dailyTimes,
  onDailyTimesChange,
  onDailyTimeIdUsed,
}: RegimenDailyContentProps) => {
  const {t} = useTranslation('drugsCreate', {i18n});
  const [isAddModalVisible, setAddModalVisible] = useState(false);
  const addInitialValue = formatNowTime();

  return (
    <Animated.View style={styles.card} layout={LinearTransition.duration(180)}>
      <Text style={styles.title}>{t('regimenTypes.dailyPlanTitle')}</Text>

      <Animated.View style={styles.contentRow} layout={LinearTransition.duration(180)}>
        <Animated.View style={styles.row} layout={LinearTransition.duration(180)}>
          {dailyTimes.length === 0 ? (
            <InfoCard text={t('regimenTypes.warningAddOneTime')} />
          ) : (
            dailyTimes.map(item => (
              <Animated.View
                key={item.id}
                layout={LinearTransition.duration(180)}
                entering={FadeIn.duration(180)}
                style={styles.timeItem}>
                <TimePickerMain
                  value={item.value}
                  onChange={nextTime => {
                    onDailyTimesChange(
                      sortTimesAscending(
                        dailyTimes.map(prevItem => (prevItem.id === item.id ? {...prevItem, value: nextTime} : prevItem)),
                      ),
                    );
                  }}
                  onCancel={() => {
                    onDailyTimesChange(dailyTimes.filter(prevItem => prevItem.id !== item.id));
                  }}
                />
              </Animated.View>
            ))
          )}
        </Animated.View>
        <CircleIconButton
          icon="clock-plus"
          iconColor="rgba(35, 142, 235, 1)"
          backgroundColor="rgba(35, 142, 235, 0.15)"
          onPress={() => setAddModalVisible(true)}
          style={styles.addButton}
        />
      </Animated.View>

      <TimePickerModal
        visible={isAddModalVisible}
        initialValue={addInitialValue}
        title={t('regimenTypes.timeStartModalTitle')}
        onClose={() => setAddModalVisible(false)}
        onSave={time => {
          if (!hasTimeValue(dailyTimes, time)) {
            onDailyTimesChange(
              sortTimesAscending([...dailyTimes, {id: onDailyTimeIdUsed(), value: time}]),
            );
          }
          setAddModalVisible(false);
        }}
      />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(255, 255, 255, 1)',
    borderRadius: 28,
    paddingVertical: 20,
    paddingHorizontal: 12,
  },
  title: {
    color: 'rgba(134, 132, 168, 1)',
    marginBottom: 24,
    marginLeft: 16
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  row: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: 12,
    alignItems: 'flex-start',
  },
  timeItem: {
    alignSelf: 'flex-start',
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginBottom: 16
  },
});
