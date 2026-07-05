import {memo, useMemo} from 'react';
import {StyleSheet, View} from 'react-native';

import type {CalendarDayCell} from './calendarDateUtils.ts';
import {
  isDayInOpenRange,
  isDayRangeHighlighted,
  isRangeEndpoint,
  isSameDay,
  sortDayRange,
  WEEK_LENGTH,
} from './calendarDateUtils.ts';
import {formatApiDate} from '../mapCalendarData.ts';
import {LargeCalendarDay} from './LargeCalendarDay.tsx';
import type {RangeBgType, RangeBridge} from './LargeCalendarDay.tsx';

type LargeCalendarGridProps = {
  days: CalendarDayCell[];
  daySize: number;
  calendarWidth: number;
  today: Date;
  selectionStart: Date | null;
  selectionEnd: Date | null;
  datesWithEvents?: ReadonlySet<string>;
  onDayPress: (date: Date) => void;
};

const NO_BRIDGE: RangeBridge = {
  left: false,
  right: false,
  top: false,
  bottom: false,
};

const buildRangeBridge = (
  index: number,
  days: CalendarDayCell[],
  rangeBgType: RangeBgType,
  selectionStart: Date | null,
  selectionEnd: Date | null,
): RangeBridge => {
  if (rangeBgType === 'none') {
    return NO_BRIDGE;
  }

  const col = index % WEEK_LENGTH;
  const prev = index > 0 ? days[index - 1] : undefined;
  const next = index < days.length - 1 ? days[index + 1] : undefined;
  const above = index >= WEEK_LENGTH ? days[index - WEEK_LENGTH] : undefined;
  const below =
    index + WEEK_LENGTH < days.length ? days[index + WEEK_LENGTH] : undefined;

  const connects = (cell: CalendarDayCell | undefined) =>
    cell !== undefined &&
    isDayRangeHighlighted(cell.date, selectionStart, selectionEnd);

  const bridgeLeft = col > 0 && connects(prev);
  const bridgeRight = col < WEEK_LENGTH - 1 && connects(next);
  const bridgeTop = connects(above);
  const bridgeBottom = connects(below);

  if (rangeBgType === 'startCap') {
    return {
      left: false,
      right: bridgeRight,
      top: bridgeTop,
      bottom: bridgeBottom,
    };
  }

  if (rangeBgType === 'endCap') {
    return {
      left: bridgeLeft,
      right: false,
      top: bridgeTop,
      bottom: bridgeBottom,
    };
  }

  return {
    left: bridgeLeft,
    right: bridgeRight,
    top: bridgeTop,
    bottom: bridgeBottom,
  };
};

export const LargeCalendarGrid = memo(
  ({
    days,
    daySize,
    calendarWidth,
    today,
    selectionStart,
    selectionEnd,
    datesWithEvents,
    onDayPress,
  }: LargeCalendarGridProps) => {
    const dayStates = useMemo(() => {
      const hasInterval =
        selectionStart !== null &&
        selectionEnd !== null &&
        !isSameDay(selectionStart, selectionEnd);

      const sortedRange = hasInterval
        ? sortDayRange(selectionStart!, selectionEnd!)
        : null;

      return days.map((cell, index) => {
        const isEndpoint = isRangeEndpoint(
          cell.date,
          selectionStart,
          selectionEnd,
        );
        const inRange = isDayInOpenRange(
          cell.date,
          selectionStart,
          selectionEnd,
        );

        let rangeBgType: RangeBgType = 'none';

        if (inRange) {
          rangeBgType = 'full';
        } else if (isEndpoint && sortedRange !== null) {
          rangeBgType = isSameDay(cell.date, sortedRange[0])
            ? 'startCap'
            : 'endCap';
        }

        return {
          key: `${cell.date.getFullYear()}-${cell.date.getMonth()}-${cell.date.getDate()}`,
          cell,
          isToday: isSameDay(cell.date, today),
          isSelected: isEndpoint,
          hasEvent: datesWithEvents?.has(formatApiDate(cell.date)) ?? false,
          rangeBgType,
          rangeBridge: buildRangeBridge(
            index,
            days,
            rangeBgType,
            selectionStart,
            selectionEnd,
          ),
        };
      });
    }, [datesWithEvents, days, selectionEnd, selectionStart, today]);

    return (
      <View style={[styles.root, {width: calendarWidth}]}>
        {dayStates.map(
          ({key, cell, isToday, isSelected, hasEvent, rangeBgType, rangeBridge}) => (
            <LargeCalendarDay
              key={key}
              date={cell.date}
              daySize={daySize}
              isCurrentMonth={cell.isCurrentMonth}
              isToday={isToday}
              rangeBgType={rangeBgType}
              rangeBridge={rangeBridge}
              isSelected={isSelected}
              hasEvent={hasEvent}
              onPress={onDayPress}
            />
          ),
        )}
      </View>
    );
  },
);

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    overflow: 'visible',
  },
});
