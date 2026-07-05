import {memo, useMemo} from 'react';
import {PixelRatio, Pressable, StyleSheet, Text, View} from 'react-native';
import type {ViewStyle} from 'react-native';

import {isSameDay} from './calendarDateUtils.ts';

export type RangeBgType = 'none' | 'full' | 'startCap' | 'endCap';

export type RangeBridge = {
  left: boolean;
  right: boolean;
  top: boolean;
  bottom: boolean;
};

const EVENT_DOT_SIZE = 4;
const EVENT_DOT_GAP = 7;
const DAY_TEXT_LINE_HEIGHT = 16;
const RANGE_BRIDGE = Math.max(1, PixelRatio.roundToNearestPixel(1));

type LargeCalendarDayProps = {
  date: Date;
  daySize: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  rangeBgType: RangeBgType;
  rangeBridge: RangeBridge;
  isSelected: boolean;
  hasEvent: boolean;
  onPress: (date: Date) => void;
};

const COLORS = {
  inMonth: 'rgba(29, 26, 73, 1)',
  outOfMonth: 'rgba(162, 160, 191, 1)',
  today: 'rgba(35, 142, 235, 1)',
  rangeBg: 'rgba(241, 240, 249, 1)',
  rangeText: 'rgba(162, 160, 191, 1)',
  selectedBg: 'rgba(35, 142, 235, 1)',
  selectedText: 'rgba(255, 255, 255, 1)',
  eventDot: 'rgba(162, 160, 191, 1)',
  selectedEventDot: 'rgba(255, 255, 255, 1)',
} as const;

const rangeBgBase: ViewStyle = {
  position: 'absolute',
  backgroundColor: COLORS.rangeBg,
};

const buildRangeBgStyle = (
  type: Exclude<RangeBgType, 'none'>,
  bridge: RangeBridge,
): ViewStyle => {
  const top = bridge.top ? -RANGE_BRIDGE : 0;
  const bottom = bridge.bottom ? -RANGE_BRIDGE : 0;

  if (type === 'full') {
    return {
      ...rangeBgBase,
      top,
      bottom,
      left: bridge.left ? -RANGE_BRIDGE : 0,
      right: bridge.right ? -RANGE_BRIDGE : 0,
    };
  }

  if (type === 'startCap') {
    return {
      ...rangeBgBase,
      top,
      bottom,
      left: '50%',
      right: bridge.right ? -RANGE_BRIDGE : 0,
    };
  }

  return {
    ...rangeBgBase,
    top,
    bottom,
    left: bridge.left ? -RANGE_BRIDGE : 0,
    right: '50%',
  };
};

export const LargeCalendarDay = memo(
  ({
    date,
    daySize,
    isCurrentMonth,
    isToday,
    rangeBgType,
    rangeBridge,
    isSelected,
    hasEvent,
    onPress,
  }: LargeCalendarDayProps) => {
    const label = date.getDate();

    const rangeBgStyle = useMemo(
      () =>
        rangeBgType === 'none'
          ? null
          : buildRangeBgStyle(rangeBgType, rangeBridge),
      [rangeBgType, rangeBridge],
    );

    const textColor = useMemo(() => {
      if (isSelected) {
        return COLORS.selectedText;
      }
      if (rangeBgType !== 'none') {
        return COLORS.rangeText;
      }
      if (isToday) {
        return COLORS.today;
      }
      return isCurrentMonth ? COLORS.inMonth : COLORS.outOfMonth;
    }, [isCurrentMonth, rangeBgType, isSelected, isToday]);

    return (
      <Pressable
        onPress={() => onPress(date)}
        style={{width: daySize, height: daySize, flexShrink: 0, overflow: 'visible'}}>
        {({pressed}: {pressed: boolean}) => (
          <>
            {rangeBgStyle !== null && <View style={rangeBgStyle} />}
            {isSelected && <View style={styles.selectedBg} />}
            <View style={styles.content}>
              <Text
                style={[
                  styles.dayText,
                  {color: textColor, opacity: pressed ? 0.5 : 1},
                ]}>
                {label}
              </Text>
              {hasEvent ? (
                <View
                  style={[
                    styles.eventDot,
                    {
                      backgroundColor: isSelected
                        ? COLORS.selectedEventDot
                        : COLORS.eventDot,
                    },
                  ]}
                />
              ) : null}
            </View>
          </>
        )}
      </Pressable>
    );
  },
  (prev, next) =>
    prev.daySize === next.daySize &&
    prev.isCurrentMonth === next.isCurrentMonth &&
    prev.isToday === next.isToday &&
    prev.rangeBgType === next.rangeBgType &&
    prev.isSelected === next.isSelected &&
    prev.hasEvent === next.hasEvent &&
    prev.rangeBridge.left === next.rangeBridge.left &&
    prev.rangeBridge.right === next.rangeBridge.right &&
    prev.rangeBridge.top === next.rangeBridge.top &&
    prev.rangeBridge.bottom === next.rangeBridge.bottom &&
    isSameDay(prev.date, next.date),
);

const styles = StyleSheet.create({
  selectedBg: {
    ...StyleSheet.absoluteFill,
    borderRadius: 16,
    backgroundColor: COLORS.selectedBg,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eventDot: {
    position: 'absolute',
    width: EVENT_DOT_SIZE,
    height: EVENT_DOT_SIZE,
    borderRadius: EVENT_DOT_SIZE / 2,
    left: '50%',
    marginLeft: -EVENT_DOT_SIZE / 2,
    top: '50%',
    marginTop: -(DAY_TEXT_LINE_HEIGHT / 2 + EVENT_DOT_GAP + EVENT_DOT_SIZE),
  },
  dayText: {
    fontSize: 16,
    fontWeight: '500',
    lineHeight: DAY_TEXT_LINE_HEIGHT,
  },
});
