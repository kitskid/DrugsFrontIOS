import {useCallback, useDeferredValue, useEffect, useMemo, useRef, useState} from 'react';
import type {LayoutChangeEvent} from 'react-native';
import {StyleSheet, Text, useWindowDimensions, View} from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  runOnJS,
  scrollTo,
  useAnimatedReaction,
  useAnimatedRef,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
} from 'react-native-reanimated';
import {GestureDetector} from 'react-native-gesture-handler';
import {
  useFocusEffect,
  useNavigation,
  useRoute,
} from '@react-navigation/native';
import type {CompositeNavigationProp} from '@react-navigation/native';
import type {NativeStackNavigationProp, NativeStackScreenProps} from '@react-navigation/native-stack';
import {useQueryClient} from '@tanstack/react-query';
import {BottomSheetModal} from '@gorhom/bottom-sheet';
import {useTranslation} from 'react-i18next';

import type {AppStackParamList} from '../../app/AppStack';
import type {CalendarTabStackParamList} from '../../features/navigation/tabs/CalendarTabStack.tsx';
import i18n from '../../features/localisation/i18n.ts';
import {useAppDispatch} from '../../features/redux/hooks.ts';
import {resetDrugsCreateStateFromCalendar} from '../../features/redux/drugsCreate/drugsCreateSlice.ts';
import {StatusBarAvoidContainer} from '../../shared/ui/StatusBarAvoidContainer.tsx';
import {CircleIconButton} from '../../shared/ui/CircleIconButton.tsx';
import {IconMapper} from '../../shared/ui/IconMapper.tsx';
import {
  pullIndicatorOverlayStyle,
  usePullIndicatorOverlayStyle,
  usePullToRefresh,
} from '../../shared/ui/refreshIndicator/usePullToRefresh.ts';
import {PullToRefreshIndicator} from '../../shared/ui/refreshIndicator/PullToRefreshIndicator.tsx';
import {LargeCalendar} from '../../widgets/calendarScreen/largeCalendar/LargeCalendar.tsx';
import {
  getLargeCalendarHeights,
} from '../../widgets/calendarScreen/largeCalendar/calendarDateUtils.ts';
import {CalendarCardsGroup} from '../../shared/ui/drugs/CalendarCardsGroup.tsx';
import {
  StatusChangeModal,
  type StatusChangeModalItem,
} from '../../shared/ui/drugs/StatusChangeModal.tsx';
import {CalendarSelectedDatesLabel} from '../../widgets/calendarScreen/CalendarSelectedDatesLabel.tsx';
import {SkeletonCards} from '../../widgets/calendarScreen/SkeletonCards.tsx';
import {SkeletonCalendar} from '../../widgets/calendarScreen/SkeletonCalendar.tsx';
import {
  CALENDAR_YEARS_QUERY_PREFIX,
  useMergedCalendarYears,
  usePrefetchCalendarYear,
} from '../../widgets/calendarScreen/useCalendarYears.ts';
import {
  getCalendarDatesWithEvents,
  mapCalendarToCardGroups,
  type CalendarCardGroup,
  type CalendarCardGroupItem,
} from '../../widgets/calendarScreen/mapCalendarData.ts';

const CALENDAR_BOTTOM_GAP = 16;
const SNAP_VELOCITY_THRESHOLD = 0.05;
const SNAP_TOLERANCE = 1;
const COLLAPSE_SCROLL_DISTANCE = 20;
const SCROLL_BOTTOM_PADDING = 32;
const SCROLL_BACKGROUND_COLOR = 'rgba(247, 246, 251, 1)';
const SKELETON_CARD_GROUPS = [0, 1, 2] as const;
const EMPTY_GROUPS: CalendarCardGroup[] = [];

const startOfDay = (date: Date): Date =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());

type CalendarScreenNavigation = CompositeNavigationProp<
  NativeStackNavigationProp<CalendarTabStackParamList, 'CalendarScreen'>,
  NativeStackNavigationProp<AppStackParamList>
