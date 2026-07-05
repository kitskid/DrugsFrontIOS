import {useEffect} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import Animated, {
  interpolateColor,
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

type CodeEnterInputsProps = {
  values: string[];
  isError?: boolean;
};

const ANIMATION_DURATION = 180;

export const CodeEnterInputs = ({values, isError = false}: CodeEnterInputsProps) => {
  const errorProgress = useSharedValue(isError ? 1 : 0);

  useEffect(() => {
    errorProgress.value = withTiming(isError ? 1 : 0, {duration: ANIMATION_DURATION});
  }, [errorProgress, isError]);

  return (
    <View style={styles.container}>
      {values.map((value, index) => (
        <CodeCircle
          key={`code-input-${index}`}
          value={value}
          errorProgress={errorProgress}
          withGap={index !== values.length - 1}
        />
      ))}
    </View>
  );
};

type CodeCircleProps = {
  value: string;
  withGap: boolean;
  errorProgress: SharedValue<number>;
};

const CodeCircle = ({value, withGap, errorProgress}: CodeCircleProps) => {
  const animatedStyle = useAnimatedStyle(() => ({
    borderWidth: errorProgress.value * 2,
    borderColor: interpolateColor(
      errorProgress.value,
      [0, 1],
      ['rgba(255, 102, 102, 0)', 'rgba(255, 102, 102, 1)'],
    ),
  }));

  return (
    <Animated.View style={[styles.circle, withGap && styles.circleWithGap, animatedStyle]}>
      {value ? <Text style={styles.valueText}>{value}</Text> : null}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    maxWidth: 360,
    alignSelf: 'center',
    flexDirection: 'row',
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  circle: {
    width: 56,
    height: 56,
    borderRadius: 1000,
    backgroundColor: 'rgba(241, 240, 249, 1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleWithGap: {
    marginRight: 8,
  },
  valueText: {
    color: 'rgba(29, 26, 73, 1)',
    fontSize: 18,
    fontWeight: '500',
  },
});
