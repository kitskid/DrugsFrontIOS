import {useCallback, useEffect, useMemo} from 'react';
import {ActivityIndicator, StyleSheet, Text, View} from 'react-native';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import type {CompositeNavigationProp} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useTranslation} from 'react-i18next';
import Animated, {FadeIn, FadeOut, LinearTransition} from 'react-native-reanimated';

import type {AppStackParamList} from '../../../../app/AppStack.tsx';
import {formatMealTimeDisplay, mapMealScheduleToMealItems} from '../../../../features/api/meals/mealScheduleMappers.ts';
import {areMealRemindersEnabled} from '../../../../features/api/meals/types.ts';
import {useMealScheduleQuery} from '../../../../features/api/meals/useMealScheduleQuery.ts';
import type {DrugsCreateStackParamList} from '../../../../features/navigation/DrugsCreateStack.tsx';
import i18n from '../../../../features/localisation/i18n';
import {formatMealsPeriodicityLabel} from '../../../../features/redux/drugsCreate/mealsRegimenUtils.ts';
import {updateMealsRegimenDraft} from '../../../../features/redux/drugsCreate/drugsCreateSlice.ts';
import type {MealsFoodRelation, MealsOffsetPresetKey, NotificationCustomOffsetUnit} from '../../../../features/redux/drugsCreate/types.ts';
import {useAppDispatch, useAppSelector} from '../../../../features/redux/hooks.ts';
import {ActiveButton} from '../../../../shared/ui/ActiveButton.tsx';
import {ButtonMain} from '../../../../shared/ui/ButtonMain.tsx';
import {LabelValueTouchableRightChevron} from '../../../../shared/ui/LabelValueTouchableRightChevron.tsx';
import {SwitchLabelIconCard} from '../../../../shared/ui/SwitchLabelIconCard.tsx';
import {TimePickerNotify} from '../../../../shared/ui/timePickers/TimePickerNotify.tsx';
import {WEEK_DAYS} from '../RegimenWeekDayContent.tsx';
import {MealsEmptyCard} from './MealsEmptyCard.tsx';

const LOADER_COLOR = 'rgba(35, 142, 235, 1)';
const MEAL_OFFSET_UNITS: NotificationCustomOffsetUnit[] = ['minute', 'hour'];

const FOOD_RELATION_KEYS = ['before', 'during', 'after'] as const satisfies readonly MealsFoodRelation[];
const OFFSET_PRESET_KEYS = ['5m', '15m', '30m', '1h', '2h', 'custom'] as const satisfies readonly MealsOffsetPresetKey[];

type RegimenMealsContentNavigationProp = CompositeNavigationProp<
  NativeStackNavigationProp<DrugsCreateStackParamList>,
  NativeStackNavigationProp<AppStackParamList>
>;

