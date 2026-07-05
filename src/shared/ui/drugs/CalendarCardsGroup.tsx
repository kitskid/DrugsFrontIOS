import {useMemo} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {useTranslation} from 'react-i18next';

import i18n from '../../../features/localisation/i18n.ts';
import {
  formatDateWithMonth,
  WEEK_DAY_CALENDAR_KEYS,
  MONTH_GENITIVE_KEY_LIST,
} from '../../../widgets/calendarScreen/formatCalendarDate.ts';
import type {CalendarCardGroupItem} from '../../../widgets/calendarScreen/mapCalendarData.ts';
import {CalendarCard} from './CalendarCard.tsx';

type CalendarCardsGroupProps = {
  date: Date;
  items: readonly CalendarCardGroupItem[];
  onCardPress?: (item: CalendarCardGroupItem) => void;
};

export const CalendarCardsGroup = ({
  date,
  items,
  onCardPress,
}: CalendarCardsGroupProps) => {
  const {t, i18n: i18nInstance} = useTranslation('calendar', {i18n});

  const weekDayLabel = t(`weekdays.${WEEK_DAY_CALENDAR_KEYS[date.getDay()]}`);

  const dateLabel = useMemo(() => {
    const monthNames = MONTH_GENITIVE_KEY_LIST.map(key => t(`monthsGenitive.${key}`));
    return formatDateWithMonth(date, monthNames);
  }, [date, i18nInstance.language, t]);

  const eventsCountLabel = t('eventsCount', {count: items.length});

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
          <CalendarCard key={item.id} item={item} onPress={onCardPress} />
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
    marginBottom: 16,
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
