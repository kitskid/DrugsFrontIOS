import {useCallback, useEffect, useMemo} from 'react';
import {Platform, StyleSheet} from 'react-native';
import {Gesture} from 'react-native-gesture-handler';
import {
  cancelAnimation,
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

export type PullExclusionZone = {
  top: number;
  bottom: number;
  left?: number;
  right?: number;
};

const PULL_EXCLUSION_PADDING = 16;

export const PULL_REFRESH_THRESHOLD = 243;
export const PULL_REFRESH_MAX = 365;
const TOP_TOLERANCE = 3;
const PULL_INDICATOR_TOP_BASE = -10;
const PULL_INDICATOR_TOP_SHIFT = 6;
const PULL_INDICATOR_MAX_TRAVEL = 6;

export const getPullIndicatorTop = (
  topInset: number,
  pullProgress: number,
): number => {
  'worklet';

  const progress = Math.min(1, Math.max(0, pullProgress));
  const travelStart = topInset + PULL_INDICATOR_TOP_BASE + PULL_INDICATOR_TOP_SHIFT;
  const travelEnd = travelStart + PULL_INDICATOR_MAX_TRAVEL;

  return interpolate(progress, [0, 1], [travelStart, travelEnd], Extrapolation.CLAMP);
};

export const pullIndicatorOverlayStyle = StyleSheet.create({
  overlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
    elevation: 10,
  },
});

export const usePullIndicatorOverlayStyle = (
  anchorTop: number | null,
  pullDistance: SharedValue<number>,
  pullProgress: SharedValue<number>,
  isRefreshing = false,
) =>
  useAnimatedStyle(() => {
    if (isRefreshing) {
      return {
        opacity: 0,
      };
    }

    const distance = pullDistance.value;
    const progress = Math.min(1, pullProgress.value);
    const isAnchorReady = anchorTop !== null;

    return {
      top:
        isAnchorReady ? getPullIndicatorTop(anchorTop, progress) : 0,
      opacity:
        isAnchorReady && distance > 2
          ? interpolate(
              progress,
              [0, 0.05, 0.15, 1],
              [0, 0.55, 1, 1],
              Extrapolation.CLAMP,
            )
          : 0,
    };
  });

export type PullToRefreshScrollEvent = {
  contentOffset: {x: number; y: number};
  contentInset?: {
    top?: number;
    right?: number;
    bottom?: number;
    left?: number;
  };
  contentSize?: {width: number; height: number};
  layoutMeasurement?: {width: number; height: number};
  velocity?: {x?: number; y?: number};
};

type PullToRefreshScrollCallbacks = {
  onScroll?: (event: PullToRefreshScrollEvent) => void;
  onBeginDrag?: (event: PullToRefreshScrollEvent) => void;
  onEndDrag?: (event: PullToRefreshScrollEvent) => void;
  onMomentumEnd?: (event: PullToRefreshScrollEvent) => void;
};

type UsePullToRefreshOptions = {
  onRefresh: () => void;
  isRefreshing?: boolean;
  /**
   * Android Pan pull gesture conflicts with nested scroll views in list headers.
   * Disable it and rely on overscroll + scrollHandler instead.
   */
  enableAndroidPullGesture?: boolean;
  /** Screen-space bounds where Android pull-to-refresh must not start. */
  pullExclusionZone?: SharedValue<PullExclusionZone | null>;
  /** Re-measure pull exclusion zones when the list scrolls. */
  onPullExclusionZoneSync?: (force?: boolean) => void;
  /** While true, pull distance is not updated (e.g. finger over nested scroll). */
  pullTouchSuppressed?: SharedValue<boolean>;
  /** When true, nested calendar scroll is at top and pull may pass through. */
  calendarScrollAtTop?: SharedValue<boolean>;
  /** When set, receives clamped scroll offset on every scroll event. */
  trackedScrollOffset?: SharedValue<number>;
  scrollCallbacks?: PullToRefreshScrollCallbacks;
};

type UsePullToRefreshResult = {
  scrollHandler: ReturnType<typeof useAnimatedScrollHandler>;
  scrollOffset: SharedValue<number>;
  pullDistance: SharedValue<number>;
  pullProgress: SharedValue<number>;
  resetPull: () => void;
  isIosPullEnabled: boolean;
  androidPullGesture: ReturnType<typeof Gesture.Pan> | null;
  listGesture: ReturnType<typeof Gesture.Simultaneous> | null;
};