export const RegimenMealsContent = () => {
  const dispatch = useAppDispatch();
  const navigation = useNavigation<RegimenMealsContentNavigationProp>();
  const {t} = useTranslation('drugsCreate', {i18n});
  const mealsDraft = useAppSelector(state => state.drugsCreate.regimen.meals);
  const {data: schedule, isPending, refetch} = useMealScheduleQuery();

  const openProfileMeals = useCallback(() => {
    navigation.navigate('Profile', {
      screen: 'ProfileMeals',
    });
  }, [navigation]);

  useFocusEffect(
    useCallback(() => {
      void refetch();
    }, [refetch]),
  );

  const meals = useMemo(() => mapMealScheduleToMealItems(schedule), [schedule]);
  const mealIds = useMemo(() => meals.map(meal => meal.id), [meals]);

  const weekDayShortLabels = useMemo(() => {
    const labels: string[] = [];
    WEEK_DAYS.forEach(day => {
      labels[day.key] = t(`regimenTypes.weekDays.${day.shortKey}`);
    });
    return labels;
  }, [t]);

  const foodRelationOptions = useMemo(
    () =>
      FOOD_RELATION_KEYS.map(key => ({
        key,
        label: t(`meals.foodRelation.${key}`),
      })),
    [t],
  );

  const offsetPresets = useMemo(
    () =>
      OFFSET_PRESET_KEYS.map(key => ({
        key,
        label: t(`meals.offsetPresets.${key}`),
      })),
    [t],
  );

  const periodicityLabel = useMemo(
    () => formatMealsPeriodicityLabel(mealsDraft.periodicity, weekDayShortLabels, t),
    [mealsDraft.periodicity, weekDayShortLabels, t],
  );

  useEffect(() => {
    if (!schedule || mealsDraft.initialHasMealReminderEnabled != null) {
      return;
    }

    dispatch(
      updateMealsRegimenDraft({
        hasMealReminderEnabled: areMealRemindersEnabled(schedule),
        initialHasMealReminderEnabled: areMealRemindersEnabled(schedule),
      }),
    );
  }, [dispatch, mealsDraft.initialHasMealReminderEnabled, schedule]);

  useEffect(() => {
    if (isPending) {
      return;
    }

    if (mealIds.length === 0) {
      if (mealsDraft.selectedMealSlotIds.length > 0) {
        dispatch(updateMealsRegimenDraft({selectedMealSlotIds: []}));
      }
      return;
    }

    const validSelectedIds = mealsDraft.selectedMealSlotIds.filter(id => mealIds.includes(id));

    if (validSelectedIds.length === 0) {
      dispatch(updateMealsRegimenDraft({selectedMealSlotIds: [mealIds[0]]}));
      return;
    }

    if (validSelectedIds.length !== mealsDraft.selectedMealSlotIds.length) {
      dispatch(updateMealsRegimenDraft({selectedMealSlotIds: validSelectedIds}));
    }
  }, [dispatch, isPending, mealIds, mealsDraft.selectedMealSlotIds]);

  const isOffsetSectionVisible = mealsDraft.foodRelation !== 'during';
  const isCustomOffsetVisible = isOffsetSectionVisible && mealsDraft.offsetPreset === 'custom';
  const offsetSectionLabel =
    mealsDraft.foodRelation === 'before'
      ? t('meals.offsetLabel.before')
      : t('meals.offsetLabel.after');

  const toggleMealSelection = (mealId: string) => {
    const current = mealsDraft.selectedMealSlotIds;

    if (current.includes(mealId)) {
      if (current.length === 1) {
        return;
      }

      dispatch(
        updateMealsRegimenDraft({
          selectedMealSlotIds: current.filter(id => id !== mealId),
        }),
      );
      return;
    }

    dispatch(
      updateMealsRegimenDraft({
        selectedMealSlotIds: [...current, mealId],
      }),
    );
  };

  if (isPending) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={LOADER_COLOR} />
      </View>
    );
  }

  if (meals.length === 0) {
    return <MealsEmptyCard onSpecifyPress={openProfileMeals} />;
  }

  return (
    <>
      <View style={styles.card}>
        <LabelValueTouchableRightChevron
          title={t('meals.periodicityTitle')}
          filledText={periodicityLabel}
          onPress={() => {
            navigation.navigate('DrugsCreatePeriodicityScreen');
          }}
        />
        <View style={styles.divider} />
        <SwitchLabelIconCard
          icon="meals"
          text={t('meals.mealReminderLabel')}
          isActive={mealsDraft.hasMealReminderEnabled}
          setIsActive={value => {
            dispatch(updateMealsRegimenDraft({hasMealReminderEnabled: value}));
          }}
        />
        <ButtonMain
          title={t('meals.editMealsButton')}
          variant="outline"
          onPress={openProfileMeals}
          style={styles.editButton}
        />
      </View>

      <View style={styles.settingsCard}>
        <Text style={[styles.sectionLabel, styles.sectionLabelFirst]}>
          {t('meals.whenToTakeLabel')}
        </Text>
        <View style={styles.buttonsWrap}>
          {meals.map(meal => (
            <ActiveButton
              key={meal.id}
              label={`${formatMealTimeDisplay(meal.time)} ${meal.name}`}
              isActive={mealsDraft.selectedMealSlotIds.includes(meal.id)}
              onPress={() => toggleMealSelection(meal.id)}
            />
          ))}
        </View>

        <Text style={[styles.sectionLabel, styles.sectionLabelSpaced]}>
          {t('meals.intakeMomentLabel')}
        </Text>
        <View style={styles.buttonsWrap}>
          {foodRelationOptions.map(option => (
            <ActiveButton
              key={option.key}
              label={option.label}
              isActive={mealsDraft.foodRelation === option.key}
              onPress={() => {
                dispatch(updateMealsRegimenDraft({foodRelation: option.key}));
              }}
            />
          ))}
        </View>

        {isOffsetSectionVisible ? (
          <Animated.View layout={LinearTransition.duration(180)}>
            <Text style={[styles.sectionLabel, styles.sectionLabelSpaced]}>{offsetSectionLabel}</Text>
            <View style={styles.buttonsWrap}>
              {offsetPresets.map(preset => (
                <ActiveButton
                  key={preset.key}
                  label={preset.label}
                  isActive={mealsDraft.offsetPreset === preset.key}
                  onPress={() => {
                    dispatch(updateMealsRegimenDraft({offsetPreset: preset.key}));
                  }}
                />
              ))}
            </View>

            {isCustomOffsetVisible ? (
              <Animated.View
                entering={FadeIn.duration(180)}
                exiting={FadeOut.duration(120)}
                style={styles.customOffsetField}>
                <TimePickerNotify
                  valueAmount={mealsDraft.customOffsetAmount}
                  valueUnit={mealsDraft.customOffsetUnit}
                  units={MEAL_OFFSET_UNITS}
                  onChange={(amount, unit) => {
                    if (unit !== 'minute' && unit !== 'hour') {
                      return;
                    }

                    dispatch(
                      updateMealsRegimenDraft({
                        customOffsetAmount: amount,
                        customOffsetUnit: unit,
                      }),
                    );
                  }}
                />
              </Animated.View>
            ) : null}
          </Animated.View>
        ) : null}
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  loaderContainer: {
    minHeight: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 1)',
    borderRadius: 28,
    marginBottom: 16,
  },
  settingsCard: {
    backgroundColor: 'rgba(255, 255, 255, 1)',
    borderRadius: 28,
    marginBottom: 16,
    paddingVertical: 16,
    paddingHorizontal: 12,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(241, 240, 249, 1)',
    marginHorizontal: 20,
  },
  editButton: {
    marginHorizontal: 20,
    marginTop: 4,
    marginBottom: 20,
  },
  sectionLabel: {
    color: 'rgba(134, 132, 168, 1)',
    marginLeft: 16,
  },
  sectionLabelFirst: {
    marginTop: 12,
  },
  sectionLabelSpaced: {
    marginTop: 22,
  },
  buttonsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: 12,
    rowGap: 16,
    marginTop: 20,
  },
  customOffsetField: {
    marginTop: 20,
  },
});
