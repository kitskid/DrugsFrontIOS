import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {useTranslation} from 'react-i18next';

import type {CalendarEventStatus} from '../../../features/api/apiCalendar.ts';
import i18n from '../../../features/localisation/i18n';
import type {CalendarCardGroupItem} from '../../../widgets/calendarScreen/mapCalendarData.ts';
import {DrugsCardIconNameMapper} from './DrugsCardIconNameMapper.tsx';

type CalendarCardProps = {
  item: CalendarCardGroupItem;
  onPress?: (item: CalendarCardGroupItem) => void;
};

const CALENDAR_EVENT_STATUS_PRESENTATION: Record<
  CalendarEventStatus,
  {labelKey: 'scheduled' | 'completed' | 'missed'; color: string}
> = {
  MISSED: {
    labelKey: 'missed',
    color: 'rgba(245, 33, 33, 1)',
  },
  COMPLETED: {
    labelKey: 'completed',
    color: 'rgba(116, 183, 0, 1)',
  },
  SCHEDULED: {
    labelKey: 'scheduled',
    color: 'rgba(35, 142, 235, 1)',
  },
};

export const CalendarCard = ({item, onPress}: CalendarCardProps) => {
  const {t} = useTranslation('calendar', {i18n});
  const eventTime = item.intakeTimes[0] ?? '--:--';
  const statusPresentation = CALENDAR_EVENT_STATUS_PRESENTATION[item.status];

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      disabled={!onPress}
      onPress={() => onPress?.(item)}
      style={styles.container}>
      <Text style={styles.time}>{eventTime}</Text>
      <View style={styles.divider} />
      <View style={styles.textContainer}>
        <Text style={[styles.status, {color: statusPresentation.color}]}>
          {t(`intakeStatus.${statusPresentation.labelKey}`)}
        </Text>
        <Text
          numberOfLines={2}
          ellipsizeMode="tail"
          style={styles.medicationName}>
          {item.medicationName}
        </Text>
        {item.notes ? (
          <Text numberOfLines={2} ellipsizeMode="tail" style={styles.notes}>
            {item.notes}
          </Text>
        ) : null}
      </View>
      <View style={styles.iconContainer}>
        <DrugsCardIconNameMapper
          backgroundImage={item.backgroundImage}
          medicationName={item.medicationName}
        />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'stretch',
    paddingVertical: 12,
  },
  time: {
    marginLeft: 20,
    marginRight: 18,
    alignSelf: 'center',
    color: 'rgba(134, 132, 168, 1)',
    fontWeight: '500',
    fontSize: 16,
  },
  divider: {
    width: 1,
    backgroundColor: 'rgba(241, 240, 249, 1)',
  },
  textContainer: {
    flex: 1,
    marginLeft: 14,
    justifyContent: 'center',
  },
  status: {
    fontWeight: '500',
  },
  medicationName: {
    marginTop: 4,
    color: 'rgba(29, 26, 73, 1)',
    fontWeight: '500',
    fontSize: 16,
  },
  notes: {
    marginTop: 4,
    color: 'rgba(134, 132, 168, 1)',
  },
  iconContainer: {
    marginLeft: 10,
    marginRight: 12,
    justifyContent: 'center',
  },
});
