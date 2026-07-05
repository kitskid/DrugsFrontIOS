import {useCallback, useMemo, useRef, useState} from 'react';
import {ScrollView, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useTranslation} from 'react-i18next';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeOut,
  FadeOutUp,
  LinearTransition,
} from 'react-native-reanimated';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import type {DrugsCreateStackParamList} from '../../features/navigation/DrugsCreateStack.tsx';
import i18n from '../../features/localisation/i18n';
import {updateMealsRegimenDraft} from '../../features/redux/drugsCreate/drugsCreateSlice.ts';
import type {MealsPeriodicityScheduleType} from '../../features/redux/drugsCreate/types.ts';
import {useAppDispatch, useAppSelector} from '../../features/redux/hooks.ts';
import {
  WEEK_DAYS,
  type WeekDayKey,
} from '../../widgets/drugsCreate/regimenTypes/RegimenWeekDayContent.tsx';
import {ActiveButton} from '../../shared/ui/ActiveButton.tsx';
import {ButtonMain} from '../../shared/ui/ButtonMain.tsx';
import {CircleIconButton} from '../../shared/ui/CircleIconButton.tsx';
import {Header} from '../../shared/ui/Header.tsx';
import {IconMapper} from '../../shared/ui/IconMapper.tsx';
import {InfoCard} from '../../shared/ui/InfoCard.tsx';
import {StatusBarAvoidContainer} from '../../shared/ui/StatusBarAvoidContainer.tsx';
import {DatePickerModal} from '../../shared/ui/timePickers/DatePickerModal.tsx';
import {EveryPickerMain} from '../../shared/ui/timePickers/EveryPickerMain.tsx';

const SCREEN_BACKGROUND = 'rgba(247, 246, 251, 1)';
const SAVE_BUTTON_BOTTOM_OFFSET = 16;
const SAVE_BUTTON_HEIGHT = 48;
const SAVE_BUTTON_TOP_SPACING = 12;
const CIRCLE_BUTTON_SPACING = 16;
const CIRCLE_BUTTON_SIZE = 48;
const SCROLL_BOTTOM_EXTRA_PADDING = 12;
const INTERVAL_MAX_DAYS = 365;
const DATE_CARD_ICON_COLOR = 'rgba(199, 198, 217, 1)';

type ScheduleTypeKey = MealsPeriodicityScheduleType;

type PeriodicityDateItem = {
  id: number;
  date: Date;
};

type DateModalState = {mode: 'add'} | {mode: 'edit'; dateId: number} | null;

const MONTH_KEYS = [
  'jan',
  'feb',
  'mar',
  'apr',
  'may',
  'jun',
  'jul',
  'aug',
  'sep',
  'oct',
  'nov',
  'dec',
] as const;

const isSameDay = (left: Date, right: Date) =>
  left.getFullYear() === right.getFullYear() &&
  left.getMonth() === right.getMonth() &&
  left.getDate() === right.getDate();

const sortDatesAscending = (items: PeriodicityDateItem[]) =>
  [...items].sort((left, right) => left.date.getTime() - right.date.getTime());

const formatPeriodicityDate = (date: Date, monthNames: string[]) => {
  const day = date.getDate();
  const month = monthNames[date.getMonth()];
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
};

