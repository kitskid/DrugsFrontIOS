import {useEffect, useMemo, useState} from 'react';
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {useTranslation} from 'react-i18next';

import i18n from '../../features/localisation/i18n.ts';
import {DrugsCardIconNameMapper} from '../../shared/ui/drugs/DrugsCardIconNameMapper.tsx';
import {
  formatNotificationRelativeTime,
  type NotificationCardItem,
} from './notificationScreenFormat.ts';

type NotificationCardProps = {
  item: NotificationCardItem;
  onPress?: (item: NotificationCardItem) => void;
};

const RELATIVE_TIME_REFRESH_MS = 30 * 1000;

export const NotificationCard = ({item, onPress}: NotificationCardProps) => {
  const {t} = useTranslation('notifications', {i18n});
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    const intervalId = setInterval(() => {
      setNowMs(Date.now());
    }, RELATIVE_TIME_REFRESH_MS);

    return () => clearInterval(intervalId);
  }, []);

  const timeText = useMemo(
    () => formatNotificationRelativeTime(item.eventTime, t, i18n.language, nowMs),
    [item.eventTime, nowMs, t, i18n.language],
  );

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      disabled={!onPress}
      onPress={() => onPress?.(item)}
      style={styles.card}>
      <DrugsCardIconNameMapper
        backgroundImage={item.backgroundImage}
        medicationName={item.name}
        size={48}
      />

      <View style={styles.textColumn}>
        <Text style={styles.name} numberOfLines={2} ellipsizeMode="tail">
          {item.name}
        </Text>
        <Text style={styles.typeLabel} numberOfLines={1} ellipsizeMode="tail">
          {item.typeLabel}
        </Text>
      </View>

      <Text style={styles.time}>{timeText}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
    padding: 12,
  },
  textColumn: {
    flex: 1,
    marginLeft: 10,
  },
  name: {
    color: 'rgba(29, 26, 73, 1)',
    fontSize: 16,
    fontWeight: '500',
  },
  typeLabel: {
    marginTop: 4,
    color: 'rgba(134, 132, 168, 1)',
    fontSize: 13,
  },
  time: {
    alignSelf: 'flex-end',
    marginLeft: 8,
    color: 'rgba(134, 132, 168, 1)',
    fontSize: 13,
  },
});
