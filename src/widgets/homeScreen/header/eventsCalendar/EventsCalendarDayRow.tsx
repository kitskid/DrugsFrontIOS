import {useMemo} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {useTranslation} from 'react-i18next';

import i18n from '../../../../features/localisation/i18n.ts';
import type {HomeEventRowItem} from './homeEventTypes.ts';
import {formatTimeFromTimestamp} from './formatTimeFromTimestamp.ts';

type EventsCalendarDayRowProps =
  | {data: HomeEventRowItem; placeholder?: false}
  | {data?: undefined; placeholder: true};

export const EventsCalendarDayRow = (props: EventsCalendarDayRowProps) => {
  const {t} = useTranslation('home', {i18n});
  const isPlaceholder = props.placeholder === true;
  const rawTime = isPlaceholder ? undefined : props.data?.time;
  const time = useMemo(
    () => (rawTime == null ? '-- : --' : formatTimeFromTimestamp(rawTime)),
    [rawTime],
  );

  return (
    <View style={styles.row}>
      <View style={styles.timeChip}>
        <Text style={[styles.timeText, isPlaceholder && styles.placeholderText]}>
          {time}
        </Text>
      </View>
      <Text
        style={[styles.titleText, isPlaceholder && styles.placeholderText]}
        numberOfLines={1}>
        {isPlaceholder ? t('eventsCalendar.noEvents') : props.data!.title}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    height: 23,
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeChip: {
    borderRadius: 999,
    backgroundColor: 'rgba(222, 236, 251, 1)',
    height: 23,
    width: 54,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  timeText: {
    fontSize: 14,
    color: 'rgba(29, 26, 73, 1)',
  },
  placeholderText: {
    color: 'rgba(29, 26, 73, 0.4)',
  },
  titleText: {
    flex: 1,
    fontWeight: 500,
    fontSize: 16,
    color: 'rgba(29, 26, 73, 1)',
  },
});
