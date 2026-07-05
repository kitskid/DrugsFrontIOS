import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
} from 'react';
import type {MutableRefObject, ReactNode} from 'react';
import type {
  ListRenderItemInfo,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from 'react-native';
import {FlatList, StyleSheet, View} from 'react-native';

const DRAG_SNAP_VELOCITY_THRESHOLD = 0.05;
const SNAP_ALIGNMENT_EPSILON_PX = 0.5;

export type LargeCalendarMonthsPagerHandle = {
  scrollToAdjacent: (direction: -1 | 1) => void;
  scrollToOffset: (offset: number, animated: boolean) => void;
  recenter: () => void;
};

type LargeCalendarMonthsPagerProps = {
  pageWidth: number;
  pageHeight: number;
  minOffset: number;
  maxOffset: number;
  /** Month offset to center on mount (0 = anchor month). */
  initialOffset: number;
  /** Fires when scrolling settles on a month (drives the header). */
  onOffsetSettled: (offset: number) => void;
  renderMonth: (offset: number) => ReactNode;
  isScrollAnimatingRef?: MutableRefObject<boolean>;
};

const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), max);

export const LargeCalendarMonthsPager = forwardRef<
  LargeCalendarMonthsPagerHandle,
  LargeCalendarMonthsPagerProps
>(
  (
    {
      pageWidth,
      pageHeight,
      minOffset,
      maxOffset,
      initialOffset,
      onOffsetSettled,
      renderMonth,
      isScrollAnimatingRef,
    },
    ref,
  ) => {
    const listRef = useRef<FlatList<number>>(null);
    const pageWidthRef = useRef(pageWidth);
    pageWidthRef.current = pageWidth;

    const data = useMemo(() => {
      const length = Math.max(0, maxOffset - minOffset + 1);
      return Array.from({length}, (_, index) => minOffset + index);
    }, [minOffset, maxOffset]);
    const snapOffsets = useMemo(
      () => data.map((_, index) => index * pageWidth),
      [data, pageWidth],
    );

    const lastIndex = data.length - 1;
    const initialIndex = clamp(initialOffset - minOffset, 0, Math.max(0, lastIndex));
    const currentIndexRef = useRef(initialIndex);

    const getItemLayout = useCallback(
      (_: ArrayLike<number> | null | undefined, index: number) => ({
        length: pageWidth,
        offset: pageWidth * index,
        index,
      }),
      [pageWidth],
    );

    const keyExtractor = useCallback((offset: number) => String(offset), []);

    const renderItem = useCallback(
      ({item}: ListRenderItemInfo<number>) => (
        <View
          style={[styles.page, {width: pageWidth, height: pageHeight}]}
          collapsable={false}>
          {renderMonth(item)}
        </View>
      ),
      [pageHeight, pageWidth, renderMonth],
    );

    const settleAt = useCallback(
      (contentOffsetX: number) => {
        const pw = pageWidthRef.current;
        if (pw <= 0) {
          return;
        }
        const index = clamp(Math.round(contentOffsetX / pw), 0, lastIndex);
        const targetOffsetX = index * pw;

        // FlatList snap can occasionally finish a little off-page while nested
        // inside the vertical calendar scroll. Force an exact page offset so
        // weekdays and day cells never drift relative to each other.
        if (Math.abs(contentOffsetX - targetOffsetX) > SNAP_ALIGNMENT_EPSILON_PX) {
          listRef.current?.scrollToOffset({
            offset: targetOffsetX,
            animated: false,
          });
        }

        if (index !== currentIndexRef.current) {
          currentIndexRef.current = index;
          onOffsetSettled(minOffset + index);
        }
      },
      [lastIndex, minOffset, onOffsetSettled],
    );

    const handleMomentumEnd = useCallback(
      (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        if (isScrollAnimatingRef) {
          isScrollAnimatingRef.current = false;
        }
        settleAt(event.nativeEvent.contentOffset.x);
      },
      [isScrollAnimatingRef, settleAt],
    );

    const handleScrollEndDrag = useCallback(
      (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        // A flick continues into momentum; only settle here on a slow release so
        // the header doesn't jump mid-deceleration.
        const velocityX = event.nativeEvent.velocity?.x ?? 0;
        if (Math.abs(velocityX) >= DRAG_SNAP_VELOCITY_THRESHOLD) {
          return;
        }
        if (isScrollAnimatingRef) {
          isScrollAnimatingRef.current = false;
        }
        settleAt(event.nativeEvent.contentOffset.x);
      },
      [isScrollAnimatingRef, settleAt],
    );

    const scrollToIndex = useCallback((index: number, animated: boolean) => {
      const pw = pageWidthRef.current;
      if (pw <= 0) {
        return;
      }
      listRef.current?.scrollToOffset({offset: index * pw, animated});
    }, []);

    const recenter = useCallback(() => {
      scrollToIndex(currentIndexRef.current, false);
    }, [scrollToIndex]);

    // Keep the centered month aligned after a width change.
    useEffect(() => {
      recenter();
    }, [pageWidth, recenter]);

    useImperativeHandle(
      ref,
      () => ({
        scrollToAdjacent: (direction: -1 | 1) => {
          const target = clamp(currentIndexRef.current + direction, 0, lastIndex);
          if (target === currentIndexRef.current) {
            return;
          }
          currentIndexRef.current = target;
          if (isScrollAnimatingRef) {
            isScrollAnimatingRef.current = true;
          }
          scrollToIndex(target, true);
          onOffsetSettled(minOffset + target);
        },
        scrollToOffset: (offset: number, animated: boolean) => {
          const target = clamp(offset - minOffset, 0, lastIndex);
          currentIndexRef.current = target;
          scrollToIndex(target, animated);
        },
        recenter,
      }),
      [isScrollAnimatingRef, lastIndex, minOffset, onOffsetSettled, recenter, scrollToIndex],
    );

    const handleScrollBeginDrag = useCallback(() => {
      if (isScrollAnimatingRef) {
        isScrollAnimatingRef.current = true;
      }
    }, [isScrollAnimatingRef]);

    const handleScrollToIndexFailed = useCallback(
      (info: {index: number}) => {
        scrollToIndex(info.index, false);
      },
      [scrollToIndex],
    );

    if (pageWidth <= 0 || pageHeight <= 0 || data.length === 0) {
      return null;
    }

    return (
      <FlatList
        ref={listRef}
        data={data}
        horizontal
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        getItemLayout={getItemLayout}
        initialScrollIndex={initialIndex}
        snapToOffsets={snapOffsets}
        snapToAlignment="start"
        decelerationRate="fast"
        directionalLockEnabled
        bounces={false}
        showsHorizontalScrollIndicator={false}
        removeClippedSubviews
        initialNumToRender={1}
        maxToRenderPerBatch={3}
        windowSize={5}
        scrollEventThrottle={16}
        onScrollBeginDrag={handleScrollBeginDrag}
        onMomentumScrollEnd={handleMomentumEnd}
        onScrollEndDrag={handleScrollEndDrag}
        onScrollToIndexFailed={handleScrollToIndexFailed}
        style={{width: pageWidth, height: pageHeight}}
      />
    );
  },
);

LargeCalendarMonthsPager.displayName = 'LargeCalendarMonthsPager';

const styles = StyleSheet.create({
  page: {
    overflow: 'visible',
  },
});
