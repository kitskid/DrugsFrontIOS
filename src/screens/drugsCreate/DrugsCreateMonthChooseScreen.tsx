import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {useTranslation} from 'react-i18next';
import {useFocusEffect, useNavigation, useRoute} from '@react-navigation/native';
import type {
  NativeStackNavigationProp,
  NativeStackScreenProps,
} from '@react-navigation/native-stack';
import type {NativeScrollEvent, NativeSyntheticEvent} from 'react-native';
import {
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import {useQuery, useQueryClient} from '@tanstack/react-query';

import type {DrugsCreateStackParamList} from '../../features/navigation/DrugsCreateStack.tsx';
import {apiCalendar, CALENDAR_QUERY_KEY} from '../../features/api/apiCalendar.ts';
import i18n from '../../features/localisation/i18n.ts';
import {Header} from '../../shared/ui/Header.tsx';
import {IconMapper} from '../../shared/ui/IconMapper.tsx';
import {StatusBarAvoidContainer} from '../../shared/ui/StatusBarAvoidContainer.tsx';
import {YearsScroll} from '../../widgets/calendarScreen/YearsScroll.tsx';
import {SmallCalendarCardGroup} from '../../widgets/calendarScreen/SmallCalendarCardGroup.tsx';
import {
  getYearRange,
  mapCalendarToPreviewCardsByMonth,
  type CalendarPreviewCardItem,
} from '../../widgets/calendarScreen/mapCalendarData.ts';

const MIN_YEAR = 1980;
const MAX_YEAR = 2080;
const MONTH_CARD_GAP = 16;
const LIST_TOP_OFFSET = 16;
const CARDS_BLOCK_MARGIN_TOP = 16;

type MonthEventItem = CalendarPreviewCardItem;

const buildEventKey = (year: number, monthIndex: number): string =>
  `${year}-${monthIndex}`;

const MONTH_KEYS = [
  'jan',
  'feb',
  'mar',
  'apr',
  'may',
  'jun',
  'jul',
  'aug',
  'sep',
  'oct',
  'nov',
  'dec',
] as const;

const YEARS = Array.from(
  {length: MAX_YEAR - MIN_YEAR + 1},
  (_, index) => MIN_YEAR + index,
);

type DrugsCreateMonthChooseNavigation = NativeStackNavigationProp<
  DrugsCreateStackParamList,
  'DrugsCreateMonthChooseScreen'
>;

type DrugsCreateMonthChooseRoute = NativeStackScreenProps<
  DrugsCreateStackParamList,
  'DrugsCreateMonthChooseScreen'
>['route'];

type MonthCardProps = {
  monthIndex: number;
  monthLabel: string;
  year: number;
  events: MonthEventItem[];
  isLast: boolean;
  onPress: (monthIndex: number) => void;
};

const MonthCard = ({
  monthIndex,
  monthLabel,
  year,
  events,
  isLast,
  onPress,
}: MonthCardProps) => {
  const handlePress = useCallback(() => {
    onPress(monthIndex);
  }, [monthIndex, onPress]);

  return (
    <View style={isLast ? undefined : styles.monthCardWrapper}>
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={handlePress}
        style={styles.monthCard}>
        <View style={styles.monthRow}>
          <Text style={styles.monthText}>
            {monthLabel} <Text style={styles.yearText}>{year}</Text>
          </Text>
          <IconMapper
            icon="chevron-right"
            size={24}
            color="rgba(199, 198, 217, 1)"
            weight={1.5}
          />
        </View>
        {events.length > 0 ? (
          <View style={styles.cardsBlock}>
            <SmallCalendarCardGroup items={events} />
          </View>
        ) : null}
      </TouchableOpacity>
    </View>
  );
};

type MonthYearPageProps = {
  year: number;
  width: number;
  height: number;
  monthLabels: string[];
  eventsByMonth: Record<string, MonthEventItem[]>;
  onMonthPress: (monthIndex: number, year: number) => void;
};

const MonthYearPage = ({
  year,
  width,
  height,
  monthLabels,
  eventsByMonth,
  onMonthPress,
}: MonthYearPageProps) => {
  const handlePress = useCallback(
    (monthIndex: number) => {
      onMonthPress(monthIndex, year);
    },
    [onMonthPress, year],
  );

  return (
    <View style={{width, height}}>
      <ScrollView
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}>
        {monthLabels.map((monthLabel, monthIndex) => (
          <MonthCard
            key={monthIndex}
            monthIndex={monthIndex}
            monthLabel={monthLabel}
            year={year}
            events={eventsByMonth[buildEventKey(year, monthIndex)] ?? []}
            isLast={monthIndex === monthLabels.length - 1}
            onPress={handlePress}
          />
        ))}
      </ScrollView>
    </View>
  );
};

