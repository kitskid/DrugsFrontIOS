import {useCallback, useMemo, useState} from 'react';
import {
  FlatList,
  LayoutChangeEvent,
  ListRenderItem,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Svg, {Path} from 'react-native-svg';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import {CircleIconButton} from '../../shared/ui/CircleIconButton.tsx';
import {Skeleton} from '../../shared/ui/Skeleton.tsx';
import {HomeStorageCardSkeleton} from './header/HomeStorageCardSkeleton.tsx';
import {UpcomingEventsBlockSkeleton} from './UpcomingEventsBlockSkeleton.tsx';
import {
  HeaderGradientFill,
  HOME_CONTENT_BACKGROUND,
  HOME_HEADER_GRADIENT_COLORS,
  HOME_HEADER_GRADIENT_END,
  HOME_HEADER_GRADIENT_START,
  homeListHeaderWrapStyle,
} from './header/HomeListHeader.tsx';

const CURVE_HEIGHT = 26;
const CURVE_DIP = 17;
const HEADER_CONTENT_TOP_GAP = 12;
const HOME_HEADER_HORIZONTAL_PADDING = 16;
const CARD_LEFT_FROM_SCREEN = 12;
const CARD_GAP = 12;
const NEXT_CARD_PEEK_WIDTH = 12;
const EVENTS_CALENDAR_HEIGHT = 130;

type ListItem = {
  id: string;
};

const HeaderBottomCurve = ({width}: {width: number}) => {
  const curvePath = `M 0 0 Q ${width / 2} ${CURVE_DIP} ${width} 0 L ${width} ${CURVE_HEIGHT} L 0 ${CURVE_HEIGHT} Z`;

  return (
    <Svg width={width} height={CURVE_HEIGHT} pointerEvents="none">
      <Path d={curvePath} fill={HOME_CONTENT_BACKGROUND} />
    </Svg>
  );
};

const HeaderSkeletonBlock = ({
  width,
  height,
  borderRadius = 28,
  style,
}: {
  width: number | `${number}%`;
  height: number;
  borderRadius?: number;
  style?: object;
}) => (
  <Skeleton
    width={width}
    height={height}
    borderRadius={borderRadius}
    style={[styles.headerSkeletonSurface, style]}
  />
);

const SkeletonHomeListHeader = ({
  topInset,
  onLayout,
}: {
  topInset: number;
  onLayout: (event: LayoutChangeEvent) => void;
}) => {
  const topPadding = topInset + HEADER_CONTENT_TOP_GAP;
  const {width: screenWidth} = useWindowDimensions();

  const cardWidth =
    screenWidth - CARD_LEFT_FROM_SCREEN - CARD_GAP - NEXT_CARD_PEEK_WIDTH;

  return (
    <View onLayout={onLayout} style={styles.headerRoot}>
      <LinearGradient
        colors={[...HOME_HEADER_GRADIENT_COLORS]}
        start={HOME_HEADER_GRADIENT_START}
        end={HOME_HEADER_GRADIENT_END}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      <View style={[styles.headerContent, {paddingTop: topPadding}]}>
        <View style={styles.headerTopRow}>
          <HeaderSkeletonBlock width={175} height={32} borderRadius={8} />
          <HeaderSkeletonBlock width={24} height={24} borderRadius={12} />
        </View>

        <View style={styles.notificationWrap}>
          <HeaderSkeletonBlock width={cardWidth} height={88} />
        </View>

        <HeaderSkeletonBlock width="100%" height={EVENTS_CALENDAR_HEIGHT} />

        <HomeStorageCardSkeleton />
      </View>

      <View style={styles.headerCurveWrap}>
        <HeaderBottomCurve width={screenWidth} />
      </View>
    </View>
  );
};

const SkeletonHomeContent = () => (
  <View>
    <View style={styles.contentBlock}>
      <View style={styles.contentHeaderRow}>
        <Skeleton width={140} height={14} borderRadius={6} />
        <Skeleton width={120} height={14} borderRadius={6} />
      </View>
      <View style={styles.activeDrugsCard}>
        <View style={styles.activeDrugRow}>
          <Skeleton width={36} height={36} borderRadius={14} />
          <Skeleton width="52%" height={16} borderRadius={6} style={styles.activeDrugTitle} />
          <Skeleton width={24} height={24} borderRadius={12} />
        </View>
        <Skeleton width="100%" height={8} borderRadius={1000} style={styles.progressBar} />
        <Skeleton width="100%" height={8} borderRadius={1000} />
      </View>
    </View>

    <View style={styles.upcomingBlock}>
      <View style={styles.contentHeaderRow}>
        <Skeleton width={130} height={14} borderRadius={6} />
        <Skeleton width={90} height={14} borderRadius={6} />
      </View>
      <UpcomingEventsBlockSkeleton />
    </View>
  </View>
);

type SkeletonHomeScreenProps = {
  onAddDrugPress?: () => void;
};

const renderListItem: ListRenderItem<ListItem> = () => <SkeletonHomeContent />;

export const SkeletonHomeScreen = ({onAddDrugPress}: SkeletonHomeScreenProps) => {
  const insets = useSafeAreaInsets();
  const [measuredHeaderHeight, setMeasuredHeaderHeight] = useState(0);

  const listData = useMemo(() => [{id: 'home-skeleton-content'}], []);

  const onHeaderLayout = useCallback((event: LayoutChangeEvent) => {
    setMeasuredHeaderHeight(event.nativeEvent.layout.height);
  }, []);

  const listHeader = useMemo(
    () => <SkeletonHomeListHeader topInset={insets.top} onLayout={onHeaderLayout} />,
    [insets.top, onHeaderLayout],
  );

  return (
    <View style={styles.screen}>
      {measuredHeaderHeight > 0 ? (
        <View
          style={[styles.statusBarClip, {height: insets.top}]}
          pointerEvents="none">
          <View
            style={[
              styles.statusBarGradientViewport,
              {height: measuredHeaderHeight},
            ]}>
            <HeaderGradientFill />
          </View>
        </View>
      ) : null}

      <FlatList
        data={listData}
        keyExtractor={item => item.id}
        renderItem={renderListItem}
        ListHeaderComponent={listHeader}
        ListHeaderComponentStyle={homeListHeaderWrapStyle}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
        overScrollMode="never"
      />

      <CircleIconButton
        icon="pill-plus-new"
        onPress={onAddDrugPress ?? (() => {})}
        style={styles.addButton}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: HOME_CONTENT_BACKGROUND,
  },
  statusBarClip: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    overflow: 'hidden',
    zIndex: 2,
  },
  statusBarGradientViewport: {
    width: '100%',
  },
  list: {
    flex: 1,
    zIndex: 1,
  },
  listContent: {
    flexGrow: 1,
  },
  addButton: {
    position: 'absolute',
    right: 12,
    bottom: 16,
    zIndex: 3,
  },
  headerRoot: {
    overflow: 'visible',
  },
  headerContent: {
    zIndex: 1,
    paddingHorizontal: HOME_HEADER_HORIZONTAL_PADDING,
    paddingBottom: 24,
  },
  headerCurveWrap: {
    zIndex: 2,
    elevation: 2,
    marginTop: -1,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  notificationWrap: {
    marginHorizontal: -HOME_HEADER_HORIZONTAL_PADDING,
    marginBottom: 16,
    paddingLeft: CARD_LEFT_FROM_SCREEN,
  },
  headerSkeletonSurface: {
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
  },
  contentBlock: {
    marginBottom: 8,
  },
  contentHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    marginBottom: 20
  },
  activeDrugsCard: {
    backgroundColor: 'rgba(255, 255, 255, 1)',
    borderRadius: 28,
    paddingTop: 16,
    paddingBottom: 20,
    paddingHorizontal: 12,
  },
  activeDrugRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  activeDrugTitle: {
    flex: 1,
    marginHorizontal: 10,
  },
  progressBar: {
    marginBottom: 8,
  },
  upcomingBlock: {
    marginTop: 24,
    marginBottom: 8,
  },
});
