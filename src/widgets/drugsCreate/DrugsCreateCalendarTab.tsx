import {memo, useCallback, useEffect, useMemo, useRef, useState} from 'react';
import type {LayoutChangeEvent} from 'react-native';
import {StyleSheet, Text, useWindowDimensions, View} from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  runOnUI,
  scrollTo,
  useAnimatedRef,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  type SharedValue,
} from 'react-native-reanimated';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useQuery} from '@tanstack/react-query';
import {useTranslation} from 'react-i18next';
import {BottomSheetModal} from '@gorhom/bottom-sheet';

import {apiCalendar, CALENDAR_QUERY_KEY} from '../../features/api/apiCalendar.ts';
import type {DrugsCreateStackParamList} from '../../features/navigation/DrugsCreateStack.tsx';
import i18n from '../../features/localisation/i18n';
import {LargeCalendar} from '../calendarScreen/largeCalendar/LargeCalendar.tsx';
import {getLargeCalendarHeights} from '../calendarScreen/largeCalendar/calendarDateUtils.ts';
import {CalendarCardsGroup} from '../../shared/ui/drugs/CalendarCardsGroup.tsx';
import {
  StatusChangeModal,
  type StatusChangeModalItem,
} from '../../shared/ui/drugs/StatusChangeModal.tsx';
import {CalendarSelectedDatesLabel} from '../calendarScreen/CalendarSelectedDatesLabel.tsx';
import {SkeletonCards} from '../calendarScreen/SkeletonCards.tsx';
import {IconMapper} from '../../shared/ui/IconMapper.tsx';
import {
  getCalendarDatesWithEvents,
  localDateToEndOfDayIsoString,
  localDateToIsoString,
  mapCalendarToCardGroups,
  type CalendarCardGroup,
  type CalendarCardGroupItem,
} from '../calendarScreen/mapCalendarData.ts';

const CALENDAR_BOTTOM_GAP = 16;
const CALENDAR_TOP_MARGIN = 12;
const CALENDAR_BORDER_RADIUS = 28;
const SNAP_VELOCITY_THRESHOLD = 0.05;
const SNAP_TOLERANCE = 1;
const COLLAPSE_SCROLL_DISTANCE = 20;
const SCROLL_BOTTOM_PADDING = 32;
const SCROLL_BACKGROUND_COLOR = 'rgba(247, 246, 251, 1)';
const SKELETON_CARD_GROUPS = [0, 1, 2] as const;
const EMPTY_GROUPS: CalendarCardGroup[] = [];
const DAY_MS = 24 * 60 * 60 * 1000;

const startOfDay = (date: Date): Date =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());

type DrugsCreateCalendarTabNavigation = NativeStackNavigationProp<
  DrugsCreateStackParamList,
  'DrugsCreateScreen'
>;

type DrugsCreateCalendarTabProps = {
  prescriptionId: string;
  startDateIso: string;
  durationDays: number;
  searchName: string;
  initialMonth?: number;
  initialYear?: number;
  openIntakeId?: string;
  onOpenIntakeHandled?: () => void;
};

type IntakesListHeaderProps = {
  expandedCalendarHeight: SharedValue<number>;
  startDate: Date | null;
  endDate: Date | null;
  isEmptyState: boolean;
  isLoading: boolean;
  isError: boolean;
  emptyTitle: string;
  emptySubtitle: string;
  loadError: string;
};

