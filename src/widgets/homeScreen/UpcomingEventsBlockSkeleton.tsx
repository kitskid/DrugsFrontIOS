import {StyleSheet, View, type DimensionValue, type StyleProp, type ViewStyle} from 'react-native';

import {Skeleton} from '../../shared/ui/Skeleton.tsx';

const BASE_COLOR = 'rgba(241, 240, 249, 1)';
const ICON_SIZE = 36;
const TIME_WIDTH = 44;
const TIME_HEIGHT = 16;
const STATUS_HEIGHT = 12;
const TITLE_HEIGHT = 16;
const NOTES_HEIGHT = 12;
const CARD_ROWS = [0, 1] as const;

type PlaceholderBlockProps = {
  width: DimensionValue;
  height: number;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
  animated: boolean;
};

const PlaceholderBlock = ({
  width,
  height,
  borderRadius = 1000,
  style,
  animated,
}: PlaceholderBlockProps) => {
  if (animated) {
    return (
      <Skeleton
        width={width}
        height={height}
        borderRadius={borderRadius}
        style={style}
      />
    );
  }

  return (
    <View
      style={[
        styles.staticBlock,
        {
          width,
          height,
          borderRadius,
        },
        style,
      ]}
    />
  );
};

type SkeletonEventRowProps = {
  animated: boolean;
};

const SkeletonEventRow = ({animated}: SkeletonEventRowProps) => (
  <View style={styles.row}>
    <View style={styles.timeContainer}>
      <PlaceholderBlock
        width={TIME_WIDTH}
        height={TIME_HEIGHT}
        borderRadius={1000}
        animated={animated}
      />
    </View>
    <View style={styles.divider} />
    <View style={styles.textContainer}>
      <PlaceholderBlock width={60} height={STATUS_HEIGHT} animated={animated} />
      <PlaceholderBlock
        width="72%"
        height={TITLE_HEIGHT}
        animated={animated}
        style={styles.lineGap}
      />
      <PlaceholderBlock
        width="48%"
        height={NOTES_HEIGHT}
        animated={animated}
        style={styles.lineGap}
      />
    </View>
    <View style={styles.iconContainer}>
      <PlaceholderBlock
        width={ICON_SIZE}
        height={ICON_SIZE}
        borderRadius={14}
        animated={animated}
      />
    </View>
  </View>
);

type UpcomingEventsBlockSkeletonProps = {
  animated?: boolean;
};

export const UpcomingEventsBlockSkeleton = ({
  animated = true,
}: UpcomingEventsBlockSkeletonProps) => (
  <View style={styles.card}>
    {CARD_ROWS.map(row => (
      <SkeletonEventRow key={row} animated={animated} />
    ))}
  </View>
);

const styles = StyleSheet.create({
  staticBlock: {
    backgroundColor: BASE_COLOR,
  },
  card: {
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 1)',
    paddingVertical: 12,
  },
  row: {
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
    backgroundColor: BASE_COLOR,
  },
  textContainer: {
    flex: 1,
    marginLeft: 14,
    justifyContent: 'center',
  },
  lineGap: {
    marginTop: 4,
  },
  iconContainer: {
    marginLeft: 10,
    marginRight: 12,
    justifyContent: 'center',
  },
});
