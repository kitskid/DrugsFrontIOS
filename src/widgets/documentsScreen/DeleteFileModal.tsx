import {forwardRef, useImperativeHandle, useRef, useState} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {BottomSheetModal} from '@gorhom/bottom-sheet';
import {useTranslation} from 'react-i18next';

import {apiDocuments} from '../../features/api/apiDocuments.ts';
import i18n from '../../features/localisation/i18n.ts';
import {ButtonMain} from '../../shared/ui/ButtonMain.tsx';
import {CenterModal} from '../../shared/ui/modals/CenterModal.tsx';

type DeleteFileModalProps = {
    documentId: string;
    onDeleted: () => void;
};

export const DeleteFileModal = forwardRef<BottomSheetModal, DeleteFileModalProps>(
    ({documentId, onDeleted}, ref) => {
        const {t} = useTranslation('documents', {i18n});
        const sheetRef = useRef<BottomSheetModal>(null);
        const [isDeleting, setIsDeleting] = useState(false);

        useImperativeHandle(ref, () => sheetRef.current as BottomSheetModal, []);

        const dismiss = () => {
            sheetRef.current?.dismiss();
        };

        const handleDelete = async () => {
            if (isDeleting) {
                return;
            }

            setIsDeleting(true);

            try {
                await apiDocuments.deleteDocument(documentId);
                dismiss();
                onDeleted();
            } catch {
                setIsDeleting(false);
            }
        };

        return (
            <CenterModal ref={sheetRef}>
                <View style={styles.container}>
                    <Text style={styles.title}>{t('modals.deleteFile.title')}</Text>
                    <View style={styles.buttonsRow}>
                        <ButtonMain
                            title={t('modals.deleteFile.no')}
                            variant="secondary"
                            onPress={dismiss}
                            disabled={isDeleting}
                            style={styles.button}
                        />
                        <ButtonMain
                            title={t('modals.deleteFile.yes')}
                            onPress={() => {
                                void handleDelete();
                            }}
                            isLoading={isDeleting}
                            style={styles.button}
                        />
                    </View>
                </View>
            </CenterModal>
        );
    },
);

const styles = StyleSheet.create({
    container: {
        backgroundColor: 'rgba(255, 255, 255, 1)',
        borderRadius: 24,
        paddingHorizontal: 16,
        paddingVertical: 24,
    },
    title: {
        color: 'rgba(29, 26, 73, 1)',
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 24,
    },
    buttonsRow: {
        flexDirection: 'row',
        gap: 12,
    },
    button: {
        flex: 1,
    },
});
