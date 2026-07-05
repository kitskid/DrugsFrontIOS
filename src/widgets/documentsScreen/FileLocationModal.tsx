import {forwardRef, useCallback, useImperativeHandle, useMemo, useRef, useState} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {useQuery} from '@tanstack/react-query';
import {
    BottomSheetFlatList,
    BottomSheetFooter,
    BottomSheetModal,
} from '@gorhom/bottom-sheet';
import type {BottomSheetFooterProps} from '@gorhom/bottom-sheet';
import {useTranslation} from 'react-i18next';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import type {TFunction} from 'i18next';

import {
    apiDocuments,
    getPatientFoldersContentsQueryKey,
    STORAGE_USAGE_SUMMARY_QUERY_KEY,
    type PatientFolderDto,
} from '../../features/api/apiDocuments.ts';
import type {PrescriptionDocumentDto} from '../../features/api/drugs/apiDrugs.ts';
import i18n from '../../features/localisation/i18n.ts';
import {
    formatFileCountLabel,
    formatFileSize,
    formatFolderCountLabel,
    parseBytes,
} from './formatStorageUsage.ts';
import {ButtonMain} from '../../shared/ui/ButtonMain.tsx';
import {BottomSheetInputMain} from '../../shared/ui/modals/BottomSheetInputMain.tsx';
import {BottomSheetMain} from '../../shared/ui/modals/BottomSheetMain.tsx';
import {FolderCard} from './FolderCard.tsx';

const STORAGE_LOCATION_ID = 'storage';
const FOOTER_VERTICAL_PADDING = 16;
const FOOTER_BUTTON_HEIGHT = 48;

type FileLocationModalProps = {
    document: PrescriptionDocumentDto;
    onLocationSaved?: (
        document: PrescriptionDocumentDto,
        locationFolder: PatientFolderDto | null,
    ) => void | Promise<void>;
};

type LocationListItem =
    | {key: string; kind: 'storage'}
    | {key: string; kind: 'folder'; folder: PatientFolderDto};

const getStorageSubtitle = (
    filesCount: number,
    foldersCount: number,
    usedBytes: number,
    t: TFunction<'documents'>,
): string =>
    `${formatFileCountLabel(filesCount, t)} | ${formatFolderCountLabel(foldersCount, t)} | ${formatFileSize(usedBytes, t)}`;

