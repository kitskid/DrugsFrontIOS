import Animated, {
  useAnimatedProps,
  useAnimatedStyle,
  type SharedValue,
} from 'react-native-reanimated';
import {Platform, StyleSheet, View} from 'react-native';
import Svg, {Circle, Defs, LinearGradient, Stop} from 'react-native-svg';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const HOST_SIZE = 48;
const RING_SIZE = 34;
const STROKE_WIDTH = 2.75;
const RADIUS = (RING_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const CENTER = RING_SIZE / 2;
const TRACK_GRADIENT_ID = 'pullRefreshTrackGradient';
const PROGRESS_GRADIENT_ID = 'pullRefreshProgressGradient';

const BRAND_PURPLE = 'rgba(153, 101, 237, 1)';
const BRAND_BLUE = 'rgba(77, 172, 255, 1)';
const BRAND_LILAC = 'rgba(214, 190, 255, 1)';

type PullToRefreshIndicatorProps = {
  progress: SharedValue<number>;
};

export const PULL_REFRESH_INDICATOR_HOST_SIZE = HOST_SIZE;

export const PullToRefreshIndicator = ({
  progress,
}: PullToRefreshIndicatorProps) => {
  const progressAnimatedProps = useAnimatedProps(() => ({
    strokeDashoffset:
      CIRCUMFERENCE * (1 - Math.min(1, Math.max(0, progress.value))),
  }));

  const hostAnimatedStyle = useAnimatedStyle(() => {
    const normalizedProgress = Math.min(1, Math.max(0, progress.value));

    return {
      transform: [{scale: 0.9 + normalizedProgress * 0.1}],
    };
  });

  const coreDotAnimatedProps = useAnimatedProps(() => {
    const normalizedProgress = Math.min(1, Math.max(0, progress.value));

    return {
      opacity: 0.45 + normalizedProgress * 0.55,
      r: 2.4 + normalizedProgress * 1.6,
    };
  });

  return (
    <Animated.View style={[styles.host, hostAnimatedStyle]}>
      <View style={styles.surfaceLayer} />
      <Svg width={RING_SIZE} height={RING_SIZE} style={styles.ring}>
        <Defs>
          <LinearGradient id={TRACK_GRADIENT_ID} x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="rgba(199, 198, 217, 0.55)" />
            <Stop offset="100%" stopColor="rgba(214, 190, 255, 0.75)" />
          </LinearGradient>
          <LinearGradient id={PROGRESS_GRADIENT_ID} x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={BRAND_PURPLE} />
            <Stop offset="55%" stopColor={BRAND_BLUE} />
            <Stop offset="100%" stopColor={BRAND_LILAC} />
          </LinearGradient>
        </Defs>
        <Circle
          cx={CENTER}
          cy={CENTER}
          r={RADIUS}
          stroke={`url(#${TRACK_GRADIENT_ID})`}
          strokeWidth={STROKE_WIDTH}
          fill="none"
        />
        <AnimatedCircle
          cx={CENTER}
          cy={CENTER}
          r={RADIUS}
          stroke={`url(#${PROGRESS_GRADIENT_ID})`}
          strokeWidth={STROKE_WIDTH}
          fill="none"
          strokeDasharray={`${CIRCUMFERENCE} ${CIRCUMFERENCE}`}
          strokeLinecap="round"
          animatedProps={progressAnimatedProps}
          transform={`rotate(-90 ${CENTER} ${CENTER})`}
        />
        <AnimatedCircle
          cx={CENTER}
          cy={CENTER}
          r={4}
          fill={`url(#${PROGRESS_GRADIENT_ID})`}
          animatedProps={coreDotAnimatedProps}
        />
      </Svg>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  host: {
    width: HOST_SIZE,
    height: HOST_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: 'rgba(153, 101, 237, 0.28)',
        shadowOffset: {width: 0, height: 4},
        shadowOpacity: 1,
        shadowRadius: 10,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  surfaceLayer: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    borderRadius: HOST_SIZE / 2,
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    borderWidth: 1,
    borderColor: 'rgba(214, 190, 255, 0.72)',
  },
  ring: {
    zIndex: 1,
  },
});
