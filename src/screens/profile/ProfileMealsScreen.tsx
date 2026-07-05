import {useCallback, useEffect, useRef, useState} from 'react';
import {ScrollView, StyleSheet, View} from 'react-native';
import axios from 'axios';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {BottomSheetModal} from '@gorhom/bottom-sheet';
import {useFocusEffect} from '@react-navigation/native';
import {useMutation, useQueryClient} from '@tanstack/react-query';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTranslation} from 'react-i18next';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeOut,
  FadeOutUp,
  LinearTransition,
} from 'react-native-reanimated';

import type {ProfileStackParamList} from '../../features/navigation/ProfileStack.tsx';
import {CALENDAR_QUERY_KEY} from '../../features/api/apiCalendar.ts';
import {invalidateDocumentsQueries} from '../../features/api/apiDocuments.ts';
import {apiProfile} from '../../features/api/apiProfile.ts';
import {
  buildUpsertMealScheduleDto,
  mapMealScheduleToMealItems,
} from '../../features/api/meals/mealScheduleMappers.ts';
import {
  getLinkedPrescriptionsForMealSlot,
} from '../../features/api/meals/mealSlotPrescriptionLinks.ts';
import type {MealScheduleDto} from '../../features/api/meals/types.ts';
import {MEAL_SCHEDULE_QUERY_KEY} from '../../features/api/meals/types.ts';
import {useMealScheduleQuery} from '../../features/api/meals/useMealScheduleQuery.ts';
import {
  MEDICATION_PRESCRIPTIONS_QUERY_KEY,
  type MedicationPrescriptionResponseDto,
} from '../../features/api/drugs/apiDrugs.ts';
import i18n from '../../features/localisation/i18n.ts';
import {useToast} from '../../features/toasts/useToast.ts';
import {ButtonMain} from '../../shared/ui/ButtonMain.tsx';
import {CircleIconButton} from '../../shared/ui/CircleIconButton.tsx';
import {Header} from '../../shared/ui/Header.tsx';
import {InfoCard} from '../../shared/ui/InfoCard.tsx';
import {StatusBarAvoidContainer} from '../../shared/ui/StatusBarAvoidContainer.tsx';
import {TimePickerModal} from '../../shared/ui/timePickers/TimePickerModal.tsx';
import {MealDeleteModal} from '../../widgets/profileScreens/meals/MealDeleteModal.tsx';
import {MealNameModal} from '../../widgets/profileScreens/meals/MealNameModal.tsx';
import {MealUnitCard} from '../../widgets/profileScreens/meals/MealUnitCard.tsx';
import {SkeletonMealUnit} from '../../widgets/profileScreens/meals/SkeletonMealUnit.tsx';
import {
  getDefaultMealTime,
  sortMealsByTime,
  type MealItem,
} from '../../widgets/profileScreens/meals/mealDefaults.ts';

const SCREEN_BACKGROUND = 'rgba(247, 246, 251, 1)';
const SAVE_BUTTON_BOTTOM_OFFSET = 16;
const SAVE_BUTTON_HEIGHT = 48;
const CIRCLE_BUTTON_SPACING = 16;
const CIRCLE_BUTTON_SIZE = 48;
const SCROLL_BOTTOM_EXTRA_PADDING = 12;

type PendingMealDelete = {
  mealId: string;
  prescriptions: MedicationPrescriptionResponseDto[];
};

type ProfileMealsScreenProps = NativeStackScreenProps<ProfileStackParamList, 'ProfileMeals'>;

