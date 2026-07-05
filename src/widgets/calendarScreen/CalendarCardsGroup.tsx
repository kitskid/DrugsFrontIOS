import {StyleSheet, Text, View} from 'react-native';

import {CalendarCard} from './CalendarCard.tsx';

type CalendarCardBackgroundImage = {
  form: number;
  reverse: number;
  color: number;
  gradientDirection: number;
};

type CalendarCardItem = {
  id: string;
  medicationName: string;
  notes: string | null;
  intakeTimes: readonly string[];
  backgroundImage: CalendarCardBackgroundImage;
};

type CalendarCardsGroupProps = {
  weekDayLabel: string;
  dateLabel: string;
  eventsCountLabel: string;
  items: readonly CalendarCardItem[];
};

export const CalendarCardsGroup = ({
  weekDayLabel,
  dateLabel,
  eventsCountLabel,
  items,
}: CalendarCardsGroupProps) => {
  return (
    <View style={styles.groupContainer}>
      <Text style={styles.groupHeaderText}>
        <Text style={styles.headerPrimary}>{weekDayLabel}</Text>
        <Text style={styles.headerSecondary}> | </Text>
        <Text style={styles.headerPrimary}>{dateLabel}</Text>
        <Text style={styles.headerSecondary}> | </Text>
        <Text style={styles.headerSecondary}>{eventsCountLabel}</Text>
      </Text>

      <View style={styles.cardsContainer}>
        {items.map(item => (
          <CalendarCard key={item.id} item={item} />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  groupContainer: {
    borderRadius: 28,
    backgroundColor: 'rgba(241, 240, 249, 1)',
    overflow: 'hidden',
    marginBottom: 16
  },
  groupHeaderText: {
    textAlign: 'center',
    paddingVertical: 12,
  },
  headerPrimary: {
    color: 'rgba(29, 26, 73, 1)',
  },
  headerSecondary: {
    color: 'rgba(134, 132, 168, 1)',
  },
  cardsContainer: {
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 1)',
    paddingVertical: 12,
  },
});
