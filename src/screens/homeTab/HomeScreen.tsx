import {useCallback, useMemo, useRef, useState} from 'react';
import {useQuery, useQueryClient} from '@tanstack/react-query';
import {
  LayoutChangeEvent,
  ListRenderItem,
  Platform,
  StatusBar,
  StyleSheet,
  View,
} from 'react-native';
import Animated from 'react-native-reanimated';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import type {CompositeNavigationProp} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {GestureDetector} from 'react-native-gesture-handler';
import {BottomSheetModal} from '@gorhom/bottom-sheet';

import {
  apiCalendar,
  CALENDAR_QUERY_KEY,
} from '../../features/api/apiCalendar.ts';
import {
  apiDocuments,
  getPatientFoldersContentsQueryKey,
  invalidateDocumentsQueries,
  STORAGE_USAGE_SUMMARY_QUERY_KEY,
} from '../../features/api/apiDocuments.ts';
import {
  HeaderGradientFill,
  HOME_CONTENT_BACKGROUND,
  HomeListHeader,
  homeListHeaderWrapStyle,
} from '../../widgets/homeScreen/header/HomeListHeader.tsx';
import {SkeletonHomeScreen} from '../../widgets/homeScreen/SkeletonHomeScreen.tsx';
import {getHomeCalendarRange, mapCalendarToCardGroups} from '../../widgets/calendarScreen/mapCalendarData.ts';
import type {AppStackParamList} from '../../app/AppStack.tsx';
import {resetDrugsCreateState} from '../../features/redux/drugsCreate/drugsCreateSlice.ts';
import {useAppDispatch} from '../../features/redux/hooks.ts';
import type {HomeTabStackParamList} from '../../features/navigation/tabs/HomeTabStack.tsx';
import {
  ACTIVE_MEDICATION_PRESCRIPTIONS_PARAMS,
  ACTIVE_MEDICATION_PRESCRIPTIONS_QUERY_KEY,
  apiDrugs,
} from '../../features/api/drugs/apiDrugs.ts';
import {CircleIconButton} from '../../shared/ui/CircleIconButton.tsx';
import {ActiveDrugsBlock} from '../../widgets/homeScreen/activeDrugs/ActiveDrugsBlock.tsx';
import {mapPrescriptionsToActiveDrugsMetrics} from '../../widgets/homeScreen/activeDrugs/activeDrugsMetrics.ts';
import {UpcomingEventsBlock} from '../../widgets/homeScreen/UpcomingEventsBlock.tsx';
import {
  StatusChangeModal,
  type StatusChangeModalItem,
} from '../../shared/ui/drugs/StatusChangeModal.tsx';
import type {CalendarCardGroupItem} from '../../widgets/calendarScreen/mapCalendarData.ts';
import {UpcomingEventsEmptyPlaceholder} from '../../widgets/homeScreen/UpcomingEventsEmptyPlaceholder.tsx';
import {useDocumentsQueriesOnFocus} from '../../widgets/documentsScreen/useDocumentsQueriesOnFocus.ts';
import {
  pullIndicatorOverlayStyle,
  usePullIndicatorOverlayStyle,
  usePullToRefresh,
} from '../../shared/ui/refreshIndicator/usePullToRefresh.ts';
import {PullToRefreshIndicator} from '../../shared/ui/refreshIndicator/PullToRefreshIndicator.tsx';
import {
  NOTIFICATIONS_UNREAD_COUNT_QUERY_KEY,
} from '../../features/api/apiNotification.ts';

type HomeScreenNavigationProp = CompositeNavigationProp<
  NativeStackNavigationProp<HomeTabStackParamList, 'HomeScreen'>,
  NativeStackNavigationProp<AppStackParamList>
>;

type ListItem = {
  id: string;
};

