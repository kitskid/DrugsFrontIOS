import {useCallback, useMemo, useRef} from 'react';
import {useQuery} from '@tanstack/react-query';
import {FlatList, ListRenderItem, StyleSheet, Text, View} from 'react-native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {BottomSheetModal} from '@gorhom/bottom-sheet';
import {useTranslation} from 'react-i18next';

import {
  apiDocuments,
  getPatientFoldersContentsQueryKey,
  STORAGE_USAGE_SUMMARY_QUERY_KEY,
} from '../../../features/api/apiDocuments.ts';
import type {HomeTabStackParamList} from '../../../features/navigation/tabs/HomeTabStack.tsx';
import i18n from '../../../features/localisation/i18n.ts';
import {parseBytes} from '../../../widgets/documentsScreen/formatStorageUsage.ts';
import {useDocumentsQueriesOnFocus} from '../../../widgets/documentsScreen/useDocumentsQueriesOnFocus.ts';
import {CircleIconButton} from '../../../shared/ui/CircleIconButton.tsx';
import {Header} from '../../../shared/ui/Header.tsx';
import {StatusBarAvoidContainer} from '../../../shared/ui/StatusBarAvoidContainer.tsx';
import {AddFileModal} from '../../../shared/ui/drugs/AddFileModal.tsx';
import {
  buildDocumentsScreenListItems,
  type DocumentsScreenListItem,
} from '../../../widgets/documentsScreen/documentsScreenList.ts';
import {FileCard} from '../../../widgets/documentsScreen/FileCard.tsx';
import {FileUploadCard} from '../../../widgets/documentsScreen/FileUploadCard.tsx';
import {DocumentsScreenSkeleton} from '../../../widgets/documentsScreen/DocumentsScreenSkeleton.tsx';
import {FolderCard} from '../../../widgets/documentsScreen/FolderCard.tsx';
import {StorageCard} from '../../../widgets/documentsScreen/StorageCard.tsx';
import {useDocumentFileUpload} from '../../../widgets/documentsScreen/useDocumentFileUpload.ts';

type DocumentsScreenProps = NativeStackScreenProps<
    HomeTabStackParamList,
    'DocumentsScreen'
>;