const IntakesListHeader = memo(
  ({
    expandedCalendarHeight,
    startDate,
    endDate,
    isEmptyState,
    isLoading,
    isError,
    emptyTitle,
    emptySubtitle,
    loadError,
  }: IntakesListHeaderProps) => {
    const spacerAnimatedStyle = useAnimatedStyle(() => ({
      height:
        expandedCalendarHeight.value +
        CALENDAR_BOTTOM_GAP +
        CALENDAR_TOP_MARGIN,
    }));

    return (
      <>
        <Animated.View style={spacerAnimatedStyle} />
        <CalendarSelectedDatesLabel startDate={startDate} endDate={endDate} />
        {isEmptyState ? (
          <View style={styles.emptyContainer}>
            <IconMapper
              icon="calendar-search"
              size={64}
              color="rgba(199, 198, 217, 1)"
              weight={1}
            />
            <Text style={styles.emptyTitle}>{emptyTitle}</Text>
            <Text style={styles.emptySubtitle}>{emptySubtitle}</Text>
          </View>
        ) : null}
        {isLoading ? (
          <View>
            {SKELETON_CARD_GROUPS.map(slot => (
              <SkeletonCards key={slot} />
            ))}
          </View>
        ) : null}
        {!isLoading && isError ? (
          <Text style={styles.errorText}>{loadError}</Text>
        ) : null}
      </>
    );
  },
);

IntakesListHeader.displayName = 'IntakesListHeader';