export const HomeScreen = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();
  const [measuredHeaderHeight, setMeasuredHeaderHeight] = useState(0);
  const [isPullRefreshing, setIsPullRefreshing] = useState(false);
  useDocumentsQueriesOnFocus();

  const {data: calendarData, isLoading: isCalendarLoading} = useQuery({
    queryKey: [...CALENDAR_QUERY_KEY, 'fromToday'],
    queryFn: async () => {
      const response = await apiCalendar.getCalendar(getHomeCalendarRange());
      return response.data;
    },
    staleTime: Infinity,
  });

  const {data: storageUsageSummary, isLoading: isStorageUsageLoading} = useQuery({
    queryKey: STORAGE_USAGE_SUMMARY_QUERY_KEY,
    queryFn: async () => {
      const response = await apiDocuments.getStorageUsageSummary();
      return response.data;
    },
    staleTime: Infinity,
  });

  const {data: foldersContents, isLoading: isFoldersContentsLoading} = useQuery({
    queryKey: getPatientFoldersContentsQueryKey(),
    queryFn: async () => {
      const response = await apiDocuments.getPatientFoldersContents();
      return response.data;
    },
    staleTime: Infinity,
  });

  const foldersCount = foldersContents?.folders.length ?? 0;
  const isStorageCardLoading = isStorageUsageLoading || isFoldersContentsLoading;

  const {data: prescriptionsData, isLoading: isActiveDrugsLoading} = useQuery({
    queryKey: ACTIVE_MEDICATION_PRESCRIPTIONS_QUERY_KEY,
    queryFn: async () => {
      const response = await apiDrugs.getMedicationPrescriptions(
        ACTIVE_MEDICATION_PRESCRIPTIONS_PARAMS,
      );
      return response.data;
    },
    staleTime: Infinity,
  });

  const hasActiveDrugs = useMemo(
    () => mapPrescriptionsToActiveDrugsMetrics(prescriptionsData?.data).length > 0,
    [prescriptionsData?.data],
  );

  const hasUpcomingEvents = useMemo(
    () => mapCalendarToCardGroups(calendarData?.days).length > 0,
    [calendarData?.days],
  );

  const showListEmptyPlaceholder =
    !isActiveDrugsLoading && !hasActiveDrugs && !hasUpcomingEvents;

  const handleAddDrugPress = useCallback(() => {
    dispatch(resetDrugsCreateState());
    navigation.navigate('DrugsCreate');
  }, [dispatch, navigation]);

  const statusModalRef = useRef<BottomSheetModal>(null);
  const [statusModalItem, setStatusModalItem] =
    useState<StatusChangeModalItem | null>(null);

  const handleCardPress = useCallback((item: CalendarCardGroupItem) => {
    setStatusModalItem({
      intakeId: item.id,
      prescriptionId: item.prescriptionId,
      status: item.status,
    });
    statusModalRef.current?.present();
  }, []);

  const handleOpenProfile = useCallback(
    (prescriptionId: string) => {
      navigation.navigate('DrugsCreate', {
        screen: 'DrugsCreateScreen',
        params: {prescriptionId},
      });
    },
    [navigation],
  );

  const listData = useMemo(() => [{id: 'home-content-blocks'}], []);

  const renderListItem: ListRenderItem<ListItem> = useCallback(
    () => (
      <View>
        <ActiveDrugsBlock
          prescriptions={prescriptionsData?.data}
          isLoading={isActiveDrugsLoading}
        />
        {showListEmptyPlaceholder ? (
          <UpcomingEventsEmptyPlaceholder />
        ) : (
          <UpcomingEventsBlock
            calendarDays={calendarData?.days}
            onCardPress={handleCardPress}
          />
        )}
      </View>
    ),
    [
      calendarData?.days,
      isActiveDrugsLoading,
      prescriptionsData?.data,
      handleCardPress,
      showListEmptyPlaceholder,
    ],
  );

  const onHeaderLayout = useCallback((event: LayoutChangeEvent) => {
    setMeasuredHeaderHeight(event.nativeEvent.layout.height);
  }, []);

  const handlePullRefresh = useCallback(() => {
    setIsPullRefreshing(true);

    void Promise.all([
      queryClient.refetchQueries({
        queryKey: [...CALENDAR_QUERY_KEY, 'fromToday'],
      }),
      queryClient.refetchQueries({
        queryKey: ACTIVE_MEDICATION_PRESCRIPTIONS_QUERY_KEY,
      }),
      invalidateDocumentsQueries(queryClient),
      queryClient.refetchQueries({
        queryKey: NOTIFICATIONS_UNREAD_COUNT_QUERY_KEY,
      }),
    ]).finally(() => {
      setIsPullRefreshing(false);
    });
  }, [queryClient]);

  const {
    scrollHandler,
    pullDistance,
    pullProgress,
    isIosPullEnabled,
    listGesture,
  } = usePullToRefresh({onRefresh: handlePullRefresh, isRefreshing: isPullRefreshing});

  const pullIndicatorOverlayAnimatedStyle = usePullIndicatorOverlayStyle(
    insets.top,
    pullDistance,
    pullProgress,
    isPullRefreshing,
  );

  useFocusEffect(
    useCallback(() => {
      StatusBar.setBarStyle('light-content');
      return () => {
        StatusBar.setBarStyle('dark-content');
      };
    }, []),
  );

  const listHeader = useMemo(
    () => (
      <HomeListHeader
        topInset={insets.top}
        onLayout={onHeaderLayout}
        calendarDays={calendarData?.days}
        storageUsage={storageUsageSummary}
        foldersCount={foldersCount}
        isStorageCardLoading={isStorageCardLoading}
      />
    ),
    [
      calendarData?.days,
      foldersCount,
      insets.top,
      isStorageCardLoading,
      onHeaderLayout,
      storageUsageSummary,
    ],
  );

  const listElement = (
    <Animated.FlatList
      data={listData}
      keyExtractor={item => item.id}
      renderItem={renderListItem}
      ListHeaderComponent={listHeader}
      ListHeaderComponentStyle={homeListHeaderWrapStyle}
      style={styles.list}
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator={false}
      bounces={isIosPullEnabled}
      alwaysBounceVertical={isIosPullEnabled}
      overScrollMode="never"
      onScroll={scrollHandler}
      scrollEventThrottle={16}
    />
  );

  if (isCalendarLoading || isPullRefreshing) {
    return <SkeletonHomeScreen onAddDrugPress={handleAddDrugPress} />;
  }

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

      <View style={styles.listHost}>
        {listGesture ? (
          <GestureDetector gesture={listGesture}>{listElement}</GestureDetector>
        ) : (
          listElement
        )}
      </View>

      <Animated.View
        style={[
          pullIndicatorOverlayStyle.overlay,
          pullIndicatorOverlayAnimatedStyle,
        ]}
        pointerEvents="none">
        <PullToRefreshIndicator progress={pullProgress} />
      </Animated.View>

      <CircleIconButton
        icon="pill-plus-new"
        onPress={handleAddDrugPress}
        style={styles.addButton}
      />

      <StatusChangeModal
        ref={statusModalRef}
        item={statusModalItem}
        showOpenProfileButton
        onOpenProfile={handleOpenProfile}
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
  listHost: {
    flex: 1,
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
});
