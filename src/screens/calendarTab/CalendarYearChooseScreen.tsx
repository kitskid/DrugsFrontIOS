import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {useTranslation} from 'react-i18next';
import {useFocusEffect, useNavigation, useRoute} from '@react-navigation/native';
import type {
  NativeStackNavigationProp,
  NativeStackScreenProps,
} from '@react-navigation/native-stack';
import type {LayoutChangeEvent, ViewToken} from 'react-native';
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {useQueryClient} from '@tanstack/react-query';

import type {CalendarTabStackParamList} from '../../features/navigation/tabs/CalendarTabStack.tsx';
import i18n from '../../features/localisation/i18n.ts';
import {Header} from '../../shared/ui/Header.tsx';
import {IconMapper} from '../../shared/ui/IconMapper.tsx';
import {StatusBarAvoidContainer} from '../../shared/ui/StatusBarAvoidContainer.tsx';
import {SmallCalendarCardGroup} from '../../widgets/calendarScreen/SmallCalendarCardGroup.tsx';
import {
  CALENDAR_YEARS_QUERY_PREFIX,
  useMergedCalendarYears,
  usePrefetchCalendarYear,
} from '../../widgets/calendarScreen/useCalendarYears.ts';
import {
  mapCalendarToPreviewCardsByYearMap,
  type CalendarPreviewCardItem,
} from '../../widgets/calendarScreen/mapCalendarData.ts';

type CalendarYearChooseNavigation = NativeStackNavigationProp<
  CalendarTabStackParamList,
  'CalendarYearChooseScreen'
>;

type CalendarYearChooseRoute = NativeStackScreenProps<
  CalendarTabStackParamList,
  'CalendarYearChooseScreen'
>['route'];

const MIN_YEAR = 1980;
const MAX_YEAR = 2080;
const YEAR_CARD_GAP = 16;
const YEAR_ROW_HEIGHT = 24;
const LIST_TOP_OFFSET = 24;
const YEARS_BELOW_CURRENT_TO_PRERENDER = 12;

const CARDS_BLOCK_MARGIN_TOP = 20;
const EMPTY_EVENTS: CalendarPreviewCardItem[] = [];
const YEARS_DATA = Array.from(
  {length: MAX_YEAR - MIN_YEAR + 1},
  (_, index) => MIN_YEAR + index,
);

type YearCardProps = {
  year: number;
  index: number;
  isLast: boolean;
  events: CalendarPreviewCardItem[];
  isError: boolean;
  onPress: (year: number) => void;
  onMeasure: (index: number, height: number) => void;
};

const YearCard = ({
  year,
  index,
  isLast,
  events,
  isError,
  onPress,
  onMeasure,
}: YearCardProps) => {
  const {t} = useTranslation('calendar', {i18n});

  const handlePress = useCallback(() => {
    onPress(year);
  }, [onPress, year]);

  const handleLayout = useCallback(
    (event: LayoutChangeEvent) => {
      onMeasure(index, event.nativeEvent.layout.height);
    },
    [index, onMeasure],
  );

  return (
    <View
      onLayout={handleLayout}
      style={isLast ? undefined : styles.yearCardWrapper}>
      <TouchableOpacity activeOpacity={0.7} onPress={handlePress} style={styles.yearCard}>
        <View style={styles.yearRow}>
          <Text style={styles.yearText}>{year}</Text>
          <IconMapper
            icon="chevron-right"
            size={24}
            color="rgba(199, 198, 217, 1)"
            weight={1.5}
          />
        </View>
        {isError ? (
          <Text style={styles.cardErrorText}>{t('cardLoadError')}</Text>
        ) : null}
        {!isError && events.length > 0 ? (
          <View style={styles.cardsBlock}>
            <SmallCalendarCardGroup items={events} />
          </View>
        ) : null}
      </TouchableOpacity>
    </View>
  );
};