export const FileLocationModal = forwardRef<BottomSheetModal, FileLocationModalProps>(
    ({document, onLocationSaved}, ref) => {
        const {t} = useTranslation('documents', {i18n});
        const sheetRef = useRef<BottomSheetModal>(null);
        const sheetIndexRef = useRef(-1);
        const insets = useSafeAreaInsets();

        const {data: foldersContents} = useQuery({
            queryKey: getPatientFoldersContentsQueryKey(),
            queryFn: async () => {
                const response = await apiDocuments.getPatientFoldersContents();
                return response.data;
            },
        });

        const {data: storageUsageSummary} = useQuery({
            queryKey: STORAGE_USAGE_SUMMARY_QUERY_KEY,
            queryFn: async () => {
                const response = await apiDocuments.getStorageUsageSummary();
                return response.data;
            },
            staleTime: Infinity,
        });

        const folders = useMemo(
            () => foldersContents?.folders ?? [],
            [foldersContents?.folders],
        );
        const storageSubtitle = useMemo(
            () =>
                getStorageSubtitle(
                    storageUsageSummary?.filesCount ?? 0,
                    folders.length,
                    parseBytes(storageUsageSummary?.usedBytes ?? '0'),
                    t,
                ),
            [folders.length, storageUsageSummary, t],
        );

        const [searchQuery, setSearchQuery] = useState('');
        const [selectedLocationId, setSelectedLocationId] = useState<string>(
            document.folderId ?? STORAGE_LOCATION_ID,
        );
        const [isSaving, setIsSaving] = useState(false);

        const snapPoints = useMemo(() => ['92%'], []);

        const listBottomInset = useMemo(
            () =>
                FOOTER_VERTICAL_PADDING +
                FOOTER_BUTTON_HEIGHT +
                FOOTER_VERTICAL_PADDING +
                insets.bottom,
            [insets.bottom],
        );

        useImperativeHandle(ref, () => sheetRef.current as BottomSheetModal, []);

        const dismiss = useCallback(() => {
            sheetRef.current?.dismiss();
        }, []);

        const resetState = useCallback(() => {
            setSearchQuery('');
            setSelectedLocationId(document.folderId ?? STORAGE_LOCATION_ID);
        }, [document.folderId]);

        const filteredFolders = useMemo(() => {
            const normalizedQuery = searchQuery.trim().toLowerCase();
            if (!normalizedQuery) {
                return folders;
            }

            return folders.filter(folder =>
                folder.name.toLowerCase().includes(normalizedQuery),
            );
        }, [folders, searchQuery]);

        const isStorageVisible = useMemo(() => {
            const normalizedQuery = searchQuery.trim().toLowerCase();
            if (!normalizedQuery) {
                return true;
            }

            return t('storage.searchKeyword').toLowerCase().includes(normalizedQuery);
        }, [searchQuery, t]);

        const listItems = useMemo(() => {
            const items: LocationListItem[] = [];

            if (isStorageVisible) {
                items.push({key: STORAGE_LOCATION_ID, kind: 'storage'});
            }

            filteredFolders.forEach(folder => {
                items.push({key: folder.id, kind: 'folder', folder});
            });

            return items;
        }, [filteredFolders, isStorageVisible]);

        const handleSelect = useCallback(async () => {
            if (isSaving) {
                return;
            }

            const currentLocationId = document.folderId ?? STORAGE_LOCATION_ID;
            if (selectedLocationId === currentLocationId) {
                dismiss();
                return;
            }

            const nextFolderId =
                selectedLocationId === STORAGE_LOCATION_ID ? null : selectedLocationId;
            const locationFolder =
                selectedLocationId === STORAGE_LOCATION_ID
                    ? null
                    : folders.find(folder => folder.id === selectedLocationId) ?? null;

            setIsSaving(true);
            try {
                const response = await apiDocuments.updateDocument(document.id, {
                    folderId: nextFolderId,
                });
                const savedDocument: PrescriptionDocumentDto = {
                    ...response.data,
                    folderId: response.data.folderId ?? nextFolderId,
                };
                dismiss();
                await onLocationSaved?.(savedDocument, locationFolder);
            } finally {
                setIsSaving(false);
            }
        }, [
            dismiss,
            document.folderId,
            document.id,
            folders,
            isSaving,
            onLocationSaved,
            selectedLocationId,
        ]);

        const renderFooter = useCallback(
            (props: BottomSheetFooterProps) => (
                <BottomSheetFooter {...props} bottomInset={insets.bottom}>
                    <View style={styles.footer}>
                        <ButtonMain
                            title={t('modals.location.select')}
                            onPress={handleSelect}
                            isLoading={isSaving}
                        />
                    </View>
                </BottomSheetFooter>
            ),
            [handleSelect, insets.bottom, isSaving, t],
        );

        const renderListHeader = useCallback(
            () => (
                <View>
                    <Text style={styles.title}>{t('modals.location.title')}</Text>
                    <BottomSheetInputMain
                        value={searchQuery}
                        onChange={setSearchQuery}
                        icon="search"
                        isX
                        placeholder={t('modals.location.searchPlaceholder')}
                        style={styles.searchInput}
                    />
                </View>
            ),
            [searchQuery, t],
        );

        const renderItem = useCallback(
            ({item}: {item: LocationListItem}) => {
                if (item.kind === 'storage') {
                    return (
                        <FolderCard
                            isStorage
                            storageSubtitle={storageSubtitle}
                            isSelected={selectedLocationId === STORAGE_LOCATION_ID}
                            onPress={() => setSelectedLocationId(STORAGE_LOCATION_ID)}
                        />
                    );
                }

                return (
                    <FolderCard
                        folder={item.folder}
                        isSelected={selectedLocationId === item.folder.id}
                        onPress={() => setSelectedLocationId(item.folder.id)}
                    />
                );
            },
            [selectedLocationId, storageSubtitle],
        );

        return (
            <BottomSheetMain
                ref={sheetRef}
                snapPoints={snapPoints}
                enableDynamicSizing={false}
                scrollable
                hasFooter
                footerComponent={renderFooter}
                onChange={index => {
                    if (sheetIndexRef.current < 0 && index >= 0) {
                        resetState();
                    }
                    sheetIndexRef.current = index;
                }}>
                <BottomSheetFlatList
                    data={listItems}
                    keyExtractor={item => item.key}
                    renderItem={renderItem}
                    ListHeaderComponent={renderListHeader}
                    contentContainerStyle={[
                        styles.listContent,
                        {paddingBottom: listBottomInset},
                    ]}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                />
            </BottomSheetMain>
        );
    },
);

const styles = StyleSheet.create({
    title: {
        textAlign: 'center',
        fontSize: 18,
        fontWeight: '500',
        color: 'rgba(29, 26, 73, 1)',
        paddingTop: 8,
    },
    searchInput: {
        marginTop: 24,
        marginBottom: 12,
    },
    listContent: {
        paddingHorizontal: 12,
    },
    footer: {
        paddingTop: FOOTER_VERTICAL_PADDING,
        paddingBottom: FOOTER_VERTICAL_PADDING,
        paddingHorizontal: 12,
    },
});
