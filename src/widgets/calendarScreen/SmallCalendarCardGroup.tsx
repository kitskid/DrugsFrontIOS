import {useMemo, useState} from 'react';
import type {LayoutChangeEvent} from 'react-native';
import {StyleSheet, Text, View} from 'react-native';

import {SmallCalendarCard} from './SmallCalendarCard.tsx';

type SmallCalendarCardBackgroundImage = {
  form: number;
  reverse: number;
  color: number;
  gradientDirection: number;
};

type SmallCalendarCardItem = {
  id: string;
  medicationName: string;
  backgroundImage: SmallCalendarCardBackgroundImage;
};

type SmallCalendarCardGroupProps = {
  items: readonly SmallCalendarCardItem[];
};

const MAX_ROWS = 3;
const GAP = 8;
const BADGE_RESERVED_WIDTH = 56;

const fitCount = (
  widths: number[],
  containerWidth: number,
  badgeReserve: number,
): number => {
  let row = 0;
  let x = 0;
  let count = 0;

  for (const width of widths) {
    const rowBudget =
      badgeReserve > 0 && row === MAX_ROWS - 1
        ? containerWidth - GAP - badgeReserve
        : containerWidth;
    const needed = x === 0 ? width : x + GAP + width;

    if (needed <= rowBudget) {
      x = needed;
      count += 1;
      continue;
    }

    if (row >= MAX_ROWS - 1) {
      break;
    }

    row += 1;
    const nextRowBudget =
      badgeReserve > 0 && row === MAX_ROWS - 1
        ? containerWidth - GAP - badgeReserve
        : containerWidth;

    if (width <= nextRowBudget) {
      x = width;
      count += 1;
    } else {
      break;
    }
  }

  return count;
};

export const SmallCalendarCardGroup = ({
  items,
}: SmallCalendarCardGroupProps) => {
  const [containerWidth, setContainerWidth] = useState<number>(0);
  const [cardWidths, setCardWidths] = useState<Record<number, number>>({});

  const handleContainerLayout = (event: LayoutChangeEvent) => {
    const nextWidth = Math.round(event.nativeEvent.layout.width);
    if (nextWidth > 0) {
      setContainerWidth(prev => (prev === nextWidth ? prev : nextWidth));
    }
  };

  const handleCardLayout = (index: number) => (event: LayoutChangeEvent) => {
    const nextWidth = Math.ceil(event.nativeEvent.layout.width);
    if (nextWidth > 0) {
      setCardWidths(prev =>
        prev[index] === nextWidth ? prev : {...prev, [index]: nextWidth},
      );
    }
  };

  const isMeasured =
    containerWidth > 0 &&
    items.length > 0 &&
    items.every((_, index) => cardWidths[index] != null);

  const {visibleCount, remainingCount} = useMemo(() => {
    if (!isMeasured) {
      return {visibleCount: 0, remainingCount: 0};
    }

    const clampedWidths = items.map((_, index) =>
      Math.min(cardWidths[index], containerWidth),
    );

    const fullCount = fitCount(clampedWidths, containerWidth, 0);
    if (fullCount >= items.length) {
      return {visibleCount: items.length, remainingCount: 0};
    }

    const truncatedCount = fitCount(
      clampedWidths,
      containerWidth,
      BADGE_RESERVED_WIDTH,
    );
    return {
      visibleCount: truncatedCount,
      remainingCount: items.length - truncatedCount,
    };
  }, [isMeasured, items, cardWidths, containerWidth]);

  return (
    <View style={styles.container} onLayout={handleContainerLayout}>
      <View
        style={styles.measureLayer}
        pointerEvents="none"
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants">
        {items.map((item, index) => (
          <View key={item.id} onLayout={handleCardLayout(index)}>
            <SmallCalendarCard
              backgroundImage={item.backgroundImage}
              medicationName={item.medicationName}
            />
          </View>
        ))}
      </View>

      {isMeasured ? (
        <View style={styles.cardsRow}>
          {items.slice(0, visibleCount).map(item => (
            <SmallCalendarCard
              key={item.id}
              backgroundImage={item.backgroundImage}
              medicationName={item.medicationName}
              maxWidth={containerWidth}
            />
          ))}
          {remainingCount > 0 ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{`+${remainingCount}`}</Text>
            </View>
          ) : null}
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  measureLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    opacity: 0,
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  cardsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GAP,
  },
  badge: {
    height: 32,
    paddingHorizontal: 16,
    borderRadius: 1000,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(241, 240, 249, 1)',
  },
  badgeText: {
    color: 'rgba(29, 26, 73, 1)',
  },
});
