import {useEffect} from 'react';
import {Pressable, StyleProp, StyleSheet, ViewStyle} from 'react-native';
import Animated, {
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import {IconMapper} from './IconMapper';

type CheckboxProps = {
  isChecked: boolean;
  setIsChecked: (value: boolean) => void;
  isError?: boolean;
  style?: StyleProp<ViewStyle>;
};

const ANIMATION_DURATION = 180;
const INACTIVE_BORDER_COLOR = 'rgba(162, 160, 191, 1)';
const ACTIVE_COLOR = 'rgba(35, 142, 235, 1)';
const INACTIVE_BACKGROUND = 'rgba(255, 255, 255, 1)';
const ERROR_BORDER_COLOR = 'rgba(245, 33, 33, 1)';

export const Checkbox = ({isChecked, setIsChecked, isError = false, style}: CheckboxProps) => {
  const progress = useSharedValue(isChecked ? 1 : 0);
  const errorProgress = useSharedValue(isError ? 1 : 0);

  useEffect(() => {
    progress.value = withTiming(isChecked ? 1 : 0, {
      duration: ANIMATION_DURATION,
    });
  }, [isChecked, progress]);

  useEffect(() => {
    errorProgress.value = withTiming(isError ? 1 : 0, {
      duration: ANIMATION_DURATION,
    });
  }, [errorProgress, isError]);

  const containerAnimatedStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      progress.value,
      [0, 1],
      [INACTIVE_BACKGROUND, ACTIVE_COLOR],
    ),
    borderColor: interpolateColor(
      progress.value,
      [0, 1],
      [
        interpolateColor(
          errorProgress.value,
          [0, 1],
          [INACTIVE_BORDER_COLOR, ERROR_BORDER_COLOR],
        ),
        ACTIVE_COLOR,
      ],
    ),
  }));

  const iconAnimatedStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{scale: interpolate(progress.value, [0, 1], [0.7, 1])}],
  }));

  return (
    <Pressable style={style} onPress={() => setIsChecked(!isChecked)} hitSlop={6}>
      <Animated.View style={[styles.container, containerAnimatedStyle]}>
        <Animated.View style={iconAnimatedStyle}>
          <IconMapper icon="check" size={16} weight={2} color={INACTIVE_BACKGROUND} />
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 24,
    height: 24,
    borderRadius: 8,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
