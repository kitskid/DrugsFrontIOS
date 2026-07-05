import {useCallback, useMemo, useRef} from 'react';
import {useQuery} from '@tanstack/react-query';
import {FlatList, ListRenderItem, StyleSheet, Text, View} from 'react-native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {BottomSheetModal} from '@gorhom/bottom-sheet';
import {useTranslation} from 'react-i18next';

import {
  apiDocuments,
  getPatientFoldersContentsQueryKey,
} from '../../../features/api/apiDocuments.ts';
import type {HomeTabStackParamList} from '../../../features/navigation/tabs/HomeTabStack.tsx';
import i18n from '../../../features/localisation/i18n.ts';
import {CircleIconButton} from '../../../shared/ui/CircleIconButton.tsx';
import {Header} from '../../../shared/ui/Header.tsx';
import {IconMapper} from '../../../shared/ui/IconMapper.tsx';
import {StatusBarAvoidContainer} from '../../../shared/ui/StatusBarAvoidContainer.tsx';
import {AddFileModal} from '../../../shared/ui/drugs/AddFileModal.tsx';
import {
  buildDocumentsScreenListItems,
  type DocumentsScreenListItem,
} from '../../../widgets/documentsScreen/documentsScreenList.ts';
import {FileCard} from '../../../widgets/documentsScreen/FileCard.tsx';
import {FileUploadCard} from '../../../widgets/documentsScreen/FileUploadCard.tsx';
import {FolderScreenSkeleton} from '../../../widgets/documentsScreen/FolderScreenSkeleton.tsx';
import {useDocumentFileUpload} from '../../../widgets/documentsScreen/useDocumentFileUpload.ts';
import {useDocumentsQueriesOnFocus} from '../../../widgets/documentsScreen/useDocumentsQueriesOnFocus.ts';

type FolderScreenProps = NativeStackScreenProps<
    HomeTabStackParamList,
    'FolderScreen'
>;

export const FolderScreen = ({navigation, route}: FolderScreenProps) => {
    const {t} = useTranslation('documents', {i18n});
    const addFileModalRef = useRef<BottomSheetModal>(null);
    const {parentId, title} = route.params;
    useDocumentsQueriesOnFocus();

    const {data: foldersContents, isPending: isFoldersContentsPending} = useQuery({
        queryKey: getPatientFoldersContentsQueryKey(parentId),
        queryFn: async () => {
            const response = await apiDocuments.getPatientFoldersContents({parentId});
            return response.data;
        },
    });

    const isFoldersContentsInitialLoading = isFoldersContentsPending && foldersContents == null;
    const folderId = foldersContents?.folder.id ?? parentId;
    const {uploadingFiles, handleFileSelected, handleCancelUpload} = useDocumentFileUpload({
        folderId,
    });

    const files = useMemo(
        () => foldersContents?.files ?? [],
        [foldersContents?.files],
    );
    const listData = useMemo(
        () => buildDocumentsScreenListItems(uploadingFiles, files),
        [files, uploadingFiles],
    );
    const listCount = listData.length;

    const listEmpty = useMemo(
        () => (
            <View style={styles.emptyContainer}>
                <IconMapper
                    icon="file-search-corner"
                    size={64}
                    color="rgba(199, 198, 217, 1)"
                    weight={0.5}
                />
                <Text style={styles.emptyText}>{t('folderScreen.empty')}</Text>
            </View>
        ),
        [t],
    );

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

    const showSkeleton = isFoldersContentsInitialLoading && uploadingFiles.length === 0;

    return (
        <StatusBarAvoidContainer backgroundColor={'rgba(247, 246, 251, 1)'}>
            <Header
                title={title}
                backgroundColor={'rgba(247, 246, 251, 1)'}
            />
            {showSkeleton ? (
                <FolderScreenSkeleton />
            ) : (
                <FlatList
                    data={listData}
                    keyExtractor={item => item.key}
                    renderItem={renderListItem}
                    ListEmptyComponent={listEmpty}
                    style={styles.list}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                />
            )}
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
        paddingBottom: 24,
    },
    fileItemContainer: {
        backgroundColor: 'rgba(255, 255, 255, 1)',
    },
    fileItemFirst: {
        marginTop: 12,
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        paddingTop: 8,
    },
    fileItemLast: {
        borderBottomLeftRadius: 28,
        borderBottomRightRadius: 28,
        paddingBottom: 8,
    },
    emptyContainer: {
        marginTop: 120,
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
