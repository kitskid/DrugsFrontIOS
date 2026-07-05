import {useCallback, useMemo, useRef, useState} from 'react';
import {ScrollView, StyleSheet, Text, View} from 'react-native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useFocusEffect} from '@react-navigation/native';
import {useQuery, useQueryClient} from '@tanstack/react-query';
import type {QueryClient} from '@tanstack/react-query';
import {BottomSheetModal} from '@gorhom/bottom-sheet';
import {useTranslation} from 'react-i18next';

import {
  apiDocuments,
  getPatientFoldersContentsQueryKey,
  invalidateDocumentsQueries,
  PATIENT_FOLDERS_CONTENTS_QUERY_KEY,
  PATIENT_FOLDERS_SEARCH_QUERY_KEY,
  type PatientFolderDto,
  type PatientFoldersContentsDto,
  type PatientFoldersSearchResponseDto,
} from '../../../features/api/apiDocuments.ts';
import type {PrescriptionDocumentDto} from '../../../features/api/drugs/apiDrugs.ts';
import type {HomeTabStackParamList} from '../../../features/navigation/tabs/HomeTabStack.tsx';
import i18n from '../../../features/localisation/i18n.ts';
import {useToast} from '../../../features/toasts/useToast.ts';
import {apiFiles} from '../../../features/api/files/apiFiles.ts';
import {formatDocumentUploadedDate} from '../../../widgets/documentsScreen/formatDocumentDate.ts';
import {formatFileSize} from '../../../widgets/documentsScreen/formatStorageUsage.ts';
import {ButtonMain} from '../../../shared/ui/ButtonMain.tsx';
import {Header} from '../../../shared/ui/Header.tsx';
import {LabelValueTouchableRightChevron} from '../../../shared/ui/LabelValueTouchableRightChevron.tsx';
import {StatusBarAvoidContainer} from '../../../shared/ui/StatusBarAvoidContainer.tsx';
import {DeleteFileModal} from '../../../widgets/documentsScreen/DeleteFileModal.tsx';
import {FileLocationModal} from '../../../widgets/documentsScreen/FileLocationModal.tsx';
import {FileNameChangeModal} from '../../../widgets/documentsScreen/FileNameChangeModal.tsx';
import {FolderCard} from '../../../widgets/documentsScreen/FolderCard.tsx';
import {findDocumentInCache} from '../../../widgets/documentsScreen/findDocumentInCache.ts';

type FileScreenProps = NativeStackScreenProps<
    HomeTabStackParamList,
    'FileScreen'
>;

const resolveLocationFolder = (
    folderId: string | null | undefined,
    breadcrumb?: HomeTabStackParamList['FileScreen']['breadcrumb'],
): PatientFolderDto | null => {
    if (!folderId || !breadcrumb?.length) {
        return null;
    }

    const breadcrumbItem =
        breadcrumb.find(item => item.id === folderId) ?? breadcrumb[breadcrumb.length - 1];

    if (!breadcrumbItem) {
        return null;
    }

    return {
        id: breadcrumbItem.id,
        name: breadcrumbItem.name,
        type: '',
        sortOrder: 0,
        createdAt: '',
        updatedAt: '',
        scope: '',
        meta: {
            filesCount: 0,
            foldersCount: 0,
            totalSizeBytes: 0,
        },
        breadcrumb,
    };
};

const findFolderInCache = (
    queryClient: QueryClient,
    folderId: string,
): PatientFolderDto | null => {
    const contentsQueries = queryClient.getQueriesData<PatientFoldersContentsDto>({
        queryKey: PATIENT_FOLDERS_CONTENTS_QUERY_KEY,
    });

    for (const [, data] of contentsQueries) {
        if (!data) {
            continue;
        }

        if (data.folder.id === folderId) {
            return data.folder;
        }

        const folder = data.folders.find(item => item.id === folderId);
        if (folder) {
            return folder;
        }
    }

    const searchQueries = queryClient.getQueriesData<PatientFoldersSearchResponseDto>({
        queryKey: PATIENT_FOLDERS_SEARCH_QUERY_KEY,
    });

    for (const [, data] of searchQueries) {
        const folder = data?.folders.find(item => item.id === folderId);
        if (folder) {
            return folder;
        }
    }

    return null;
};

