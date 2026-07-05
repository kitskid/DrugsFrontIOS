import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {
  FlatList,
  type ListRenderItem,
  type LayoutChangeEvent,
  StyleSheet,
  Text,
  View,
  type ViewToken,
} from 'react-native';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import type {CompositeNavigationProp} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import {useTranslation} from 'react-i18next';

import type {AppStackParamList} from '../../app/AppStack.tsx';
import type {HomeTabStackParamList} from '../../features/navigation/tabs/HomeTabStack.tsx';
import i18n from '../../features/localisation/i18n.ts';
import {
  apiNotification,
  INBOX_DEFAULT_PER_PAGE,
  NOTIFICATIONS_INBOX_QUERY_KEY,
  NOTIFICATIONS_UNREAD_COUNT_QUERY_KEY,
} from '../../features/api/apiNotification.ts';
import {
  decrementNotificationsUnreadCount,
  setNotificationsUnreadCount,
} from '../../features/api/notificationsQueryCache.ts';
import {Header} from '../../shared/ui/Header.tsx';
import {IconMapper} from '../../shared/ui/IconMapper.tsx';
import {StatusBarAvoidContainer} from '../../shared/ui/StatusBarAvoidContainer.tsx';
import {ButtonMain} from '../../shared/ui/ButtonMain.tsx';
import {NotificationCard} from '../../widgets/notificationScreen/NotificationCard.tsx';
import {SkeletonNotificationCard} from '../../widgets/notificationScreen/SkeletonNotificationCard.tsx';
import {
  mapInboxNotificationToCardItem,
  type NotificationCardItem,
} from '../../widgets/notificationScreen/notificationScreenFormat.ts';

const SCREEN_BACKGROUND = 'rgba(247, 246, 251, 1)';
const SECTION_TITLE_COLOR = 'rgba(134, 132, 168, 1)';
const EMPTY_ICON_COLOR = 'rgba(199, 198, 217, 1)';
const EMPTY_TEXT_COLOR = 'rgba(162, 160, 191, 1)';
const MARK_READ_DEBOUNCE_MS = 500;
const INITIAL_SKELETON_SLOTS = [0, 1, 2] as const;

const viewabilityConfig = {
  itemVisiblePercentThreshold: 50,
  minimumViewTime: 200,
};

type NotificationsScreenNavigation = CompositeNavigationProp<
  NativeStackNavigationProp<HomeTabStackParamList, 'NotificationsScreen'>,
  NativeStackNavigationProp<AppStackParamList>
>;

