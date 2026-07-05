import {memo, useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import {useTranslation} from 'react-i18next';

import i18n from '../../../features/localisation/i18n';
import {WHEEL_PICKER_ITEM_HEIGHT, WHEEL_PICKER_VISIBLE_ROWS} from './WheelPickerColumn.tsx';

const ITEM_HEIGHT = WHEEL_PICKER_ITEM_HEIGHT;
const VISIBLE_ROWS = WHEEL_PICKER_VISIBLE_ROWS;

/** Как у колеса даты (`WheelPickerColumn`) */
const WHEEL_TEXT_DIM = 'rgba(134, 132, 168, 1)';
const WHEEL_TEXT_SELECTED = 'rgba(35, 142, 235, 1)';
const HIGHLIGHT_BG = 'rgba(35, 142, 235, 0.15)';

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

export type EveryPickerUnit = string;

export type EveryPickerMainProps = {
  value: number;
  onChange: (value: number) => void;
  amount: number;
  unitShort: EveryPickerUnit;
  prefixText?: string;
  style?: StyleProp<ViewStyle>;
  syncKey?: number | string;
};

export const EveryPickerMain = memo(function EveryPickerMain({
  value,
  onChange,
  amount,
  unitShort,
  prefixText,
  style,
  syncKey,
}: EveryPickerMainProps) {
  const {t} = useTranslation('timePickers', {i18n});
  const scrollRef = useRef<ScrollView>(null);
  const lastSyncedIndexRef = useRef<number | null>(null);
  const lastOffsetYRef = useRef(0);
  const dragEndTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rafRef = useRef<number | null>(null);

  const safeAmount = Math.max(1, amount);
  const selectedIndex = clamp(value, 1, safeAmount) - 1;

  const [displayIndex, setDisplayIndex] = useState(selectedIndex);

  useEffect(() => {
    setDisplayIndex(selectedIndex);
  }, [selectedIndex, syncKey]);

  useEffect(() => {
    const targetIndex = selectedIndex;
    lastSyncedIndexRef.current = targetIndex;
    lastOffsetYRef.current = targetIndex * ITEM_HEIGHT;
    scrollRef.current?.scrollTo({y: targetIndex * ITEM_HEIGHT, animated: false});
  }, [selectedIndex, syncKey]);

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
      const rawIndex = Math.round(offsetY / ITEM_HEIGHT);
      const normalizedIndex = clamp(rawIndex, 0, safeAmount - 1);
      setDisplayIndex(prev => (prev === normalizedIndex ? prev : normalizedIndex));
    },
    [safeAmount],
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
      const rawIndex = Math.round(offsetY / ITEM_HEIGHT);
      const normalizedIndex = clamp(rawIndex, 0, safeAmount - 1);
      lastSyncedIndexRef.current = normalizedIndex;
      onChange(normalizedIndex + 1);
    },
    [onChange, safeAmount],
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

  const initialY = selectedIndex * ITEM_HEIGHT;

  const rows = useMemo(
    () => Array.from({length: safeAmount}, (_, i) => i + 1),
    [safeAmount],
  );

  return (
    <View style={[styles.root, style]}>
      <View style={styles.highlight} pointerEvents="none" />

      <View style={[styles.sideLabelSlot, styles.sideLabelLeft]} pointerEvents="none">
        <Text style={styles.sideLabel} numberOfLines={1}>
          {prefixText || t('defaults.everyPrefix')}
        </Text>
      </View>
      <View style={[styles.sideLabelSlot, styles.sideLabelRight]} pointerEvents="none">
        <Text style={styles.sideLabel} numberOfLines={1}>
          {unitShort}
        </Text>
      </View>

      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        bounces={false}
        snapToInterval={ITEM_HEIGHT}
        decelerationRate="fast"
        contentContainerStyle={styles.scrollContent}
        scrollEventThrottle={32}
        onScroll={onScroll}
        onScrollEndDrag={onScrollEndDrag}
        onMomentumScrollBegin={clearDragEndTimeout}
        onMomentumScrollEnd={onMomentumScrollEnd}
        contentOffset={{x: 0, y: initialY}}>
        {rows.map(n => {
          const index = n - 1;
          const isSelected = index === displayIndex;
          return (
            <View key={n} style={styles.numberRow}>
              <Text style={[styles.number, isSelected ? styles.numberSelected : styles.numberDim]}>{n}</Text>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
});

const SIDE_SLOT_W = 96;

const styles = StyleSheet.create({
  root: {
    position: 'relative',
    height: ITEM_HEIGHT * VISIBLE_ROWS,
    alignSelf: 'stretch',
  },
  highlight: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: ITEM_HEIGHT,
    height: ITEM_HEIGHT,
    borderRadius: 1000,
    backgroundColor: HIGHLIGHT_BG,
    zIndex: 0,
  },
  sideLabelSlot: {
    position: 'absolute',
    top: ITEM_HEIGHT,
    height: ITEM_HEIGHT,
    width: SIDE_SLOT_W,
    zIndex: 2,
    justifyContent: 'center',
  },
  sideLabelLeft: {
    left: 12,
  },
  sideLabelRight: {
    right: 12,
    alignItems: 'flex-end',
  },
  sideLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: WHEEL_TEXT_SELECTED,
  },
  scroll: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    zIndex: 1,
  },
  scrollContent: {
    paddingVertical: ITEM_HEIGHT,
  },
  numberRow: {
    height: ITEM_HEIGHT,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  number: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
    minWidth: 48,
  },
  numberDim: {
    color: WHEEL_TEXT_DIM,
  },
  numberSelected: {
    fontSize: 16,
    fontWeight: '500',
    color: WHEEL_TEXT_SELECTED,
  },
});
