import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
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
import type {NotificationCustomOffsetUnit} from '../../../features/redux/drugsCreate/types';
import {ButtonMain} from '../ButtonMain';
import {IconMapper} from '../IconMapper';
import {BottomSheetMain} from '../modals/BottomSheetMain';
import {WHEEL_PICKER_ITEM_HEIGHT, WHEEL_PICKER_VISIBLE_ROWS, WheelPickerColumn} from './WheelPickerColumn';

type TimePickerNotifyProps = {
  valueAmount: number;
  valueUnit: NotificationCustomOffsetUnit;
  onChange: (amount: number, unit: NotificationCustomOffsetUnit) => void;
  label?: string;
  modalTitle?: string;
  errorText?: string | null;
  style?: StyleProp<ViewStyle>;
  units?: NotificationCustomOffsetUnit[];
};

const ERROR_COLOR = 'rgba(245, 33, 33, 1)';
const FOCUS_COLOR = 'rgba(56, 163, 255, 1)';
const ANIMATION_DURATION = 180;
const MIN_AMOUNT = 1;
const MAX_AMOUNT = 59;
const DEFAULT_UNITS: NotificationCustomOffsetUnit[] = ['minute', 'hour', 'day'];
const LOOP_CYCLES = 5;

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

export const TimePickerNotify = ({
  valueAmount,
  valueUnit,
  onChange,
  label,
  modalTitle,
  errorText,
  style,
  units = DEFAULT_UNITS,
}: TimePickerNotifyProps) => {
  const {t} = useTranslation('timePickers', {i18n});
  const {height: windowHeight} = useWindowDimensions();
  const sheetRef = useRef<BottomSheetModal>(null);
  const [wasOpened, setWasOpened] = useState(false);
  const [syncKey, setSyncKey] = useState(0);
  const [isModalVisible, setModalVisible] = useState(false);
  const resolvedValueUnit = units.includes(valueUnit) ? valueUnit : (units[0] ?? 'hour');
  const [draftAmount, setDraftAmount] = useState(clamp(valueAmount, MIN_AMOUNT, MAX_AMOUNT));
  const [draftUnit, setDraftUnit] = useState<NotificationCustomOffsetUnit>(resolvedValueUnit);
  const hasError = typeof errorText === 'string';

  const amountOptions = useMemo(
    () => Array.from({length: MAX_AMOUNT}, (_, index) => `${index + 1}`),
    [],
  );
  const unitOptions = useMemo(() => units.map(unit => t(`notify.units.${unit}`)), [t, units]);
  const title = modalTitle ?? label ?? t('notify.modalTitle');
  const displayValue = `${clamp(valueAmount, MIN_AMOUNT, MAX_AMOUNT)} ${t(`notify.units.${resolvedValueUnit}`)}`;

  const errorProgress = useSharedValue(hasError ? 1 : 0);
  const focusProgress = useSharedValue(0);

  useEffect(() => {
    errorProgress.value = withTiming(hasError ? 1 : 0, {duration: ANIMATION_DURATION});
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

    setDraftAmount(clamp(valueAmount, MIN_AMOUNT, MAX_AMOUNT));
    setDraftUnit(units.includes(valueUnit) ? valueUnit : (units[0] ?? 'hour'));
    setSyncKey(prev => prev + 1);
    const id = requestAnimationFrame(() => {
      sheetRef.current?.present();
    });

    return () => cancelAnimationFrame(id);
  }, [isModalVisible, units, valueAmount, valueUnit, wasOpened]);

  const handleSave = useCallback(() => {
    onChange(draftAmount, draftUnit);
    sheetRef.current?.dismiss();
  }, [draftAmount, draftUnit, onChange]);

  const handleBack = useCallback(() => {
    sheetRef.current?.dismiss();
  }, []);

  return (
    <View style={style}>
      {label ? <Text style={styles.label}>{label}</Text> : null}

      <TouchableOpacity activeOpacity={0.7} onPress={openModal}>
        <Animated.View style={[styles.container, containerAnimatedStyle]}>
          <Text style={styles.valueText}>{displayValue}</Text>
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

          <View style={styles.wheelWrapper}>
            <View style={styles.selectedRowHighlight} />
            <WheelPickerColumn
              options={amountOptions}
              selectedIndex={clamp(draftAmount, MIN_AMOUNT, MAX_AMOUNT) - 1}
              onChange={index => setDraftAmount(index + 1)}
              loop
              loopCycles={LOOP_CYCLES}
              syncKey={syncKey}
            />
            <WheelPickerColumn
              options={unitOptions}
              selectedIndex={Math.max(units.indexOf(draftUnit), 0)}
              onChange={index => setDraftUnit(units[index] ?? units[0] ?? 'hour')}
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
  wheelWrapper: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'stretch',
    justifyContent: 'center',
    marginBottom: 25,
    height: WHEEL_PICKER_ITEM_HEIGHT * WHEEL_PICKER_VISIBLE_ROWS,
  },
  selectedRowHighlight: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: WHEEL_PICKER_ITEM_HEIGHT,
    height: WHEEL_PICKER_ITEM_HEIGHT,
    borderRadius: 1000,
    backgroundColor: 'rgba(35, 142, 235, 0.15)',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
  },
});
