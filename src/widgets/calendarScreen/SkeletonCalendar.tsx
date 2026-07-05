import {StyleSheet, useWindowDimensions, View} from 'react-native';

import {Skeleton} from '../../shared/ui/Skeleton.tsx';
import {
  CALENDAR_MAX_WIDTH,
  CALENDAR_ROWS,
  getLargeCalendarContentWidth,
  getLargeCalendarDaySize,
  WEEK_LENGTH,
} from './largeCalendar/calendarDateUtils.ts';

const ROOT_HORIZONTAL_PADDING = 12;
const HEADER_HEIGHT = 48;
const WEEKDAYS_HEIGHT = 40;
const ARROW_SIZE = 28;
const WEEKDAY_WIDTH = 20;
const WEEKDAY_HEIGHT = 14;
const DAY_DOT_RATIO = 0.5;

const WEEK_DAY_SLOTS = Array.from({length: WEEK_LENGTH}, (_, index) => index);
const GRID_ROWS = Array.from({length: CALENDAR_ROWS}, (_, index) => index);

/**
 * Loading placeholder that mirrors LargeCalendar's expanded layout: header,
 * weekday row and a 6x7 grid of day dots, sized from the current window width.
 */
export const SkeletonCalendar = () => {
  const {width: windowWidth} = useWindowDimensions();

  const contentWidth = getLargeCalendarContentWidth(windowWidth);
  const daySize = getLargeCalendarDaySize(contentWidth);
  const calendarWidth = daySize * WEEK_LENGTH;
  const dayDotSize = Math.max(8, Math.round(daySize * DAY_DOT_RATIO));

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Skeleton width={100} height={ARROW_SIZE} borderRadius={14} />
        <Skeleton width={ARROW_SIZE} height={ARROW_SIZE} borderRadius={14} />
      </View>

      <View style={[styles.weekdays, {width: calendarWidth}]}>
        {WEEK_DAY_SLOTS.map(slot => (
          <View key={slot} style={[styles.cell, {width: daySize}]}>
            <Skeleton
              width={WEEKDAY_WIDTH}
              height={WEEKDAY_HEIGHT}
              borderRadius={6}
            />
          </View>
        ))}
      </View>

      <View style={[styles.grid, {width: calendarWidth}]}>
        {GRID_ROWS.map(row => (
          <View key={row} style={styles.gridRow}>
            {WEEK_DAY_SLOTS.map(slot => (
              <View
                key={slot}
                style={[styles.cell, {width: daySize, height: daySize}]}>
                <Skeleton
                  width={dayDotSize}
                  height={dayDotSize}
                  borderRadius={dayDotSize / 2}
                />
              </View>
            ))}
          </View>
        ))}
      </View>

      <View style={styles.bottomHandleWrapper}>
        <View style={styles.bottomHandle} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    width: '100%',
    maxWidth: CALENDAR_MAX_WIDTH,
    alignSelf: 'center',
    paddingHorizontal: ROOT_HORIZONTAL_PADDING,
    paddingTop: 12,
    backgroundColor: 'rgba(255, 255, 255, 1)',
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    overflow: 'hidden',
  },
  header: {
    height: HEADER_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
  },
  weekdays: {
    height: WEEKDAYS_HEIGHT,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
  },
  grid: {
    alignSelf: 'center',
  },
  gridRow: {
    flexDirection: 'row',
  },
  cell: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomHandleWrapper: {
    marginTop: 12,
    marginBottom: 8,
    alignItems: 'center',
  },
  bottomHandle: {
    width: 32,
    height: 4,
    borderRadius: 10,
    backgroundColor: 'rgba(232, 231, 242, 1)',
  },
});