export const NotificationsScreen = () => {
  const {t} = useTranslation('notifications', {i18n});
  const queryClient = useQueryClient();
  const navigation = useNavigation<NotificationsScreenNavigation>();

  const [markAllButtonCount, setMarkAllButtonCount] = useState(0);
  const hasSnapshottedUnreadCountRef = useRef(false);

  const {data: unreadCount = 0, isFetching: isUnreadCountFetching} = useQuery({
    queryKey: NOTIFICATIONS_UNREAD_COUNT_QUERY_KEY,
    queryFn: async () => {
      const response = await apiNotification.getUnreadCount();
      return response.data.count;
    },
    staleTime: 0,
    refetchOnMount: 'always',
  });

  useEffect(() => {
    if (hasSnapshottedUnreadCountRef.current || isUnreadCountFetching) {
      return;
    }

    hasSnapshottedUnreadCountRef.current = true;
    setMarkAllButtonCount(unreadCount);
  }, [isUnreadCountFetching, unreadCount]);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isFetchedAfterMount,
  } = useInfiniteQuery({
    queryKey: NOTIFICATIONS_INBOX_QUERY_KEY,
    queryFn: async ({pageParam}) => {
      const response = await apiNotification.getInbox({
        page: pageParam,
        perPage: INBOX_DEFAULT_PER_PAGE,
      });
      return response.data;
    },
    initialPageParam: 1,
    getNextPageParam: last =>
      last.page * last.perPage < last.total ? last.page + 1 : undefined,
    // Always pull fresh read flags when the screen opens so previously read
    // notifications never linger in the "Новые" section between visits.
    refetchOnMount: 'always',
  });

  // Wait for this mount's fetch to settle before partitioning, otherwise the
  // stale cache (with outdated read flags) would briefly show read items as new.
  const isInitialLoading = !isFetchedAfterMount;

  const allNotifications = useMemo(
    () => data?.pages.flatMap(page => page.items) ?? [],
    [data],
  );

  // The "mark all" action optimistically moves everything to "Прочитанные"
  // without waiting for a refetch; the snapshot is per-visit (reset on mount).
  const [markedAllRead, setMarkedAllRead] = useState(false);

  const newCardItems = useMemo(
    () =>
      markedAllRead
        ? []
        : allNotifications
            .filter(notification => !notification.read)
            .map(notification => mapInboxNotificationToCardItem(notification, t)),
    [allNotifications, markedAllRead, t, i18n.language],
  );

  const readCardItems = useMemo(
    () =>
      (markedAllRead
        ? allNotifications
        : allNotifications.filter(notification => notification.read)
      ).map(notification => mapInboxNotificationToCardItem(notification, t)),
    [allNotifications, markedAllRead, t, i18n.language],
  );

  const handleCardPress = useCallback(
    (item: NotificationCardItem) => {
      if (!item.prescriptionId) {
        return;
      }

      navigation.navigate('DrugsCreate', {
        screen: 'DrugsCreateScreen',
        params: {
          prescriptionId: item.prescriptionId,
          activeTab: 'intakes',
          openIntakeId: item.intakeId ?? undefined,
        },
      });
    },
    [navigation],
  );

  const markReadMutation = useMutation({
    mutationFn: (ids: string[]) =>
      apiNotification.markAsRead(ids).then(response => response.data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: NOTIFICATIONS_UNREAD_COUNT_QUERY_KEY,
      });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: () =>
      apiNotification.markAllAsRead().then(response => response.data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: NOTIFICATIONS_UNREAD_COUNT_QUERY_KEY,
      });
      queryClient.invalidateQueries({
        queryKey: NOTIFICATIONS_INBOX_QUERY_KEY,
      });
    },
  });

  const sentReadIdsRef = useRef<Set<string>>(new Set());
  const pendingIdsRef = useRef<Set<string>>(new Set());
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const markedAllReadRef = useRef(markedAllRead);
  markedAllReadRef.current = markedAllRead;

  const newCardItemsRef = useRef(newCardItems);
  newCardItemsRef.current = newCardItems;

  useFocusEffect(
    useCallback(() => {
      return () => {
        if (markedAllReadRef.current) {
          setNotificationsUnreadCount(queryClient, 0);
          return;
        }

        const remainingUnread = newCardItemsRef.current.filter(
          item => !sentReadIdsRef.current.has(item.id),
        ).length;

        setNotificationsUnreadCount(queryClient, remainingUnread);
      };
    }, [queryClient]),
  );

  const flushPendingReads = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }

    const ids = [...pendingIdsRef.current];
    pendingIdsRef.current.clear();

    if (ids.length > 0) {
      markReadMutation.mutate(ids);
    }
  }, [markReadMutation]);

  const scheduleMarkAsRead = useCallback(
    (ids: string[]) => {
      let addedCount = 0;

      for (const id of ids) {
        if (!sentReadIdsRef.current.has(id)) {
          sentReadIdsRef.current.add(id);
          pendingIdsRef.current.add(id);
          addedCount += 1;
        }
      }

      if (addedCount === 0) {
        return;
      }

      decrementNotificationsUnreadCount(queryClient, addedCount);

      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = setTimeout(
        flushPendingReads,
        MARK_READ_DEBOUNCE_MS,
      );
    },
    [flushPendingReads, queryClient],
  );

  const scheduleMarkAsReadRef = useRef(scheduleMarkAsRead);
  useEffect(() => {
    scheduleMarkAsReadRef.current = scheduleMarkAsRead;
  }, [scheduleMarkAsRead]);

  const flushPendingReadsRef = useRef(flushPendingReads);
  useEffect(() => {
    flushPendingReadsRef.current = flushPendingReads;
  }, [flushPendingReads]);

  useEffect(
    () => () => {
      flushPendingReadsRef.current();
    },
    [],
  );

  const onViewableItemsChanged = useRef(
    (info: {viewableItems: ViewToken[]}) => {
      const ids = info.viewableItems
        .map(token => (token.item as NotificationCardItem | undefined)?.id)
        .filter((id): id is string => typeof id === 'string');

      if (ids.length > 0) {
        scheduleMarkAsReadRef.current(ids);
      }
    },
  ).current;

  const handleMarkAllRead = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    pendingIdsRef.current.clear();

    for (const item of newCardItems) {
      sentReadIdsRef.current.add(item.id);
    }

    setMarkedAllRead(true);
    setNotificationsUnreadCount(queryClient, 0);
    markAllReadMutation.mutate();
  }, [markAllReadMutation, newCardItems, queryClient]);

  const [listHeight, setListHeight] = useState(0);
  const [contentHeight, setContentHeight] = useState(0);

  const handleListLayout = useCallback((event: LayoutChangeEvent) => {
    setListHeight(event.nativeEvent.layout.height);
  }, []);

  const handleContentSizeChange = useCallback(
    (_width: number, height: number) => {
      setContentHeight(height);
    },
    [],
  );

  const isEmpty = allNotifications.length === 0;
  const isOverflowing = contentHeight > listHeight + 1;
  const hasNewItems = newCardItems.length > 0;
  const hasReadItems = readCardItems.length > 0;
  const showMarkAllButton =
    !markedAllRead && markAllButtonCount > 0 && isOverflowing;

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const renderNewItem: ListRenderItem<NotificationCardItem> = useCallback(
    ({item, index}) => (
      <View
        style={[
          styles.cardContainer,
          index === 0 && styles.cardContainerFirst,
          index === newCardItems.length - 1 && styles.cardContainerLast,
        ]}>
        <NotificationCard item={item} onPress={handleCardPress} />
      </View>
    ),
    [handleCardPress, newCardItems.length],
  );

  const listHeader = useMemo(() => {
    if (!hasNewItems) {
      return null;
    }

    return <Text style={styles.sectionTitle}>{t('screen.sections.new')}</Text>;
  }, [hasNewItems, t, i18n.language]);

  const listFooter = useMemo(() => {
    return (
      <View>
        {hasReadItems ? (
          <>
            <Text
              style={[
                styles.sectionTitle,
                hasNewItems
                  ? styles.readSectionTitleWithNew
                  : styles.readSectionTitleAlone,
              ]}>
              {t('screen.sections.read')}
            </Text>
            <View style={styles.readContainer}>
              {readCardItems.map(item => (
                <NotificationCard
                  key={item.id}
                  item={item}
                  onPress={handleCardPress}
                />
              ))}
            </View>
          </>
        ) : null}
        {isFetchingNextPage ? (
          <View style={styles.footerSkeletonContainer}>
            <SkeletonNotificationCard />
          </View>
        ) : null}
      </View>
    );
  }, [handleCardPress, hasNewItems, hasReadItems, isFetchingNextPage, readCardItems, t, i18n.language]);

  return (
    <StatusBarAvoidContainer backgroundColor={SCREEN_BACKGROUND}>
      <Header title={t('screen.title')} backgroundColor={SCREEN_BACKGROUND} />

      {isInitialLoading ? (
        <View style={styles.skeletonContainer}>
          {INITIAL_SKELETON_SLOTS.map(slot => (
            <SkeletonNotificationCard key={slot} />
          ))}
        </View>
      ) : isEmpty ? (
        <View style={styles.emptyContainer}>
          <IconMapper
            icon="bell-search"
            size={64}
            color={EMPTY_ICON_COLOR}
            weight={2}
          />
          <Text style={styles.emptyText}>{t('screen.empty')}</Text>
        </View>
      ) : (
        <FlatList
          data={newCardItems}
          keyExtractor={item => item.id}
          renderItem={renderNewItem}
          ListHeaderComponent={listHeader}
          ListFooterComponent={listFooter}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.3}
          onLayout={handleListLayout}
          onContentSizeChange={handleContentSizeChange}
          style={styles.list}
          contentContainerStyle={[
            styles.listContent,
            showMarkAllButton
              ? styles.listContentWithButton
              : styles.listContentDefault,
          ]}
          showsVerticalScrollIndicator={false}
        />
      )}

      {showMarkAllButton ? (
        <View style={styles.buttonWrap} pointerEvents="box-none">
          <ButtonMain
            title={t('screen.markAllRead', {count: markAllButtonCount})}
            variant="secondary"
            onPress={handleMarkAllRead}
            isLoading={markAllReadMutation.isPending}
          />
        </View>
      ) : null}
    </StatusBarAvoidContainer>
  );
};

