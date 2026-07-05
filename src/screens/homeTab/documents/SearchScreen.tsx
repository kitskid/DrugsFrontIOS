import {useCallback, useEffect, useMemo, useState} from 'react';
import {useInfiniteQuery} from '@tanstack/react-query';
import {FlatList, ListRenderItem, StyleSheet, Text, View} from 'react-native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useTranslation} from 'react-i18next';

import {
  apiDocuments,
  getPatientFoldersSearchQueryKey,
  type PatientFolderDocumentItemDto,
  type PatientFolderDto,
} from '../../../features/api/apiDocuments.ts';
import type {HomeTabStackParamList} from '../../../features/navigation/tabs/HomeTabStack.tsx';
import i18n from '../../../features/localisation/i18n.ts';
import {Header} from '../../../shared/ui/Header.tsx';
import {IconMapper} from '../../../shared/ui/IconMapper.tsx';
import {InputMain} from '../../../shared/ui/InputMain.tsx';
import {StatusBarAvoidContainer} from '../../../shared/ui/StatusBarAvoidContainer.tsx';
import {FileCard} from '../../../widgets/documentsScreen/FileCard.tsx';
import {FolderCard} from '../../../widgets/documentsScreen/FolderCard.tsx';
import {FolderCardSkeleton} from '../../../widgets/documentsScreen/FolderCardSkeleton.tsx';
import {useDocumentsQueriesOnFocus} from '../../../widgets/documentsScreen/useDocumentsQueriesOnFocus.ts';

type SearchScreenProps = NativeStackScreenProps<
    HomeTabStackParamList,
    'SearchScreen'
>;

type SearchListItem =
    | {type: 'folder'; id: string; folder: PatientFolderDto}
    | {type: 'file'; id: string; item: PatientFolderDocumentItemDto};

const SEARCH_DEBOUNCE_MS = 400;
const PAGE_SIZE = 20;
const INITIAL_SKELETON_COUNT = 3;

export const SearchScreen = ({navigation}: SearchScreenProps) => {
    const {t} = useTranslation('documents', {i18n});
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
    useDocumentsQueriesOnFocus();

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            setDebouncedSearchQuery(searchQuery.trim());
        }, SEARCH_DEBOUNCE_MS);

        return () => clearTimeout(timeoutId);
    }, [searchQuery]);

    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading,
        isFetched,
    } = useInfiniteQuery({
        queryKey: getPatientFoldersSearchQueryKey(debouncedSearchQuery),
        queryFn: async ({pageParam}) => {
            const response = await apiDocuments.searchPatientFolders({
                ...(debouncedSearchQuery ? {q: debouncedSearchQuery} : {}),
                limit: PAGE_SIZE,
                offset: pageParam,
            });
            return response.data;
        },
        initialPageParam: 0,
        getNextPageParam: lastPage =>
            lastPage.meta.hasNext ? lastPage.meta.offset + lastPage.meta.limit : undefined,
    });

    const searchResults = useMemo(() => {
        const folders = data?.pages.flatMap(page => page.folders) ?? [];
        const files = data?.pages.flatMap(page => page.files) ?? [];

        return [
            ...folders.map(folder => ({
                type: 'folder' as const,
                id: `folder-${folder.id}`,
                folder,
            })),
            ...files.map(item => ({
                type: 'file' as const,
                id: `file-${item.document.id}`,
                item,
            })),
        ];
    }, [data]);

    const showInitialSkeletons = isLoading && searchResults.length === 0;
    const showEmptySearch =
        isFetched && !isLoading && !isFetchingNextPage && searchResults.length === 0;

    const handleLoadMore = useCallback(() => {
        if (!hasNextPage || isFetchingNextPage) {
            return;
        }

        fetchNextPage().catch(() => undefined);
    }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

    const listEmpty = useMemo(
        () => (
            <View style={styles.emptyContainer}>
                <IconMapper
                    icon="file-search-corner"
                    size={64}
                    color="rgba(199, 198, 217, 1)"
                    weight={0.5}
                />
                <Text style={styles.emptyTitle}>{t('searchScreen.emptyTitle')}</Text>
                <Text style={styles.emptySubtitle}>
                    {t('searchScreen.emptySubtitle')}
                </Text>
            </View>
        ),
        [t],
    );

    const renderItem: ListRenderItem<SearchListItem> = useCallback(
        ({item}) => {
            if (item.type === 'folder') {
                return (
                    <FolderCard
                        folder={item.folder}
                        onPress={() =>
                            navigation.navigate('FolderScreen', {
                                parentId: item.folder.id,
                                title: item.folder.name,
                            })
                        }
                    />
                );
            }

            return (
                <FileCard
                    document={item.item.document}
                    onPress={() =>
                        navigation.navigate('FileScreen', {
                            document: item.item.document,
                            breadcrumb: item.item.breadcrumb,
                        })
                    }
                />
            );
        },
        [navigation],
    );

    return (
        <StatusBarAvoidContainer backgroundColor={'rgba(255, 255, 255, 1)'}>
            <Header title={t('screenTitles.search')} backgroundColor={'rgba(255, 255, 255, 1)'}/>
            <View style={styles.content}>
                <InputMain
                    value={searchQuery}
                    onChange={setSearchQuery}
                    icon="search"
                    isX
                    autoFocus
                    placeholder={t('searchScreen.placeholder')}
                    style={styles.searchInput}
                />
                {showInitialSkeletons ? (
                    <View style={styles.list}>
                        {Array.from({length: INITIAL_SKELETON_COUNT}, (_, index) => (
                            <FolderCardSkeleton key={`search-skeleton-${index}`} />
                        ))}
                    </View>
                ) : (
                    <FlatList
                        data={searchResults}
                        keyExtractor={item => item.id}
                        renderItem={renderItem}
                        ListEmptyComponent={showEmptySearch ? listEmpty : null}
                        ListFooterComponent={isFetchingNextPage ? <FolderCardSkeleton /> : null}
                        contentContainerStyle={showEmptySearch ? styles.emptyListContent : undefined}
                        style={styles.list}
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                        onEndReached={handleLoadMore}
                        onEndReachedThreshold={0.4}
                    />
                )}
            </View>
        </StatusBarAvoidContainer>
    );
};

const styles = StyleSheet.create({
    content: {
        flex: 1,
    },
    searchInput: {
        marginTop: 12,
        marginHorizontal: 12,
    },
    list: {
        flex: 1,
        marginTop: 12,
    },
    emptyListContent: {
        flexGrow: 1,
    },
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        paddingTop: 120,
        paddingHorizontal: 24,
    },
    emptyTitle: {
        marginTop: 12,
        color: 'rgba(162, 160, 191, 1)',
        fontWeight: '500',
        fontSize: 18,
    },
    emptySubtitle: {
        marginTop: 12,
        color: 'rgba(162, 160, 191, 1)',
        textAlign: 'center',
    },
});
