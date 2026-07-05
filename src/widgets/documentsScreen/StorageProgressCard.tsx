import {StyleSheet, Text, View} from 'react-native';
import Svg, {Circle, Defs, LinearGradient, Mask, Rect, Stop} from 'react-native-svg';

const SIZE = 85;
const STROKE_WIDTH = 10;
const RADIUS = (SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const CENTER = SIZE / 2;

const GRADIENT_ID = 'storageProgressGradient';
const MASK_ID = 'storageProgressMask';

const BLUE_BASE_COLOR = 'rgb(35, 142, 235)';
const RED_BASE_COLOR = 'rgb(245, 33, 33)';

type StorageProgressCardProps = {
  percentage: number;
  isLowStorage: boolean;
};

const clampPercentage = (percentage: number): number =>
  Math.min(100, Math.max(0, percentage));

export const StorageProgressCard = ({
  percentage,
  isLowStorage,
}: StorageProgressCardProps) => {
  const normalizedPercentage = clampPercentage(percentage);
  const progress = normalizedPercentage / 100;
  const strokeDashoffset = CIRCUMFERENCE * (1 - progress);
  const baseColor = isLowStorage ? RED_BASE_COLOR : BLUE_BASE_COLOR;
  const percentageColor = isLowStorage
    ? 'rgba(255, 102, 102, 1)'
    : 'rgba(199, 198, 217, 1)';

  return (
    <View style={styles.container}>
      <Svg width={SIZE} height={SIZE}>
        <Defs>
          <LinearGradient id={GRADIENT_ID} x1="50%" y1="0%" x2="50%" y2="100%">
            <Stop offset="0%" stopColor={baseColor} stopOpacity={0.35} />
            <Stop offset="100%" stopColor={baseColor} stopOpacity={0.65} />
          </LinearGradient>
          <Mask id={MASK_ID}>
            <Rect x={0} y={0} width={SIZE} height={SIZE} fill="black" />
            <Circle
              cx={CENTER}
              cy={CENTER}
              r={RADIUS}
              stroke="white"
              strokeWidth={STROKE_WIDTH}
              fill="none"
              strokeDasharray={`${CIRCUMFERENCE} ${CIRCUMFERENCE}`}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              transform={`rotate(-90 ${CENTER} ${CENTER})`}
            />
          </Mask>
        </Defs>
        <Circle
          cx={CENTER}
          cy={CENTER}
          r={RADIUS}
          stroke="rgba(241, 240, 249, 1)"
          strokeWidth={STROKE_WIDTH}
          fill="none"
        />
        <Rect
          x={0}
          y={0}
          width={SIZE}
          height={SIZE}
          fill={`url(#${GRADIENT_ID})`}
          mask={`url(#${MASK_ID})`}
        />
      </Svg>
      <Text style={[styles.percentage, {color: percentageColor}]}>
        {normalizedPercentage}%
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: SIZE,
    height: SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  percentage: {
    position: 'absolute',
    fontSize: 20,
    fontWeight: '700',
  },
});
