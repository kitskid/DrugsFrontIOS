import {memo} from 'react';
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';

import {CircleIconButton} from '../../../shared/ui/CircleIconButton.tsx';

type LargeCalendarHeaderProps = {
  monthLabel: string;
  yearLabel: string;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onMonthPress?: () => void;
  onYearPress?: () => void;
};

const HEADER_COLORS = {
  buttonBg: 'rgba(241, 240, 249, 1)',
  buttonText: 'rgba(29, 26, 73, 1)',
  chevron: 'rgba(162, 160, 191, 1)',
} as const;

export const LargeCalendarHeader = memo(
  ({
    monthLabel,
    yearLabel,
    onPrevMonth,
    onNextMonth,
    onMonthPress,
    onYearPress,
  }: LargeCalendarHeaderProps) => (
    <View style={styles.root}>
      <View style={styles.dateSelectors}>
        <TouchableOpacity
          activeOpacity={0.7}
          style={[styles.selectorButton, styles.monthButton]}
          onPress={onMonthPress}>
          <Text style={styles.selectorText}>{monthLabel}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          activeOpacity={0.7}
          style={[styles.selectorButton, styles.yearButton]}
          onPress={onYearPress}>
          <Text style={styles.selectorText}>{yearLabel}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.navButtons}>
        <CircleIconButton
          icon="chevron-left"
          backgroundColor="transparent"
          iconColor={HEADER_COLORS.chevron}
          onPress={onPrevMonth}
        />
        <CircleIconButton
          icon="chevron-right"
          backgroundColor="transparent"
          iconColor={HEADER_COLORS.chevron}
          onPress={onNextMonth}
        />
      </View>
    </View>
  ),
);

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateSelectors: {
    flexDirection: 'row',
    gap: 1,
  },
  selectorButton: {
    height: 48,
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: HEADER_COLORS.buttonBg,
  },
  monthButton: {
    borderTopLeftRadius: 24,
    borderBottomLeftRadius: 24,
  },
  yearButton: {
    borderTopRightRadius: 24,
    borderBottomRightRadius: 24,
  },
  selectorText: {
    color: HEADER_COLORS.buttonText,
    fontSize: 16,
    fontWeight: '500',
  },
  navButtons: {
    flexDirection: 'row',
    gap: 4,
  },
});
