import {memo, useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';

export const WHEEL_PICKER_ITEM_HEIGHT = 48;
const ITEM_HEIGHT = WHEEL_PICKER_ITEM_HEIGHT;
export const WHEEL_PICKER_VISIBLE_ROWS = 3;

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const normalizeLoopIndex = (rawIndex: number, length: number) =>
  ((rawIndex % length) + length) % length;

export type WheelPickerColumnProps = {
  options: string[];
  selectedIndex: number;
  onChange: (index: number) => void;
  loop?: boolean;
  syncKey?: number | string;
  columnStyle?: StyleProp<ViewStyle>;
  /** Дубликаты списка для «бесконечного» скролла; меньше — быстрее первый рендер */
  loopCycles?: number;
  itemTextStyle?: StyleProp<TextStyle>;
};

type WheelRowProps = {
  label: string;
  isSelected: boolean;
  itemTextStyle?: StyleProp<TextStyle>;
};

const WheelRow = memo(function WheelRow({label, isSelected, itemTextStyle}: WheelRowProps) {
  return (
    <View style={styles.wheelItem}>
      <Text style={[styles.wheelText, isSelected && styles.wheelTextSelected, itemTextStyle]}>{label}</Text>
    </View>
  );
});

export const WheelPickerColumn = memo(function WheelPickerColumn({
  options,
  selectedIndex,
  onChange,
  loop = false,
  columnStyle,
  syncKey,
  loopCycles = 5,
  itemTextStyle,
}: WheelPickerColumnProps) {
  const scrollRef = useRef<ScrollView>(null);
  const lastSyncedIndexRef = useRef<number | null>(null);
  const lastOffsetYRef = useRef(0);
  const dragEndTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rafRef = useRef<number | null>(null);

  const middleCycle = Math.floor(loopCycles / 2);

  const items = useMemo(() => {
    if (!loop || options.length === 0) {
      return options;
    }
    return Array.from({length: options.length * loopCycles}, (_, i) => options[i % options.length]);
  }, [loop, loopCycles, options]);

  const getTargetIndex = useCallback(
    (idx: number) => (loop ? middleCycle * options.length + idx : idx),
    [loop, middleCycle, options.length],
  );

  const [displayIndex, setDisplayIndex] = useState(selectedIndex);

  useEffect(() => {
    setDisplayIndex(selectedIndex);
  }, [selectedIndex, syncKey]);

  useEffect(() => {
    if (!options.length) {
      return;
    }
    const targetIndex = getTargetIndex(selectedIndex);
    if (lastSyncedIndexRef.current === targetIndex) {
      return;
    }
    lastSyncedIndexRef.current = targetIndex;
    lastOffsetYRef.current = targetIndex * ITEM_HEIGHT;
    scrollRef.current?.scrollTo({y: targetIndex * ITEM_HEIGHT, animated: false});
  }, [getTargetIndex, options.length, selectedIndex, syncKey]);

  useEffect(() => {
    return () => {
      if (dragEndTimeoutRef.current) {
        clearTimeout(dragEndTimeoutRef.current);
      }
      if (rafRef.current != null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  const updateDisplayFromOffset = useCallback(
    (offsetY: number) => {
      if (!options.length) {
        return;
      }
      const rawIndex = Math.round(offsetY / ITEM_HEIGHT);
      const normalizedIndex = loop
        ? normalizeLoopIndex(rawIndex, options.length)
        : clamp(rawIndex, 0, options.length - 1);
      setDisplayIndex(prev => (prev === normalizedIndex ? prev : normalizedIndex));
    },
    [loop, options.length],
  );

  const scheduleDisplayUpdate = useCallback(
    (offsetY: number) => {
      lastOffsetYRef.current = offsetY;
      if (rafRef.current != null) {
        return;
      }
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        updateDisplayFromOffset(lastOffsetYRef.current);
      });
    },
    [updateDisplayFromOffset],
  );

  const finalizeScroll = useCallback(
    (offsetY: number) => {
      if (!options.length) {
        return;
      }

      const rawIndex = Math.round(offsetY / ITEM_HEIGHT);
      const normalizedIndex = loop
        ? normalizeLoopIndex(rawIndex, options.length)
        : clamp(rawIndex, 0, options.length - 1);

      const targetIndex = getTargetIndex(normalizedIndex);
      lastSyncedIndexRef.current = targetIndex;
      onChange(normalizedIndex);

      if (loop) {
        const centeredIndex = middleCycle * options.length + normalizedIndex;
        if (Math.abs(rawIndex - centeredIndex) > options.length * 2) {
          lastSyncedIndexRef.current = centeredIndex;
          scrollRef.current?.scrollTo({y: centeredIndex * ITEM_HEIGHT, animated: false});
        }
      }
    },
    [getTargetIndex, loop, middleCycle, onChange, options.length],
  );

  const clearDragEndTimeout = useCallback(() => {
    if (dragEndTimeoutRef.current) {
      clearTimeout(dragEndTimeoutRef.current);
      dragEndTimeoutRef.current = null;
    }
  }, []);

  const onScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const y = event.nativeEvent.contentOffset.y;
      lastOffsetYRef.current = y;
      scheduleDisplayUpdate(y);
    },
    [scheduleDisplayUpdate],
  );

  const onScrollEndDrag = useCallback(() => {
    clearDragEndTimeout();
    dragEndTimeoutRef.current = setTimeout(() => {
      finalizeScroll(lastOffsetYRef.current);
    }, 80);
  }, [clearDragEndTimeout, finalizeScroll]);

  const onMomentumScrollEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      clearDragEndTimeout();
      const y = event.nativeEvent.contentOffset.y;
      lastOffsetYRef.current = y;
      finalizeScroll(y);
    },
    [clearDragEndTimeout, finalizeScroll],
  );

  const initialY = getTargetIndex(selectedIndex) * ITEM_HEIGHT;

  return (
    <View style={[styles.wheelColumn, columnStyle]}>
      <ScrollView
        ref={scrollRef}
        style={styles.wheelScroll}
        showsVerticalScrollIndicator={false}
        bounces={false}
        snapToInterval={ITEM_HEIGHT}
        decelerationRate="fast"
        contentContainerStyle={styles.wheelContent}
        scrollEventThrottle={32}
        onScroll={onScroll}
        onScrollEndDrag={onScrollEndDrag}
        onMomentumScrollBegin={clearDragEndTimeout}
        onMomentumScrollEnd={onMomentumScrollEnd}
        contentOffset={{x: 0, y: initialY}}>
        {items.map((item, index) => {
          const optionIndex = loop ? index % options.length : index;
          const isSelected = optionIndex === displayIndex;
          return <WheelRow key={index} label={item} isSelected={isSelected} itemTextStyle={itemTextStyle} />;
        })}
      </ScrollView>
    </View>
  );
});

const TEXT_COLOR = 'rgba(134, 132, 168, 1)';
const SELECTED_TEXT_COLOR = 'rgba(35, 142, 235, 1)';

const styles = StyleSheet.create({
  wheelColumn: {
    flex: 1,
    minWidth: 0,
    height: ITEM_HEIGHT * 3,
  },
  wheelScroll: {
    flex: 1,
  },
  wheelContent: {
    paddingVertical: ITEM_HEIGHT,
  },
  wheelItem: {
    height: ITEM_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wheelText: {
    color: TEXT_COLOR,
    fontSize: 16,
    fontWeight: '500',
  },
  wheelTextSelected: {
    color: SELECTED_TEXT_COLOR,
  },
});
