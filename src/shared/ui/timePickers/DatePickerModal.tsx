import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {StyleSheet, Text, useWindowDimensions, View} from 'react-native';
import {BottomSheetModal} from '@gorhom/bottom-sheet';
import {useTranslation} from 'react-i18next';

import i18n from '../../../features/localisation/i18n';
import {ButtonMain} from '../ButtonMain.tsx';
import {BottomSheetMain} from '../modals/BottomSheetMain.tsx';
import {WheelPickerColumn, WHEEL_PICKER_ITEM_HEIGHT, WHEEL_PICKER_VISIBLE_ROWS} from './WheelPickerColumn.tsx';

type DatePickerModalProps = {
  visible: boolean;
  initialValue?: Date | null;
  title: string;
  onClose: () => void;
  onSave: (value: Date) => void;
};

const DATE_DAY_LOOP_CYCLES = 6;
const DATE_MONTH_LOOP_CYCLES = 5;
const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);
const getDaysInMonth = (month: number, year: number) => new Date(year, month + 1, 0).getDate();

const getInitialDraft = (value: Date | null | undefined, years: number[]) => {
  const baseDate = value ?? new Date();
  const year = clamp(baseDate.getFullYear(), years[0], years[years.length - 1]);
  const month = baseDate.getMonth();
  const day = clamp(baseDate.getDate(), 1, getDaysInMonth(month, year));

  return {year, month, day};
};

export const DatePickerModal = ({visible, initialValue, title, onClose, onSave}: DatePickerModalProps) => {
  const {t} = useTranslation('timePickers', {i18n});
  const {height: windowHeight} = useWindowDimensions();
  const sheetRef = useRef<BottomSheetModal>(null);
  const [wasOpened, setWasOpened] = useState(false);
  const [syncKey, setSyncKey] = useState(0);

  const years = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return [currentYear - 1, currentYear, currentYear + 1];
  }, []);
  const yearOptions = useMemo(() => years.map(year => `${year}`), [years]);
  const monthOptions = useMemo(
    () => [
      t('months.jan'),
      t('months.feb'),
      t('months.mar'),
      t('months.apr'),
      t('months.may'),
      t('months.jun'),
      t('months.jul'),
      t('months.aug'),
      t('months.sep'),
      t('months.oct'),
      t('months.nov'),
      t('months.dec'),
    ],
    [t],
  );

  const initial = getInitialDraft(initialValue, years);
  const [draftDay, setDraftDay] = useState(initial.day);
  const [draftMonth, setDraftMonth] = useState(initial.month);
  const [draftYear, setDraftYear] = useState(initial.year);

  const dayOptions = useMemo(() => {
    const maxDay = getDaysInMonth(draftMonth, draftYear);
    return Array.from({length: maxDay}, (_, index) => `${index + 1}`);
  }, [draftMonth, draftYear]);

  const onDayChange = useCallback((index: number) => {
    setDraftDay(index + 1);
  }, []);

  const onMonthChange = useCallback(
    (nextMonth: number) => {
      const maxDay = getDaysInMonth(nextMonth, draftYear);
      setDraftMonth(nextMonth);
      setDraftDay(prev => Math.min(prev, maxDay));
    },
    [draftYear],
  );

  const onYearChange = useCallback(
    (index: number) => {
      const nextYear = years[index];
      const maxDay = getDaysInMonth(draftMonth, nextYear);
      setDraftYear(nextYear);
      setDraftDay(prev => Math.min(prev, maxDay));
    },
    [draftMonth, years],
  );

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

    const nextInitial = getInitialDraft(initialValue, years);
    setDraftYear(nextInitial.year);
    setDraftMonth(nextInitial.month);
    setDraftDay(nextInitial.day);
    setSyncKey(prev => prev + 1);

    const id = requestAnimationFrame(() => {
      sheetRef.current?.present();
    });
    return () => cancelAnimationFrame(id);
  }, [initialValue, visible, wasOpened, years]);

  const handleBack = useCallback(() => {
    sheetRef.current?.dismiss();
  }, []);

  const handleSave = useCallback(() => {
    const maxDay = getDaysInMonth(draftMonth, draftYear);
    onSave(new Date(draftYear, draftMonth, Math.min(draftDay, maxDay)));
    sheetRef.current?.dismiss();
  }, [draftDay, draftMonth, draftYear, onSave]);

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
          options={dayOptions}
          selectedIndex={Math.min(draftDay - 1, dayOptions.length - 1)}
          onChange={onDayChange}
          loop
          loopCycles={DATE_DAY_LOOP_CYCLES}
          columnStyle={styles.dayColumn}
          syncKey={syncKey}
          itemTextStyle={styles.wheelItemTextLower}
        />
        <WheelPickerColumn
          options={monthOptions}
          selectedIndex={draftMonth}
          onChange={onMonthChange}
          loop
          loopCycles={DATE_MONTH_LOOP_CYCLES}
          columnStyle={styles.monthColumn}
          syncKey={syncKey}
          itemTextStyle={styles.wheelItemTextLower}
        />
        <WheelPickerColumn
          options={yearOptions}
          selectedIndex={Math.max(years.indexOf(draftYear), 0)}
          onChange={onYearChange}
          columnStyle={styles.yearColumn}
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
    alignItems: 'center',
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
  dayColumn: {
    flex: 1.1,
  },
  monthColumn: {
    flex: 1.2,
  },
  yearColumn: {
    flex: 1.4,
  },
  wheelItemTextLower: {
    textTransform: 'lowercase',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
  },
});