export const DrugsCreatePeriodicityScreen = () => {
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const navigation = useNavigation<NativeStackNavigationProp<DrugsCreateStackParamList>>();
  const mealsDraft = useAppSelector(state => state.drugsCreate.regimen.meals);
  const {t} = useTranslation('drugsCreate', {i18n});
  const {t: tTimePickers} = useTranslation('timePickers', {i18n});
  const nextDateIdRef = useRef(mealsDraft.periodicity.nextDateId);
  const [scheduleType, setScheduleType] = useState<ScheduleTypeKey>(mealsDraft.periodicity.scheduleType);
  const [intervalDays, setIntervalDays] = useState(mealsDraft.periodicity.intervalDays);
  const [selectedWeekDayKeys, setSelectedWeekDayKeys] = useState<WeekDayKey[]>(
    mealsDraft.periodicity.selectedWeekDayKeys as WeekDayKey[],
  );
  const [periodicityDates, setPeriodicityDates] = useState<PeriodicityDateItem[]>(() =>
    mealsDraft.periodicity.dates.map(item => ({
      id: item.id,
      date: new Date(item.dateIso),
    })),
  );
  const [dateModalState, setDateModalState] = useState<DateModalState>(null);

  const hydrateFromDraft = useCallback(() => {
    const periodicity = mealsDraft.periodicity;
    setScheduleType(periodicity.scheduleType);
    setIntervalDays(periodicity.intervalDays);
    setSelectedWeekDayKeys(periodicity.selectedWeekDayKeys as WeekDayKey[]);
    setPeriodicityDates(
      periodicity.dates.map(item => ({
        id: item.id,
        date: new Date(item.dateIso),
      })),
    );
    nextDateIdRef.current = periodicity.nextDateId;
  }, [mealsDraft.periodicity]);

  useFocusEffect(
    useCallback(() => {
      hydrateFromDraft();
    }, [hydrateFromDraft]),
  );

  const monthNames = useMemo(
    () => MONTH_KEYS.map(key => tTimePickers(`months.${key}`)),
    [tTimePickers],
  );

  const scheduleTypeOptions = useMemo(
    () =>
      (['interval', 'weekDays', 'dates'] as const).map(key => ({
        key,
        label: t(`periodicity.scheduleTypes.${key}`),
      })),
    [t],
  );

  const sortedPeriodicityDates = useMemo(
    () => sortDatesAscending(periodicityDates),
    [periodicityDates],
  );

  const isDatesMode = scheduleType === 'dates';
  const saveButtonBottom = insets.bottom + SAVE_BUTTON_BOTTOM_OFFSET;
  const circleButtonBottom = saveButtonBottom + SAVE_BUTTON_HEIGHT + CIRCLE_BUTTON_SPACING;
  const scrollBottomPadding = isDatesMode
    ? circleButtonBottom + CIRCLE_BUTTON_SIZE + SCROLL_BOTTOM_EXTRA_PADDING
    : insets.bottom + SAVE_BUTTON_BOTTOM_OFFSET + SAVE_BUTTON_HEIGHT + SAVE_BUTTON_TOP_SPACING;

  const isSaveDisabled =
    (scheduleType === 'weekDays' && selectedWeekDayKeys.length === 0) ||
    (scheduleType === 'dates' && periodicityDates.length === 0);

  const editingDateItem =
    dateModalState?.mode === 'edit'
      ? periodicityDates.find(item => item.id === dateModalState.dateId) ?? null
      : null;

  const createDateId = useCallback(() => {
    const id = nextDateIdRef.current;
    nextDateIdRef.current += 1;
    return id;
  }, []);

  const toggleWeekDay = (dayKey: WeekDayKey) => {
    setSelectedWeekDayKeys(prev =>
      prev.includes(dayKey) ? prev.filter(key => key !== dayKey) : [...prev, dayKey],
    );
  };

  const upsertPeriodicityDate = useCallback(
    (date: Date, editedDateId?: number) => {
      setPeriodicityDates(prev => {
        const withoutDuplicates = prev.filter(item => {
          if (editedDateId !== undefined && item.id === editedDateId) {
            return false;
          }

          return !isSameDay(item.date, date);
        });

        if (editedDateId !== undefined) {
          const editedItem = prev.find(item => item.id === editedDateId);
          if (!editedItem) {
            return prev;
          }

          return sortDatesAscending([...withoutDuplicates, {...editedItem, date}]);
        }

        return sortDatesAscending([...withoutDuplicates, {id: createDateId(), date}]);
      });
    },
    [createDateId],
  );

  const handleDateSave = useCallback(
    (date: Date) => {
      if (dateModalState?.mode === 'edit') {
        upsertPeriodicityDate(date, dateModalState.dateId);
      } else {
        upsertPeriodicityDate(date);
      }

      setDateModalState(null);
    },
    [dateModalState, upsertPeriodicityDate],
  );

  const handleDateDelete = useCallback((dateId: number) => {
    setPeriodicityDates(prev => prev.filter(item => item.id !== dateId));
  }, []);

  const handlePeriodicitySave = useCallback(() => {
    dispatch(
      updateMealsRegimenDraft({
        periodicity: {
          scheduleType,
          intervalDays,
          selectedWeekDayKeys,
          dates: periodicityDates.map(item => ({
            id: item.id,
            dateIso: item.date.toISOString(),
          })),
          nextDateId: nextDateIdRef.current,
        },
      }),
    );
    navigation.goBack();
  }, [dispatch, intervalDays, navigation, periodicityDates, scheduleType, selectedWeekDayKeys]);

  return (
    <StatusBarAvoidContainer backgroundColor={SCREEN_BACKGROUND}>
      <Header title={t('screenTitles.periodicity')} backgroundColor={SCREEN_BACKGROUND} />
      <View style={styles.screenContent}>
        <ScrollView
          contentContainerStyle={[styles.content, {paddingBottom: scrollBottomPadding}]}
          showsVerticalScrollIndicator={false}>
          <View style={styles.settingsCard}>
            <Text style={[styles.sectionLabel, styles.sectionLabelFirst]}>
              {t('periodicity.scheduleLabel')}
            </Text>
            <View style={styles.buttonsWrap}>
              {scheduleTypeOptions.map(option => (
                <ActiveButton
                  key={option.key}
                  label={option.label}
                  isActive={scheduleType === option.key}
                  onPress={() => setScheduleType(option.key)}
                />
              ))}
            </View>
          </View>

          {scheduleType === 'interval' ? (
            <Animated.View
              entering={FadeIn.duration(180)}
              exiting={FadeOut.duration(120)}
              layout={LinearTransition.duration(180)}
              style={styles.card}>
              <EveryPickerMain
                value={intervalDays}
                onChange={setIntervalDays}
                amount={INTERVAL_MAX_DAYS}
                unitShort={t('regimenTypes.everyDay.unitShort')}
                syncKey={scheduleType}
              />
            </Animated.View>
          ) : null}

          {scheduleType === 'weekDays' ? (
            <Animated.View
              entering={FadeIn.duration(180)}
              exiting={FadeOut.duration(120)}
              layout={LinearTransition.duration(180)}
              style={styles.settingsCard}>
              <Text style={[styles.sectionLabel, styles.sectionLabelFirst]}>
                {t('periodicity.weekDaysLabel')}
              </Text>
              <View style={styles.weekDaysRow}>
                {WEEK_DAYS.map(day => (
                  <View key={day.key} style={styles.weekDayButtonWrap}>
                    <ActiveButton
                      label={t(`regimenTypes.weekDays.${day.shortKey}`)}
                      isActive={selectedWeekDayKeys.includes(day.key)}
                      onPress={() => toggleWeekDay(day.key)}
                      containerStyle={styles.weekDayButtonContainer}
                      style={styles.weekDayButton}
                    />
                  </View>
                ))}
              </View>
            </Animated.View>
          ) : null}

          {scheduleType === 'dates' ? (
            <Animated.View
              entering={FadeIn.duration(180)}
              exiting={FadeOut.duration(120)}
              layout={LinearTransition.duration(180)}
              style={styles.datesSection}>
              {sortedPeriodicityDates.length === 0 ? (
                <Animated.View
                  key="periodicity-dates-empty"
                  layout={LinearTransition.duration(180)}
                  entering={FadeIn.duration(180)}
                  exiting={FadeOut.duration(150)}>
                  <InfoCard text={t('periodicity.emptyDatesWarning')} style={styles.emptyDatesInfoCard} />
                </Animated.View>
              ) : (
                sortedPeriodicityDates.map(dateItem => (
                  <Animated.View
                    key={dateItem.id}
                    layout={LinearTransition.duration(200)}
                    entering={FadeInDown.duration(180)}
                    exiting={FadeOutUp.duration(160)}>
                    <View style={styles.dateCard}>
                      <View style={styles.dateCardHeader}>
                        <Text style={styles.dateCardText}>
                          {formatPeriodicityDate(dateItem.date, monthNames)}
                        </Text>
                        <View style={styles.dateCardActions}>
                          <TouchableOpacity
                            activeOpacity={0.7}
                            hitSlop={6}
                            onPress={() => {
                              setDateModalState({mode: 'edit', dateId: dateItem.id});
                            }}>
                            <IconMapper
                              icon="square-pen"
                              size={24}
                              color={DATE_CARD_ICON_COLOR}
                              weight={1.5}
                            />
                          </TouchableOpacity>
                          <TouchableOpacity
                            activeOpacity={0.7}
                            hitSlop={6}
                            onPress={() => {
                              handleDateDelete(dateItem.id);
                            }}
                            style={styles.dateCardDeleteButton}>
                            <IconMapper
                              icon="trash-2"
                              size={24}
                              color={DATE_CARD_ICON_COLOR}
                              weight={1.5}
                            />
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  </Animated.View>
                ))
              )}
            </Animated.View>
          ) : null}
        </ScrollView>

        {isDatesMode ? (
          <CircleIconButton
            icon="lines-plus"
            onPress={() => {
              setDateModalState({mode: 'add'});
            }}
            style={[styles.addDateButton, {bottom: circleButtonBottom}]}
          />
        ) : null}

        <ButtonMain
          title={t('periodicity.saveButton')}
          disabled={isSaveDisabled}
          onPress={handlePeriodicitySave}
          style={[styles.saveButton, {bottom: saveButtonBottom}]}
        />
      </View>

      <DatePickerModal
        visible={dateModalState !== null}
        initialValue={editingDateItem?.date ?? null}
        title={t('periodicity.datePickerTitle')}
        onClose={() => {
          setDateModalState(null);
        }}
        onSave={handleDateSave}
      />
    </StatusBarAvoidContainer>
  );
};

