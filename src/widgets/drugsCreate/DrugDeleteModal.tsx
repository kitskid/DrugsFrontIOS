import {forwardRef, useCallback, useImperativeHandle, useRef, useState} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import axios from 'axios';
import {BottomSheetModal} from '@gorhom/bottom-sheet';
import {useTranslation} from 'react-i18next';

import i18n from '../../features/localisation/i18n.ts';
import {ButtonMain} from '../../shared/ui/ButtonMain.tsx';
import {CenterModal} from '../../shared/ui/modals/CenterModal.tsx';

type DrugDeleteModalProps = {
  onConfirmDelete: (signal: AbortSignal) => Promise<void>;
};

export const DrugDeleteModal = forwardRef<BottomSheetModal, DrugDeleteModalProps>(
  ({onConfirmDelete}, ref) => {
    const {t} = useTranslation('drugsCreate', {i18n});
    const sheetRef = useRef<BottomSheetModal>(null);
    const abortControllerRef = useRef<AbortController | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    useImperativeHandle(ref, () => sheetRef.current as BottomSheetModal, []);

    const cancelDelete = useCallback(() => {
      abortControllerRef.current?.abort();
      abortControllerRef.current = null;
      setIsDeleting(false);
    }, []);

    const dismiss = useCallback(() => {
      cancelDelete();
      sheetRef.current?.dismiss();
    }, [cancelDelete]);

    const handleYesPress = useCallback(async () => {
      if (abortControllerRef.current) {
        return;
      }

      const abortController = new AbortController();
      abortControllerRef.current = abortController;
      setIsDeleting(true);

      try {
        await onConfirmDelete(abortController.signal);

        if (!abortController.signal.aborted) {
          sheetRef.current?.dismiss();
        }
      } catch (error) {
        if (
          abortController.signal.aborted ||
          (axios.isAxiosError(error) && error.code === 'ERR_CANCELED')
        ) {
          return;
        }
      } finally {
        if (!abortController.signal.aborted) {
          setIsDeleting(false);
        }
        abortControllerRef.current = null;
      }
    }, [onConfirmDelete]);

    const handleModalDismiss = useCallback(() => {
      cancelDelete();
    }, [cancelDelete]);

    return (
      <CenterModal ref={sheetRef} onDismiss={handleModalDismiss}>
        <View style={styles.container}>
          <Text style={styles.title}>{t('modals.deleteModal.title')}</Text>
          <View style={styles.buttonsRow}>
            <ButtonMain
              title={t('modals.deleteModal.no')}
              variant="secondary"
              onPress={dismiss}
              style={styles.button}
            />
            <ButtonMain
              title={t('modals.deleteModal.yes')}
              variant="danger"
              onPress={handleYesPress}
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
    backgroundColor: '#fff',
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