export const CalendarYearChooseScreen = () => {
  const {t} = useTranslation('calendar', {i18n});
  const navigation = useNavigation<CalendarYearChooseNavigation>();
  const route = useRoute<CalendarYearChooseRoute>();
  const queryClient = useQueryClient();
  const {initialMonth, initialYear} = route.params;
  const currentYear = useMemo(() => new Date().getFullYear(), []);
  const [visibleYears, setVisibleYears] = useState<number[]>([
    initialYear,
    currentYear,
  ]);

  const yearsToLoad = useMemo(
    () => Array.from(new Set([initialYear, currentYear, ...visibleYears])),
    [currentYear, initialYear, visibleYears],
  );

  const prefetchYear = usePrefetchCalendarYear();

  useEffect(() => {
    yearsToLoad.forEach(year => {
      prefetchYear(year);
    });
  }, [prefetchYear, yearsToLoad]);

  const {data, isError} = useMergedCalendarYears(yearsToLoad, {
    primaryYear: currentYear,
  });
  const eventsByYear = useMemo(
    () => mapCalendarToPreviewCardsByYearMap(data?.days),
    [data?.days],
  );

  const listRef = useRef<FlatList<number>>(null);
  const initialYearIndex = Math.min(Math.max(initialYear, MIN_YEAR), MAX_YEAR) - MIN_YEAR;
  const initialNumToRender = Math.min(
    initialYearIndex + YEARS_BELOW_CURRENT_TO_PRERENDER + 1,
    YEARS_DATA.length,
  );

  // Heights of rendered year cards (variable, and they grow as data loads).
  // We keep the initially selected year pinned to the top by recomputing its
  // exact offset from real measurements until the user scrolls themselves.
  const cardHeightsRef = useRef<Record<number, number>>({});
  const userScrolledRef = useRef(false);

  const alignToInitialYear = useCallback(() => {
    if (userScrolledRef.current) {
      return;
    }
    for (let i = 0; i <= initialYearIndex; i += 1) {
      if (cardHeightsRef.current[i] == null) {
        return;
      }
    }
    let offset = LIST_TOP_OFFSET;
    for (let i = 0; i < initialYearIndex; i += 1) {
      offset += cardHeightsRef.current[i] + YEAR_CARD_GAP;
    }
    listRef.current?.scrollToOffset({offset, animated: false});
  }, [initialYearIndex]);

  const handleCardMeasure = useCallback(
    (index: number, height: number) => {
      if (cardHeightsRef.current[index] === height) {
        return;
      }
      cardHeightsRef.current[index] = height;
      if (index <= initialYearIndex) {
        alignToInitialYear();
      }
    },
    [alignToInitialYear, initialYearIndex],
  );

  const handleScrollBeginDrag = useCallback(() => {
    userScrolledRef.current = true;
  }, []);

  useFocusEffect(
    useCallback(() => {
      queryClient.invalidateQueries({queryKey: CALENDAR_YEARS_QUERY_PREFIX});
    }, [queryClient]),
  );

  const handleViewableItemsChanged = useRef(
    ({viewableItems}: {viewableItems: ViewToken[]}) => {
      const years = viewableItems
        .map(item => item.item)
        .filter((year): year is number => typeof year === 'number');

      if (years.length === 0) {
        return;
      }

      setVisibleYears(prev => {
        const merged = new Set([...prev, ...years]);
        if (merged.size === prev.length) {
          return prev;
        }
        return Array.from(merged);
      });
    },
  ).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 10,
  }).current;

  const handleYearPress = useCallback(
    (year: number) => {
      navigation.replace('CalendarMonthChooseScreen', {
        initialMonth,
        initialYear: year,
      });
    },
    [initialMonth, navigation],
  );

  const listContentStyle = useMemo(
    () => [styles.scrollContent, {paddingTop: LIST_TOP_OFFSET}],
    [],
  );

  const initialContentOffset = useMemo(
    () => ({x: 0, y: 0}),
    [],
  );

  return (
    <StatusBarAvoidContainer backgroundColor="rgba(247, 246, 251, 1)">
      <Header
        title={t('yearChooseScreenTitle')}
        backgroundColor="rgba(247, 246, 251, 1)"
        rightIcon="x"
        onRightIconPress={() => {
          navigation.popTo('CalendarScreen', {
            initialMonth,
            initialYear,
          });
        }}
      />
      <FlatList
        ref={listRef}
        data={YEARS_DATA}
        keyExtractor={item => item.toString()}
        renderItem={({item, index}) => (
          <YearCard
            year={item}
            index={index}
            isLast={index === YEARS_DATA.length - 1}
            events={eventsByYear[item] ?? EMPTY_EVENTS}
            isError={isError}
            onPress={handleYearPress}
            onMeasure={handleCardMeasure}
          />
        )}
        contentOffset={initialContentOffset}
        initialNumToRender={initialNumToRender}
        maxToRenderPerBatch={initialNumToRender}
        windowSize={31}
        removeClippedSubviews={false}
        contentContainerStyle={listContentStyle}
        showsVerticalScrollIndicator={false}
        onScrollBeginDrag={handleScrollBeginDrag}
        onViewableItemsChanged={handleViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
      />
    </StatusBarAvoidContainer>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 24,
  },
  yearCard: {
    backgroundColor: 'rgba(255, 255, 255, 1)',
    borderRadius: 28,
    paddingVertical: 24,
    paddingHorizontal: 12,
  },
  yearRow: {
    height: YEAR_ROW_HEIGHT,
    paddingLeft: 8,
    paddingRight: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  yearCardWrapper: {
    marginBottom: YEAR_CARD_GAP,
  },
  yearText: {
    color: 'rgba(29, 26, 73, 1)',
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '500',
  },
  cardsBlock: {
    marginTop: CARDS_BLOCK_MARGIN_TOP,
  },
  cardErrorText: {
    marginTop: CARDS_BLOCK_MARGIN_TOP,
    paddingLeft: 8,
    color: 'rgba(134, 132, 168, 1)',
  },
});
