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
import {CircleIconButton} from '../CircleIconButton.tsx';
import {IconMapper} from '../IconMapper.tsx';
import {TimePickerModal} from './TimePickerModal.tsx';

type TimePickerMainProps = {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  modalTitle?: string;
  errorText?: string | null;
  style?: StyleProp<ViewStyle>;
  onCancel?: () => void;
};

const ERROR_COLOR = 'rgba(245, 33, 33, 1)';
const FOCUS_COLOR = 'rgba(56, 163, 255, 1)';
const PLACEHOLDER_COLOR = 'rgba(162, 160, 191, 1)';
const ANIMATION_DURATION = 180;

export const TimePickerMain = ({
  value,
  onChange,
  label,
  placeholder,
  modalTitle,
  errorText,
  style,
  onCancel,
}: TimePickerMainProps) => {
  const {t} = useTranslation('timePickers', {i18n});
  const hasCancel = Boolean(onCancel);
  const hasError = typeof errorText === 'string';
  const hasValue = value.trim().length > 0;
  const displayedText = hasValue ? value : (placeholder || t('defaults.timePlaceholder'));
  const title = modalTitle ?? label ?? t('defaults.timeTitle');
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

      <Animated.View style={[styles.container, hasCancel && styles.containerWithCancel, containerAnimatedStyle]}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={openModal}
          style={[styles.touchableField, hasCancel ? styles.touchableFieldWithCancel : styles.touchableFieldDefault]}>
          <Text style={[styles.valueText, hasCancel && styles.valueTextWithCancel, !hasValue && styles.placeholderText]}>
            {displayedText}
          </Text>
          <IconMapper icon="chevron-down" size={24} color="rgba(162, 160, 191, 1)" weight={1.5} />
        </TouchableOpacity>

        {hasCancel ? (
          <CircleIconButton
            icon="x"
            iconColor="rgba(162, 160, 191, 1)"
            backgroundColor="rgba(232, 231, 242, 1)"
            onPress={onCancel}
            style={styles.cancelButton}
          />
        ) : null}
      </Animated.View>

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

      <TimePickerModal
        visible={isModalVisible}
        initialValue={value}
        title={title}
        onClose={closeModal}
        onSave={time => {
          onChange(time);
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
    justifyContent: 'flex-start',
    gap: 8,
  },
  containerWithCancel: {
    paddingRight: 4,
  },
  touchableField: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  touchableFieldDefault: {
    flex: 1,
    justifyContent: 'space-between',
  },
  touchableFieldWithCancel: {
    flexShrink: 0,
    gap: 8,
  },
  valueText: {
    flex: 1,
    color: 'rgba(29, 26, 73, 1)',
    fontSize: 16,
  },
  valueTextWithCancel: {
    flex: 0,
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
  cancelButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
});