export const FileScreen = ({navigation, route}: FileScreenProps) => {
    const {t} = useTranslation('documents', {i18n});
    const {t: tTimePickers} = useTranslation('timePickers', {i18n});
    const queryClient = useQueryClient();
    const deleteFileModalRef = useRef<BottomSheetModal>(null);
    const fileNameChangeModalRef = useRef<BottomSheetModal>(null);
    const fileLocationModalRef = useRef<BottomSheetModal>(null);
    const {document: initialDocument, breadcrumb} = route.params;
    const [document, setDocument] = useState<PrescriptionDocumentDto>(initialDocument);
    const [savedLocationFolder, setSavedLocationFolder] = useState<
        PatientFolderDto | null | undefined
    >(undefined);
    const [isDownloading, setIsDownloading] = useState(false);
    const {showToast} = useToast();

    const {data: rootFoldersContents} = useQuery({
        queryKey: getPatientFoldersContentsQueryKey(),
        queryFn: async () => {
            const response = await apiDocuments.getPatientFoldersContents();
            return response.data;
        },
        enabled: Boolean(document.folderId),
    });

    const derivedLocationFolder = useMemo(() => {
        if (!document.folderId) {
            return null;
        }

        return (
            rootFoldersContents?.folders.find(folder => folder.id === document.folderId) ??
            findFolderInCache(queryClient, document.folderId) ??
            resolveLocationFolder(document.folderId, breadcrumb)
        );
    }, [breadcrumb, document.folderId, queryClient, rootFoldersContents?.folders]);

    const locationFolder =
        savedLocationFolder !== undefined ? savedLocationFolder : derivedLocationFolder;

    useFocusEffect(
        useCallback(() => {
            let isActive = true;

            void (async () => {
                await invalidateDocumentsQueries(queryClient);

                if (!isActive) {
                    return;
                }

                const updatedDocument = findDocumentInCache(queryClient, document.id);

                if (updatedDocument) {
                    setDocument(updatedDocument);
                    setSavedLocationFolder(undefined);
                    return;
                }

                navigation.goBack();
            })();

            return () => {
                isActive = false;
            };
        }, [document.id, navigation, queryClient]),
    );

    const handleFileDeleted = useCallback(() => {
        navigation.goBack();
        void invalidateDocumentsQueries(queryClient);
    }, [navigation, queryClient]);

    const handleFileNameSaved = useCallback(
        async (updatedDocument: PrescriptionDocumentDto) => {
            setDocument(updatedDocument);
            await invalidateDocumentsQueries(queryClient);
        },
        [queryClient],
    );

    const handleFileLocationSaved = useCallback(
        async (
            updatedDocument: PrescriptionDocumentDto,
            nextLocationFolder: PatientFolderDto | null,
        ) => {
            setDocument({
                ...updatedDocument,
                folderId: updatedDocument.folderId ?? nextLocationFolder?.id ?? null,
            });
            setSavedLocationFolder(nextLocationFolder);
            await invalidateDocumentsQueries(queryClient);
        },
        [queryClient],
    );

    const handleDownloadPress = useCallback(async () => {
        if (isDownloading || !document.fileId) {
            return;
        }

        setIsDownloading(true);

        try {
            const savedFile = await apiFiles.downloadFileToDevice(
                document.fileId,
                document.fileName,
            );

            showToast({
                variant: 'success',
                text: t('toasts.fileDownloadSuccess', {
                    fileName: savedFile.fileName,
                    locationLabel: savedFile.locationLabel,
                }),
            });
        } catch {
            showToast({variant: 'error', text: t('toasts.fileDownloadError')});
        } finally {
            setIsDownloading(false);
        }
    }, [document.fileId, document.fileName, isDownloading, showToast, t]);

    const metadataValues = useMemo(() => {
        const fileType = document.mimeType;
        const uploadedAt = document.uploadDate ?? document.createdAt ?? '';

        return [
            {label: t('fileScreen.metadata.type'), value: fileType},
            {label: t('fileScreen.metadata.size'), value: formatFileSize(document.fileSize, t)},
            {
                label: t('fileScreen.metadata.uploadDate'),
                value: formatDocumentUploadedDate(uploadedAt, tTimePickers),
            },
        ];
    }, [document, t, tTimePickers]);

    return (
        <StatusBarAvoidContainer backgroundColor={'rgba(247, 246, 251, 1)'}>
            <Header
                title={t('screenTitles.fileProperties')}
                backgroundColor={'rgba(247, 246, 251, 1)'}
                rightIcon="trash-2"
                onRightIconPress={() => deleteFileModalRef.current?.present()}
            />
            <View style={styles.contentContainer}>
                <ScrollView
                    style={styles.scroll}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}>
                    <View style={styles.fileNameTouchable}>
                        <LabelValueTouchableRightChevron
                            title={t('fileScreen.fileNameLabel')}
                            filledText={document.fileName}
                            onPress={() => fileNameChangeModalRef.current?.present()}
                        />
                    </View>
                    <View style={styles.metadataRow}>
                        {metadataValues.map(field => (
                            <View key={field.label} style={styles.metadataItem}>
                                <Text style={styles.metadataLabel}>{field.label}</Text>
                                <Text style={styles.metadataValue}>{field.value}</Text>
                            </View>
                        ))}
                    </View>
                    <Text style={styles.locationTitle}>{t('fileScreen.location')}</Text>
                    <View style={styles.locationFolder}>
                        {locationFolder ? (
                            <FolderCard
                                folder={locationFolder}
                                hideSubtitle
                                isChevron
                                onPress={() => fileLocationModalRef.current?.present()}
                            />
                        ) : (
                            <FolderCard
                                isStorage
                                hideSubtitle
                                isChevron
                                onPress={() => fileLocationModalRef.current?.present()}
                            />
                        )}
                    </View>
                </ScrollView>
                <ButtonMain
                    title={t('fileScreen.download')}
                    onPress={() => {
                        handleDownloadPress().catch(() => undefined);
                    }}
                    isLoading={isDownloading}
                    style={styles.downloadButton}
                />
            </View>
            <DeleteFileModal
                ref={deleteFileModalRef}
                documentId={document.id}
                onDeleted={handleFileDeleted}
            />
            <FileNameChangeModal
                ref={fileNameChangeModalRef}
                documentId={document.id}
                value={document.fileName}
                onSaved={handleFileNameSaved}
            />
            <FileLocationModal
                ref={fileLocationModalRef}
                document={document}
                onLocationSaved={handleFileLocationSaved}
            />
        </StatusBarAvoidContainer>
    );
};

const styles = StyleSheet.create({
    contentContainer: {
        flex: 1,
        marginTop: 12,
        backgroundColor: 'rgba(255, 255, 255, 1)',
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        paddingHorizontal: 24,
    },
    scroll: {
        flex: 1,
    },
    scrollContent: {
        paddingTop: 16,
        paddingBottom: 16,
    },
    fileNameTouchable: {
        marginHorizontal: -20,
    },
    metadataRow: {
        marginTop: 12,
        flexDirection: 'row',
    },
    metadataItem: {
        flex: 1,
    },
    metadataLabel: {
        color: 'rgba(134, 132, 168, 1)',
    },
    metadataValue: {
        marginTop: 4,
        color: 'rgba(29, 26, 73, 1)',
        fontSize: 16,
    },
    locationTitle: {
        marginTop: 24,
        color: 'rgba(134, 132, 168, 1)',
    },
    locationFolder: {
        marginTop: 4,
        marginHorizontal: -12,
    },
    downloadButton: {
        marginVertical: 16,
        marginHorizontal: -12
    },
});
