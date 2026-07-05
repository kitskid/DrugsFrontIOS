import {forwardRef, useEffect, useImperativeHandle, useRef, useState} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {BottomSheetModal} from '@gorhom/bottom-sheet';
import {useTranslation} from 'react-i18next';

import {apiDocuments} from '../../features/api/apiDocuments.ts';
import type {PrescriptionDocumentDto} from '../../features/api/drugs/apiDrugs.ts';
import i18n from '../../features/localisation/i18n.ts';
import {ButtonMain} from '../../shared/ui/ButtonMain.tsx';
import {BottomSheetInputMain} from '../../shared/ui/modals/BottomSheetInputMain.tsx';
import {BottomSheetMain} from '../../shared/ui/modals/BottomSheetMain.tsx';

type FileNameChangeModalProps = {
    documentId: string;
    value: string;
    onSaved?: (document: PrescriptionDocumentDto) => void | Promise<void>;
};

export const FileNameChangeModal = forwardRef<BottomSheetModal, FileNameChangeModalProps>(
    ({documentId, value, onSaved}, ref) => {
        const {t} = useTranslation('documents', {i18n});
        const sheetRef = useRef<BottomSheetModal>(null);
        const [fileName, setFileName] = useState(value);
        const [isSaving, setIsSaving] = useState(false);

        useImperativeHandle(ref, () => sheetRef.current as BottomSheetModal, []);

        useEffect(() => {
            setFileName(value);
        }, [value]);

        const dismiss = () => {
            sheetRef.current?.dismiss();
        };

        const handleSave = async () => {
            const trimmedFileName = fileName.trim();

            if (!trimmedFileName || isSaving) {
                return;
            }

            if (trimmedFileName === value.trim()) {
                dismiss();
                return;
            }

            setIsSaving(true);

            try {
                const response = await apiDocuments.updateDocument(documentId, {
                    fileName: trimmedFileName,
                });
                dismiss();
                await onSaved?.(response.data);
            } finally {
                setIsSaving(false);
            }
        };

        return (
            <BottomSheetMain ref={sheetRef} contentContainerStyle={styles.content}>
                <View>
                    <Text style={styles.title}>{t('modals.fileName.title')}</Text>
                    <BottomSheetInputMain
                        value={fileName}
                        onChange={setFileName}
                        autoFocus
                        numberOfLines={2}
                    />
                </View>
                <View style={styles.buttonsRow}>
                    <ButtonMain
                        title={t('modals.fileName.back')}
                        variant="secondary"
                        onPress={dismiss}
                        disabled={isSaving}
                        style={styles.button}
                    />
                    <ButtonMain
                        title={t('modals.fileName.save')}
                        onPress={() => {
                            void handleSave();
                        }}
                        isLoading={isSaving}
                        style={styles.button}
                    />
                </View>
            </BottomSheetMain>
        );
    },
);

const styles = StyleSheet.create({
    content: {
        paddingTop: 8,
        justifyContent: 'space-between',
    },
    title: {
        textAlign: 'center',
        fontSize: 18,
        fontWeight: '500',
        color: 'rgba(29, 26, 73, 1)',
        marginBottom: 25,
        marginTop: 13,
    },
    buttonsRow: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 24,
    },
    button: {
        flex: 1,
    },
});