const styles = StyleSheet.create({
  screenContent: {
    flex: 1,
  },
  content: {
    marginTop: 12,
    gap: 16,
  },
  settingsCard: {
    backgroundColor: 'rgba(255, 255, 255, 1)',
    borderRadius: 28,
    paddingTop: 16,
    paddingBottom: 28,
    paddingHorizontal: 12,
  },
  sectionLabel: {
    color: 'rgba(134, 132, 168, 1)',
    marginLeft: 16,
  },
  sectionLabelFirst: {
    marginTop: 12,
  },
  buttonsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: 12,
    rowGap: 16,
    marginTop: 20,
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 1)',
    borderRadius: 28,
    paddingHorizontal: 12,
  },
  weekDaysRow: {
    flexDirection: 'row',
    columnGap: 8,
    marginTop: 20,
  },
  weekDayButtonWrap: {
    flex: 1,
  },
  weekDayButtonContainer: {
    flex: 1,
  },
  weekDayButton: {
    paddingHorizontal: 0,
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 16,
  },
  datesSection: {
    gap: 16,
  },
  dateCard: {
    backgroundColor: 'rgba(255, 255, 255, 1)',
    borderRadius: 28,
    paddingHorizontal: 12,
  },
  dateCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 26,
    justifyContent: 'space-between',
  },
  dateCardText: {
    flex: 1,
    marginLeft: 16,
    color: 'rgba(29, 26, 73, 1)',
    fontSize: 18,
    fontWeight: '500',
  },
  dateCardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
  },
  dateCardDeleteButton: {
    marginRight: 12,
  },
  emptyDatesInfoCard: {
    marginHorizontal: 12,
  },
  addDateButton: {
    position: 'absolute',
    right: 12,
  },
  saveButton: {
    position: 'absolute',
    left: 12,
    right: 12,
  },
});
