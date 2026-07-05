import {StyleSheet, View} from 'react-native';

import {Skeleton} from '../../shared/ui/Skeleton.tsx';

const ICON_SIZE = 36;
const TIME_WIDTH = 44;
const TIME_HEIGHT = 16;
const STATUS_HEIGHT = 12;
const TITLE_HEIGHT = 16;
const NOTES_HEIGHT = 12;
const HEADER_HEIGHT = 16;
const HEADER_WIDTH = 220;
const DEFAULT_CARD_SLOTS = [0, 1] as const;

type SkeletonCardsProps = {
  cardsCount?: number;
};

const SkeletonCalendarCard = ({withNotes}: {withNotes?: boolean}) => {
  return (
    <View style={styles.cardContainer}>
      <View style={styles.timeContainer}>
        <Skeleton width={TIME_WIDTH} height={TIME_HEIGHT} borderRadius={6} />
      </View>
      <View style={styles.divider} />
      <View style={styles.textContainer}>
        <Skeleton width={60} height={STATUS_HEIGHT} borderRadius={6} />
        <Skeleton
          width="72%"
          height={TITLE_HEIGHT}
          borderRadius={6}
          style={styles.title}
        />
        {withNotes ? (
          <Skeleton
            width="48%"
            height={NOTES_HEIGHT}
            borderRadius={6}
            style={styles.notes}
          />
        ) : null}
      </View>
      <View style={styles.iconContainer}>
        <Skeleton width={ICON_SIZE} height={ICON_SIZE} borderRadius={14} />
      </View>
    </View>
  );
};

export const SkeletonCards = ({
  cardsCount = DEFAULT_CARD_SLOTS.length,
}: SkeletonCardsProps) => {
  const cardSlots = Array.from({length: cardsCount}, (_, index) => index);

  return (
    <View style={styles.groupContainer}>
      <View style={styles.groupHeader}>
        <Skeleton
          width={HEADER_WIDTH}
          height={HEADER_HEIGHT}
          borderRadius={6}
        />
      </View>

      <View style={styles.cardsContainer}>
        {cardSlots.map(slot => (
          <SkeletonCalendarCard key={slot} withNotes={slot === 0} />
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
  groupHeader: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  cardsContainer: {
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 1)',
    paddingVertical: 12,
  },
  cardContainer: {
    flexDirection: 'row',
    alignItems: 'stretch',
    paddingVertical: 12,
  },
  timeContainer: {
    marginLeft: 20,
    marginRight: 18,
    alignSelf: 'center',
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
  title: {
    marginTop: 4,
  },
  notes: {
    marginTop: 4,
  },
  iconContainer: {
    marginLeft: 10,
    marginRight: 12,
    justifyContent: 'center',
  },
});