>;

type CalendarScreenRoute = NativeStackScreenProps<
  CalendarTabStackParamList,
  'CalendarScreen'
>['route'];

export const CalendarScreen = () => {
  const {t} = useTranslation('calendar', {i18n});
  const navigation = useNavigation<CalendarScreenNavigation>();
  const route = useRoute<CalendarScreenRoute>();
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();
  const {initialMonth, initialYear} = route.params ?? {};
  const {width: windowWidth} = useWindowDimensions();
  // Today is selected by default (single-day selection: startDate stays null,
  // endDate holds the chosen day — matching the calendar's tap model).
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(() => startOfDay(new Date()));
  const [isPullRefreshing, setIsPullRefreshing] = useState(false);

  const currentYear = useMemo(() => new Date().getFullYear(), []);
  const [visibleYear, setVisibleYear] = useState<number>(
    () => initialYear ?? currentYear,
  );

  const yearsToLoad = useMemo(() => {
    const years = new Set<number>([currentYear, visibleYear]);
    if (startDate) {
      years.add(startDate.getFullYear());
    }
    if (endDate) {
      years.add(endDate.getFullYear());
    }
    if (typeof initialYear === 'number') {
      years.add(initialYear);
    }
    return Array.from(years);
  }, [currentYear, visibleYear, startDate, endDate, initialYear]);

  const prefetchYear = usePrefetchCalendarYear();

  useEffect(() => {
    prefetchYear(visibleYear);
  }, [visibleYear, prefetchYear]);

  const {data, isLoading, isError} = useMergedCalendarYears(yearsToLoad, {
    primaryYear: currentYear,
  });

  // Refresh in the background when returning to the screen (e.g. after creating
  // a new drug elsewhere). Data already in cache stays visible and skeletons
  // are tied to isLoading, so a background refetch shows no skeletons.
  useEffect(() => {
    if (typeof initialYear === 'number') {
      setVisibleYear(prev => (prev === initialYear ? prev : initialYear));
    }
  }, [initialYear]);

  useFocusEffect(
    useCallback(() => {
      queryClient.invalidateQueries({queryKey: CALENDAR_YEARS_QUERY_PREFIX});
    }, [queryClient]),
  );

  const initialCalendarHeights = useMemo(
    () => getLargeCalendarHeights(windowWidth),
    [windowWidth],
  );
  const collapseDistance =
    initialCalendarHeights.expanded - initialCalendarHeights.collapsed;

  const scrollY = useSharedValue<number>(0);
  const expandedCalendarHeight = useSharedValue<number>(
    initialCalendarHeights.expanded,
  );
  const collapsedCalendarHeight = useSharedValue<number>(
    initialCalendarHeights.collapsed,
  );
  const scrollRef = useAnimatedRef<Animated.FlatList<CalendarCardGroup>>();

  const [viewportHeight, setViewportHeight] = useState<number>(0);
  const [collapseScrollDistance, setCollapseScrollDistance] =
    useState<number>(collapseDistance);
  const [naturalContentHeight, setNaturalContentHeight] = useState<number>(0);
  const [scrollFooterHeight, setScrollFooterHeight] = useState<number>(() =>
    Math.max(SCROLL_BOTTOM_PADDING, collapseDistance),
  );

  const handleScrollLayout = useCallback((event: LayoutChangeEvent) => {
    const height = event.nativeEvent.layout.height;
    setViewportHeight(prev => (prev === height ? prev : height));
  }, []);

  const handleContentSizeChange = useCallback(
    (_width: number, height: number) => {
      const natural = height - scrollFooterHeight;
      if (natural < 0) {
        return;
      }
      setNaturalContentHeight(prev =>
        Math.abs(prev - natural) < 1 ? prev : natural,
      );
    },
    [scrollFooterHeight],
  );

  const targetScrollFooterHeight = useMemo(() => {
    if (viewportHeight <= 0) {
      return Math.max(SCROLL_BOTTOM_PADDING, collapseScrollDistance);
    }
    const minRequired =
      collapseScrollDistance + viewportHeight - naturalContentHeight;
    return Math.max(SCROLL_BOTTOM_PADDING, minRequired);
  }, [
    collapseScrollDistance,
    naturalContentHeight,
    viewportHeight,
  ]);

  useEffect(() => {
    setScrollFooterHeight(prev =>
      Math.abs(prev - targetScrollFooterHeight) < 1
        ? prev
        : targetScrollFooterHeight,
    );
  }, [targetScrollFooterHeight]);

  useAnimatedReaction(
    () => expandedCalendarHeight.value - collapsedCalendarHeight.value,
    (distance, previous) => {
      if (distance > 0 && distance !== previous) {
        runOnJS(setCollapseScrollDistance)(distance);
      }
    },
    [],
  );

  const collapseProgress = useDerivedValue<number>(() => {
    const distance =
      expandedCalendarHeight.value - collapsedCalendarHeight.value;
    if (distance <= 0) {
      return 0;
    }
    return interpolate(
      scrollY.value,
      [0, distance],
      [0, 1],
      Extrapolation.CLAMP,
    );
  });

  const snapCalendar = useCallback(
    (y: number) => {
      'worklet';
      const distance =
        expandedCalendarHeight.value - collapsedCalendarHeight.value;
      if (distance <= 0) {
        return;
      }
      if (y > SNAP_TOLERANCE && y < distance - SNAP_TOLERANCE) {
        const targetY = y > COLLAPSE_SCROLL_DISTANCE ? distance : 0;
        scrollTo(scrollRef, 0, targetY, true);
      }
    },
    [collapsedCalendarHeight, expandedCalendarHeight, scrollRef],
  );

  const handlePullRefresh = useCallback(() => {
    setIsPullRefreshing(true);

    void queryClient
      .refetchQueries({queryKey: CALENDAR_YEARS_QUERY_PREFIX})
      .finally(() => {
        setIsPullRefreshing(false);
      });
  }, [queryClient]);

  const pullScrollCallbacks = useMemo(
    () => ({
      onEndDrag: (event: {
        contentOffset: {y: number};
        velocity?: {y?: number};
      }) => {
        'worklet';
        if (Math.abs(event.velocity?.y ?? 0) >= SNAP_VELOCITY_THRESHOLD) {
          return;
        }
        snapCalendar(Math.max(0, event.contentOffset.y));
      },
      onMomentumEnd: (event: {contentOffset: {y: number}}) => {
        'worklet';
        snapCalendar(Math.max(0, event.contentOffset.y));
      },
    }),
    [snapCalendar],
  );

  const {
    scrollHandler,
    pullDistance,
    pullProgress,
    isIosPullEnabled,
    listGesture,
  } = usePullToRefresh({
    onRefresh: handlePullRefresh,
    isRefreshing: isPullRefreshing,
    trackedScrollOffset: scrollY,
    scrollCallbacks: pullScrollCallbacks,
  });

  const pullIndicatorOverlayAnimatedStyle = usePullIndicatorOverlayStyle(
    0,
    pullDistance,
    pullProgress,
    isPullRefreshing,
  );

  const spacerAnimatedStyle = useAnimatedStyle(() => ({
    height:
      expandedCalendarHeight.value +
      CALENDAR_BOTTOM_GAP,
  }));

  const handleVisiblePageChange = useCallback((_month: number, year: number) => {
    setVisibleYear(prev => (prev === year ? prev : year));
  }, []);

  const handleMonthPress = useCallback(
    (month: number, year: number) => {
      navigation.navigate('CalendarMonthChooseScreen', {
        initialMonth: month,
        initialYear: year,
      });
    },
    [navigation],
  );

  const handleYearPress = useCallback(
    (month: number, year: number) => {
      navigation.navigate('CalendarYearChooseScreen', {
        initialMonth: month,
        initialYear: year,
      });
    },
    [navigation],
  );

  // Everything below the calendar (the period label and the cards) reacts to a
  // deferred copy of the selection so the calendar itself (grey interval + press
  // feedback) updates immediately and at high priority, while the label and list
  // change together in a following background pass — no staggered "pop in".
  const deferredStartDate = useDeferredValue(startDate);
  const deferredEndDate = useDeferredValue(endDate);

  // Dots come from the whole all-time dataset and simply appear once it loads.
  const datesWithEvents = useMemo(
    () => getCalendarDatesWithEvents(data?.days),
    [data?.days],
  );

  // Mapping the whole all-time dataset is the expensive part, so it runs once per
  // data change (not per selection). Tapping a day then only re-filters this.
  const allGroups = useMemo(
    () => mapCalendarToCardGroups(data?.days),
    [data?.days],
  );

  // The full dataset is in cache, so the list for the selected range is filtered
  // on the client. With nothing selected, all events for all time are shown.
  const visibleGroups = useMemo(() => {
    const selected = [deferredStartDate, deferredEndDate].filter(
      (date): date is Date => date !== null,
    );

    if (selected.length === 0) {
      return allGroups;
    }

    const times = selected.map(date => startOfDay(date).getTime());
    const min = Math.min(...times);
    const max = Math.max(...times);

    return allGroups.filter(group => {
      const time = startOfDay(group.date).getTime();
      return time >= min && time <= max;
    });
  }, [allGroups, deferredStartDate, deferredEndDate]);

  const listData = !isLoading && !isError ? visibleGroups : EMPTY_GROUPS;

  const showRefreshSkeletons = isLoading || isPullRefreshing;

  // No events in the selected range: show the placeholder centered below the
  // calendar (only once data is loaded, so it doesn't flash during loading).
  const isEmptyState =
    !showRefreshSkeletons && !isError && listData.length === 0;

  const collapseScrollFooter = useMemo(
    () => (
      <View
        pointerEvents="none"
        style={[styles.collapseScrollFooter, {height: scrollFooterHeight}]}
      />
    ),
    [scrollFooterHeight],
  );

  const statusModalRef = useRef<BottomSheetModal>(null);
  const [statusModalItem, setStatusModalItem] =
    useState<StatusChangeModalItem | null>(null);

  const handleCardPress = useCallback((item: CalendarCardGroupItem) => {
    setStatusModalItem({
      intakeId: item.id,
      prescriptionId: item.prescriptionId,
      status: item.status,
      scheduledTime: item.scheduledTime,
    });
    statusModalRef.current?.present();
  }, []);

  const handleOpenProfile = useCallback(
    (prescriptionId: string) => {
      navigation.navigate('DrugsCreate', {
        screen: 'DrugsCreateScreen',
        params: {prescriptionId},
      });
    },
    [navigation],
  );

  const keyExtractor = useCallback(
    (group: CalendarCardGroup) =>
      `${group.date.getFullYear()}-${group.date.getMonth()}-${group.date.getDate()}`,
    [],
  );

  const renderItem = useCallback(
    ({item}: {item: CalendarCardGroup}) => (
      <CalendarCardsGroup
        date={item.date}
        items={item.items}
        onCardPress={handleCardPress}
      />
    ),
    [handleCardPress],
  );

  const listHeader = (
    <>
      <Animated.View style={spacerAnimatedStyle} />
      <CalendarSelectedDatesLabel
        startDate={deferredStartDate}
        endDate={deferredEndDate}
      />
      {isEmptyState ? (
        <View style={styles.emptyContainer}>
          <IconMapper
            icon="calendar-search"
            size={64}
            color="rgba(199, 198, 217, 1)"
            weight={1}
          />
          <Text style={styles.emptyTitle}>{t('emptyState.title')}</Text>
          <Text style={styles.emptySubtitle}>{t('emptyState.subtitle')}</Text>
        </View>
      ) : null}
      {showRefreshSkeletons ? (
        <View>
          {SKELETON_CARD_GROUPS.map(slot => (
            <SkeletonCards key={slot} />
          ))}
        </View>
      ) : null}
      {!showRefreshSkeletons && isError ? (
        <Text style={styles.errorText}>{t('loadError')}</Text>
      ) : null}
    </>
  );

  const listElement = (
    <Animated.FlatList
      ref={scrollRef}
      style={styles.scroll}
      data={listData}
      keyExtractor={keyExtractor}
      renderItem={renderItem}
      ListHeaderComponent={listHeader}
      ListFooterComponent={collapseScrollFooter}
      extraData={`${scrollFooterHeight}-${listData.length}-${isEmptyState}`}
      onContentSizeChange={handleContentSizeChange}
      onScroll={scrollHandler}
      scrollEventThrottle={16}
      showsVerticalScrollIndicator={false}
      bounces={isIosPullEnabled}
      alwaysBounceVertical={isIosPullEnabled}
      overScrollMode="never"
    />
  );

  return (
    <StatusBarAvoidContainer backgroundColor="#FFFFFF">
      <View style={styles.container}>
        <View style={styles.listHost} onLayout={handleScrollLayout}>
          {listGesture ? (
            <GestureDetector gesture={listGesture}>{listElement}</GestureDetector>
          ) : (
            listElement
          )}
        </View>

        <View pointerEvents="box-none" style={styles.calendarOverlay}>
          {showRefreshSkeletons ? (
            <SkeletonCalendar />
          ) : (
            <LargeCalendar
              collapseProgress={collapseProgress}
              expandedHeightShared={expandedCalendarHeight}
              collapsedHeightShared={collapsedCalendarHeight}
              startDate={startDate}
              endDate={endDate}
              setStartDate={setStartDate}
              setEndDate={setEndDate}
              onMonthPress={handleMonthPress}
              onYearPress={handleYearPress}
              onVisiblePageChange={handleVisiblePageChange}
              datesWithEvents={datesWithEvents}
              initialMonth={initialMonth}
              initialYear={initialYear}
            />
          )}
        </View>

        <Animated.View
          style={[
            pullIndicatorOverlayStyle.overlay,
            pullIndicatorOverlayAnimatedStyle,
          ]}
          pointerEvents="none">
          <PullToRefreshIndicator progress={pullProgress} />
        </Animated.View>

        <CircleIconButton
          icon={'pill-plus-new'}
          onPress={() => {
            dispatch(
              resetDrugsCreateStateFromCalendar({
                rangeStartIso: startDate ? startOfDay(startDate).toISOString() : null,
                rangeEndIso: endDate ? startOfDay(endDate).toISOString() : null,
              }),
            );
            navigation.navigate('DrugsCreate');
          }}
          style={styles.addButton}
        />
      </View>

      <StatusChangeModal
        ref={statusModalRef}
        item={statusModalItem}
        showOpenProfileButton
        onOpenProfile={handleOpenProfile}
      />
    </StatusBarAvoidContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: SCROLL_BACKGROUND_COLOR,
  },
  listHost: {
    flex: 1,
  },
  scroll: {
    flex: 1,
    backgroundColor: SCROLL_BACKGROUND_COLOR,
  },
  calendarOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: 'transparent',
  },
  collapseScrollFooter: {
    backgroundColor: SCROLL_BACKGROUND_COLOR,
  },
  errorText: {
    marginHorizontal: 16,
    marginBottom: 16,
    textAlign: 'center',
    color: 'rgba(134, 132, 168, 1)',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 32,
    paddingBottom: 24,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    marginTop: 12,
    fontWeight: '500',
    fontSize: 18,
    color: 'rgba(162, 160, 191, 1)',
  },
  emptySubtitle: {
    marginTop: 12,
    textAlign: 'center',
    color: 'rgba(162, 160, 191, 1)',
  },
  addButton: {
    position: 'absolute',
    right: 12,
    bottom: 16,
  },
});
