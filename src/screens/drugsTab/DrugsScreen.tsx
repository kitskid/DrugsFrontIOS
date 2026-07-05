import {useCallback, useEffect, useMemo, useState} from 'react';
import type {LayoutChangeEvent} from 'react-native';
import {StyleSheet, Text, View} from 'react-native';
import Animated from 'react-native-reanimated';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import type {CompositeNavigationProp} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useInfiniteQuery, useQueryClient} from '@tanstack/react-query';
import {GestureDetector} from 'react-native-gesture-handler';
import {useTranslation} from 'react-i18next';

import {StatusBarAvoidContainer} from '../../shared/ui/StatusBarAvoidContainer.tsx';
import {CircleIconButton} from '../../shared/ui/CircleIconButton.tsx';
import {InputMain} from '../../shared/ui/InputMain.tsx';
import {
  pullIndicatorOverlayStyle,
  usePullIndicatorOverlayStyle,
  usePullToRefresh,
} from '../../shared/ui/refreshIndicator/usePullToRefresh.ts';
import {PullToRefreshIndicator} from '../../shared/ui/refreshIndicator/PullToRefreshIndicator.tsx';
import type {AppStackParamList} from '../../app/AppStack';
import type {DrugsTabStackParamList} from '../../features/navigation/tabs/DrugsTabStack';
import {
  apiDrugs,
  DRUGS_LIST_PRESCRIPTIONS_QUERY_KEY,
} from '../../features/api/drugs/apiDrugs.ts';
import {useAppDispatch} from '../../features/redux/hooks.ts';
import {resetDrugsCreateState} from '../../features/redux/drugsCreate/drugsCreateSlice.ts';
import {IconMapper} from '../../shared/ui/IconMapper.tsx';
import {DrugCard} from '../../widgets/drugsScreen/DrugCard.tsx';
import {SkeletonCard} from '../../widgets/drugsScreen/SkeletonCard.tsx';
import i18n from '../../features/localisation/i18n';

const PAGE_SIZE = 20;
const SEARCH_DEBOUNCE_MS = 400;
const SEARCH_INPUT_INDICATOR_GAP = 4;

type DrugsScreenNavigationProp = CompositeNavigationProp<
  NativeStackNavigationProp<DrugsTabStackParamList, 'DrugsScreen'>,
  NativeStackNavigationProp<AppStackParamList>
>;

