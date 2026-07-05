import {useEffect} from 'react';
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import type {TouchableOpacityProps} from 'react-native';
import Animated, {
  interpolateColor,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import {IconMapper} from './IconMapper.tsx';

const TITLE_COLOR = 'rgba(134, 132, 168, 1)';
const PLACEHOLDER_COLOR = 'rgba(199, 198, 217, 1)';
const ERROR_COLOR = 'rgba(245, 33, 33, 1)';
const ERROR_BLINK_IN_MS = 200;
const ERROR_BLINK_OUT_MS = 1000;

type DrugsCreateTouchableRightIconProps = {
  title?: string;
  placeholder?: string;
  filledText?: string;
  isError?: boolean;
  errorAnimationKey?: number;
  onErrorAnimationEnd?: () => void;
  onPress: TouchableOpacityProps['onPress'];
};

export const LabelValueTouchableRightChevron = ({
  title,
  placeholder,
  filledText,
  isError = false,
  errorAnimationKey = 0,
  onErrorAnimationEnd,
  onPress,
}: DrugsCreateTouchableRightIconProps) => {
  const hasTitle = Boolean(title);
  const normalizedFilledText = filledText?.trim() ?? '';
  const isFilled = normalizedFilledText.length > 0;
  const textToShow = isFilled ? filledText ?? '' : placeholder ?? '';
  const errorProgress = useSharedValue(0);

  useEffect(() => {
    if (!isError || isFilled) {
      return;
    }

    errorProgress.value = 0;
    errorProgress.value = withSequence(
      withTiming(1, {duration: ERROR_BLINK_IN_MS}),
      withTiming(0, {duration: ERROR_BLINK_OUT_MS}, finished => {
        if (finished && onErrorAnimationEnd) {
          runOnJS(onErrorAnimationEnd)();
        }
      }),
    );
  }, [errorAnimationKey, errorProgress, isError, isFilled, onErrorAnimationEnd]);

  const titleAnimatedStyle = useAnimatedStyle(() => ({
    color: interpolateColor(
      errorProgress.value,
      [0, 1],
      [TITLE_COLOR, ERROR_COLOR],
    ),
  }));

  const placeholderAnimatedStyle = useAnimatedStyle(() => ({
    color: interpolateColor(
      errorProgress.value,
      [0, 1],
      [PLACEHOLDER_COLOR, ERROR_COLOR],
    ),
  }));

  const valueTextStyle = [
    hasTitle ? styles.valueWithTitle : styles.valueWithoutTitle,
    isFilled
      ? hasTitle
        ? styles.filledWithTitle
        : styles.filledWithoutTitle
      : hasTitle
        ? styles.placeholderWithTitle
        : styles.placeholderWithoutTitle,
  ];

  return (
    <TouchableOpacity activeOpacity={0.7} onPress={onPress} style={styles.container}>
      <View style={styles.textContainer}>
        {hasTitle ? (
          isFilled ? (
            <Text style={styles.title}>{title}</Text>
          ) : (
            <Animated.Text style={[styles.title, titleAnimatedStyle]}>{title}</Animated.Text>
          )
        ) : null}

        {isFilled ? (
          <Text numberOfLines={2} ellipsizeMode="tail" style={valueTextStyle}>
            {textToShow}
          </Text>
        ) : (
          <Animated.Text
            numberOfLines={2}
            ellipsizeMode="tail"
            style={[valueTextStyle, placeholderAnimatedStyle]}>
            {textToShow}
          </Animated.Text>
        )}
      </View>

      <View style={styles.iconContainer}>
        <IconMapper
          icon="chevron-right"
          size={24}
          color="rgba(199, 198, 217, 1)"
          weight={1.5}
        />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    minHeight: 76,
    flexDirection: 'row',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
  },
  title: {
    color: 'rgba(134, 132, 168, 1)',
  },
  valueWithTitle: {
    marginTop: 2,
    fontSize: 16,
  },
  valueWithoutTitle: {
    fontSize: 18,
    fontWeight: '500',
  },
  placeholderWithTitle: {
    color: 'rgba(199, 198, 217, 1)',
  },
  placeholderWithoutTitle: {
    color: 'rgba(199, 198, 217, 1)',
  },
  filledWithTitle: {
    color: 'rgba(29, 26, 73, 1)',
  },
  filledWithoutTitle: {
    color: 'rgba(29, 26, 73, 1)',
  },
  iconContainer: {
    marginHorizontal: 12,
  },
});
