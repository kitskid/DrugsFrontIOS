import {forwardRef, useEffect, useImperativeHandle, useRef, useState} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {BottomSheetModal} from '@gorhom/bottom-sheet';
import {useTranslation} from 'react-i18next';

import i18n from '../../features/localisation/i18n';
import {ButtonMain} from '../../shared/ui/ButtonMain';
import {BottomSheetInputMain} from '../../shared/ui/modals/BottomSheetInputMain';
import {BottomSheetMain} from '../../shared/ui/modals/BottomSheetMain';

type DrugsCreateNameBottomSheetProps = {
  value: string;
  onSave: (value: string) => void;
};

export const DrugsCreateNameModal = forwardRef<
  BottomSheetModal,
  DrugsCreateNameBottomSheetProps
>(({value, onSave}, ref) => {
  const {t} = useTranslation('drugsCreate', {i18n});
  const sheetRef = useRef<BottomSheetModal>(null);
  const [name, setName] = useState(value);
  const [errorText, setErrorText] = useState<string | null>(null);

  useImperativeHandle(ref, () => sheetRef.current as BottomSheetModal, []);

  useEffect(() => {
    setName(value);
  }, [value]);

  const onNameChange = (newValue: string) => {
    setName(newValue);
    if (errorText) {
      setErrorText(null);
    }
  };

  const onSavePress = () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setErrorText(t('modals.requiredError'));
      return;
    }

    const normalizedName = trimmedName.charAt(0).toUpperCase() + trimmedName.slice(1);

    onSave(normalizedName);
    sheetRef.current?.dismiss();
  };

  return (
    <BottomSheetMain
      ref={sheetRef}
      contentContainerStyle={styles.content}>
      <View>
        <Text style={styles.title}>{t('modals.name.title')}</Text>
        <BottomSheetInputMain
          value={name}
          onChange={onNameChange}
          autoFocus
          placeholder={t('modals.name.placeholder')}
          numberOfLines={2}
          errorText={errorText}
        />
      </View>

      <View style={styles.buttonsRow}>
        <ButtonMain
          title={t('modals.back')}
          variant="secondary"
          onPress={() => {
            sheetRef.current?.dismiss();
          }}
          style={styles.button}
        />
        <ButtonMain
          title={t('modals.save')}
          onPress={onSavePress}
          style={styles.button}
        />
      </View>
    </BottomSheetMain>
  );
});

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
  },
  buttonsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24
  },
  button: {
    flex: 1,
  },
});
