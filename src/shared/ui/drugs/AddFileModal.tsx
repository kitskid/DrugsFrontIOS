import {forwardRef, useCallback, useImperativeHandle, useMemo, useRef} from 'react';
import {PermissionsAndroid, Platform, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {BottomSheetModal} from '@gorhom/bottom-sheet';
import {
  errorCodes,
  isErrorWithCode,
  pick,
  types,
  type DocumentPickerResponse,
} from '@react-native-documents/picker';
import {launchCamera, launchImageLibrary, type Asset} from 'react-native-image-picker';
import {useTranslation} from 'react-i18next';

import {
  buildUploadFilePayload,
  mimeForAttachment,
  resolveDocumentForUpload,
} from '../../../features/api/files/resolveDocumentForUpload.ts';
import i18n from '../../../features/localisation/i18n';
import {useToast} from '../../../features/toasts/useToast.ts';
import {ButtonMain} from '../ButtonMain.tsx';
import {IconMapper} from '../IconMapper.tsx';
import {BottomSheetMain} from '../modals/BottomSheetMain.tsx';

const ADD_FILE_OPTION_KEYS = ['takePhoto', 'openGallery', 'uploadFromStorage'] as const;

type AddFileOptionKey = (typeof ADD_FILE_OPTION_KEYS)[number];

const STORAGE_PICK_TYPES = [
    types.pdf,
    types.images,
    types.doc,
    types.docx,
    types.xls,
    types.xlsx,
    types.ppt,
    types.pptx,
    types.plainText,
    types.csv,
];

export type SelectedFile = {
    uri: string;
    fileName: string;
    mimeType: string;
    fileSize?: number;
};

type AddFileModalProps = {
    onFileSelected?: (file: SelectedFile) => void;
};

const MODAL_DISMISS_DELAY_MS = 300;

const waitForModalDismiss = () =>
    new Promise<void>(resolve => {
        setTimeout(resolve, MODAL_DISMISS_DELAY_MS);
    });

const assetToSelectedFile = (asset: Asset, index = 0): SelectedFile | null => {
    if (!asset.uri) {
        return null;
    }

    return {
        uri: asset.uri,
        fileName: asset.fileName ?? `photo_${Date.now()}_${index}.jpg`,
        mimeType: asset.type ?? 'image/jpeg',
        fileSize: asset.fileSize,
    };
};

const resolveDocumentFile = async (
    document: DocumentPickerResponse,
    defaultFileName: string,
): Promise<SelectedFile | null> => {
    if (!document.uri) {
        return null;
    }

    const ext = (document.name ?? '').split('.').pop()?.toUpperCase() || '';
    const mimeType = mimeForAttachment(ext, document.type);

    const prepared = await resolveDocumentForUpload({
        uri: document.uri,
        fileName: document.name ?? defaultFileName,
        mimeType,
        isVirtual: document.isVirtual,
        convertibleToMimeTypes: document.convertibleToMimeTypes,
    });
    const uploadPayload = buildUploadFilePayload(prepared);

    return {
        uri: uploadPayload.uri,
        fileName: uploadPayload.fileName,
        mimeType: uploadPayload.mimeType,
        fileSize: document.size ?? undefined,
    };
};

const requestCameraPermission = async (): Promise<boolean> => {
    if (Platform.OS !== 'android') {
        return true;
    }

    try {
        const isGranted = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.CAMERA);
        if (isGranted) {
            return true;
        }

        const result = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.CAMERA);
        return result === PermissionsAndroid.RESULTS.GRANTED;
    } catch {
        return false;
    }
};

