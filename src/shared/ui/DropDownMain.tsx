import {useEffect, useRef, useCallback} from 'react';
import {
  Keyboard,
  StyleProp,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
  ViewStyle,
} from 'react-native';
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Animated, {
  FadeIn,
  FadeOut,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import {ButtonMain} from './ButtonMain';
import {IconMapper} from './IconMapper';

export type DropDownMainOption = {
  title: string;
  value: string;
};

type DropDownMainProps = {
  value: string;
  onChange: (value: string) => void;
  options: DropDownMainOption[];
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

export const DropDownMain = ({
  value,
  onChange,
  options,
  label,
  placeholder,
  modalTitle,
  errorText,
  style,
}: DropDownMainProps) => {
  const {height: windowHeight} = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const sheetRef = useRef<BottomSheetModal>(null);
  const selectedOption = options.find(option => option.value === value);
  const hasError = typeof errorText === 'string';
  const hasValue = value.trim().length > 0;
  const displayedText = hasValue ? selectedOption?.title ?? value : placeholder ?? '';
  const title = modalTitle ?? label ?? '';
  const maxSheetHeight = windowHeight * 0.90;

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} pressBehavior="close" />
    ),
    [],
  );

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
    Keyboard.dismiss();
    focusProgress.value = withTiming(1, {duration: ANIMATION_DURATION});
    sheetRef.current?.present();
  };

  const resetFocus = () => {
    focusProgress.value = withTiming(0, {duration: ANIMATION_DURATION});
  };

  const closeModal = () => {
    resetFocus();
    sheetRef.current?.dismiss();
  };

  const selectOption = (option: DropDownMainOption) => {
    onChange(option.value);
    closeModal();
  };

  return (
    <View style={style}>
      {label ? <Text style={styles.label}>{label}</Text> : null}

      <TouchableOpacity activeOpacity={0.7} onPress={openModal}>
        <Animated.View style={[styles.container, containerAnimatedStyle]}>
          <Text style={[styles.valueText, !hasValue && styles.placeholderText]}>{displayedText}</Text>
          <IconMapper
            icon="chevron-down"
            size={24}
            color="rgba(162, 160, 191, 1)"
            weight={1.5}
          />
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

      <BottomSheetModal
        ref={sheetRef}
        maxDynamicContentSize={maxSheetHeight}
        enablePanDownToClose
        backdropComponent={renderBackdrop}
        handleIndicatorStyle={styles.handleIndicator}
        backgroundStyle={styles.background}
        onDismiss={resetFocus}>
        <BottomSheetScrollView
          style={styles.optionsScrollContainer}
          contentContainerStyle={[styles.optionsContentContainer, {paddingBottom: 16 + insets.bottom}]}>
          <Text style={styles.sheetTitle}>{title}</Text>
          {options.map(option => (
            <TouchableOpacity
              key={`${option.value}-${option.title}`}
              activeOpacity={0.7}
              onPress={() => selectOption(option)}
              style={styles.optionButton}>
              <Text style={styles.optionText}>{option.title}</Text>
            </TouchableOpacity>
          ))}
          <View style={styles.buttonWrap}>
            <ButtonMain title="Вернуться" variant="secondary" onPress={closeModal} />
          </View>
        </BottomSheetScrollView>
      </BottomSheetModal>
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
  background: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  handleIndicator: {
    width: 36,
    backgroundColor: 'rgba(232, 231, 242, 1)',
  },
  sheetTitle: {
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '500',
    color: 'rgba(29, 26, 73, 1)',
    paddingTop: 8,
  },
  optionsScrollContainer: {
    paddingHorizontal: 12,
  },
  optionsContentContainer: {
    paddingTop: 4,
  },
  buttonWrap: {
    marginTop: 12,
  },
  optionButton: {
    height: 56,
    justifyContent: 'center',
    paddingLeft: 16,
  },
  optionText: {
    color: 'rgba(29, 26, 73, 1)',
    fontSize: 16,
  },
});
