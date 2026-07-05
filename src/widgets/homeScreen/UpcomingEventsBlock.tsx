import {useMemo} from 'react';
import {StyleSheet, View} from 'react-native';

import type {CalendarResponseDto} from '../../features/api/apiCalendar.ts';
import {CalendarCardsGroup} from '../../shared/ui/drugs/CalendarCardsGroup.tsx';
import {
  mapCalendarToCardGroups,
  type CalendarCardGroupItem,
} from '../calendarScreen/mapCalendarData.ts';
import {UpcomingEventsBlockHeader} from './UpcomingEventsEmptyPlaceholder.tsx';

type UpcomingEventsBlockProps = {
  calendarDays?: CalendarResponseDto['days'];
  onCardPress?: (item: CalendarCardGroupItem) => void;
};

export const UpcomingEventsBlock = ({
  calendarDays,
  onCardPress,
}: UpcomingEventsBlockProps) => {
  const eventGroups = useMemo(
    () => mapCalendarToCardGroups(calendarDays),
    [calendarDays],
  );

  if (eventGroups.length === 0) {
    return null;
  }

  return (
    <View style={styles.block}>
      <UpcomingEventsBlockHeader style={styles.header} />

      {eventGroups.map(group => (
        <CalendarCardsGroup
          key={`${group.date.getFullYear()}-${group.date.getMonth()}-${group.date.getDate()}`}
          date={group.date}
          items={group.items}
          onCardPress={onCardPress}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  block: {
    marginTop: 24,
    marginBottom: 8,
  },
  header: {
    marginBottom: 20,
  },
});
