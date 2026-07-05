import {useCallback, useMemo, useRef} from 'react';
import {
  Image,
  LayoutChangeEvent,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import type {CompositeNavigationProp} from '@react-navigation/native';
import type {BottomTabNavigationProp} from '@react-navigation/bottom-tabs';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useQuery} from '@tanstack/react-query';
import LinearGradient from 'react-native-linear-gradient';
import Svg, {Path} from 'react-native-svg';

import type {TabsStackParamList} from '../../../app/TabsStack.tsx';
import type {CalendarResponseDto} from '../../../features/api/apiCalendar.ts';
import type {StorageUsageSummaryDto} from '../../../features/api/apiDocuments.ts';
import {
  apiNotification,
  NOTIFICATIONS_UNREAD_COUNT_QUERY_KEY,
} from '../../../features/api/apiNotification.ts';
import type {HomeTabStackParamList} from '../../../features/navigation/tabs/HomeTabStack.tsx';
import {IconMapper} from '../../../shared/ui/IconMapper.tsx';
import {EventsCalendar} from './eventsCalendar/EventsCalendar.tsx';
import {mapHomeEventsFromCalendarDays} from './eventsCalendar/mapHomeEventsFromCalendarDays.ts';
import {HomeStorageCard} from './HomeStorageCard.tsx';
import {
  getTodayCalendarEvents,
  mapCalendarEventsToNotificationReminders,
} from './notificationGroup/mapCalendarEventsToNotificationReminders.ts';
import {NotificationGroupScroll} from './notificationGroup/NotificationGroupScroll.tsx';

export const HOME_HEADER_GRADIENT_COLORS = [
  'rgba(153, 101, 237, 1)',
  'rgba(77, 172, 255, 1)',
  'rgba(214, 190, 255, 1)',
] as const;

export const HOME_HEADER_GRADIENT_START = {x: 0, y: 0};
export const HOME_HEADER_GRADIENT_END = {x: 1, y: 1};

export const HOME_CONTENT_BACKGROUND = 'rgba(247, 246, 251, 1)';

const CURVE_HEIGHT = 26;
const CURVE_DIP = 17;
const HEADER_CONTENT_TOP_GAP = 12;

type HeaderBottomCurveProps = {
  width: number;
};

const HeaderBottomCurve = ({width}: HeaderBottomCurveProps) => {
  const curvePath = `M 0 0 Q ${width / 2} ${CURVE_DIP} ${width} 0 L ${width} ${CURVE_HEIGHT} L 0 ${CURVE_HEIGHT} Z`;

  return (
    <Svg width={width} height={CURVE_HEIGHT} pointerEvents="none">
      <Path d={curvePath} fill={HOME_CONTENT_BACKGROUND} />
    </Svg>
  );
};

export type HomeListHeaderProps = {
  topInset: number;
  onLayout: (event: LayoutChangeEvent) => void;
  calendarDays?: CalendarResponseDto['days'];
  storageUsage?: StorageUsageSummaryDto;
  foldersCount?: number;
  isStorageCardLoading?: boolean;
};

type HomeListHeaderNavigationProp = CompositeNavigationProp<
  NativeStackNavigationProp<HomeTabStackParamList>,
  BottomTabNavigationProp<TabsStackParamList>
>;

