import {useCallback, useMemo, useRef, useState, type RefObject} from 'react';
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import {ScrollView} from 'react-native-gesture-handler';
import type {SharedValue} from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import {useTranslation} from 'react-i18next';

import i18n from '../../../../features/localisation/i18n.ts';
import {IconMapper} from '../../../../shared/ui/IconMapper.tsx';
import {EventsCalendarDayCard} from './EventsCalendarDayCard.tsx';
import {EventsCalendarDayRow} from './EventsCalendarDayRow.tsx';
import type {HomeEventRowItem} from './homeEventTypes.ts';

type EventsCalendarProps = {
  mappedEvents: HomeEventRowItem[];
  onCalendarPress: () => void;
  cardRef?: RefObject<View | null>;
  onCardLayout?: () => void;
  pullTouchSuppressed?: SharedValue<boolean>;
  calendarScrollAtTop?: SharedValue<boolean>;
};

type DayItem = {
  key: string;
  weekday: string;
  day: string;
  month: string;
  firstRowIndex: number;
};

type RowItem =
  | {key: string; type: 'event'; dayIndex: number; event: HomeEventRowItem}
  | {key: string; type: 'spacer'; dayIndex: number};

const CARD_HEIGHT = 130;

const DAY_CARD_HEIGHT = 92;
const DAY_GAP = 10;
const DAY_SNAP = DAY_CARD_HEIGHT + DAY_GAP;
const DAY_PADDING = (CARD_HEIGHT - DAY_CARD_HEIGHT) / 2;

const ROW_HEIGHT = 23;
const ROW_GAP = 12;
const ROW_SNAP = ROW_HEIGHT + ROW_GAP;
const ROWS_PER_PAGE = 3;
const PAGE_SNAP = ROW_SNAP * ROWS_PER_PAGE;
const VISIBLE_ROWS_HEIGHT = ROW_HEIGHT * ROWS_PER_PAGE + ROW_GAP * (ROWS_PER_PAGE - 1);
const ROWS_PADDING = (CARD_HEIGHT - VISIBLE_ROWS_HEIGHT) / 2;
const CALENDAR_SCROLL_TOP_TOLERANCE = 3;

const getLocale = (language: string): string => (language === 'en' ? 'en-US' : 'ru-RU');

