import {useEffect} from 'react';
import {Pressable, StyleSheet, View} from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

type SwitchProps = {
  isActive: boolean;
  setIsActive: (value: boolean) => void;
};

const SWITCH_WIDTH = 48;
const SWITCH_HEIGHT = 28;
const KNOB_SIZE = 22;
const KNOB_OFFSET = 3;
const KNOB_TRAVEL = SWITCH_WIDTH - KNOB_SIZE - KNOB_OFFSET * 2;
const ACTIVE_BG = 'rgba(35, 142, 235, 1)';
const INACTIVE_BG = 'rgba(232, 231, 242, 1)';

export const Switch = ({isActive, setIsActive}: SwitchProps) => {
  const progress = useSharedValue(isActive ? 1 : 0);

  useEffect(() => {
    progress.value = withTiming(isActive ? 1 : 0, {duration: 180});
  }, [isActive, progress]);

  const containerAnimatedStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(progress.value, [0, 1], [INACTIVE_BG, ACTIVE_BG]),
  }));

  const knobAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{translateX: progress.value * KNOB_TRAVEL}],
  }));

  return (
    <Pressable
      hitSlop={6}
      onPress={() => {
        setIsActive(!isActive);
      }}>
      <Animated.View style={[styles.container, containerAnimatedStyle]}>
        <Animated.View style={[styles.knobWrap, knobAnimatedStyle]}>
          <View style={styles.knob} />
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    width: SWITCH_WIDTH,
    height: SWITCH_HEIGHT,
    borderRadius: 1000,
    justifyContent: 'center',
  },
  knobWrap: {
    position: 'absolute',
    left: KNOB_OFFSET,
  },
  knob: {
    width: KNOB_SIZE,
    height: KNOB_SIZE,
    borderRadius: 1000,
    backgroundColor: 'rgba(255, 255, 255, 1)',
  },
});
