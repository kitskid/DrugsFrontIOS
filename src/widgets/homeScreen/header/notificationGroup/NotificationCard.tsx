import {useEffect, useMemo, useState} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {useTranslation} from 'react-i18next';

import i18n from '../../../../features/localisation/i18n.ts';
import type {NotificationReminder} from './notificationTypes.ts';
import {DrugsCardIconNameMapper} from '../../../../shared/ui/drugs/DrugsCardIconNameMapper.tsx';
import {
  formatCountdownUntilIntake,
  formatScheduledTimeMoscow,
  formatThroughUntilIntake,
  getRemainingMsUntilIntake,
} from './notificationFormat.ts';

type NotificationCardProps = {
  reminder: NotificationReminder;
  width: number;
  // Index used to stagger interval start times so cards never tick simultaneously.
  // Simultaneous ticks produce one large React Fabric commit (path-clone from root
  // for all 3 cards at once) which accumulates faster than individual commits.
  timerIndex?: number;
};

const STAGGER_MS = 350; // spread cards 0ms / 350ms / 700ms apart within each second

export const NotificationCard = ({reminder, width, timerIndex = 0}: NotificationCardProps) => {
  const {t} = useTranslation('home', {i18n});
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    // Delay the first tick so cards are spread across the second.
    // After the stagger offset, a normal 1-second interval takes over.
    const staggerDelay = timerIndex * STAGGER_MS;
    let intervalId: ReturnType<typeof setInterval>;

    const timeoutId = setTimeout(() => {
      setNowMs(Date.now());
      intervalId = setInterval(() => setNowMs(Date.now()), 1000);
    }, staggerDelay);

    return () => {
      clearTimeout(timeoutId);
      clearInterval(intervalId);
    };
  // timerIndex is stable (card position in list never changes at runtime)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const remainingMs = useMemo(
    () => getRemainingMsUntilIntake(reminder.scheduledAt, nowMs),
    [reminder.scheduledAt, nowMs],
  );

  // "Through" text shows rounded hours/minutes — it only changes when the
  // minute boundary crosses, not every second. Keying on whole-minute bucket
  // reduces i18n t() calls (and Intl plural-rule allocations) from 1/sec to
  // ~1/min per card without any visible difference to the user.
  const throughText = useMemo(
    () => formatThroughUntilIntake(remainingMs, t),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [Math.floor(remainingMs / 60000), t, i18n.language],
  );

  const scheduledTimeText = useMemo(
    () => formatScheduledTimeMoscow(reminder.scheduledAt, i18n.language),
    [reminder.scheduledAt, i18n.language],
  );

  const countdownText = useMemo(
    () => formatCountdownUntilIntake(remainingMs),
    [remainingMs],
  );

  return (
    <View style={[styles.card, {width}]}>
      <View style={styles.timeRow}>
        <Text style={styles.timeMetaText} numberOfLines={1}>
          {throughText} | {scheduledTimeText}
        </Text>
        <Text style={styles.countdownText}>{countdownText}</Text>
      </View>

      <View style={styles.medicationRow}>
        <DrugsCardIconNameMapper
          backgroundImage={reminder.backgroundImage}
          medicationName={reminder.medicationName}
          size={36}
          isWhiteBG
        />
        <Text style={styles.medicationName} numberOfLines={2} ellipsizeMode="tail">
          {reminder.medicationName}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(29, 26, 73, 0.25)',
    borderRadius: 28,
    paddingTop: 12,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    columnGap: 8,
  },
  timeMetaText: {
    flex: 1,
    color: 'rgba(255, 255, 255, 1)',
    marginRight: 8,
  },
  countdownText: {
    color: 'rgba(255, 255, 255, 1)',
    fontSize: 24,
    fontWeight: '700',
  },
  medicationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    columnGap: 10,
  },
  medicationName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 1)',
  },
});