const getDateParts = (isoDate: string, language: string, invalidPlaceholder: string) => {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) {
    return {
      weekday: invalidPlaceholder,
      day: invalidPlaceholder,
      month: invalidPlaceholder,
      dateKey: 'invalid',
    };
  }

  const locale = getLocale(language);
  const weekdayRaw = new Intl.DateTimeFormat(locale, {weekday: 'short'}).format(date);
  const monthRaw = new Intl.DateTimeFormat(locale, {month: 'short'}).format(date);

  return {
    weekday: `${weekdayRaw.charAt(0).toUpperCase()}${weekdayRaw.slice(1)}`.replace('.', ''),
    day: String(date.getDate()),
    month: monthRaw.replace('.', ''),
    dateKey: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
      date.getDate(),
    ).padStart(2, '0')}`,
  };
};

const buildListData = (
  mappedEvents: HomeEventRowItem[],
  language: string,
  invalidPlaceholder: string,
) => {
  const byDate = new Map<string, HomeEventRowItem[]>();

  mappedEvents
    .slice()
    .sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime())
    .forEach(event => {
      const {dateKey} = getDateParts(event.time, language, invalidPlaceholder);
      const bucket = byDate.get(dateKey);
      if (bucket) {
        bucket.push(event);
      } else {
        byDate.set(dateKey, [event]);
      }
    });

  const sortedDays = Array.from(byDate.entries()).sort(
    ([left], [right]) => new Date(left).getTime() - new Date(right).getTime(),
  );

  const days: DayItem[] = [];
  const rows: RowItem[] = [];

  sortedDays.forEach(([dateKey, dayEvents], dayIndex) => {
    const parts = getDateParts(
      dayEvents[0]?.time ?? `${dateKey}T00:00:00.000Z`,
      language,
      invalidPlaceholder,
    );
    days.push({
      key: dateKey,
      weekday: parts.weekday,
      day: parts.day,
      month: parts.month,
      firstRowIndex: rows.length,
    });

    dayEvents.forEach(event => {
      rows.push({key: `evt-${event.key}`, type: 'event', dayIndex, event});
    });

    const remainder = dayEvents.length % ROWS_PER_PAGE;
    if (remainder > 0) {
      for (let index = 0; index < ROWS_PER_PAGE - remainder; index++) {
        rows.push({key: `spc-${dateKey}-${index}`, type: 'spacer', dayIndex});
      }
    }
  });

  return {days, rows};
};

const findDayForRow = (days: DayItem[], rowIndex: number): number => {
  for (let index = days.length - 1; index >= 0; index--) {
    if (rowIndex >= days[index].firstRowIndex) {
      return index;
    }
  }
  return 0;
};

export const EventsCalendar = ({
  mappedEvents,
  onCalendarPress,
  cardRef,
  onCardLayout,
  pullTouchSuppressed,
  calendarScrollAtTop,
}: EventsCalendarProps) => {
  const {t} = useTranslation('home', {i18n});
  const {days, rows} = useMemo(
    () =>
      buildListData(mappedEvents, i18n.language, t('eventsCalendar.invalidDatePlaceholder')),
    [mappedEvents, i18n.language, t],
  );
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const localCardRef = useRef<View>(null);
  const calendarCardRef = cardRef ?? localCardRef;
  const dayListRef = useRef<ScrollView>(null);
  const rowsListRef = useRef<ScrollView>(null);
  const isSyncing = useRef(false);
  const isNestedDraggingRef = useRef(false);
  const daysScrollOffsetRef = useRef(0);
  const rowsScrollOffsetRef = useRef(0);

  const updateCalendarScrollAtTop = useCallback(() => {
    if (!calendarScrollAtTop) {
      return;
    }

    calendarScrollAtTop.value =
      daysScrollOffsetRef.current <= CALENDAR_SCROLL_TOP_TOLERANCE &&
      rowsScrollOffsetRef.current <= CALENDAR_SCROLL_TOP_TOLERANCE;
  }, [calendarScrollAtTop]);

  const handleDaysScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      daysScrollOffsetRef.current = event.nativeEvent.contentOffset.y;
      updateCalendarScrollAtTop();
    },
    [updateCalendarScrollAtTop],
  );

  const handleRowsScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      rowsScrollOffsetRef.current = event.nativeEvent.contentOffset.y;
      updateCalendarScrollAtTop();
    },
    [updateCalendarScrollAtTop],
  );

  const suppressPullTouch = useCallback(() => {
    if (
      pullTouchSuppressed &&
      calendarScrollAtTop &&
      calendarScrollAtTop.value === false
    ) {
      pullTouchSuppressed.value = true;
    }
  }, [calendarScrollAtTop, pullTouchSuppressed]);

  const releasePullTouch = useCallback(() => {
    if (!isNestedDraggingRef.current && pullTouchSuppressed) {
      pullTouchSuppressed.value = false;
    }
  }, [pullTouchSuppressed]);

  const handleNestedScrollBeginDrag = useCallback(() => {
    isNestedDraggingRef.current = true;
    suppressPullTouch();
  }, [suppressPullTouch]);

  const handleNestedScrollEndDrag = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      isNestedDraggingRef.current = false;
      const velocityY = event.nativeEvent.velocity?.y ?? 0;
      if (Math.abs(velocityY) < 0.05 && pullTouchSuppressed) {
        pullTouchSuppressed.value = false;
      }
    },
    [pullTouchSuppressed],
  );

  const handleNestedMomentumEnd = useCallback(() => {
    isNestedDraggingRef.current = false;
    if (pullTouchSuppressed) {
      pullTouchSuppressed.value = false;
    }
  }, [pullTouchSuppressed]);

  const daysSnapOffsets = useMemo(
    () => days.map((_, index) => index * DAY_SNAP),
    [days],
  );

  const rowsSnapOffsets = useMemo(() => {
    const pageCount = Math.max(1, Math.ceil(rows.length / ROWS_PER_PAGE));
    return Array.from({length: pageCount}, (_, index) => index * PAGE_SNAP);
  }, [rows.length]);

  const scrollToDay = useCallback(
    (dayIndex: number, animated = true) => {
      const index = Math.max(0, Math.min(dayIndex, days.length - 1));
      const day = days[index];
      if (!day) {
        return;
      }

      setSelectedDayIndex(index);
      dayListRef.current?.scrollTo({y: index * DAY_SNAP, animated});
      rowsListRef.current?.scrollTo({y: day.firstRowIndex * ROW_SNAP, animated});
    },
    [days],
  );

  const handleDaysMomentumEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (!days.length || isSyncing.current) {
        return;
      }

      isSyncing.current = true;
      const index = Math.round(event.nativeEvent.contentOffset.y / DAY_SNAP);
      scrollToDay(index, true);
      setTimeout(() => {
        isSyncing.current = false;
      }, 500);
    },
    [days.length, scrollToDay],
  );

  const handleRowsMomentumEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (!rows.length || !days.length || isSyncing.current) {
        return;
      }

      isSyncing.current = true;

      const offset = event.nativeEvent.contentOffset.y;
      const pageIndex = Math.max(0, Math.round(offset / PAGE_SNAP));

      const topRow = Math.min(pageIndex * ROWS_PER_PAGE, rows.length - 1);
      const dayIndex = findDayForRow(days, topRow);
      if (dayIndex !== selectedDayIndex) {
        setSelectedDayIndex(dayIndex);
        dayListRef.current?.scrollTo({y: dayIndex * DAY_SNAP, animated: true});
      }

      setTimeout(() => {
        isSyncing.current = false;
      }, 500);
    },
    [days, rows.length, selectedDayIndex],
  );

  if (!days.length) {
    return null;
  }

  return (
    <View>
      <View
        ref={calendarCardRef}
        onLayout={onCardLayout}
        onTouchStart={suppressPullTouch}
        onTouchEnd={releasePullTouch}
        onTouchCancel={releasePullTouch}
        style={styles.cardShadow}>
        <View style={styles.card}>
          <View style={styles.daysColumn}>
            <ScrollView
              ref={dayListRef}
              nestedScrollEnabled
              showsVerticalScrollIndicator={false}
              snapToOffsets={daysSnapOffsets}
              snapToAlignment="start"
              disableIntervalMomentum
              decelerationRate="fast"
              bounces={false}
              scrollEventThrottle={16}
              onScroll={handleDaysScroll}
              onScrollBeginDrag={handleNestedScrollBeginDrag}
              onScrollEndDrag={handleNestedScrollEndDrag}
              onMomentumScrollEnd={event => {
                handleDaysMomentumEnd(event);
                handleNestedMomentumEnd();
              }}
              contentContainerStyle={styles.daysContent}>
              {days.map((item, index) => (
                <View key={item.key}>
                  {index > 0 ? <View style={styles.daySeparator} /> : null}
                  <EventsCalendarDayCard data={item} />
                </View>
              ))}
            </ScrollView>
            <LinearGradient
              colors={['rgba(255,255,255,1)', 'rgba(255,255,255,0)']}
              style={styles.fadeTop}
              pointerEvents="none"
            />
            <LinearGradient
              colors={['rgba(255,255,255,0)', 'rgba(255,255,255,1)']}
              style={styles.fadeBottom}
              pointerEvents="none"
            />
          </View>

          <View style={styles.rowsColumn}>
            <TouchableOpacity activeOpacity={0.7} style={styles.calendarButton} onPress={onCalendarPress} hitSlop={8}>
              <IconMapper
                icon="calendar-1"
                size={24}
                color="rgba(199, 198, 217, 1)"
                weight={1.5}
              />
            </TouchableOpacity>

            <ScrollView
              ref={rowsListRef}
              nestedScrollEnabled
              showsVerticalScrollIndicator={false}
              snapToOffsets={rowsSnapOffsets}
              snapToAlignment="start"
              disableIntervalMomentum
              decelerationRate="fast"
              bounces={false}
              scrollEventThrottle={16}
              onScroll={handleRowsScroll}
              onScrollBeginDrag={handleNestedScrollBeginDrag}
              onScrollEndDrag={handleNestedScrollEndDrag}
              onMomentumScrollEnd={event => {
                handleRowsMomentumEnd(event);
                handleNestedMomentumEnd();
              }}
              contentContainerStyle={styles.rowsContent}>
              {rows.map(item => (
                <View key={item.key} style={styles.rowWrapper}>
                  {item.type === 'event' ? (
                    <EventsCalendarDayRow data={item.event} />
                  ) : (
                    <EventsCalendarDayRow placeholder />
                  )}
                </View>
              ))}
            </ScrollView>
            <LinearGradient
              colors={['rgba(255,255,255,1)', 'rgba(255,255,255,0)']}
              style={styles.fadeTop}
              pointerEvents="none"
            />
            <LinearGradient
              colors={['rgba(255,255,255,0)', 'rgba(255,255,255,1)']}
              style={styles.fadeBottom}
              pointerEvents="none"
            />
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  cardShadow: {
    borderRadius: 28,
    shadowColor: '#371B99',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: {width: 2, height: 2},
    elevation: 4,
    backgroundColor: '#FFFFFF',
  },
  card: {
    height: CARD_HEIGHT,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  daysColumn: {
    height: CARD_HEIGHT,
  },
  daysContent: {
    paddingVertical: DAY_PADDING,
  },
  daySeparator: {
    height: DAY_GAP,
  },
  rowsColumn: {
    flex: 1,
    marginLeft: 12,
    height: CARD_HEIGHT,
  },
  calendarButton: {
    position: 'absolute',
    right: 14,
    top: 22,
    zIndex: 2,
  },
  rowsContent: {
    paddingTop: ROWS_PADDING,
    paddingBottom: ROWS_PADDING - ROW_GAP,
    paddingRight: 38,
  },
  rowWrapper: {
    height: ROW_SNAP,
  },
  fadeTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: DAY_PADDING,
    zIndex: 1,
  },
  fadeBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: DAY_PADDING,
    zIndex: 1,
  },
});
