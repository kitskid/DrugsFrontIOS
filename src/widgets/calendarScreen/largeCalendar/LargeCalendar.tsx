import {memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState} from 'react';
import type {LayoutChangeEvent, StyleProp, ViewStyle} from 'react-native';
import {StyleSheet, useWindowDimensions, View} from 'react-native';
import {Gesture, GestureDetector} from 'react-native-gesture-handler';
import type {SharedValue} from 'react-native-reanimated';
import Animated, {
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import {useTranslation} from 'react-i18next';

import i18n from '../../../features/localisation/i18n.ts';
import type {CalendarDayCell} from './calendarDateUtils.ts';
import {
  buildWeekAtOffset,
  CALENDAR_MAX_WIDTH,
  CALENDAR_ROWS,
  getLargeCalendarContentWidth,
  getLargeCalendarDaySize,
  getLargeCalendarHeights,
  getMonthPageAtOffset,
  isSameDay,
  monthOffsetFromDate,
  sortDayRange,
  weekOffsetFromDate,
  WEEK_LENGTH,
} from './calendarDateUtils.ts';
import {LargeCalendarGrid} from './LargeCalendarGrid.tsx';
import {LargeCalendarHeader} from './LargeCalendarHeader.tsx';
import type {LargeCalendarLoopPagerHandle, LoopPagerSlot} from './LargeCalendarLoopPager.tsx';
import {LargeCalendarLoopPager} from './LargeCalendarLoopPager.tsx';
import type {LargeCalendarMonthsPagerHandle} from './LargeCalendarMonthsPager.tsx';
import {LargeCalendarMonthsPager} from './LargeCalendarMonthsPager.tsx';
import {LargeCalendarWeekdays} from './LargeCalendarWeekdays.tsx';

const CALENDAR_MIN_YEAR = 1980;
const CALENDAR_MAX_YEAR = 2080;

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

const WEEKDAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;

const COLLAPSE_THRESHOLD = 0.5;
const COLLAPSE_SPRING_CONFIG = {damping: 20, stiffness: 220};
const COLLAPSE_TIMING_CONFIG = {duration: 220};

const snapCollapseProgress = (
  progress: SharedValue<number>,
  useTiming = false,
) => {
  'worklet';
  const target = progress.value > COLLAPSE_THRESHOLD ? 1 : 0;
  progress.value = useTiming
    ? withTiming(target, COLLAPSE_TIMING_CONFIG)
    : withSpring(target, COLLAPSE_SPRING_CONFIG);
};

type LargeCalendarProps = {
  collapseProgress?: SharedValue<number>;
  expandedHeightShared?: SharedValue<number>;
  collapsedHeightShared?: SharedValue<number>;
  startDate: Date | null;
  endDate: Date | null;
  setStartDate: (date: Date | null) => void;
  setEndDate: (date: Date | null) => void;
  onMonthPress?: (month: number, year: number) => void;
  onYearPress?: (month: number, year: number) => void;
  onVisiblePageChange?: (month: number, year: number) => void;
  datesWithEvents?: ReadonlySet<string>;
  initialMonth?: number;
  initialYear?: number;
  /**
   * When set, the collapsed view centers on this date instead of the current
   * selection. Used to navigate to an explicitly chosen month/year even while
   * a range is selected.
   */
  collapseFocusDate?: Date | null;
  /** When true, the calendar starts in collapsed week mode (e.g. embedded tabs). */
  defaultCollapsed?: boolean;
  /** Drag the bottom handle to expand/collapse when collapseProgress is set. */
  enableCollapseHandleGesture?: boolean;
  style?: StyleProp<ViewStyle>;
};

const LargeCalendarComponent = ({
  collapseProgress,
  expandedHeightShared,
  collapsedHeightShared,
  startDate,
  endDate,
  setStartDate,
  setEndDate,
  onMonthPress,
  onYearPress,
  onVisiblePageChange,
  datesWithEvents,
  initialMonth,
  initialYear,
  collapseFocusDate,
  defaultCollapsed = false,
  enableCollapseHandleGesture = false,
  style: containerStyle,
}: LargeCalendarProps) => {
  const {t, i18n: i18nInstance} = useTranslation('calendar', {i18n});
  const {width: windowWidth} = useWindowDimensions();

  const today = useMemo(() => new Date(), []);
  const anchor = useMemo<Date>(() => {
    if (typeof initialMonth === 'number' && typeof initialYear === 'number') {
      return new Date(initialYear, initialMonth, 1);
    }
    return new Date(today.getFullYear(), today.getMonth(), 1);
  }, [initialMonth, initialYear, today]);
  const initialWidth = useMemo(
    () => Math.min(Math.max(windowWidth, 1), CALENDAR_MAX_WIDTH),
    [windowWidth],
  );

  const [layoutWidth, setLayoutWidth] = useState<number>(initialWidth);
  const [monthOffset, setMonthOffset] = useState<number>(0);
  const [weekOffset, setWeekOffset] = useState<number>(0);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(defaultCollapsed);
  const older = startDate;
  const newer = endDate;

  const contentWidth = getLargeCalendarContentWidth(layoutWidth);
  const daySize = getLargeCalendarDaySize(contentWidth);
  const calendarWidth = daySize * WEEK_LENGTH;
  const expandedGridHeight = CALENDAR_ROWS * daySize;
  const collapsedGridHeight = daySize;
  const gridExpandDistance = Math.max(1, expandedGridHeight - collapsedGridHeight);
  const gridExpandDistanceSv = useSharedValue<number>(gridExpandDistance);

  const gestureStartProgress = useSharedValue<number>(defaultCollapsed ? 1 : 0);

  const monthsPagerRef = useRef<LargeCalendarMonthsPagerHandle>(null);
  const weeksPagerRef = useRef<LargeCalendarLoopPagerHandle>(null);

  // Full month range (relative to anchor) backing the virtualized months pager.
  const monthMinOffset = useMemo(
    () => monthOffsetFromDate(anchor, new Date(CALENDAR_MIN_YEAR, 0, 1)),
    [anchor],
  );
  const monthMaxOffset = useMemo(
    () => monthOffsetFromDate(anchor, new Date(CALENDAR_MAX_YEAR, 11, 1)),
    [anchor],
  );
  const isWeekScrollAnimatingRef = useRef<boolean>(false);

  const monthOffsetRef = useRef<number>(monthOffset);
  monthOffsetRef.current = monthOffset;

  const weekOffsetRef = useRef<number>(weekOffset);
  weekOffsetRef.current = weekOffset;

  const isCollapsedRef = useRef<boolean>(isCollapsed);
  isCollapsedRef.current = isCollapsed;

  const olderRef = useRef<Date | null>(older);
  olderRef.current = older;
  const newerRef = useRef<Date | null>(newer);
  newerRef.current = newer;

  const anchorRef = useRef<Date>(anchor);
  anchorRef.current = anchor;

  const focusRef = useRef<Date | null>(collapseFocusDate ?? null);
  focusRef.current = collapseFocusDate ?? null;

  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    const nextWidth = Math.round(event.nativeEvent.layout.width);
    if (nextWidth > 0) {
      setLayoutWidth((prev: number) =>
        prev === nextWidth ? prev : nextWidth,
      );
    }
  }, []);

  useEffect(() => {
    gridExpandDistanceSv.value = gridExpandDistance;
  }, [gridExpandDistance, gridExpandDistanceSv]);

  useEffect(() => {
    if (daySize <= 0 || (!expandedHeightShared && !collapsedHeightShared)) {
      return;
    }
    const {expanded, collapsed} = getLargeCalendarHeights(layoutWidth);
    if (expandedHeightShared) {
      expandedHeightShared.value = expanded;
    }
    if (collapsedHeightShared) {
      collapsedHeightShared.value = collapsed;
    }
  }, [daySize, layoutWidth, expandedHeightShared, collapsedHeightShared]);

  const currentMonthPage = useMemo(
    () => getMonthPageAtOffset(anchor, monthOffset),
    [anchor, monthOffset],
  );
  const monthLabel = t(`months.${MONTH_KEYS[currentMonthPage.month]}`);
  const yearLabel = `${currentMonthPage.year}`;

  useEffect(() => {
    onVisiblePageChange?.(currentMonthPage.month, currentMonthPage.year);
  }, [currentMonthPage.month, currentMonthPage.year, onVisiblePageChange]);

  const weekdayLabels = useMemo<string[]>(
    () => WEEKDAY_KEYS.map(key => t(`weekdays.${key}`)),
    [i18nInstance.language, t],
  );

  const fallbackProgress = useSharedValue<number>(defaultCollapsed ? 1 : 0);
  const effectiveProgress = collapseProgress ?? fallbackProgress;
  const isEmbeddedCollapsed = defaultCollapsed && collapseProgress == null;

  useAnimatedReaction(
    () => effectiveProgress.value > COLLAPSE_THRESHOLD,
    (collapsed: boolean, prev: boolean | null) => {
      if (collapsed !== prev) {
        runOnJS(setIsCollapsed)(collapsed);
      }
    },
    [],
  );

  const containerAnimatedStyle = useAnimatedStyle(() => ({
    height: interpolate(
      effectiveProgress.value,
      [0, 1],
      [expandedGridHeight, collapsedGridHeight],
      Extrapolation.CLAMP,
    ),
  }));

  const monthsAnimatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      effectiveProgress.value,
      [0, 0.6],
      [1, 0],
      Extrapolation.CLAMP,
    ),
  }));

  const weeksAnimatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      effectiveProgress.value,
      [0.4, 1],
      [0, 1],
      Extrapolation.CLAMP,
    ),
  }));

  const collapseHandleGesture = useMemo(() => {
    if (!enableCollapseHandleGesture || collapseProgress == null) {
      return null;
    }

    return Gesture.Pan()
      .activeOffsetY([-6, 6])
      .failOffsetX([-24, 24])
      .onStart(() => {
        gestureStartProgress.value = effectiveProgress.value;
      })
      .onUpdate(event => {
        const distance = gridExpandDistanceSv.value;
        if (distance <= 0) {
          return;
        }
        const next =
          gestureStartProgress.value - event.translationY / distance;
        collapseProgress.value = Math.min(1, Math.max(0, next));
      })
      .onEnd(() => {
        snapCollapseProgress(collapseProgress, true);
      });
  }, [
    collapseProgress,
    effectiveProgress,
    enableCollapseHandleGesture,
    gestureStartProgress,
    gridExpandDistanceSv,
  ]);

  const bottomHandle = (
    <View style={lcStyles.bottomHandleWrapper}>
      <View style={lcStyles.bottomHandle} />
    </View>
  );

  const computeCollapseTargetDate = useCallback((): Date => {
    if (focusRef.current !== null) {
      return focusRef.current;
    }
    const o = olderRef.current;
    const n = newerRef.current;
    if (o !== null && n !== null) {
      return sortDayRange(o, n)[0];
    }
    if (n !== null) {
      return n;
    }
    if (o !== null) {
      return o;
    }
    const cp = getMonthPageAtOffset(anchorRef.current, monthOffsetRef.current);
    return new Date(cp.year, cp.month, 1);
  }, []);

  const syncWeekOffsetToTarget = useCallback((targetDate: Date) => {
    const wOff = weekOffsetFromDate(anchorRef.current, targetDate);
    setWeekOffset((prev: number) => (prev === wOff ? prev : wOff));
    weeksPagerRef.current?.recenter();
  }, []);

  const syncMonthOffsetToTarget = useCallback((targetDate: Date) => {
    const mOff = monthOffsetFromDate(anchorRef.current, targetDate);
    setMonthOffset((prev: number) => (prev === mOff ? prev : mOff));
    monthsPagerRef.current?.scrollToOffset(mOff, false);
  }, []);

  useEffect(() => {
    if (calendarWidth <= 0 || isCollapsedRef.current) {
      return;
    }
    syncWeekOffsetToTarget(computeCollapseTargetDate());
  }, [
    monthOffset,
    older,
    newer,
    collapseFocusDate,
    calendarWidth,
    computeCollapseTargetDate,
    syncWeekOffsetToTarget,
  ]);

  useEffect(() => {
    if (calendarWidth <= 0 || !isCollapsed) {
      return;
    }
    syncMonthOffsetToTarget(computeCollapseTargetDate());
  }, [
    isCollapsed,
    older,
    newer,
    collapseFocusDate,
    calendarWidth,
    computeCollapseTargetDate,
    syncMonthOffsetToTarget,
  ]);

  useLayoutEffect(() => {
    if (!defaultCollapsed || calendarWidth <= 0) {
      return;
    }
    const targetDate = computeCollapseTargetDate();
    syncWeekOffsetToTarget(targetDate);
    syncMonthOffsetToTarget(targetDate);
  }, [
    calendarWidth,
    collapseFocusDate,
    computeCollapseTargetDate,
    defaultCollapsed,
    syncMonthOffsetToTarget,
    syncWeekOffsetToTarget,
  ]);

  // Called synchronously when the week pager settles on an adjacent week. The
  // weekOffset state has not been committed yet, so derive the new offset from
  // the swipe direction and pick the month from the week's Thursday (ISO rule):
  // the days of that month render black and the rest grey.
  const handleWeekPagerSettled = useCallback((direction: -1 | 1) => {
    const nextWeekOffset = weekOffsetRef.current + direction;
    const week = buildWeekAtOffset(anchorRef.current, nextWeekOffset);
    const midWeek = week[3];
    if (midWeek) {
      const mOff = monthOffsetFromDate(anchorRef.current, midWeek);
      setMonthOffset((prev: number) => (prev === mOff ? prev : mOff));
    }
  }, []);

  const goToPrev = useCallback(() => {
    if (isCollapsedRef.current) {
      if (isWeekScrollAnimatingRef.current) {
        return;
      }
      weeksPagerRef.current?.scrollToAdjacent(-1);
    } else {
      monthsPagerRef.current?.scrollToAdjacent(-1);
    }
  }, []);

  const goToNext = useCallback(() => {
    if (isCollapsedRef.current) {
      if (isWeekScrollAnimatingRef.current) {
        return;
      }
      weeksPagerRef.current?.scrollToAdjacent(1);
    } else {
      monthsPagerRef.current?.scrollToAdjacent(1);
    }
  }, []);

  const dayPressRef = useRef<(date: Date) => void>(() => {});
  dayPressRef.current = (date: Date) => {
    const isRange =
      older !== null && newer !== null && !isSameDay(older, newer);

    if (isRange) {
      // Active interval: any tap collapses to that single day.
      setStartDate(null);
      setEndDate(date);
      return;
    }

    const singleDay = newer ?? older;
    if (singleDay !== null && isSameDay(date, singleDay)) {
      return;
    }

    setStartDate(singleDay);
    setEndDate(date);
  };

  const stableDayPress = useCallback((date: Date) => {
    dayPressRef.current(date);
  }, []);

  const headerMonth = currentMonthPage.month;
  const headerYear = currentMonthPage.year;

  const handleHeaderMonthPress = useCallback(() => {
    onMonthPress?.(headerMonth, headerYear);
  }, [headerMonth, headerYear, onMonthPress]);

  const handleHeaderYearPress = useCallback(() => {
    onYearPress?.(headerMonth, headerYear);
  }, [headerMonth, headerYear, onYearPress]);

  // The months pager remounts on anchor change (keyed below) and re-centers on
  // the anchor month; we only need to reset the offsets and the week pager.
  const didMountRef = useRef<boolean>(false);
  useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true;
      return;
    }
    setMonthOffset(0);
    setWeekOffset(0);
    weeksPagerRef.current?.recenter();
  }, [anchor]);

  const buildWeekCells = useCallback(
    (weekDates: Date[]): CalendarDayCell[] =>
      weekDates.map(d => ({
        date: d,
        isCurrentMonth:
          d.getMonth() === headerMonth && d.getFullYear() === headerYear,
      })),
    [headerMonth, headerYear],
  );

  const renderMonth = useCallback(
    (offset: number) => {
      const page = getMonthPageAtOffset(anchor, offset);
      return (
        <LargeCalendarGrid
          days={page.days}
          daySize={daySize}
          calendarWidth={calendarWidth}
          today={today}
          selectionStart={older}
          selectionEnd={newer}
          datesWithEvents={datesWithEvents}
          onDayPress={stableDayPress}
        />
      );
    },
    [
      anchor,
      calendarWidth,
      datesWithEvents,
      daySize,
      newer,
      older,
      stableDayPress,
      today,
    ],
  );

  const renderWeekPage = useCallback(
    (slot: LoopPagerSlot, center: number) => {
      const week = buildWeekAtOffset(anchor, center + slot);
      return (
        <LargeCalendarGrid
          days={buildWeekCells(week)}
          daySize={daySize}
          calendarWidth={calendarWidth}
          today={today}
          selectionStart={older}
          selectionEnd={newer}
          datesWithEvents={datesWithEvents}
          onDayPress={stableDayPress}
        />
      );
    },
    [
      anchor,
      buildWeekCells,
      calendarWidth,
      datesWithEvents,
      daySize,
      newer,
      older,
      stableDayPress,
      today,
    ],
  );

  return (
    <View style={[lcStyles.root, containerStyle]} onLayout={handleLayout}>
      <View>
        <LargeCalendarHeader
          monthLabel={monthLabel}
          yearLabel={yearLabel}
          onPrevMonth={goToPrev}
          onNextMonth={goToNext}
          onMonthPress={handleHeaderMonthPress}
          onYearPress={handleHeaderYearPress}
        />
      </View>
      <View style={[lcStyles.centered, {width: calendarWidth}]}>
        <LargeCalendarWeekdays labels={weekdayLabels} daySize={daySize} />
      </View>
      {isEmbeddedCollapsed ? (
        <View
          style={[
            lcStyles.gridContainer,
            {width: calendarWidth, height: collapsedGridHeight, overflow: 'hidden'},
          ]}>
          <LargeCalendarLoopPager
            ref={weeksPagerRef}
            pageWidth={calendarWidth}
            pageHeight={collapsedGridHeight}
            centerOffset={weekOffset}
            onCenterOffsetChange={setWeekOffset}
            onCenterSlotSettled={handleWeekPagerSettled}
            renderPage={renderWeekPage}
            isScrollAnimatingRef={isWeekScrollAnimatingRef}
          />
        </View>
      ) : (
        <Animated.View
          style={[
            lcStyles.gridContainer,
            {width: calendarWidth},
            defaultCollapsed ? {height: collapsedGridHeight} : null,
            containerAnimatedStyle,
          ]}>
          <Animated.View
            pointerEvents={isCollapsed ? 'none' : 'auto'}
            shouldRasterizeIOS
            renderToHardwareTextureAndroid
            style={[
              lcStyles.absoluteFill,
              {height: expandedGridHeight},
              monthsAnimatedStyle,
            ]}>
            <LargeCalendarMonthsPager
              key={`${anchor.getFullYear()}-${anchor.getMonth()}`}
              ref={monthsPagerRef}
              pageWidth={calendarWidth}
              pageHeight={expandedGridHeight}
              minOffset={monthMinOffset}
              maxOffset={monthMaxOffset}
              initialOffset={0}
              onOffsetSettled={setMonthOffset}
              renderMonth={renderMonth}
            />
          </Animated.View>

          <Animated.View
            pointerEvents={isCollapsed ? 'auto' : 'none'}
            shouldRasterizeIOS
            renderToHardwareTextureAndroid
            style={[
              lcStyles.absoluteFill,
              {height: collapsedGridHeight},
              weeksAnimatedStyle,
            ]}>
            <LargeCalendarLoopPager
              ref={weeksPagerRef}
              pageWidth={calendarWidth}
              pageHeight={collapsedGridHeight}
              centerOffset={weekOffset}
              onCenterOffsetChange={setWeekOffset}
              onCenterSlotSettled={handleWeekPagerSettled}
              renderPage={renderWeekPage}
              isScrollAnimatingRef={isWeekScrollAnimatingRef}
            />
          </Animated.View>
        </Animated.View>
      )}
      {collapseHandleGesture ? (
        <GestureDetector gesture={collapseHandleGesture}>
          {bottomHandle}
        </GestureDetector>
      ) : (
        bottomHandle
      )}
      <View pointerEvents="none" style={lcStyles.bottomBorder} />
    </View>
  );
};

export const LargeCalendar = memo(LargeCalendarComponent);

const lcStyles = StyleSheet.create({
  root: {
    width: '100%',
    maxWidth: CALENDAR_MAX_WIDTH,
    alignSelf: 'center',
    paddingHorizontal: 12,
    paddingTop: 12,
    backgroundColor: 'rgba(255, 255, 255, 1)',
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    overflow: 'hidden',
  },
  centered: {
    alignSelf: 'center',
  },
  gridContainer: {
    alignSelf: 'center',
    overflow: 'visible',
  },
  absoluteFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  bottomHandleWrapper: {
    marginTop: 12,
    marginBottom: 8,
    alignItems: 'center',
    paddingVertical: 8,
  },
  bottomHandle: {
    width: 32,
    height: 4,
    borderRadius: 10,
    backgroundColor: 'rgba(232, 231, 242, 1)',
  },
  bottomBorder: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 28,
    borderBottomWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    borderColor: 'rgba(241, 240, 249, 1)',
  },
});