export const ProfileMealsScreen = ({navigation}: ProfileMealsScreenProps) => {
  const {t} = useTranslation('profile', {i18n});
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const {showToast} = useToast();
  const mealNameModalRef = useRef<BottomSheetModal>(null);
  const mealDeleteModalRef = useRef<BottomSheetModal>(null);
  const nextMealIdRef = useRef(0);
  const [meals, setMeals] = useState<MealItem[]>([]);
  const [schedule, setSchedule] = useState<MealScheduleDto | null>(null);
  const [editingMealId, setEditingMealId] = useState<string | null>(null);
  const [checkingDeleteMealId, setCheckingDeleteMealId] = useState<string | null>(null);
  const [pendingMealDelete, setPendingMealDelete] = useState<PendingMealDelete | null>(null);
  const [isTimePickerVisible, setTimePickerVisible] = useState(false);
  const [pendingMealName, setPendingMealName] = useState('');
  const [pendingMealTime, setPendingMealTime] = useState('08:00');
  const [isScheduleLoaded, setIsScheduleLoaded] = useState(false);

  const {refetch: refetchSchedule} = useMealScheduleQuery();

  const {mutateAsync: saveMealSchedule, isPending: isSaving} = useMutation({
    mutationFn: async ({
      nextMeals,
      currentSchedule,
    }: {
      nextMeals: MealItem[];
      currentSchedule: MealScheduleDto | null;
    }) => {
      if (nextMeals.length === 0) {
        if (currentSchedule) {
          try {
            await apiProfile.meals.deleteMe();
          } catch (error) {
            if (!axios.isAxiosError(error) || error.response?.status !== 404) {
              throw error;
            }
          }
        }

        return null;
      }

      const response = await apiProfile.meals.upsertMe(buildUpsertMealScheduleDto(nextMeals));
      return response.data;
    },
  });

  const hydrateFromSchedule = useCallback((nextSchedule: MealScheduleDto | null) => {
    setSchedule(nextSchedule);
    setMeals(mapMealScheduleToMealItems(nextSchedule));
  }, []);

  useFocusEffect(
    useCallback(() => {
      void refetchSchedule().then(result => {
        hydrateFromSchedule(result.data ?? null);
        setIsScheduleLoaded(true);
      });
    }, [hydrateFromSchedule, refetchSchedule]),
  );

  const saveButtonBottom = insets.bottom + SAVE_BUTTON_BOTTOM_OFFSET;
  const circleButtonBottom = saveButtonBottom + SAVE_BUTTON_HEIGHT + CIRCLE_BUTTON_SPACING;
  const scrollBottomPadding =
    circleButtonBottom + CIRCLE_BUTTON_SIZE + SCROLL_BOTTOM_EXTRA_PADDING;

  const createMealId = useCallback(() => {
    nextMealIdRef.current += 1;
    return `meal-${nextMealIdRef.current}`;
  }, []);

  const editingMeal = editingMealId ? meals.find(meal => meal.id === editingMealId) : null;

  const openAddMealModal = useCallback(() => {
    setEditingMealId(null);
    mealNameModalRef.current?.present();
  }, []);

  const openEditMealModal = useCallback((mealId: string) => {
    setEditingMealId(mealId);
    mealNameModalRef.current?.present();
  }, []);

  const handleMealNameSave = useCallback((name: string) => {
    if (editingMealId) {
      setMeals(prevMeals =>
        sortMealsByTime(
          prevMeals.map(meal => (meal.id === editingMealId ? {...meal, name} : meal)),
        ),
      );
      setEditingMealId(null);
      return;
    }

    setPendingMealName(name);
    setPendingMealTime(getDefaultMealTime(name));
    setTimePickerVisible(true);
  }, [editingMealId]);

  const handleMealNameModalClose = useCallback(() => {
    setEditingMealId(null);
  }, []);

  const handleMealDelete = useCallback(
    async (mealId: string) => {
      const meal = meals.find(item => item.id === mealId);
      if (!meal) {
        return;
      }

      if (!meal.serverSlotId) {
        setMeals(prevMeals => prevMeals.filter(item => item.id !== mealId));
        return;
      }

      setCheckingDeleteMealId(mealId);

      try {
        const prescriptions = await getLinkedPrescriptionsForMealSlot(meal.serverSlotId);

        if (prescriptions.length === 0) {
          setMeals(prevMeals => prevMeals.filter(item => item.id !== mealId));
          return;
        }

        setPendingMealDelete({mealId, prescriptions});
      } catch {
        showToast({variant: 'error', text: t('meals_delete_check_error')});
      } finally {
        setCheckingDeleteMealId(null);
      }
    },
    [meals, showToast, t],
  );

  const handleMealDeleteConfirm = useCallback(() => {
    if (!pendingMealDelete) {
      return;
    }

    const {mealId} = pendingMealDelete;
    setMeals(prevMeals => prevMeals.filter(item => item.id !== mealId));
    setPendingMealDelete(null);
  }, [pendingMealDelete]);

  const handleMealDeleteModalClose = useCallback(() => {
    setPendingMealDelete(null);
  }, []);

  useEffect(() => {
    if (pendingMealDelete) {
      mealDeleteModalRef.current?.present();
    }
  }, [pendingMealDelete]);

  const handleMealTimeSave = useCallback(
    (time: string) => {
      setMeals(prevMeals =>
        sortMealsByTime([
          ...prevMeals,
          {
            id: createMealId(),
            name: pendingMealName,
            time,
          },
        ]),
      );
      setTimePickerVisible(false);
      setPendingMealName('');
    },
    [createMealId, pendingMealName],
  );

  const handleMealTimeClose = useCallback(() => {
    setTimePickerVisible(false);
    setPendingMealName('');
  }, []);

  const handleMealTimeChange = useCallback((mealId: string, time: string) => {
    setMeals(prevMeals => sortMealsByTime(
      prevMeals.map(meal => (meal.id === mealId ? {...meal, time} : meal)),
    ));
  }, []);

  const handleSavePress = useCallback(async () => {
    if (isSaving) {
      return;
    }

    try {
      const savedSchedule = await saveMealSchedule({
        nextMeals: meals,
        currentSchedule: schedule,
      });
      queryClient.setQueryData(MEAL_SCHEDULE_QUERY_KEY, savedSchedule);
      void queryClient.invalidateQueries({queryKey: MEDICATION_PRESCRIPTIONS_QUERY_KEY});
      void queryClient.invalidateQueries({queryKey: CALENDAR_QUERY_KEY});
      void queryClient.invalidateQueries({queryKey: MEAL_SCHEDULE_QUERY_KEY});
      void invalidateDocumentsQueries(queryClient);
      showToast({variant: 'success', text: t('meals_save_success')});
      navigation.goBack();
    } catch {
      showToast({variant: 'error', text: t('meals_save_error')});
    }
  }, [isSaving, meals, navigation, queryClient, saveMealSchedule, schedule, showToast, t]);

  return (
    <StatusBarAvoidContainer backgroundColor={SCREEN_BACKGROUND}>
      <Header title={t('meals_screen_title')} backgroundColor={SCREEN_BACKGROUND} />
      <View style={styles.screen}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.scrollContent, {paddingBottom: scrollBottomPadding}]}
          showsVerticalScrollIndicator={false}>
          {!isScheduleLoaded ? (
            <SkeletonMealUnit />
          ) : meals.length === 0 ? (
            <Animated.View
              key="meals-empty-state"
              layout={LinearTransition.duration(180)}
              entering={FadeIn.duration(180)}
              exiting={FadeOut.duration(150)}
              style={styles.infoCard}>
              <InfoCard text={t('meals_empty_info')} />
            </Animated.View>
          ) : (
            meals.map(meal => (
              <Animated.View
                key={meal.id}
                layout={LinearTransition.duration(200)}
                entering={FadeInDown.duration(180)}
                exiting={FadeOutUp.duration(160)}>
                <MealUnitCard
                  name={meal.name}
                  time={meal.time}
                  timePickerModalTitle={t('meals_time_modal_title')}
                  isDeleteLoading={checkingDeleteMealId === meal.id}
                  onTimeChange={time => {
                    handleMealTimeChange(meal.id, time);
                  }}
                  onEdit={() => {
                    openEditMealModal(meal.id);
                  }}
                  onDelete={() => {
                    void handleMealDelete(meal.id);
                  }}
                />
              </Animated.View>
            ))
          )}
        </ScrollView>
        <CircleIconButton
          icon="meals"
          onPress={openAddMealModal}
          style={[styles.circleButton, {bottom: circleButtonBottom}]}
        />
        <ButtonMain
          title={t('meals_save_button')}
          onPress={() => {
            void handleSavePress();
          }}
          isLoading={isSaving}
          style={[styles.saveButton, {bottom: saveButtonBottom}]}
        />
      </View>

      <MealDeleteModal
        ref={mealDeleteModalRef}
        prescriptions={pendingMealDelete?.prescriptions ?? []}
        onConfirm={handleMealDeleteConfirm}
        onClose={handleMealDeleteModalClose}
      />

      <MealNameModal
        ref={mealNameModalRef}
        mealsCount={meals.length}
        initialName={editingMeal?.name ?? null}
        onSave={handleMealNameSave}
        onClose={handleMealNameModalClose}
      />
      <TimePickerModal
        visible={isTimePickerVisible}
        initialValue={pendingMealTime}
        title={t('meals_time_modal_title')}
        onClose={handleMealTimeClose}
        onSave={handleMealTimeSave}
      />
    </StatusBarAvoidContainer>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 12,
  },
  infoCard: {
    marginHorizontal: 12,
  },
  saveButton: {
    position: 'absolute',
    left: 12,
    right: 12,
    zIndex: 2,
  },
  circleButton: {
    position: 'absolute',
    right: 12,
    zIndex: 2,
  },
});