export const DocumentsScreen = ({navigation}: DocumentsScreenProps) => {
    const {t} = useTranslation('documents', {i18n});
    const addFileModalRef = useRef<BottomSheetModal>(null);
    useDocumentsQueriesOnFocus();

    const {data: storageUsageSummary, isLoading: isStorageUsageLoading} = useQuery({
        queryKey: STORAGE_USAGE_SUMMARY_QUERY_KEY,
        queryFn: async () => {
            const response = await apiDocuments.getStorageUsageSummary();
            return response.data;
        },
        staleTime: Infinity,
    });

    const {data: foldersContents, isPending: isFoldersContentsPending} = useQuery({
        queryKey: getPatientFoldersContentsQueryKey(),
        queryFn: async () => {
            const response = await apiDocuments.getPatientFoldersContents();
            return response.data;
        },
    });

    const isFoldersContentsInitialLoading = isFoldersContentsPending && foldersContents == null;
    const {uploadingFiles, handleFileSelected, handleCancelUpload} = useDocumentFileUpload();

    const folders = useMemo(
        () => foldersContents?.folders ?? [],
        [foldersContents?.folders],
    );
    const files = useMemo(
        () => foldersContents?.files ?? [],
        [foldersContents?.files],
    );
    const listData = useMemo(
        () => buildDocumentsScreenListItems(uploadingFiles, files),
        [files, uploadingFiles],
    );
    const listCount = listData.length;
    const hasFolders = folders.length > 0;
    const hasFilesSection = listCount > 0;

    const renderListItem: ListRenderItem<DocumentsScreenListItem> = useCallback(
        ({item, index}) => (
            <View
                style={[
                    styles.fileItemContainer,
                    index === 0 && styles.fileItemFirst,
                    index === listCount - 1 && styles.fileItemLast,
                ]}>
                {item.type === 'upload' ? (
                    <FileUploadCard
                        localId={item.upload.localId}
                        fileName={item.upload.fileName}
                        fileType={item.upload.fileType}
                        sizeBytes={item.upload.sizeBytes}
                        progress={item.upload.progress}
                        onCancelUpload={() => {
                            handleCancelUpload(item.upload.localId).catch(() => undefined);
                        }}
                    />
                ) : (
                    <FileCard
                        document={item.file.document}
                        onPress={() =>
                            navigation.navigate('FileScreen', {
                                document: item.file.document,
                                breadcrumb: item.file.breadcrumb,
                            })
                        }
                    />
                )}
            </View>
        ),
        [handleCancelUpload, listCount, navigation],
    );

    const listHeader = useMemo(
        () => (
            <View>
                <StorageCard
                    usedBytes={parseBytes(storageUsageSummary?.usedBytes ?? '0')}
                    limitBytes={parseBytes(storageUsageSummary?.limitBytes ?? '0')}
                    isLoading={isStorageUsageLoading}
                />
                {isFoldersContentsInitialLoading ? (
                    <DocumentsScreenSkeleton />
                ) : (
                    <>
                        {hasFolders ? (
                            <>
                                <Text style={styles.sectionTitle}>{t('sections.folders')}</Text>
                                <View style={styles.foldersContainer}>
                                    {folders.map(folder => (
                                        <FolderCard
                                            key={folder.id}
                                            folder={folder}
                                            onPress={() =>
                                                navigation.navigate('FolderScreen', {
                                                    parentId: folder.id,
                                                    title: folder.name,
                                                })
                                            }
                                        />
                                    ))}
                                </View>
                            </>
                        ) : null}
                        {hasFilesSection ? <Text style={styles.filesTitle}>{t('sections.files')}</Text> : null}
                    </>
                )}
            </View>
        ),
        [
            folders,
            hasFilesSection,
            hasFolders,
            isFoldersContentsInitialLoading,
            isStorageUsageLoading,
            navigation,
            storageUsageSummary,
            t,
        ],
    );

    return (
        <StatusBarAvoidContainer backgroundColor={'rgba(247, 246, 251, 1)'}>
            <Header
                title={t('screenTitles.documents')}
                backgroundColor={'rgba(247, 246, 251, 1)'}
                rightIcon="search"
                onRightIconPress={() => navigation.navigate('SearchScreen')}
            />
            <FlatList
                data={listData}
                keyExtractor={item => item.key}
                renderItem={renderListItem}
                ListHeaderComponent={listHeader}
                style={styles.list}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
            />
            <CircleIconButton
                icon="file-plus-corner"
                onPress={() => addFileModalRef.current?.present()}
                style={styles.addButton}
            />
            <AddFileModal ref={addFileModalRef} onFileSelected={handleFileSelected} />
        </StatusBarAvoidContainer>
    );
};

const styles = StyleSheet.create({
    list: {
        flex: 1,
    },
    listContent: {
        paddingTop: 16,
        paddingBottom: 24,
    },
    sectionTitle: {
        marginTop: 24,
        marginLeft: 12,
        color: 'rgba(29, 26, 73, 1)',
    },
    foldersContainer: {
        marginTop: 16,
        backgroundColor: 'rgba(255, 255, 255, 1)',
        borderRadius: 28,
        paddingVertical: 8,
    },
    filesTitle: {
        marginTop: 24,
        marginLeft: 12,
        color: 'rgba(29, 26, 73, 1)',
    },
    fileItemContainer: {
        backgroundColor: 'rgba(255, 255, 255, 1)',
    },
    fileItemFirst: {
        marginTop: 16,
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        paddingTop: 8,
    },
    fileItemLast: {
        borderBottomLeftRadius: 28,
        borderBottomRightRadius: 28,
        paddingBottom: 8,
    },
    addButton: {
        position: 'absolute',
        right: 12,
        bottom: 16,
    },
});