export const HomeListHeader = ({
  topInset,
  onLayout,
  calendarDays,
  storageUsage,
  foldersCount,
  isStorageCardLoading,
}: HomeListHeaderProps) => {
  const topPadding = topInset + HEADER_CONTENT_TOP_GAP;
  const {width: screenWidth} = useWindowDimensions();
  const navigation = useNavigation<HomeListHeaderNavigationProp>();

  const {data: unreadCount = 0} = useQuery({
    queryKey: NOTIFICATIONS_UNREAD_COUNT_QUERY_KEY,
    queryFn: async () => {
      const response = await apiNotification.getUnreadCount();
      return response.data.count;
    },
    staleTime: 0,
  });

  const hasUnreadNotifications = unreadCount > 0;

  const mappedEvents = useMemo(
    () => mapHomeEventsFromCalendarDays(calendarDays),
    [calendarDays],
  );

  const todayReminderSnapshotKeysRef = useRef<Set<string> | null>(null);

  const todayReminders = useMemo(() => {
    if (!calendarDays) {
      return [];
    }

    const todayEvents = getTodayCalendarEvents(calendarDays);
    const allReminders = mapCalendarEventsToNotificationReminders(todayEvents);

    if (todayReminderSnapshotKeysRef.current === null) {
      const initialReminders = mapCalendarEventsToNotificationReminders(
        todayEvents,
        Date.now() - 30 * 60 * 1000,
      );
      todayReminderSnapshotKeysRef.current = new Set(
        initialReminders.map(reminder => reminder.snapshotKey),
      );
      return initialReminders;
    }

    allReminders.forEach(reminder => {
      todayReminderSnapshotKeysRef.current?.add(reminder.snapshotKey);
    });

    return allReminders.filter(reminder =>
      todayReminderSnapshotKeysRef.current?.has(reminder.snapshotKey),
    );
  }, [calendarDays]);

  const handleCalendarPress = useCallback(() => {
    navigation.navigate('CalendarTab');
  }, [navigation]);

  const handleStorageCardPress = useCallback(() => {
    navigation.navigate('DocumentsScreen');
  }, [navigation]);

  const handleNotificationsPress = useCallback(() => {
    navigation.navigate('NotificationsScreen');
  }, [navigation]);

  return (
    <View style={styles.headerRoot}>
      <LinearGradient
        colors={[...HOME_HEADER_GRADIENT_COLORS]}
        start={HOME_HEADER_GRADIENT_START}
        end={HOME_HEADER_GRADIENT_END}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      <View onLayout={onLayout} style={styles.headerBody}>
        <View style={[styles.headerContent, {paddingTop: topPadding}]}>
          <View style={styles.headerTopRow}>
            <Image
              source={require('../../../../assets/images/logoOutline.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleNotificationsPress}
              hitSlop={12}
              style={styles.bellButton}>
              <IconMapper icon="bell" size={24} color="rgba(255, 255, 255, 1)" />
              {hasUnreadNotifications ? <View style={styles.bellBadge} /> : null}
            </TouchableOpacity>
          </View>

          <NotificationGroupScroll reminders={todayReminders} />

          <EventsCalendar
            mappedEvents={mappedEvents}
            onCalendarPress={handleCalendarPress}
          />
          <HomeStorageCard
            storageUsage={storageUsage}
            foldersCount={foldersCount}
            isLoading={isStorageCardLoading}
            onPress={handleStorageCardPress}
          />
        </View>

        <View style={styles.headerCurveWrap}>
          <HeaderBottomCurve width={screenWidth} />
        </View>
      </View>
    </View>
  );
};

export const HeaderGradientFill = () => (
  <LinearGradient
    colors={[...HOME_HEADER_GRADIENT_COLORS]}
    start={HOME_HEADER_GRADIENT_START}
    end={HOME_HEADER_GRADIENT_END}
    style={StyleSheet.absoluteFill}
  />
);

const styles = StyleSheet.create({
  listHeaderWrap: {
    overflow: 'visible',
  },
  headerRoot: {
    overflow: 'visible',
  },
  headerBody: {
    position: 'relative',
  },
  headerContent: {
    zIndex: 1,
    paddingHorizontal: 16,
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
  logo: {
    width: 175,
    height: 32,
  },
  bellButton: {
    position: 'relative',
  },
  bellBadge: {
    position: 'absolute',
    top: -1,
    right: -1,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(216, 72, 206, 1)',
  },
});

export const homeListHeaderWrapStyle = styles.listHeaderWrap;