export const DrugsCreateCalendarTab = ({
  prescriptionId,
  startDateIso,
  durationDays,
  searchName,
  initialMonth,
  initialYear,
  openIntakeId,
  onOpenIntakeHandled,
}: DrugsCreateCalendarTabProps) => {
  const {t} = useTranslation('calendar', {i18n});
  const navigation = useNavigation<DrugsCreateCalendarTabNavigation>();
  const {width: windowWidth} = useWindowDimensions();

  const firstDay = useMemo(() => startOfDay(new Date(startDateIso)), [startDateIso]);
  const lastDay = useMemo(
    () => new Date(firstDay.getTime() + Math.max(0, durationDays - 1) * DAY_MS),
    [firstDay, durationDays],
  );

  const range = useMemo(
    () => ({
      from: localDateToIsoString(firstDay),
      to: localDateToEndOfDayIsoString(lastDay),
    }),
    [firstDay, lastDay],
  );

  const [startDate, setStartDate] = useState<Date | null>(firstDay);
  const [endDate, setEndDate] = useState<Date | null>(lastDay);

  const {data, isLoading, isError} = useQuery({
    queryKey: [
      ...CALENDAR_QUERY_KEY,
      'prescription',
      prescriptionId,
      range.from,
      range.to,
    ],
    queryFn: async () => {
      const response = await apiCalendar.getCalendar({...range, search: searchName});
      return response.data;
    },
    staleTime: Infinity,
  });

  const hasPickedMonth =
    typeof initialMonth === 'number' && typeof initialYear === 'number';
  const anchorMonth = hasPickedMonth ? initialMonth! : firstDay.getMonth();
  const anchorYear = hasPickedMonth ? initialYear! : firstDay.getFullYear();

  const collapseFocusDate = useMemo(
    () => (hasPickedMonth ? new Date(anchorYear, anchorMonth, 1) : firstDay),
    [hasPickedMonth, anchorMonth, anchorYear, firstDay],
  );

  const initialCalendarHeights = useMemo(
    () => getLargeCalendarHeights(windowWidth),
    [windowWidth],
  );
  const collapseDistance =
    initialCalendarHeights.expanded - initialCalendarHeights.collapsed;

  const scrollY = useSharedValue<number>(
    collapseDistance > 0 ? collapseDistance : 0,
  );
  const initialCollapsePending = useSharedValue<number>(collapseDistance > 0 ? 1 : 0);
  const expandedCalendarHeight = useSharedValue<number>(
    initialCalendarHeights.expanded,
  );
  const collapsedCalendarHeight = useSharedValue<number>(
    initialCalendarHeights.collapsed,
  );
  const scrollRef = useAnimatedRef<Animated.FlatList<CalendarCardGroup>>();

  const [viewportHeight, setViewportHeight] = useState<number>(0);
  const viewportHeightRef = useRef<number>(0);
  const [naturalContentHeight, setNaturalContentHeight] = useState<number>(0);
  const appliedBottomPaddingRef = useRef<number>(SCROLL_BOTTOM_PADDING);
  const initialCollapseDoneRef = useRef<boolean>(collapseDistance <= 0);

  const handleScrollLayout = useCallback((event: LayoutChangeEvent) => {
    const height = event.nativeEvent.layout.height;
    viewportHeightRef.current = height;
    setViewportHeight(prev => (prev === height ? prev : height));
  }, []);

  const commitCollapsedScroll = useCallback(
    (distance: number) => {
      if (distance <= 0 || initialCollapseDoneRef.current) {
        return;
      }
      initialCollapseDoneRef.current = true;
      scrollY.value = distance;
      initialCollapsePending.value = 0;
      runOnUI(() => {
        'worklet';
        scrollTo(scrollRef, 0, distance, false);
      })();
    },
    [initialCollapsePending, scrollRef, scrollY],
  );

  const handleContentSizeChange = useCallback(
    (_width: number, height: number) => {
      const natural = height - appliedBottomPaddingRef.current;
      setNaturalContentHeight(prev =>
        Math.abs(prev - natural) < 1 ? prev : natural,
      );

      if (
        collapseDistance > 0 &&
        viewportHeightRef.current > 0 &&
        height >= collapseDistance + viewportHeightRef.current
      ) {
        commitCollapsedScroll(collapseDistance);
      }
    },
    [collapseDistance, commitCollapsedScroll],
  );

  const dynamicBottomPadding = useMemo(() => {
    if (viewportHeight <= 0) {
      return Math.max(SCROLL_BOTTOM_PADDING, collapseDistance);
    }
    const minRequired =
      collapseDistance + viewportHeight - naturalContentHeight;
    return Math.max(SCROLL_BOTTOM_PADDING, minRequired);
  }, [collapseDistance, viewportHeight, naturalContentHeight]);

  appliedBottomPaddingRef.current = dynamicBottomPadding;

  const collapseProgress = useDerivedValue<number>(() => {
    if (initialCollapsePending.value === 1) {
      return 1;
    }
    const distance =
      expandedCalendarHeight.value - collapsedCalendarHeight.value;
    if (distance <= 0) {
      return 1;
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

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: event => {
      const y = event.contentOffset.y;
      const distance =
        expandedCalendarHeight.value - collapsedCalendarHeight.value;

      if (initialCollapsePending.value === 1) {
        if (distance > 0 && y >= distance - SNAP_TOLERANCE) {
          initialCollapsePending.value = 0;
          scrollY.value = y;
        }
        return;
      }

      scrollY.value = y;
    },
    onEndDrag: event => {
      if (initialCollapsePending.value === 1) {
        return;
      }
      if (Math.abs(event.velocity?.y ?? 0) >= SNAP_VELOCITY_THRESHOLD) {
        return;
      }
      snapCalendar(Math.max(0, event.contentOffset.y));
    },
    onMomentumEnd: event => {
      if (initialCollapsePending.value === 1) {
        return;
      }
      snapCalendar(Math.max(0, event.contentOffset.y));
    },
  });

  const initialContentOffset = useMemo(
    () => ({x: 0, y: collapseDistance > 0 ? collapseDistance : 0}),
    [collapseDistance],
  );

  const handleMonthPress = useCallback(
    (month: number, year: number) => {
      navigation.navigate('DrugsCreateMonthChooseScreen', {
        prescriptionId,
        initialMonth: month,
        initialYear: year,
        search: searchName,
      });
    },
    [navigation, prescriptionId, searchName],
  );

  const handleYearPress = useCallback(
    (month: number, year: number) => {
      navigation.navigate('DrugsCreateYearChooseScreen', {
        prescriptionId,
        initialMonth: month,
        initialYear: year,
        search: searchName,
      });
    },
    [navigation, prescriptionId, searchName],
  );

  const datesWithEvents = useMemo(
    () => getCalendarDatesWithEvents(data?.days),
    [data?.days],
  );

  const visibleGroups = useMemo(() => {
    const groups = mapCalendarToCardGroups(data?.days);
    const selected = [startDate, endDate].filter(
      (date): date is Date => date !== null,
    );

    if (selected.length === 0) {
      return groups;
    }

    const times = selected.map(date => startOfDay(date).getTime());
    const min = Math.min(...times);
    const max = Math.max(...times);

    return groups.filter(group => {
      const time = startOfDay(group.date).getTime();
      return time >= min && time <= max;
    });
  }, [data?.days, startDate, endDate]);

  const listData = !isLoading && !isError ? visibleGroups : EMPTY_GROUPS;
  const isEmptyState = !isLoading && !isError && listData.length === 0;

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

  const autoOpenHandledRef = useRef(false);

  useEffect(() => {
    if (autoOpenHandledRef.current || !openIntakeId || isLoading || !data) {
      return;
    }

    const targetItem = mapCalendarToCardGroups(data.days)
      .flatMap(group => group.items)
      .find(item => item.id === openIntakeId);

    autoOpenHandledRef.current = true;
    onOpenIntakeHandled?.();

    if (targetItem) {
      setStatusModalItem({
        intakeId: targetItem.id,
        prescriptionId: targetItem.prescriptionId,
        status: targetItem.status,
        scheduledTime: targetItem.scheduledTime,
      });
      statusModalRef.current?.present();
    }
  }, [openIntakeId, isLoading, data, onOpenIntakeHandled]);

  useEffect(() => {
    expandedCalendarHeight.value = initialCalendarHeights.expanded;
    collapsedCalendarHeight.value = initialCalendarHeights.collapsed;
  }, [
    collapsedCalendarHeight,
    expandedCalendarHeight,
    initialCalendarHeights.collapsed,
    initialCalendarHeights.expanded,
  ]);

  useEffect(() => {
    if (
      collapseDistance <= 0 ||
      viewportHeight <= 0 ||
      initialCollapseDoneRef.current
    ) {
      return;
    }

    const totalContentHeight = naturalContentHeight + dynamicBottomPadding;
    if (totalContentHeight >= collapseDistance + viewportHeight) {
      commitCollapsedScroll(collapseDistance);
    }
  }, [
    collapseDistance,
    commitCollapsedScroll,
    dynamicBottomPadding,
    naturalContentHeight,
    viewportHeight,
  ]);

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

  const listHeaderElement = useMemo(
    () => (
      <IntakesListHeader
        expandedCalendarHeight={expandedCalendarHeight}
        startDate={startDate}
        endDate={endDate}
        isEmptyState={isEmptyState}
        isLoading={isLoading}
        isError={isError}
        emptyTitle={t('emptyState.title')}
        emptySubtitle={t('emptyState.subtitle')}
        loadError={t('loadError')}
      />
    ),
    [
      endDate,
      expandedCalendarHeight,
      isEmptyState,
      isError,
      isLoading,
      startDate,
      t,
    ],
  );

  const renderListHeader = useCallback(() => listHeaderElement, [listHeaderElement]);

  return (
    <View style={styles.container}>
      <Animated.FlatList
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={{
          flexGrow: 1,
          paddingBottom: dynamicBottomPadding,
        }}
        data={listData}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        ListHeaderComponent={renderListHeader}
        extraData={`${isEmptyState}-${isLoading}-${isError}-${listData.length}`}
        contentOffset={initialContentOffset}
        onLayout={handleScrollLayout}
        onContentSizeChange={handleContentSizeChange}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        bounces
        alwaysBounceVertical
        overScrollMode="never"
      />

      <View pointerEvents="box-none" style={styles.calendarOverlay}>
        <View pointerEvents="none" style={styles.calendarTopMask} />
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
          datesWithEvents={datesWithEvents}
          initialMonth={anchorMonth}
          initialYear={anchorYear}
          collapseFocusDate={collapseFocusDate}
          defaultCollapsed
          style={styles.calendar}
        />
      </View>

      <StatusChangeModal ref={statusModalRef} item={statusModalItem} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: SCROLL_BACKGROUND_COLOR,
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
  calendarTopMask: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: CALENDAR_TOP_MARGIN + CALENDAR_BORDER_RADIUS,
    backgroundColor: SCROLL_BACKGROUND_COLOR,
  },
  calendar: {
    marginTop: CALENDAR_TOP_MARGIN,
    borderTopLeftRadius: CALENDAR_BORDER_RADIUS,
    borderTopRightRadius: CALENDAR_BORDER_RADIUS,
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
});
