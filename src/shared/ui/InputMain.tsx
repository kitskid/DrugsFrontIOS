import {useEffect} from 'react';
import {
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  type TextInputProps,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import {IconMapper, type IconName} from './IconMapper';

type InputMainProps = {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  icon?: IconName;
  errorText?: string | null;
  autoFocus?: boolean;
  label?: string;
  placeholder?: string;
  numberOfLines?: number;
  keyboardType?: TextInputProps['keyboardType'];
  isX?: boolean;
  style?: StyleProp<ViewStyle>;
};

const ICON_COLOR = 'rgba(162, 160, 191, 1)';
const ICON_SIZE = 24;
const ICON_WEIGHT = 1.5;

const ERROR_COLOR = 'rgba(245, 33, 33, 1)';
const FOCUS_COLOR = 'rgba(56, 163, 255, 1)';
const PLACEHOLDER_COLOR = 'rgba(162, 160, 191, 1)';
const ANIMATION_DURATION = 180;

export const InputMain = ({
  value,
  onChange,
  onBlur,
  icon,
  errorText,
  autoFocus = false,
  label,
  placeholder,
  numberOfLines = 1,
  keyboardType,
  isX = false,
  style,
}: InputMainProps) => {
  const hasError = typeof errorText === 'string';
  const errorProgress = useSharedValue(hasError ? 1 : 0);
  const focusProgress = useSharedValue(autoFocus ? 1 : 0);

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

  return (
    <View style={style}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <Animated.View style={[styles.container, containerAnimatedStyle]}>
        {icon ? (
          <View style={styles.iconContainer}>
            <IconMapper weight={ICON_WEIGHT} icon={icon} size={ICON_SIZE} color={ICON_COLOR} />
          </View>
        ) : null}

        <TextInput
          value={value}
          onChangeText={onChange}
          autoFocus={autoFocus}
          placeholder={placeholder}
          numberOfLines={numberOfLines}
          multiline={numberOfLines > 1}
          keyboardType={keyboardType}
          placeholderTextColor={PLACEHOLDER_COLOR}
          onFocus={() => {
            focusProgress.value = withTiming(1, {
              duration: ANIMATION_DURATION,
            });
          }}
          onBlur={() => {
            focusProgress.value = withTiming(0, {
              duration: ANIMATION_DURATION,
            });
            onBlur?.();
          }}
          style={[styles.input, !icon && styles.inputWithoutIcon]}
        />

        {isX && value.length > 0 ? (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => onChange('')}
            style={styles.iconContainer}>
            <IconMapper icon="x" size={ICON_SIZE} color={ICON_COLOR} weight={ICON_WEIGHT} />
          </TouchableOpacity>
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 24,
    backgroundColor: 'rgba(241, 240, 249, 1)',
    minHeight: 48,
    borderWidth: 2,
  },
  iconContainer: {
    marginHorizontal: 12,
    marginVertical: 12,
  },
  input: {
    flex: 1,
    color: 'rgba(29, 26, 73, 1)',
    fontSize: 16,
  },
  inputWithoutIcon: {
    marginHorizontal: 12,
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
