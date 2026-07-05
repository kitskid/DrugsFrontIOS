import {forwardRef, useImperativeHandle, useRef, useState} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {BottomSheetModal} from '@gorhom/bottom-sheet';

import {ButtonMain} from '../../../shared/ui/ButtonMain.tsx';
import {BottomSheetInputMain} from '../../../shared/ui/modals/BottomSheetInputMain.tsx';
import {BottomSheetMain} from '../../../shared/ui/modals/BottomSheetMain.tsx';
import {getDefaultMealName} from './mealDefaults.ts';

type MealNameModalProps = {
  mealsCount: number;
  initialName?: string | null;
  onSave: (name: string) => void;
  onClose?: () => void;
};

const EMPTY_FIELD_ERROR = 'Поле обязательно для заполнения';
const MEAL_NAME_MAX_LENGTH = 50;

export const MealNameModal = forwardRef<BottomSheetModal, MealNameModalProps>(
  ({mealsCount, initialName = null, onSave, onClose}, ref) => {
    const sheetRef = useRef<BottomSheetModal>(null);
    const [draftName, setDraftName] = useState<string | null>(null);
    const [errorText, setErrorText] = useState<string | null>(null);
    const name = (draftName ?? initialName ?? getDefaultMealName(mealsCount)).slice(0, MEAL_NAME_MAX_LENGTH);

    useImperativeHandle(ref, () => sheetRef.current as BottomSheetModal, []);

    const dismiss = () => {
      sheetRef.current?.dismiss();
    };

    const handleSheetChange = (index: number) => {
      if (index >= 0) {
        setErrorText(null);
        return;
      }

      setDraftName(null);
      setErrorText(null);
      onClose?.();
    };

    const onNameChange = (value: string) => {
      setDraftName(value.slice(0, MEAL_NAME_MAX_LENGTH));
      if (errorText) {
        setErrorText(null);
      }
    };

    const handleSavePress = () => {
      const trimmedName = name.trim();

      if (!trimmedName) {
        setErrorText(EMPTY_FIELD_ERROR);
        return;
      }

      setDraftName(null);
      onSave(trimmedName);
      dismiss();
    };

    return (
      <BottomSheetMain
        ref={sheetRef}
        contentContainerStyle={styles.content}
        onChange={handleSheetChange}>
        <Text style={styles.title}>Название приёма пищи</Text>
        <BottomSheetInputMain
          value={name}
          onChange={onNameChange}
          autoFocus
          maxLength={MEAL_NAME_MAX_LENGTH}
          errorText={errorText}
          style={styles.input}
        />
        <View style={styles.buttonsRow}>
          <ButtonMain
            title="Вернуться"
            variant="secondary"
            onPress={dismiss}
            style={styles.button}
          />
          <ButtonMain
            title="Сохранить"
            onPress={handleSavePress}
            style={styles.button}
          />
        </View>
      </BottomSheetMain>
    );
  },
);

const styles = StyleSheet.create({
  content: {
    paddingTop: 0,
  },
  title: {
    marginTop: 12,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '500',
    color: 'rgba(29, 26, 73, 1)',
  },
  input: {
    marginTop: 24,
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
