import {useEffect, useMemo, useRef} from 'react';
import {
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

const CONTAINER_HEIGHT = 50;
const CONTAINER_TOP_OFFSET = 1;
const CONTAINER_PADDING = 2;
const ITEM_WIDTH = 96;
const ANIMATION_DURATION = 220;

const BACKGROUND_COLOR = 'rgba(232, 231, 242, 1)';
const ACTIVE_BACKGROUND_COLOR = 'rgba(255, 255, 255, 1)';
const ACTIVE_TEXT_COLOR = 'rgba(35, 142, 235, 1)';
const INACTIVE_TEXT_COLOR = 'rgba(134, 132, 168, 1)';

type YearsScrollProps = {
  minYear: number;
  maxYear: number;
  selectedYear: number;
  onYearChange: (year: number) => void;
  style?: StyleProp<ViewStyle>;
};

type YearTabLabelProps = {
  year: number;
  index: number;
  selectedIndex: SharedValue<number>;
};

const YearTabLabel = ({year, index, selectedIndex}: YearTabLabelProps) => {
  const animatedTextStyle = useAnimatedStyle(() => ({
    color: interpolateColor(
      selectedIndex.value,
      [index - 1, index, index + 1],
      [INACTIVE_TEXT_COLOR, ACTIVE_TEXT_COLOR, INACTIVE_TEXT_COLOR],
      'RGB',
    ),
  }));

  return <Animated.Text style={[styles.yearText, animatedTextStyle]}>{year}</Animated.Text>;
};

export const YearsScroll = ({
  minYear,
  maxYear,
  selectedYear,
  onYearChange,
  style,
}: YearsScrollProps) => {
  const {width: windowWidth} = useWindowDimensions();
  const scrollRef = useRef<ScrollView>(null);

  const years = useMemo<number[]>(() => {
    const count = Math.max(0, maxYear - minYear + 1);
    return Array.from({length: count}, (_, index) => minYear + index);
  }, [maxYear, minYear]);

  const clampedSelectedYear = Math.min(Math.max(selectedYear, minYear), maxYear);
  const selectedIndex = clampedSelectedYear - minYear;

  const selectedIndexSv = useSharedValue(selectedIndex);
  const didInitialScrollRef = useRef(false);

  useEffect(() => {
    selectedIndexSv.value = withTiming(selectedIndex, {
      duration: ANIMATION_DURATION,
    });
  }, [selectedIndex, selectedIndexSv]);

  useEffect(() => {
    if (windowWidth <= 0) {
      return;
    }
    const targetX =
      selectedIndex * ITEM_WIDTH + ITEM_WIDTH / 2 - windowWidth / 2;
    scrollRef.current?.scrollTo({
      x: Math.max(0, targetX),
      animated: didInitialScrollRef.current,
    });
    didInitialScrollRef.current = true;
  }, [selectedIndex, windowWidth]);

  const activeBackgroundStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX:
          CONTAINER_PADDING + selectedIndexSv.value * ITEM_WIDTH,
      },
    ],
  }));

  return (
    <View style={[styles.root, style]}>
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>
        <Animated.View style={[styles.activeBackground, activeBackgroundStyle]} />
        {years.map((year, index) => (
          <TouchableOpacity
            key={year}
            activeOpacity={0.7}
            style={styles.yearItem}
            onPress={() => onYearChange(year)}>
            <YearTabLabel
              year={year}
              index={index}
              selectedIndex={selectedIndexSv}
            />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    height: CONTAINER_HEIGHT,
    marginTop: CONTAINER_TOP_OFFSET,
    backgroundColor: BACKGROUND_COLOR,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  scrollContent: {
    paddingHorizontal: CONTAINER_PADDING,
    alignItems: 'center',
    height: CONTAINER_HEIGHT,
  },
  activeBackground: {
    position: 'absolute',
    top: CONTAINER_PADDING,
    bottom: CONTAINER_PADDING,
    left: 0,
    width: ITEM_WIDTH,
    borderRadius: 1000,
    backgroundColor: ACTIVE_BACKGROUND_COLOR,
  },
  yearItem: {
    width: ITEM_WIDTH,
    height: CONTAINER_HEIGHT - CONTAINER_PADDING * 2,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  yearText: {
    fontSize: 16,
    fontWeight: '500',
  },
});
