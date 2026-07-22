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
};

export const NotificationCard = ({reminder, width}: NotificationCardProps) => {
  const {t} = useTranslation('home', {i18n});
  const [nowMs, setNowMs] = useState(() => Date.now());

  // Each card owns its own timer so re-renders stay isolated to that card only.
  // A single shared timer in the parent would re-render the entire ScrollView tree every second.
  // All 3 cards mount simultaneously → their intervals fire together → React 18 automatic
  // batching merges all 3 setState calls into ONE Fabric commit (beneficial, not harmful).
  useEffect(() => {
    const id = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(id);
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
