import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {StyleSheet, Text, useWindowDimensions, View} from 'react-native';
import {BottomSheetModal} from '@gorhom/bottom-sheet';
import {useTranslation} from 'react-i18next';

import i18n from '../../../features/localisation/i18n';
import {ButtonMain} from '../ButtonMain.tsx';
import {BottomSheetMain} from '../modals/BottomSheetMain.tsx';
import {WheelPickerColumn, WHEEL_PICKER_ITEM_HEIGHT, WHEEL_PICKER_VISIBLE_ROWS} from './WheelPickerColumn.tsx';

type TimePickerModalProps = {
  visible: boolean;
  initialValue: string;
  title: string;
  onClose: () => void;
  onSave: (value: string) => void;
};

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);
const formatNumber = (value: number) => `${value}`.padStart(2, '0');

const parseTime = (value: string) => {
  const [rawHour, rawMinute] = value.split(':');
  let hour = Number(rawHour);
  if (!Number.isFinite(hour)) {
    hour = 0;
  }
  // раньше в колесе был «24-й час» как полночь — приводим к 00
  if (hour === 24) {
    hour = 0;
  }
  hour = clamp(hour, 0, 23);
  const minute = clamp(Number(rawMinute) || 0, 0, 59);
  return {hour, minute};
};

const formatTime = (hour: number, minute: number) => `${formatNumber(hour)}:${formatNumber(minute)}`;

/** Меньше дубликатов в списке — быстрее первый mount при открытии */
const TIME_LOOP_CYCLES = 5;

export const TimePickerModal = ({visible, initialValue, title, onClose, onSave}: TimePickerModalProps) => {
  const {t} = useTranslation('timePickers', {i18n});
  const {height: windowHeight} = useWindowDimensions();
  const sheetRef = useRef<BottomSheetModal>(null);
  const [wasOpened, setWasOpened] = useState(false);
  const [syncKey, setSyncKey] = useState(0);
  const initial = parseTime(initialValue);
  const [draftHour, setDraftHour] = useState(initial.hour);
  const [draftMinute, setDraftMinute] = useState(initial.minute);

  const hourOptions = useMemo(() => Array.from({length: 24}, (_, i) => formatNumber(i)), []);
  const minuteOptions = useMemo(() => Array.from({length: 60}, (_, i) => formatNumber(i)), []);

  const onHourChange = useCallback((index: number) => {
    setDraftHour(index);
  }, []);

  const onMinuteChange = useCallback((index: number) => {
    setDraftMinute(index);
  }, []);

  useEffect(() => {
    if (!visible) {
      return;
    }
    setWasOpened(true);
  }, [visible]);

  useEffect(() => {
    if (!visible || !wasOpened) {
      return;
    }
    const parsed = parseTime(initialValue);
    setDraftHour(parsed.hour);
    setDraftMinute(parsed.minute);
    setSyncKey(prev => prev + 1);
    const id = requestAnimationFrame(() => {
      sheetRef.current?.present();
    });
    return () => cancelAnimationFrame(id);
  }, [initialValue, visible, wasOpened]);

  const handleSave = useCallback(() => {
    onSave(formatTime(draftHour, draftMinute));
    sheetRef.current?.dismiss();
  }, [draftHour, draftMinute, onSave]);

  const handleBack = useCallback(() => {
    sheetRef.current?.dismiss();
  }, []);

  if (!wasOpened) {
    return null;
  }

  return (
    <BottomSheetMain
      ref={sheetRef}
      onDismiss={onClose}
      enableContentPanningGesture={false}
      enableHandlePanningGesture={false}
      enablePanDownToClose={false}
      maxDynamicContentSize={windowHeight * 0.88}
      contentContainerStyle={styles.sheetContent}>
      <Text style={styles.modalTitle}>{title}</Text>

      <View style={styles.wheelWrapper}>
        <View style={styles.selectedRowHighlight} />
        <WheelPickerColumn
          options={hourOptions}
          selectedIndex={draftHour}
          onChange={onHourChange}
          loop
          loopCycles={TIME_LOOP_CYCLES}
          columnStyle={styles.hourColumn}
          syncKey={syncKey}
        />
        <WheelPickerColumn
          options={minuteOptions}
          selectedIndex={draftMinute}
          onChange={onMinuteChange}
          loop
          loopCycles={TIME_LOOP_CYCLES}
          columnStyle={styles.minuteColumn}
          syncKey={syncKey}
        />
      </View>

      <View style={styles.actionsRow}>
        <ButtonMain title={t('common.back')} variant="secondary" onPress={handleBack} style={styles.actionButton} />
        <ButtonMain title={t('common.save')} onPress={handleSave} style={styles.actionButton} />
      </View>
    </BottomSheetMain>
  );
};

const styles = StyleSheet.create({
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
  hourColumn: {
    flex: 1,
    minWidth: 0,
  },
  minuteColumn: {
    flex: 1,
    minWidth: 0,
  },
  timeSeparator: {
    alignSelf: 'center',
    fontSize: 20,
    fontWeight: '600',
    color: 'rgba(29, 26, 73, 1)',
    paddingHorizontal: 4,
    lineHeight: 24,
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
