import {memo} from 'react';
import {StyleSheet, Text, View} from 'react-native';

type LargeCalendarWeekdaysProps = {
  labels: string[];
  daySize: number;
};

const WEEKDAY_COLOR = 'rgba(134, 132, 168, 1)';

export const LargeCalendarWeekdays = memo(({labels, daySize}: LargeCalendarWeekdaysProps) => (
  <View style={styles.root}>
    {labels.map(label => (
      <View key={label} style={{width: daySize, flexShrink: 0}}>
        <Text style={styles.label}>{label}</Text>
      </View>
    ))}
  </View>
));

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    marginTop: 8,
    alignItems: 'center',
    height: 32
  },
  label: {
    color: WEEKDAY_COLOR,
    textAlign: 'center',
  },
});