const styles = StyleSheet.create({
  skeletonContainer: {
    marginTop: 16,
    backgroundColor: 'rgba(255, 255, 255, 1)',
    borderRadius: 28,
    overflow: 'hidden',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    marginTop: 12,
    color: EMPTY_TEXT_COLOR,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingTop: 16,
  },
  listContentDefault: {
    paddingBottom: 24,
  },
  listContentWithButton: {
    paddingBottom: 96,
  },
  sectionTitle: {
    marginLeft: 16,
    color: SECTION_TITLE_COLOR,
  },
  readSectionTitleWithNew: {
    marginTop: 24,
  },
  readSectionTitleAlone: {
    marginTop: 0,
  },
  cardContainer: {
    backgroundColor: 'rgba(255, 255, 255, 1)',
  },
  cardContainerFirst: {
    marginTop: 16,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  cardContainerLast: {
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  readContainer: {
    marginTop: 16,
    backgroundColor: 'rgba(255, 255, 255, 1)',
    borderRadius: 28,
    overflow: 'hidden',
  },
  footerSkeletonContainer: {
    marginTop: 16,
    backgroundColor: 'rgba(255, 255, 255, 1)',
    borderRadius: 28,
    overflow: 'hidden',
  },
  buttonWrap: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 16,
  },
});