export const DrugsCreateMonthChooseScreen = () => {
  const {t} = useTranslation('calendar', {i18n});
  const navigation = useNavigation<DrugsCreateMonthChooseNavigation>();
  const route = useRoute<DrugsCreateMonthChooseRoute>();
  const queryClient = useQueryClient();
  const {initialYear, initialMonth, prescriptionId, search} = route.params;
  const {width: windowWidth} = useWindowDimensions();

  const initialSelectedYear = Math.min(
    Math.max(initialYear, MIN_YEAR),
    MAX_YEAR,
  );
  const [selectedYear, setSelectedYear] = useState<number>(initialSelectedYear);
  const [pagerHeight, setPagerHeight] = useState<number>(0);

  const yearRange = useMemo(() => getYearRange(selectedYear), [selectedYear]);

  const {data: calendarData, isError: isCalendarError} = useQuery({
    queryKey: [
      ...CALENDAR_QUERY_KEY,
      'prescription',
      prescriptionId,
      yearRange.from,
      yearRange.to,
    ],
    queryFn: async () => {
      const response = await apiCalendar.getCalendar({...yearRange, search});
      return response.data;
    },
  });

  useFocusEffect(
    useCallback(() => {
      queryClient.invalidateQueries({queryKey: CALENDAR_QUERY_KEY});
    }, [queryClient]),
  );

  const eventsByMonth = useMemo(
    () => mapCalendarToPreviewCardsByMonth(calendarData?.days),
    [calendarData?.days],
  );

  const pagerRef = useRef<FlatList<number>>(null);
  const selectedIndex = selectedYear - MIN_YEAR;
  const currentIndexRef = useRef<number>(selectedIndex);

  const monthLabels = useMemo(
    () => MONTH_KEYS.map(key => t(`months.${key}`)),
    [t],
  );

  useEffect(() => {
    const prevIndex = currentIndexRef.current;
    if (prevIndex === selectedIndex) {
      return;
    }
    currentIndexRef.current = selectedIndex;
    pagerRef.current?.scrollToIndex({
      index: selectedIndex,
      animated: Math.abs(selectedIndex - prevIndex) <= 1,
    });
  }, [selectedIndex]);

  useEffect(() => {
    if (pagerHeight <= 0 || windowWidth <= 0) {
      return;
    }
    pagerRef.current?.scrollToOffset({
      offset: currentIndexRef.current * windowWidth,
      animated: false,
    });
  }, [windowWidth, pagerHeight]);

  const handleMomentumScrollEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (windowWidth <= 0) {
        return;
      }
      const index = Math.round(event.nativeEvent.contentOffset.x / windowWidth);
      if (index < 0 || index >= YEARS.length) {
        return;
      }
      currentIndexRef.current = index;
      const nextYear = MIN_YEAR + index;
      setSelectedYear(prev => (prev === nextYear ? prev : nextYear));
    },
    [windowWidth],
  );

  const handleMonthPress = useCallback(
    (monthIndex: number, year: number) => {
      navigation.popTo('DrugsCreateScreen', {
        prescriptionId,
        initialMonth: monthIndex,
        initialYear: year,
        activeTab: 'intakes',
      });
    },
    [navigation, prescriptionId],
  );

  const getItemLayout = useCallback(
    (_: ArrayLike<number> | null | undefined, index: number) => ({
      length: windowWidth,
      offset: windowWidth * index,
      index,
    }),
    [windowWidth],
  );

  const renderItem = useCallback(
    ({item}: {item: number}) => (
      <MonthYearPage
        year={item}
        width={windowWidth}
        height={pagerHeight}
        monthLabels={monthLabels}
        eventsByMonth={eventsByMonth}
        onMonthPress={handleMonthPress}
      />
    ),
    [eventsByMonth, handleMonthPress, monthLabels, pagerHeight, windowWidth],
  );

  return (
    <StatusBarAvoidContainer backgroundColor="rgba(247, 246, 251, 1)">
      <Header
        title={t('monthChooseScreenTitle')}
        backgroundColor="rgba(247, 246, 251, 1)"
        rightIcon="x"
        onRightIconPress={() => {
          navigation.popTo('DrugsCreateScreen', {
            prescriptionId,
            initialMonth,
            initialYear,
            activeTab: 'intakes',
          });
        }}
      />
      <YearsScroll
        minYear={MIN_YEAR}
        maxYear={MAX_YEAR}
        selectedYear={selectedYear}
        onYearChange={setSelectedYear}
      />
      {isCalendarError ? (
        <Text style={styles.errorText}>Не удалось загрузить календарь</Text>
      ) : null}
      <View
        style={styles.pagerContainer}
        onLayout={event => {
          const nextHeight = Math.round(event.nativeEvent.layout.height);
          if (nextHeight > 0) {
            setPagerHeight(prev => (prev === nextHeight ? prev : nextHeight));
          }
        }}>
        {pagerHeight > 0 ? (
          <FlatList
            ref={pagerRef}
            data={YEARS}
            keyExtractor={year => String(year)}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            initialScrollIndex={selectedIndex}
            getItemLayout={getItemLayout}
            renderItem={renderItem}
            onMomentumScrollEnd={handleMomentumScrollEnd}
            initialNumToRender={1}
            maxToRenderPerBatch={2}
            windowSize={3}
            removeClippedSubviews
          />
        ) : null}
      </View>
    </StatusBarAvoidContainer>
  );
};

const styles = StyleSheet.create({
  pagerContainer: {
    flex: 1,
  },
  listContent: {
    paddingTop: LIST_TOP_OFFSET,
    paddingBottom: 24,
  },
  monthCard: {
    backgroundColor: 'rgba(255, 255, 255, 1)',
    borderRadius: 28,
    paddingVertical: 24,
    paddingLeft: 20,
    paddingRight: 24,
  },
  monthRow: {
    minHeight: 24,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  monthCardWrapper: {
    marginBottom: MONTH_CARD_GAP,
  },
  monthText: {
    color: 'rgba(29, 26, 73, 1)',
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '500',
  },
  yearText: {
    color: 'rgba(162, 160, 191, 1)',
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '500',
  },
  cardsBlock: {
    marginTop: CARDS_BLOCK_MARGIN_TOP,
  },
  errorText: {
    marginHorizontal: 16,
    marginBottom: 8,
    textAlign: 'center',
    color: 'rgba(134, 132, 168, 1)',
  },
});