export const usePullToRefresh = ({
  onRefresh,
  isRefreshing = false,
  enableAndroidPullGesture = true,
  pullExclusionZone,
  onPullExclusionZoneSync,
  pullTouchSuppressed,
  calendarScrollAtTop,
  trackedScrollOffset,
  scrollCallbacks,
}: UsePullToRefreshOptions): UsePullToRefreshResult => {
  const isIosPullEnabled = Platform.OS === 'ios';
  const isAndroidPullEnabled =
    Platform.OS === 'android' && enableAndroidPullGesture;
  const scrollOffset = useSharedValue(0);
  const pullDistance = useSharedValue(0);
  const beganAtTop = useSharedValue(false);
  const hasTriggeredRefresh = useSharedValue(false);
  const isAndroidPullGestureActive = useSharedValue(false);
  const pullTouchStartY = useSharedValue(-1);
  const PULL_ACTIVATION_OFFSET = 6;

  const isInsidePullExclusionZone = (touchX: number, touchY: number) => {
    'worklet';
    const zone = pullExclusionZone?.value;
    // Until the zone is measured, do not block pull anywhere.
    if (zone == null) {
      return false;
    }

    const top = zone.top - PULL_EXCLUSION_PADDING;
    const bottom = zone.bottom + PULL_EXCLUSION_PADDING;
    const left = (zone.left ?? 0) - PULL_EXCLUSION_PADDING;
    const right = (zone.right ?? Number.MAX_SAFE_INTEGER) + PULL_EXCLUSION_PADDING;

    return (
      touchY >= top &&
      touchY <= bottom &&
      touchX >= left &&
      touchX <= right
    );
  };

  const isPullBlockedInCalendarArea = (touchX: number, touchY: number) => {
    'worklet';
    if (!isInsidePullExclusionZone(touchX, touchY)) {
      return false;
    }

    // Calendar is at its top — allow pull-to-refresh to pass through.
    if (calendarScrollAtTop?.value !== false) {
      return false;
    }

    return true;
  };

  const isPullSuppressed = () => {
    'worklet';
    if (pullTouchSuppressed?.value !== true) {
      return false;
    }

    // Suppression from calendar touch is ignored while calendar is at top.
    if (calendarScrollAtTop?.value !== false) {
      return false;
    }

    return true;
  };

  const pullProgress = useDerivedValue(() =>
    Math.min(1, pullDistance.value / PULL_REFRESH_THRESHOLD),
  );

  const resetPullInstant = useCallback(() => {
    hasTriggeredRefresh.value = false;
    cancelAnimation(pullDistance);
    pullDistance.value = 0;
  }, [hasTriggeredRefresh, pullDistance]);

  useEffect(() => {
    if (isRefreshing) {
      resetPullInstant();
    }
  }, [isRefreshing, resetPullInstant]);

  const finishPull = useCallback(() => {
    'worklet';
    if (hasTriggeredRefresh.value) {
      return;
    }

    const distanceAtRelease = pullDistance.value;

    if (beganAtTop.value && distanceAtRelease >= PULL_REFRESH_THRESHOLD) {
      hasTriggeredRefresh.value = true;
      cancelAnimation(pullDistance);
      pullDistance.value = 0;
      runOnJS(onRefresh)();
      return;
    }

    pullDistance.value = withTiming(0, {duration: 220});
  }, [beganAtTop, hasTriggeredRefresh, onRefresh, pullDistance]);

  const updatePullDistance = useCallback((nextDistance: number) => {
    'worklet';
    if (hasTriggeredRefresh.value) {
      return;
    }

    pullDistance.value = Math.min(
      Math.max(0, nextDistance),
      PULL_REFRESH_MAX,
    );
  }, [hasTriggeredRefresh, pullDistance]);

  const nativeScrollGesture = useMemo(
    () => Gesture.Native().shouldCancelWhenOutside(false),
    [],
  );

  const androidPullGesture = useMemo(() => {
    if (!isAndroidPullEnabled) {
      return null;
    }

    const hasPullExclusionZone = pullExclusionZone != null;

    let panGesture = Gesture.Pan()
      .maxPointers(1)
      .failOffsetX([-40, 40])
      .cancelsTouchesInView(false)
      .simultaneousWithExternalGesture(nativeScrollGesture);

    if (hasPullExclusionZone) {
      panGesture = panGesture
        .manualActivation(true)
        .onTouchesDown((event, stateManager) => {
          'worklet';
          const touch = event.allTouches[0];
          const touchX = touch?.absoluteX ?? touch?.x ?? -1;
          const touchY = touch?.absoluteY ?? touch?.y ?? -1;
          pullTouchStartY.value = touchY;

          if (isPullSuppressed() || isPullBlockedInCalendarArea(touchX, touchY)) {
            stateManager.fail();
            return;
          }

          if (scrollOffset.value > TOP_TOLERANCE) {
            stateManager.fail();
          }
        })
        .onTouchesMove((event, stateManager) => {
          'worklet';
          const touch = event.allTouches[0];
          const touchX = touch?.absoluteX ?? touch?.x ?? -1;
          const touchY = touch?.absoluteY ?? touch?.y ?? -1;
          if (pullTouchStartY.value < 0) {
            return;
          }

          if (isPullSuppressed() || isPullBlockedInCalendarArea(touchX, touchY)) {
            stateManager.fail();
            return;
          }

          // Allow pull even when the list has no overflow (short content).
          const deltaY = touchY - pullTouchStartY.value;
          if (deltaY > PULL_ACTIVATION_OFFSET) {
            stateManager.activate();
          } else if (deltaY < -PULL_ACTIVATION_OFFSET) {
            stateManager.fail();
          }
        })
        .onTouchesUp(() => {
          'worklet';
          pullTouchStartY.value = -1;
        })
        .onTouchesCancelled(() => {
          'worklet';
          pullTouchStartY.value = -1;
        });
    } else {
      panGesture = panGesture.activeOffsetY(PULL_ACTIVATION_OFFSET);
    }

    return panGesture
      .onBegin(() => {
        'worklet';
        // Treat "no scroll possible / at top" the same — short content stays at 0.
        const isAtTop = scrollOffset.value <= TOP_TOLERANCE;
        beganAtTop.value = isAtTop;
        isAndroidPullGestureActive.value = isAtTop;
      })
      .onUpdate(event => {
        'worklet';
        if (
          hasTriggeredRefresh.value ||
          isPullSuppressed() ||
          !beganAtTop.value ||
          !isAndroidPullGestureActive.value
        ) {
          return;
        }

        if (event.translationY > 0) {
          updatePullDistance(event.translationY);
          return;
        }

        updatePullDistance(0);
      })
      .onEnd(() => {
        'worklet';
        if (
          hasTriggeredRefresh.value ||
          !beganAtTop.value ||
          !isAndroidPullGestureActive.value
        ) {
          isAndroidPullGestureActive.value = false;
          return;
        }

        isAndroidPullGestureActive.value = false;
        finishPull();
      })
      .onFinalize(() => {
        'worklet';
        isAndroidPullGestureActive.value = false;
        pullTouchStartY.value = -1;
      });
  }, [
    calendarScrollAtTop,
    finishPull,
    isAndroidPullEnabled,
    nativeScrollGesture,
    pullExclusionZone,
    pullTouchStartY,
    pullTouchSuppressed,
    updatePullDistance,
  ]);

  const listGesture = useMemo(() => {
    if (androidPullGesture == null) {
      return null;
    }

    return Gesture.Simultaneous(nativeScrollGesture, androidPullGesture);
  }, [androidPullGesture, nativeScrollGesture]);

  const scrollHandler = useAnimatedScrollHandler(
    {
      onBeginDrag: event => {
        beganAtTop.value = event.contentOffset.y <= TOP_TOLERANCE;
        if (onPullExclusionZoneSync) {
          runOnJS(onPullExclusionZoneSync)(true);
        }
        scrollCallbacks?.onBeginDrag?.(event);
      },
      onScroll: event => {
        const offsetY = event.contentOffset.y;
        scrollOffset.value = offsetY;
        if (trackedScrollOffset) {
          trackedScrollOffset.value = Math.max(0, offsetY);
        }

        if (!hasTriggeredRefresh.value && !isPullSuppressed()) {
          if (beganAtTop.value && offsetY < 0) {
            updatePullDistance(-offsetY);
          } else if (isIosPullEnabled) {
            if (offsetY >= 0) {
              updatePullDistance(0);
            }
          } else if (!isAndroidPullGestureActive.value) {
            const insetPull = Math.max(event.contentInset?.top ?? 0, 0);
            if (beganAtTop.value && insetPull > 0) {
              updatePullDistance(insetPull);
            } else if (offsetY >= 0 && insetPull <= 0) {
              updatePullDistance(0);
            }
          }
        }

        scrollCallbacks?.onScroll?.(event);

        if (onPullExclusionZoneSync && offsetY < PULL_REFRESH_MAX) {
          runOnJS(onPullExclusionZoneSync)(false);
        }
      },
      onEndDrag: event => {
        if (
          !isAndroidPullGestureActive.value &&
          !isPullSuppressed() &&
          beganAtTop.value &&
          pullDistance.value > 0
        ) {
          finishPull();
        }

        scrollCallbacks?.onEndDrag?.(event);
      },
      onMomentumEnd: event => {
        scrollCallbacks?.onMomentumEnd?.(event);
      },
    },
    [
      calendarScrollAtTop,
      onPullExclusionZoneSync,
      pullTouchSuppressed,
      scrollCallbacks,
      trackedScrollOffset,
    ],
  );

  const resetPull = useCallback(() => {
    hasTriggeredRefresh.value = false;
    pullDistance.value = withTiming(0, {duration: 220});
  }, [hasTriggeredRefresh, pullDistance]);

  return {
    scrollHandler,
    scrollOffset,
    pullDistance,
    pullProgress,
    resetPull,
    isIosPullEnabled,
    androidPullGesture,
    listGesture,
  };
};
