import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import type {ReactNode} from 'react';
import type {NativeScrollEvent, NativeSyntheticEvent} from 'react-native';
import {ScrollView, View} from 'react-native';

export const LOOP_PAGER_SLOT_COUNT = 3;
export const LOOP_PAGER_CENTER_SLOT = 1;

export type LoopPagerSlot = -1 | 0 | 1;

export type LargeCalendarLoopPagerHandle = {
  scrollToAdjacent: (direction: -1 | 1) => void;
  recenter: () => void;
};

type LargeCalendarLoopPagerProps = {
  pageWidth: number;
  pageHeight: number;
  centerOffset: number;
  onCenterOffsetChange: (updater: (prev: number) => number) => void;
  onCenterSlotSettled?: (direction: -1 | 1) => void;
  renderPage: (slot: LoopPagerSlot, centerOffset: number) => ReactNode;
  isScrollAnimatingRef?: React.MutableRefObject<boolean>;
};

export const LargeCalendarLoopPager = forwardRef<
  LargeCalendarLoopPagerHandle,
  LargeCalendarLoopPagerProps
>(
  (
    {
      pageWidth,
      pageHeight,
      centerOffset,
      onCenterOffsetChange,
      onCenterSlotSettled,
      renderPage,
      isScrollAnimatingRef,
    },
    ref,
  ) => {
    const scrollRef = useRef<ScrollView>(null);
    const pageWidthRef = useRef(pageWidth);
    pageWidthRef.current = pageWidth;

    const isAdjustingRef = useRef(false);
    const needsRecenterAfterOffsetRef = useRef(false);

    const [isRepositioning, setIsRepositioning] = useState(false);

    const recenter = useCallback(() => {
      const pw = pageWidthRef.current;
      if (pw <= 0) {
        return;
      }
      scrollRef.current?.scrollTo({
        x: LOOP_PAGER_CENTER_SLOT * pw,
        animated: false,
      });
    }, []);

    useLayoutEffect(() => {
      recenter();
    }, [pageWidth, recenter]);

    useLayoutEffect(() => {
      if (!needsRecenterAfterOffsetRef.current) {
        return;
      }
      needsRecenterAfterOffsetRef.current = false;
      recenter();
      setIsRepositioning(false);
      isAdjustingRef.current = false;
    }, [centerOffset, recenter]);

    const applySlotChange = useCallback(
      (slot: number) => {
        if (isAdjustingRef.current) {
          return;
        }
        if (slot === LOOP_PAGER_CENTER_SLOT - 1) {
          isAdjustingRef.current = true;
          needsRecenterAfterOffsetRef.current = true;
          setIsRepositioning(true);
          onCenterOffsetChange(prev => prev - 1);
          onCenterSlotSettled?.(-1);
          return;
        }
        if (slot === LOOP_PAGER_CENTER_SLOT + 1) {
          isAdjustingRef.current = true;
          needsRecenterAfterOffsetRef.current = true;
          setIsRepositioning(true);
          onCenterOffsetChange(prev => prev + 1);
          onCenterSlotSettled?.(1);
        }
      },
      [onCenterOffsetChange, onCenterSlotSettled],
    );

    const handleScrollEnd = useCallback(
      (e: NativeSyntheticEvent<NativeScrollEvent>) => {
        if (isScrollAnimatingRef) {
          isScrollAnimatingRef.current = false;
        }
        if (isAdjustingRef.current) {
          return;
        }
        const pw = pageWidthRef.current;
        if (pw <= 0) {
          return;
        }
        const slot = Math.round(e.nativeEvent.contentOffset.x / pw);
        if (
          slot === LOOP_PAGER_CENTER_SLOT - 1 ||
          slot === LOOP_PAGER_CENTER_SLOT + 1
        ) {
          applySlotChange(slot);
        }
      },
      [applySlotChange, isScrollAnimatingRef],
    );

    useImperativeHandle(
      ref,
      () => ({
        scrollToAdjacent: (direction: -1 | 1) => {
          const pw = pageWidthRef.current;
          if (pw <= 0) {
            return;
          }
          const targetSlot = LOOP_PAGER_CENTER_SLOT + direction;
          if (isScrollAnimatingRef) {
            isScrollAnimatingRef.current = true;
          }
          scrollRef.current?.scrollTo({
            x: targetSlot * pw,
            animated: true,
          });
        },
        recenter,
      }),
      [isScrollAnimatingRef, recenter],
    );

    if (pageWidth <= 0 || pageHeight <= 0) {
      return null;
    }

    const slots: LoopPagerSlot[] = [-1, 0, 1];

    return (
      <View
        style={{
          width: pageWidth,
          height: pageHeight,
          opacity: isRepositioning ? 0 : 1,
        }}>
        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          disableIntervalMomentum
          snapToInterval={pageWidth}
          snapToAlignment="start"
          decelerationRate="fast"
          bounces={false}
          removeClippedSubviews={false}
          showsHorizontalScrollIndicator={false}
          scrollEventThrottle={16}
          onScrollBeginDrag={() => {
            if (isScrollAnimatingRef) {
              isScrollAnimatingRef.current = true;
            }
          }}
          onMomentumScrollEnd={handleScrollEnd}
          onScrollEndDrag={e => {
            const pw = pageWidthRef.current;
            if (pw <= 0) {
              return;
            }
            const velocityX = e.nativeEvent.velocity?.x ?? 0;
            if (Math.abs(velocityX) < 0.05) {
              handleScrollEnd(e);
            }
          }}
          contentContainerStyle={{
            width: LOOP_PAGER_SLOT_COUNT * pageWidth,
            height: pageHeight,
          }}
          style={{width: pageWidth, height: pageHeight}}>
          {slots.map(slot => (
            <View
              key={`slot-${slot}`}
              style={{
                width: pageWidth,
                height: pageHeight,
                overflow: 'visible',
              }}
              collapsable={false}>
              {renderPage(slot, centerOffset)}
            </View>
          ))}
        </ScrollView>
      </View>
    );
  },
);

LargeCalendarLoopPager.displayName = 'LargeCalendarLoopPager';
