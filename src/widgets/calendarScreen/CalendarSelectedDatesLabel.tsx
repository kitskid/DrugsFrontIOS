import {useMemo} from 'react';
import {StyleSheet, Text, type StyleProp, type TextStyle} from 'react-native';
import {useTranslation} from 'react-i18next';

import i18n from '../../features/localisation/i18n.ts';
import {
  formatDateWithMonth,
  formatDateWithMonthAndYear,
  MONTH_GENITIVE_KEY_LIST,
} from './formatCalendarDate.ts';

type CalendarSelectedDatesLabelProps = {
  startDate: Date | null;
  endDate: Date | null;
  style?: StyleProp<TextStyle>;
};

export const CalendarSelectedDatesLabel = ({
  startDate,
  endDate,
  style,
}: CalendarSelectedDatesLabelProps) => {
  const {t, i18n: i18nInstance} = useTranslation('calendar', {i18n});

  const label = useMemo(() => {
    if (!startDate && !endDate) {
      return '';
    }

    const monthGenitiveNames = MONTH_GENITIVE_KEY_LIST.map(key =>
      t(`monthsGenitive.${key}`),
    );

    if (startDate && endDate) {
      const [firstDate, secondDate] =
        startDate.getTime() <= endDate.getTime()
          ? [startDate, endDate]
          : [endDate, startDate];
      const isSameYear = firstDate.getFullYear() === secondDate.getFullYear();

      if (isSameYear) {
        return `${formatDateWithMonth(firstDate, monthGenitiveNames)} — ${formatDateWithMonthAndYear(secondDate, monthGenitiveNames)}`;
      }

      return `${formatDateWithMonthAndYear(firstDate, monthGenitiveNames)} — ${formatDateWithMonthAndYear(secondDate, monthGenitiveNames)}`;
    }

    return formatDateWithMonthAndYear(endDate ?? startDate!, monthGenitiveNames);
  }, [endDate, i18nInstance.language, startDate, t]);

  if (!label) {
    return null;
  }

  return <Text style={[styles.text, style]}>{label}</Text>;
};

const styles = StyleSheet.create({
  text: {
    marginVertical: 16,
    textAlign: 'center',
    fontWeight: '500',
    fontSize: 18,
    color: 'rgba(134, 132, 168, 1)',
  },
});
