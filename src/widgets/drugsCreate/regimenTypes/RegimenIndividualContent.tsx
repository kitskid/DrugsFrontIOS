import {useEffect, useMemo, useRef} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {useTranslation} from 'react-i18next';
import Animated, {FadeIn, FadeInDown, FadeOut, FadeOutUp, LinearTransition} from 'react-native-reanimated';

import {CircleIconButton} from '../../../shared/ui/CircleIconButton.tsx';
import i18n from '../../../features/localisation/i18n';
import {useToast} from '../../../features/toasts/useToast.ts';
import {DatePickerModal} from '../../../shared/ui/timePickers/DatePickerModal.tsx';
import {TimePickerMain} from '../../../shared/ui/timePickers/TimePickerMain.tsx';
import {TimePickerModal} from '../../../shared/ui/timePickers/TimePickerModal.tsx';
import {InfoCard} from '../../../shared/ui/InfoCard.tsx';

export type IndividualDayCard = {
  id: number;
  date: Date;
};

export type IndividualTimeItem = {
  id: number;
  value: string;
};

export type IndividualDateModalState = {mode: 'add'} | null;

const formatDate = (date: Date, language: string) =>
  new Intl.DateTimeFormat(language, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);

const formatNowTime = () => {
  const now = new Date();
  return `${now.getHours()}`.padStart(2, '0') + ':' + `${now.getMinutes()}`.padStart(2, '0');
};

const sortTimesAscending = (items: IndividualTimeItem[]) =>
  [...items].sort((a, b) => {
    const [aH = 0, aM = 0] = a.value.split(':').map(Number);
    const [bH = 0, bM = 0] = b.value.split(':').map(Number);
    return aH * 60 + aM - (bH * 60 + bM);
  });

const hasTimeValue = (items: IndividualTimeItem[], value: string) => items.some(item => item.value === value);
const isSameDay = (left: Date, right: Date) =>
  left.getFullYear() === right.getFullYear() &&
  left.getMonth() === right.getMonth() &&
  left.getDate() === right.getDate();

type RegimenIndividualContentProps = {
  openAddDateRequestKey: number;
  individualDays: IndividualDayCard[];
  individualTimesByDay: Record<number, IndividualTimeItem[]>;
  individualDateModalState: IndividualDateModalState;
  individualAddModalDay: number | null;
  onIndividualDaysChange: (value: IndividualDayCard[]) => void;
  onIndividualTimesByDayChange: (value: Record<number, IndividualTimeItem[]>) => void;
  onIndividualDateModalStateChange: (value: IndividualDateModalState) => void;
  onIndividualAddModalDayChange: (value: number | null) => void;
  onIndividualDayIdUsed: () => number;
  onIndividualTimeIdUsed: () => number;
};

