import {useCallback, useEffect, useRef, useState} from 'react';
import {StyleProp, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View, ViewStyle} from 'react-native';
import {BottomSheetModal} from '@gorhom/bottom-sheet';
import {useTranslation} from 'react-i18next';
import Animated, {
  FadeIn,
  FadeOut,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import i18n from '../../../features/localisation/i18n';
import {ButtonMain} from '../ButtonMain.tsx';
import {IconMapper} from '../IconMapper.tsx';
import {BottomSheetMain} from '../modals/BottomSheetMain.tsx';
import {EveryPickerMain} from './EveryPickerMain.tsx';

export type EveryHourPickerMainProps = {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  modalTitle?: string;
  errorText?: string | null;
  style?: StyleProp<ViewStyle>;
};

const ERROR_COLOR = 'rgba(245, 33, 33, 1)';
const FOCUS_COLOR = 'rgba(56, 163, 255, 1)';
const PLACEHOLDER_COLOR = 'rgba(162, 160, 191, 1)';
const ANIMATION_DURATION = 180;

const HOURS_AMOUNT = 24;

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const parseAmountValue = (raw: string, max: number) => {
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n)) {
    return 1;
  }
  return clamp(n, 1, Math.max(1, max));
};

/** Localized hour word form for current language */
const getHourWord = (hour: number, language: string, one: string, few: string, many: string) => {
  if (language === 'en') {
    return hour === 1 ? one : many;
  }

  const mod10 = hour % 10;
  const mod100 = hour % 100;

  if (mod10 === 1 && mod100 !== 11) {
    return one;
  }
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
    return few;
  }
  return many;
};

export const EveryHourPickerMain = ({
  value,
  onChange,
  label,
  placeholder,
  modalTitle,
  errorText,
  style,
}: EveryHourPickerMainProps) => {
  const {t} = useTranslation('timePickers', {i18n});
  const {height: windowHeight} = useWindowDimensions();
  const sheetRef = useRef<BottomSheetModal>(null);
  const [wasOpened, setWasOpened] = useState(false);
  const [syncKey, setSyncKey] = useState(0);

  const hasError = typeof errorText === 'string';
  const parsed = Number.parseInt(value, 10);
  const hasValid = Number.isFinite(parsed) && parsed >= 1 && parsed <= HOURS_AMOUNT;
  const displayedText = hasValid
    ? `${parsed} ${getHourWord(parsed, i18n.language, t('hours.one'), t('hours.few'), t('hours.many'))}`
    : (placeholder || t('defaults.intervalPlaceholder'));
  const title = modalTitle ?? label ?? t('defaults.everyTitle');
  const [isModalVisible, setModalVisible] = useState(false);

  const sheetInitialValue = hasValid ? `${parsed}` : '1';
  const [draft, setDraft] = useState(1);

  const errorProgress = useSharedValue(hasError ? 1 : 0);
  const focusProgress = useSharedValue(0);

  useEffect(() => {
    errorProgress.value = withTiming(hasError ? 1 : 0, {
      duration: ANIMATION_DURATION,
    });
  }, [errorProgress, hasError]);

  const containerAnimatedStyle = useAnimatedStyle(() => ({
    borderColor: interpolateColor(
      errorProgress.value,
      [0, 1],
      [interpolateColor(focusProgress.value, [0, 1], ['transparent', FOCUS_COLOR]), ERROR_COLOR],
    ),
  }));

  const openModal = () => {
    focusProgress.value = withTiming(1, {duration: ANIMATION_DURATION});
    setModalVisible(true);
  };

  const resetFocus = () => {
    focusProgress.value = withTiming(0, {duration: ANIMATION_DURATION});
  };

  const closeModal = () => {
    setModalVisible(false);
    resetFocus();
  };

  useEffect(() => {
    if (!isModalVisible) {
      return;
    }
    setWasOpened(true);
  }, [isModalVisible]);

  useEffect(() => {
    if (!isModalVisible || !wasOpened) {
      return;
    }
    setDraft(parseAmountValue(sheetInitialValue, HOURS_AMOUNT));
    setSyncKey(prev => prev + 1);
    const id = requestAnimationFrame(() => {
      sheetRef.current?.present();
    });
    return () => cancelAnimationFrame(id);
  }, [isModalVisible, sheetInitialValue, wasOpened]);

  const handleSave = useCallback(() => {
    onChange(`${draft}`);
    sheetRef.current?.dismiss();
  }, [draft, onChange]);

  const handleBack = useCallback(() => {
    sheetRef.current?.dismiss();
  }, []);

  return (
    <View style={style}>
      {label ? <Text style={styles.label}>{label}</Text> : null}

      <TouchableOpacity activeOpacity={0.7} onPress={openModal}>
        <Animated.View style={[styles.container, containerAnimatedStyle]}>
          <Text style={[styles.valueText, !hasValid && styles.placeholderText]}>{displayedText}</Text>
          <IconMapper icon="chevron-down" size={24} color="rgba(162, 160, 191, 1)" weight={1.5} />
        </Animated.View>
      </TouchableOpacity>

      <View style={styles.errorSlot}>
        {hasError ? (
          <Animated.Text
            entering={FadeIn.duration(ANIMATION_DURATION)}
            exiting={FadeOut.duration(ANIMATION_DURATION)}
            style={styles.errorText}>
            {errorText}
          </Animated.Text>
        ) : null}
      </View>

      {wasOpened ? (
        <BottomSheetMain
          ref={sheetRef}
          onDismiss={closeModal}
          enableContentPanningGesture={false}
          enableHandlePanningGesture={false}
          enablePanDownToClose={false}
          maxDynamicContentSize={windowHeight * 0.88}
          contentContainerStyle={styles.sheetContent}>
          <Text style={styles.modalTitle}>{title}</Text>

          <View style={styles.pickerWrap}>
            <EveryPickerMain
              value={draft}
              onChange={setDraft}
              amount={HOURS_AMOUNT}
              unitShort={t('units.hourShort')}
              syncKey={syncKey}
            />
          </View>

          <View style={styles.actionsRow}>
            <ButtonMain title={t('common.back')} variant="secondary" onPress={handleBack} style={styles.actionButton} />
            <ButtonMain title={t('common.save')} onPress={handleSave} style={styles.actionButton} />
          </View>
        </BottomSheetMain>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    minHeight: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(241, 240, 249, 1)',
    borderWidth: 2,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  valueText: {
    flex: 1,
    color: 'rgba(29, 26, 73, 1)',
    fontSize: 16,
  },
  placeholderText: {
    color: PLACEHOLDER_COLOR,
  },
  label: {
    marginLeft: 16,
    marginBottom: 6,
    color: 'rgba(134, 132, 168, 1)',
  },
  errorText: {
    color: ERROR_COLOR,
    fontSize: 12,
    marginLeft: 12,
  },
  errorSlot: {
    height: 16,
    justifyContent: 'flex-end',
  },
  sheetContent: {
    paddingTop: 8,
  },
  modalTitle: {
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '500',
    color: 'rgba(29, 26, 73, 1)',
    marginBottom: 25,
  },
  pickerWrap: {
    marginBottom: 25,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
  },
});