export const DrugsScreen = () => {
  const {t} = useTranslation('drugsCreate', {i18n});
  const navigation = useNavigation<DrugsScreenNavigationProp>();
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [isPullRefreshing, setIsPullRefreshing] = useState(false);
  const [searchInputBottom, setSearchInputBottom] = useState(0);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery.trim());
    }, SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const searchFilter = debouncedSearchQuery.length > 0 ? debouncedSearchQuery : undefined;

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteQuery({
    queryKey: [...DRUGS_LIST_PRESCRIPTIONS_QUERY_KEY, searchFilter ?? ''],
    queryFn: async ({pageParam}) => {
      const response = await apiDrugs.getMedicationPrescriptions({
        offset: pageParam,
        limit: PAGE_SIZE,
        ...(searchFilter ? {customMedicationName: searchFilter} : {}),
      });
      return response.data;
    },
    initialPageParam: 0,
    getNextPageParam: lastPage =>
      lastPage.meta.hasNext ? lastPage.meta.offset + lastPage.meta.limit : undefined,
  });

  useFocusEffect(
    useCallback(() => {
      void queryClient.invalidateQueries({queryKey: DRUGS_LIST_PRESCRIPTIONS_QUERY_KEY});
    }, [queryClient]),
  );

  const prescriptions = useMemo(
    () => data?.pages.flatMap(page => page.data) ?? [],
    [data],
  );

  const handleLoadMore = () => {
    if (!hasNextPage || isFetchingNextPage) {
      return;
    }

    void fetchNextPage();
  };

  const handleSearchInputLayout = useCallback((event: LayoutChangeEvent) => {
    const {y, height} = event.nativeEvent.layout;
    setSearchInputBottom(y + height);
  }, []);

  const handlePullRefresh = useCallback(() => {
    setIsPullRefreshing(true);

    void queryClient
      .refetchQueries({queryKey: DRUGS_LIST_PRESCRIPTIONS_QUERY_KEY})
      .finally(() => {
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

  const pullIndicatorAnchorTop =
    searchInputBottom > 0 ? searchInputBottom + SEARCH_INPUT_INDICATOR_GAP : null;

  const pullIndicatorOverlayAnimatedStyle = usePullIndicatorOverlayStyle(
    pullIndicatorAnchorTop,
    pullDistance,
    pullProgress,
    isPullRefreshing,
  );

  const showSkeletons =
    isPullRefreshing || (isLoading && prescriptions.length === 0);

  const listElement = (
    <Animated.FlatList
      data={prescriptions}
      keyExtractor={item => item.id}
      renderItem={({item}) => (
        <DrugCard
          drug={item}
          onPress={() => {
            navigation.navigate('DrugsCreate', {
              screen: 'DrugsCreateScreen',
              params: {prescriptionId: item.id},
            });
          }}
        />
      )}
      style={styles.list}
      contentContainerStyle={
        prescriptions.length === 0 ? styles.emptyListContent : undefined
      }
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      onEndReached={handleLoadMore}
      onEndReachedThreshold={0.4}
      onScroll={scrollHandler}
      scrollEventThrottle={16}
      bounces={isIosPullEnabled}
      alwaysBounceVertical={isIosPullEnabled}
      overScrollMode="never"
      ListEmptyComponent={
        <View style={styles.emptyContainer}>
          <IconMapper
            icon="pill-search"
            size={64}
            color="rgba(199, 198, 217, 1)"
            weight={1.5}
          />
          <Text style={styles.emptyText}>{t('drugsScreen.emptyText')}</Text>
        </View>
      }
      ListFooterComponent={isFetchingNextPage ? <SkeletonCard /> : null}
    />
  );

  return (
    <StatusBarAvoidContainer backgroundColor="rgba(255, 255, 255, 1)">
      <View style={styles.wrapper}>
        <View style={styles.container}>
          <View onLayout={handleSearchInputLayout} style={styles.searchInputWrap}>
            <InputMain
              value={searchQuery}
              onChange={setSearchQuery}
              icon="search"
              placeholder={t('drugsScreen.searchPlaceholder')}
              style={styles.searchInput}
            />
          </View>
          {showSkeletons ? (
            <View style={styles.list}>
              {Array.from({length: 5}, (_, index) => (
                <SkeletonCard key={`initial-skeleton-${index}`} />
              ))}
            </View>
          ) : (
            <View style={styles.listHost}>
              {listGesture ? (
                <GestureDetector gesture={listGesture}>{listElement}</GestureDetector>
              ) : (
                listElement
              )}
            </View>
          )}

          <Animated.View
            style={[
              pullIndicatorOverlayStyle.overlay,
              pullIndicatorOverlayAnimatedStyle,
            ]}
            pointerEvents="none">
            <PullToRefreshIndicator progress={pullProgress} />
          </Animated.View>
        </View>
        <CircleIconButton
          icon={'pill-plus-new'}
          onPress={() => {
            dispatch(resetDrugsCreateState());
            navigation.navigate('DrugsCreate');
          }}
          style={styles.addButton}
        />
      </View>
    </StatusBarAvoidContainer>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 1)',
  },
  container: {
    flex: 1,
    padding: 12,
    paddingBottom: 0,
  },
  searchInputWrap: {
    zIndex: 2,
  },
  searchInput: {
    marginBottom: -16,
  },
  listHost: {
    flex: 1,
  },
  list: {
    flex: 1,
    marginTop: 12,
  },
  emptyListContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
  },
  emptyText: {
    marginTop: 12,
    color: 'rgba(162, 160, 191, 1)',
  },
  addButton: {
    position: 'absolute',
    right: 12,
    bottom: 16,
  },
});