export const RegimenIndividualContent = ({
  openAddDateRequestKey,
  individualDays,
  individualTimesByDay,
  individualDateModalState,
  individualAddModalDay,
  onIndividualDaysChange,
  onIndividualTimesByDayChange,
  onIndividualDateModalStateChange,
  onIndividualAddModalDayChange,
  onIndividualDayIdUsed,
  onIndividualTimeIdUsed,
}: RegimenIndividualContentProps) => {
  const {t} = useTranslation('drugsCreate', {i18n});
  const {showToast} = useToast();
  const lastHandledOpenRequestKeyRef = useRef(openAddDateRequestKey);
  const sortedDays = useMemo(
    () => individualDays.slice().sort((a, b) => a.date.getTime() - b.date.getTime()),
    [individualDays],
  );

  const addInitialValue = formatNowTime();

  useEffect(() => {
    if (openAddDateRequestKey === lastHandledOpenRequestKeyRef.current) {
      return;
    }

    lastHandledOpenRequestKeyRef.current = openAddDateRequestKey;

    if (openAddDateRequestKey <= 0) {
      return;
    }

    onIndividualDateModalStateChange({mode: 'add'});
  }, [openAddDateRequestKey, onIndividualDateModalStateChange]);

  const changeTime = (dayId: number, timeId: number, nextTime: string) => {
    const currentTimes = individualTimesByDay[dayId] ?? [];
    onIndividualTimesByDayChange({
      ...individualTimesByDay,
      [dayId]: sortTimesAscending(currentTimes.map(item => (item.id === timeId ? {...item, value: nextTime} : item))),
    });
  };

  const removeTime = (dayId: number, timeId: number) => {
    const currentTimes = individualTimesByDay[dayId] ?? [];
    const nextDayTimes = sortTimesAscending(currentTimes.filter(item => item.id !== timeId));
    if (nextDayTimes.length === 0) {
      onIndividualDaysChange(individualDays.filter(day => day.id !== dayId));
      const nextTimesByDay = {...individualTimesByDay};
      delete nextTimesByDay[dayId];
      onIndividualTimesByDayChange(nextTimesByDay);
      if (individualAddModalDay === dayId) {
        onIndividualAddModalDayChange(null);
      }
      return;
    }

    onIndividualTimesByDayChange({
      ...individualTimesByDay,
      [dayId]: nextDayTimes,
    });
  };

  const addTime = (dayId: number, time: string) => {
    const currentTimes = individualTimesByDay[dayId] ?? [];
    if (hasTimeValue(currentTimes, time)) {
      return;
    }

    onIndividualTimesByDayChange({
      ...individualTimesByDay,
      [dayId]: sortTimesAscending([...currentTimes, {id: onIndividualTimeIdUsed(), value: time}]),
    });
  };

  return (
    <View style={styles.container}>
      {sortedDays.length === 0 ? <InfoCard style={styles.emptyDaysWarning} text={t('regimenTypes.warningAddOneIndividualDay')} /> : null}
      {sortedDays.map(day => {
        const dayTimes = individualTimesByDay[day.id] ?? [];

        return (
          <Animated.View
            style={styles.card}
            key={day.id}
            layout={LinearTransition.duration(200)}
            entering={FadeInDown.duration(180)}
            exiting={FadeOutUp.duration(160)}>
            <View style={styles.headerRow}>
              <Text style={styles.dayTitle}>{formatDate(day.date, i18n.language)}</Text>
              <View style={styles.headerActions}>
                <CircleIconButton
                  icon="trash-2"
                  backgroundColor="transparent"
                  iconColor="rgba(199, 198, 217, 1)"
                  onPress={() => {
                    onIndividualDaysChange(individualDays.filter(prevDay => prevDay.id !== day.id));
                    const nextTimesByDay = {...individualTimesByDay};
                    delete nextTimesByDay[day.id];
                    onIndividualTimesByDayChange(nextTimesByDay);
                    if (individualAddModalDay === day.id) {
                      onIndividualAddModalDayChange(null);
                    }
                  }}
                  style={styles.headerActionButton}
                />
              </View>
            </View>

            <Animated.View style={styles.separator} layout={LinearTransition.duration(180)} />

            <Animated.View style={styles.contentRow} layout={LinearTransition.duration(180)}>
              <Animated.View style={styles.timeRow} layout={LinearTransition.duration(180)}>
                {dayTimes.map(timeItem => (
                  <Animated.View
                    key={timeItem.id}
                    layout={LinearTransition.duration(180)}
                    entering={FadeIn.duration(180)}
                    exiting={FadeOut.duration(150)}
                    style={styles.timeItem}>
                    <TimePickerMain
                      value={timeItem.value}
                      onChange={nextTime => {
                        changeTime(day.id, timeItem.id, nextTime);
                      }}
                      onCancel={() => {
                        removeTime(day.id, timeItem.id);
                      }}
                    />
                  </Animated.View>
                ))}
              </Animated.View>

              <CircleIconButton
                icon="clock-plus"
                iconColor="rgba(35, 142, 235, 1)"
                backgroundColor="rgba(35, 142, 235, 0.15)"
                onPress={() => onIndividualAddModalDayChange(day.id)}
                style={styles.addButton}
              />
            </Animated.View>
          </Animated.View>
        );
      })}
      <DatePickerModal
        visible={individualDateModalState !== null}
        initialValue={null}
        title={t('regimen.dateStartLabel')}
        onClose={() => onIndividualDateModalStateChange(null)}
        onSave={date => {
          if (individualDateModalState?.mode === 'add') {
            const hasDuplicateDate = individualDays.some(day => isSameDay(day.date, date));
            if (hasDuplicateDate) {
              showToast({variant: 'warning', text: t('regimenTypes.warningDuplicateIndividualDay')});
              onIndividualDateModalStateChange(null);
              return;
            }

            const dayId = onIndividualDayIdUsed();
            const initialTime = formatNowTime();

            onIndividualDaysChange([...individualDays, {id: dayId, date}]);
            onIndividualTimesByDayChange({
              ...individualTimesByDay,
              [dayId]: [{id: onIndividualTimeIdUsed(), value: initialTime}],
            });
          }

          onIndividualDateModalStateChange(null);
        }}
      />
      <TimePickerModal
        visible={individualAddModalDay !== null}
        initialValue={addInitialValue}
        title={t('regimenTypes.timeStartModalTitle')}
        onClose={() => onIndividualAddModalDayChange(null)}
        onSave={time => {
          if (individualAddModalDay !== null) {
            addTime(individualAddModalDay, time);
          }
          onIndividualAddModalDayChange(null);
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 1)',
    borderRadius: 28,
    paddingVertical: 20,
    paddingHorizontal: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  dayTitle: {
    fontSize: 18,
    fontWeight: '500',
    color: 'rgba(29, 26, 73, 1)',
    marginLeft: 16,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginRight: 6,
  },
  headerActionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  separator: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(232, 231, 242, 1)',
    marginBottom: 24,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  timeRow: {
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
    marginBottom: 16,
  },
  emptyDaysWarning: {
    marginHorizontal: 12,
  },
});
