import {useCallback, useMemo, useRef} from 'react';
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';

import {NotificationCard} from './NotificationCard.tsx';
import type {NotificationReminder} from './notificationTypes.ts';

type NotificationGroupScrollProps = {
  reminders: NotificationReminder[];
};

const HOME_HEADER_HORIZONTAL_PADDING = 16;
const CARD_LEFT_FROM_SCREEN = 12;
const CARD_GAP = 12;
const NEXT_CARD_PEEK_WIDTH = 12;

export const NotificationGroupScroll = ({reminders}: NotificationGroupScrollProps) => {
  const {width: screenWidth} = useWindowDimensions();
  const scrollRef = useRef<ScrollView>(null);

  const cardWidth =
    screenWidth - CARD_LEFT_FROM_SCREEN - CARD_GAP - NEXT_CARD_PEEK_WIDTH;
  const snapInterval = cardWidth + CARD_GAP;

  const contentPaddingRight = screenWidth - CARD_LEFT_FROM_SCREEN - cardWidth;

  const maxScrollOffset = Math.max(
    0,
    (reminders.length - 1) * snapInterval,
  );

  const snapOffsets = useMemo(
    () => reminders.map((_, index) => index * snapInterval),
    [reminders, snapInterval],
  );

  const snapToNearestCard = useCallback(
    (offsetX: number, animated = true) => {
      const clampedOffset = Math.min(Math.max(offsetX, 0), maxScrollOffset);
      const rawIndex = Math.round(clampedOffset / snapInterval);
      const index = Math.max(0, Math.min(rawIndex, reminders.length - 1));
      const targetOffset = index * snapInterval;

      if (Math.abs(clampedOffset - targetOffset) > 0.5) {
        scrollRef.current?.scrollTo({x: targetOffset, animated});
      }
    },
    [maxScrollOffset, reminders.length, snapInterval],
  );

  const handleScrollEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      snapToNearestCard(event.nativeEvent.contentOffset.x);
    },
    [snapToNearestCard],
  );

  const handleScrollEndDrag = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const velocityX = event.nativeEvent.velocity?.x ?? 0;
      if (Math.abs(velocityX) < 0.05) {
        snapToNearestCard(event.nativeEvent.contentOffset.x);
      }
    },
    [snapToNearestCard],
  );

  if (reminders.length === 0) {
    return null;
  }

  return (
    <View style={styles.wrap}>
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        snapToOffsets={snapOffsets}
        snapToAlignment="start"
        disableIntervalMomentum
        // No scrollEventThrottle — no onScroll handler, no need to emit events to JS
        onScrollEndDrag={handleScrollEndDrag}
        onMomentumScrollEnd={handleScrollEnd}
        contentContainerStyle={[
          styles.scrollContent,
          {paddingRight: contentPaddingRight},
        ]}>
        {reminders.map((reminder, index) => (
          <View
            key={reminder.id}
            style={[
              styles.cardSlot,
              {
                width: cardWidth,
                marginRight: index < reminders.length - 1 ? CARD_GAP : 0,
              },
            ]}>
            <NotificationCard reminder={reminder} width={cardWidth} timerIndex={index} />
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    marginHorizontal: -HOME_HEADER_HORIZONTAL_PADDING,
    marginBottom: 16,
    overflow: 'visible',
  },
  scrollContent: {
    paddingLeft: CARD_LEFT_FROM_SCREEN,
  },
  cardSlot: {
    flexShrink: 0,
  },
});
