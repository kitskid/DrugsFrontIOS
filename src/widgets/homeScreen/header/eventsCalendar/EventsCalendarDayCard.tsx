import {StyleSheet, Text, View} from 'react-native';

type EventsCalendarDayCardProps = {
  data: {
    weekday: string;
    day: string;
    month: string;
  };
};

export const EventsCalendarDayCard = ({data}: EventsCalendarDayCardProps) => {
  const monthLabel = data.month.slice(0, 3);

  return (
    <View style={styles.card}>
      <Text style={styles.text}>{data.weekday}</Text>
      <View style={styles.divider} />
      <Text style={styles.text}>{data.day}</Text>
      <View style={styles.divider} />
      <Text style={styles.text}>{monthLabel}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    height: 92,
    borderRadius: 20,
    width: 40,
    justifyContent: 'space-evenly',
    alignItems: 'center',
    paddingVertical: 8,
    backgroundColor: 'rgba(116, 183, 0, 0.7)',
  },
  text: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 1)',
  },
  divider: {
    width: 34,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 1)',
  },
});