export const AddFileModal = forwardRef<BottomSheetModal, AddFileModalProps>(
    ({onFileSelected}, ref) => {
    const {t} = useTranslation('drugsCreate', {i18n});
    const sheetRef = useRef<BottomSheetModal>(null);
    const {showToast} = useToast();

    const addFileOptions = useMemo(
        () =>
            ADD_FILE_OPTION_KEYS.map(key => ({
                key,
                label: t(`filesTab.addFileModal.${key}`),
            })),
        [t],
    );

    useImperativeHandle(ref, () => sheetRef.current as BottomSheetModal, []);

    const dismiss = useCallback(() => {
        sheetRef.current?.dismiss();
    }, []);

    const handleTakePhoto = useCallback(async () => {
        dismiss();
        await waitForModalDismiss();

        const hasPermission = await requestCameraPermission();
        if (!hasPermission) {
            return;
        }

        const result = await launchCamera({
            mediaType: 'photo',
            saveToPhotos: false,
        });

        if (result.didCancel || !result.assets?.length) {
            return;
        }

        const selectedFile = assetToSelectedFile(result.assets[0]);

        if (selectedFile) {
            onFileSelected?.(selectedFile);
        }
    }, [dismiss, onFileSelected]);

    const handleOpenGallery = useCallback(async () => {
        dismiss();
        await waitForModalDismiss();

        const result = await launchImageLibrary({
            mediaType: 'photo',
            selectionLimit: 0,
        });

        if (result.didCancel || !result.assets?.length) {
            return;
        }

        result.assets.forEach((asset, index) => {
            const selectedFile = assetToSelectedFile(asset, index);

            if (selectedFile) {
                onFileSelected?.(selectedFile);
            }
        });
    }, [dismiss, onFileSelected]);

    const handleOpenStorage = useCallback(async () => {
        try {
            const documents = await pick({
                type: STORAGE_PICK_TYPES,
                allowMultiSelection: true,
                allowVirtualFiles: true,
            });

            dismiss();

            const defaultFileName = t('filesTab.addFileModal.defaultFileName');

            for (const [index, document] of documents.entries()) {
                const selectedFile = await resolveDocumentFile(
                    document,
                    documents.length > 1
                        ? `${defaultFileName}_${index + 1}`
                        : defaultFileName,
                );

                if (selectedFile) {
                    onFileSelected?.(selectedFile);
                }
            }
        } catch (error) {
            dismiss();

            if (isErrorWithCode(error) && error.code === errorCodes.OPERATION_CANCELED) {
                return;
            }

            console.warn('Storage picker failed', error);

            const message =
                error instanceof Error && /authentication_failure/i.test(error.message)
                    ? t('filesTab.addFileModal.cloudFileError')
                    : t('filesTab.addFileModal.storagePickError');

            showToast({variant: 'error', text: message});
        }
    }, [dismiss, onFileSelected, showToast, t]);

    const handleOptionPress = useCallback(
        (optionKey: AddFileOptionKey) => {
            if (optionKey === 'takePhoto') {
                void handleTakePhoto();
                return;
            }

            if (optionKey === 'openGallery') {
                void handleOpenGallery();
                return;
            }

            if (optionKey === 'uploadFromStorage') {
                void handleOpenStorage();
            }
        },
        [handleOpenGallery, handleOpenStorage, handleTakePhoto],
    );

    return (
        <BottomSheetMain ref={sheetRef} contentContainerStyle={styles.content}>
            <Text style={styles.title}>{t('filesTab.addFileModal.title')}</Text>
            <View>
                {addFileOptions.map(option => (
                    <TouchableOpacity
                        key={option.key}
                        activeOpacity={0.7}
                        onPress={() => handleOptionPress(option.key)}
                        style={styles.option}>
                        <Text style={styles.optionText}>{option.label}</Text>
                        <IconMapper
                            icon="chevron-right"
                            size={24}
                            color="rgba(199, 198, 217, 1)"
                            weight={1.5}
                        />
                    </TouchableOpacity>
                ))}
            </View>
            <ButtonMain
                title={t('modals.back')}
                variant="secondary"
                onPress={dismiss}
                style={styles.backButton}
            />
        </BottomSheetMain>
    );
},
);

const styles = StyleSheet.create({
    content: {
        paddingTop: 16,
    },
    title: {
        textAlign: 'center',
        color: 'rgba(29, 26, 73, 1)',
        fontSize: 18,
        fontWeight: '500',
        paddingTop: 8,
        paddingBottom: 24,
    },
    option: {
        height: 56,
        flexDirection: 'row',
        alignItems: 'center',
        paddingLeft: 16,
        paddingRight: 16,
    },
    optionText: {
        flex: 1,
        color: 'rgba(29, 26, 73, 1)',
        fontSize: 16,
    },
    backButton: {
        marginTop: 24,
    },
});
