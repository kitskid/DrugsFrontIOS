import {useEffect, useState} from 'react';
import {StyleProp, StyleSheet, Text, TouchableOpacity, View, ViewStyle} from 'react-native';
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
import {IconMapper} from '../IconMapper.tsx';
import {DatePickerModal} from './DatePickerModal.tsx';

type DatePickerMainProps = {
  value: Date | null;
  onChange: (value: Date) => void;
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

const formatDate = (date: Date, monthNames: string[]) => {
  const day = `${date.getDate()}`.padStart(2, '0');
  const month = monthNames[date.getMonth()];
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
};

export const DatePickerMain = ({
  value,
  onChange,
  label,
  placeholder,
  modalTitle,
  errorText,
  style,
}: DatePickerMainProps) => {
  const {t} = useTranslation('timePickers', {i18n});
  const monthNames = [
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
  ];
  const hasError = typeof errorText === 'string';
  const hasValue = value !== null;
  const displayedText = hasValue ? formatDate(value, monthNames) : (placeholder || t('defaults.datePlaceholder'));
  const title = modalTitle ?? label ?? t('defaults.dateTitle');

  const [isModalVisible, setModalVisible] = useState(false);

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

  return (
    <View style={style}>
      {label ? <Text style={styles.label}>{label}</Text> : null}

      <TouchableOpacity activeOpacity={0.7} onPress={openModal}>
        <Animated.View style={[styles.container, containerAnimatedStyle]}>
          <Text style={[styles.valueText, !hasValue && styles.placeholderText]}>{displayedText}</Text>
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

      <DatePickerModal
        visible={isModalVisible}
        initialValue={value}
        title={title}
        onClose={closeModal}
        onSave={date => {
          onChange(date);
        }}
      />
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
});
