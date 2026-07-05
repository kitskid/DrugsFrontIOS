import {useCallback, useMemo, useRef} from 'react';
import {useTranslation} from 'react-i18next';
import {useFocusEffect, useNavigation, useRoute} from '@react-navigation/native';
import type {
  NativeStackNavigationProp,
  NativeStackScreenProps,
} from '@react-navigation/native-stack';
import type {LayoutChangeEvent} from 'react-native';
import {FlatList, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {useQuery, useQueryClient} from '@tanstack/react-query';

import type {DrugsCreateStackParamList} from '../../features/navigation/DrugsCreateStack.tsx';
import {apiCalendar, CALENDAR_QUERY_KEY} from '../../features/api/apiCalendar.ts';
import i18n from '../../features/localisation/i18n.ts';
import {Header} from '../../shared/ui/Header.tsx';
import {IconMapper} from '../../shared/ui/IconMapper.tsx';
import {StatusBarAvoidContainer} from '../../shared/ui/StatusBarAvoidContainer.tsx';
import {SmallCalendarCardGroup} from '../../widgets/calendarScreen/SmallCalendarCardGroup.tsx';
import {
  getYearRange,
  mapCalendarToPreviewCardsByYear,
} from '../../widgets/calendarScreen/mapCalendarData.ts';

type DrugsCreateYearChooseNavigation = NativeStackNavigationProp<
  DrugsCreateStackParamList,
  'DrugsCreateYearChooseScreen'
>;

type DrugsCreateYearChooseRoute = NativeStackScreenProps<
  DrugsCreateStackParamList,
  'DrugsCreateYearChooseScreen'
>['route'];

const MIN_YEAR = 1980;
const MAX_YEAR = 2080;
const YEAR_CARD_GAP = 16;
const YEAR_ROW_HEIGHT = 24;
const LIST_TOP_OFFSET = 24;
const YEARS_BELOW_CURRENT_TO_PRERENDER = 12;

const CARDS_BLOCK_MARGIN_TOP = 20;
const YEARS_DATA = Array.from(
  {length: MAX_YEAR - MIN_YEAR + 1},
  (_, index) => MIN_YEAR + index,
);

const useYearCalendarEvents = (
  year: number,
  prescriptionId: string,
  search: string | undefined,
) => {
  const yearRange = useMemo(() => getYearRange(year), [year]);

  const {data, isLoading, isError} = useQuery({
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

  const events = useMemo(
    () => mapCalendarToPreviewCardsByYear(data?.days),
    [data?.days],
  );

  return {events, isLoading, isError};
};

type YearCardProps = {
  year: number;
  index: number;
  isLast: boolean;
  prescriptionId: string;
  search: string | undefined;
  onPress: (year: number) => void;
  onMeasure: (index: number, height: number) => void;
};

const YearCard = ({
  year,
  index,
  isLast,
  prescriptionId,
  search,
  onPress,
  onMeasure,
}: YearCardProps) => {
  const {events, isLoading, isError} = useYearCalendarEvents(
    year,
    prescriptionId,
    search,
  );

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
        {!isLoading && isError ? (
          <Text style={styles.cardErrorText}>Не удалось загрузить</Text>
        ) : null}
        {!isLoading && !isError && events.length > 0 ? (
          <View style={styles.cardsBlock}>
            <SmallCalendarCardGroup items={events} />
          </View>
        ) : null}
      </TouchableOpacity>
    </View>
  );
};

export const DrugsCreateYearChooseScreen = () => {
  const {t} = useTranslation('calendar', {i18n});
  const navigation = useNavigation<DrugsCreateYearChooseNavigation>();
  const route = useRoute<DrugsCreateYearChooseRoute>();
  const queryClient = useQueryClient();
  const {initialMonth, initialYear, prescriptionId, search} = route.params;
  const listRef = useRef<FlatList<number>>(null);
  const initialYearIndex =
    Math.min(Math.max(initialYear, MIN_YEAR), MAX_YEAR) - MIN_YEAR;
  const initialNumToRender = Math.min(
    initialYearIndex + YEARS_BELOW_CURRENT_TO_PRERENDER + 1,
    YEARS_DATA.length,
  );

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
      queryClient.invalidateQueries({queryKey: CALENDAR_QUERY_KEY});
    }, [queryClient]),
  );

  const handleYearPress = useCallback(
    (year: number) => {
      navigation.replace('DrugsCreateMonthChooseScreen', {
        prescriptionId,
        initialMonth,
        initialYear: year,
        search,
      });
    },
    [initialMonth, navigation, prescriptionId, search],
  );

  const listContentStyle = useMemo(
    () => [styles.scrollContent, {paddingTop: LIST_TOP_OFFSET}],
    [],
  );

  const initialContentOffset = useMemo(() => ({x: 0, y: 0}), []);

  return (
    <StatusBarAvoidContainer backgroundColor="rgba(247, 246, 251, 1)">
      <Header
        title={t('yearChooseScreenTitle')}
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
      <FlatList
        ref={listRef}
        data={YEARS_DATA}
        keyExtractor={item => item.toString()}
        renderItem={({item, index}) => (
          <YearCard
            year={item}
            index={index}
            isLast={index === YEARS_DATA.length - 1}
            prescriptionId={prescriptionId}
            search={search}
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
