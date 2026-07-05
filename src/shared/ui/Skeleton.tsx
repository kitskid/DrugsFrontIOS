import {useEffect, useState} from 'react';
import {StyleSheet, type DimensionValue, type StyleProp, type ViewStyle} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

const BASE_COLOR = 'rgba(241, 240, 249, 1)';
const SHIMMER_DURATION_MS = 1400;

type SkeletonProps = {
  width: DimensionValue;
  height: number;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
};

export const Skeleton = ({
  width,
  height,
  borderRadius = 8,
  style,
}: SkeletonProps) => {
  const [layoutWidth, setLayoutWidth] = useState(0);
  const shimmerTranslate = useSharedValue(0);

  useEffect(() => {
    if (layoutWidth <= 0) {
      return;
    }

    const shimmerStart = -layoutWidth * 2;
    const shimmerEnd = layoutWidth;

    shimmerTranslate.value = shimmerStart;
    shimmerTranslate.value = withRepeat(
      withTiming(shimmerEnd, {
        duration: SHIMMER_DURATION_MS,
        easing: Easing.linear,
      }),
      -1,
      false,
    );
  }, [layoutWidth, shimmerTranslate]);

  const shimmerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{translateX: shimmerTranslate.value}],
  }));

  return (
    <Animated.View
      onLayout={event => {
        setLayoutWidth(event.nativeEvent.layout.width);
      }}
      style={[
        styles.container,
        {
          width,
          height,
          borderRadius,
        },
        style,
      ]}>
      {layoutWidth > 0 ? (
        <Animated.View
          style={[
            styles.shimmer,
            {
              width: layoutWidth * 2,
              height,
            },
            shimmerAnimatedStyle,
          ]}>
          <LinearGradient
            colors={[
              'rgba(255, 255, 255, 0)',
              'rgba(255, 255, 255, 0.45)',
              'rgba(255, 255, 255, 0)',
            ]}
            locations={[0, 0.5, 1]}
            start={{x: 0, y: 0.5}}
            end={{x: 1, y: 0.5}}
            style={styles.gradient}
          />
        </Animated.View>
      ) : null}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    backgroundColor: BASE_COLOR,
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  gradient: {
    flex: 1,
  },
});
