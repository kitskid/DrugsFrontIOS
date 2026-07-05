import {useCallback, useEffect, useMemo, useRef, useState, type ReactNode} from 'react';
import {
  StyleSheet,
  TouchableOpacity,
  View,
  type LayoutChangeEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Animated, {
  Easing,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

type TabItem<T extends string = string> = {
  id: T;
  title: string;
  content: ReactNode;
};

type TabsItems<T extends string = string> =
  | readonly [TabItem<T>, TabItem<T>]
  | readonly [TabItem<T>, TabItem<T>, TabItem<T>];

type TabsProps<T extends string = string> = {
  tabs: TabsItems<T>;
  initialTabId?: T;
  selectedTabId?: T;
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
  onTabChange?: (tabId: T) => void;
  stretchContent?: boolean;
};

type TabLayoutMetrics = {
  x: number;
  width: number;
};

const CONTAINER_PADDING = 2;
const ANIMATION_DURATION = 260;
const TAB_INDICATOR_EASING = Easing.out(Easing.cubic);
const ACTIVE_TEXT_COLOR = 'rgba(35, 142, 235, 1)';
const INACTIVE_TEXT_COLOR = 'rgba(134, 132, 168, 1)';

type TabLabelProps = {
  title: string;
  index: number;
  selectedIndex: SharedValue<number>;
};

const TabLabel = ({title, index, selectedIndex}: TabLabelProps) => {
  const animatedTextStyle = useAnimatedStyle(() => ({
    color: interpolateColor(
      selectedIndex.value,
      [index - 1, index, index + 1],
      [INACTIVE_TEXT_COLOR, ACTIVE_TEXT_COLOR, INACTIVE_TEXT_COLOR],
      'RGB',
    ),
  }));

  return <Animated.Text style={[styles.tabText, animatedTextStyle]}>{title}</Animated.Text>;
};

export const Tabs = <T extends string>({
  tabs,
  initialTabId,
  selectedTabId: selectedTabIdProp,
  style,
  contentContainerStyle,
  onTabChange,
  stretchContent = false,
}: TabsProps<T>) => {
  const initialSelectedId =
    initialTabId && tabs.some(tab => tab.id === initialTabId) ? initialTabId : tabs[0].id;
  const [internalSelectedTabId, setInternalSelectedTabId] =
    useState<T>(initialSelectedId);
  const selectedTabId = selectedTabIdProp ?? internalSelectedTabId;

  const selectedIndex = tabs.findIndex(tab => tab.id === selectedTabId);
  const normalizedSelectedIndex = selectedIndex < 0 ? 0 : selectedIndex;

  const selectedIndexSv = useSharedValue(normalizedSelectedIndex);
  const indicatorTranslateXSv = useSharedValue(0);
  const indicatorWidthSv = useSharedValue(0);

  const tabLayoutsRef = useRef<Array<TabLayoutMetrics | undefined>>([]);
  const selectedIndexRef = useRef(normalizedSelectedIndex);
  const shouldAnimateSelectionRef = useRef(false);

  const applyIndicatorLayout = useCallback(
    (layout: TabLayoutMetrics, animated: boolean) => {
      indicatorWidthSv.value = layout.width;

      if (animated) {
        indicatorTranslateXSv.value = withTiming(layout.x, {
          duration: ANIMATION_DURATION,
          easing: TAB_INDICATOR_EASING,
        });
      } else {
        indicatorTranslateXSv.value = layout.x;
      }
    },
    [indicatorTranslateXSv, indicatorWidthSv],
  );

  const syncIndicatorToIndex = useCallback(
    (index: number, animated: boolean) => {
      const layout = tabLayoutsRef.current[index];

      if (layout && layout.width > 0) {
        applyIndicatorLayout(layout, animated);
      }
    },
    [applyIndicatorLayout],
  );

  const selectTab = useCallback(
    (tabId: T) => {
      if (selectedTabIdProp === undefined) {
        setInternalSelectedTabId(tabId);
      }

      onTabChange?.(tabId);
    },
    [onTabChange, selectedTabIdProp],
  );

  useEffect(() => {
    tabLayoutsRef.current = [];
    indicatorTranslateXSv.value = 0;
    indicatorWidthSv.value = 0;
  }, [tabs.length, indicatorTranslateXSv, indicatorWidthSv]);

  useEffect(() => {
    selectedIndexRef.current = normalizedSelectedIndex;

    const animated = shouldAnimateSelectionRef.current;
    shouldAnimateSelectionRef.current = true;

    selectedIndexSv.value = animated
      ? withTiming(normalizedSelectedIndex, {
          duration: ANIMATION_DURATION,
          easing: TAB_INDICATOR_EASING,
        })
      : normalizedSelectedIndex;

    syncIndicatorToIndex(normalizedSelectedIndex, animated);
  }, [normalizedSelectedIndex, selectedIndexSv, syncIndicatorToIndex]);

  const activeTab = useMemo(
    () => tabs.find(tab => tab.id === selectedTabId) ?? tabs[0],
    [selectedTabId, tabs],
  );

  const handleTabLayout = useCallback(
    (index: number, event: LayoutChangeEvent) => {
      const {x, width} = event.nativeEvent.layout;

      tabLayoutsRef.current[index] = {x, width};

      if (index === selectedIndexRef.current) {
        applyIndicatorLayout({x, width}, false);
      }
    },
    [applyIndicatorLayout],
  );

  const indicatorAnimatedStyle = useAnimatedStyle(() => ({
    width: indicatorWidthSv.value,
    opacity: indicatorWidthSv.value > 0 ? 1 : 0,
    transform: [{translateX: indicatorTranslateXSv.value}],
  }));

  return (
    <View style={stretchContent ? styles.rootStretched : undefined}>
      <View collapsable={false} style={[styles.tabsContainer, style]}>
        <Animated.View
          pointerEvents="none"
          style={[styles.activeTabBackground, indicatorAnimatedStyle]}
        />

        {tabs.map((tab, index) => (
          <TouchableOpacity
            key={tab.id}
            activeOpacity={0.7}
            onLayout={event => {
              handleTabLayout(index, event);
            }}
            onPress={() => {
              selectTab(tab.id);
            }}
            style={styles.tabButton}>
            <TabLabel title={tab.title} index={index} selectedIndex={selectedIndexSv} />
          </TouchableOpacity>
        ))}
      </View>

      <View
        style={[
          stretchContent ? styles.contentContainerStretched : undefined,
          contentContainerStyle,
        ]}>
        {activeTab.content}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  tabsContainer: {
    height: 50,
    borderRadius: 1000,
    backgroundColor: 'rgba(232, 231, 242, 1)',
    padding: CONTAINER_PADDING,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  activeTabBackground: {
    position: 'absolute',
    left: CONTAINER_PADDING,
    top: CONTAINER_PADDING,
    bottom: CONTAINER_PADDING,
    borderRadius: 1000,
    backgroundColor: 'rgba(255, 255, 255, 1)',
    zIndex: 0,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  tabText: {
    fontWeight: '500',
  },
  rootStretched: {
    flex: 1,
  },
  contentContainerStretched: {
    flex: 1,
  },
});
