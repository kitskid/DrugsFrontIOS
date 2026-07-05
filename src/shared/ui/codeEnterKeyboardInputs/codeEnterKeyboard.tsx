import {useMemo, useState} from 'react';
import {LayoutChangeEvent, Pressable, StyleSheet, Text, View} from 'react-native';
import Animated, {useAnimatedStyle, useSharedValue, withTiming} from 'react-native-reanimated';

import {IconMapper} from '../IconMapper';

const TEXT_COLOR = 'rgba(29, 26, 73, 1)';
const PRESSED_COLOR = 'rgba(35, 142, 235, 0.25)';
const KEY_HEIGHT = 66;
const MAX_KEY_WIDTH = 120;
const KEYBOARD_COLUMNS = 3;
const PRESS_ANIMATION_DURATION = 90;
const KEYBOARD_MAX_WIDTH = MAX_KEY_WIDTH * KEYBOARD_COLUMNS;

const rows = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['empty', '0', 'delete'],
] as const;

type CodeEnterKeyboardProps = {
  onDigitPress: (digit: string) => void;
  onDeletePress: () => void;
};

type KeyboardKeyProps = {
  item: string;
  keyWidth: number;
  onDigitPress: (digit: string) => void;
  onDeletePress: () => void;
};

const KeyboardKey = ({item, keyWidth, onDigitPress, onDeletePress}: KeyboardKeyProps) => {
  const backgroundOpacity = useSharedValue(0);

  const animatedBackgroundStyle = useAnimatedStyle(() => ({
    opacity: backgroundOpacity.value,
  }));

  const handlePressIn = () => {
    backgroundOpacity.value = withTiming(1, {duration: PRESS_ANIMATION_DURATION});
  };

  const handlePressOut = () => {
    backgroundOpacity.value = withTiming(0, {duration: PRESS_ANIMATION_DURATION});
  };

  const handlePress = () => {
    if (item === 'delete') {
      onDeletePress();
      return;
    }

    onDigitPress(item);
  };

  return (
    <Pressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[styles.key, {width: keyWidth, height: KEY_HEIGHT}]}>
      <Animated.View pointerEvents="none" style={[styles.keyBackground, animatedBackgroundStyle]} />

      {item === 'delete' ? (
        <IconMapper icon="delete" size={24} color={TEXT_COLOR} weight={1.5} />
      ) : (
        <Text style={styles.keyText}>{item}</Text>
      )}
    </Pressable>
  );
};

export const CodeEnterKeyboard = ({onDigitPress, onDeletePress}: CodeEnterKeyboardProps) => {
  const [containerWidth, setContainerWidth] = useState(0);

  const keyWidth = useMemo(() => {
    const resolvedWidth = containerWidth > 0 ? containerWidth : MAX_KEY_WIDTH * KEYBOARD_COLUMNS;

    return Math.min(resolvedWidth / KEYBOARD_COLUMNS, MAX_KEY_WIDTH);
  }, [containerWidth]);

  const onContainerLayout = ({nativeEvent}: LayoutChangeEvent) => {
    setContainerWidth(nativeEvent.layout.width);
  };

  return (
    <View onLayout={onContainerLayout} style={styles.container}>
      {rows.map((row, rowIndex) => (
        <View key={`row-${rowIndex}`} style={styles.row}>
          {row.map((item, itemIndex) => {
            if (item === 'empty') {
              return (
                <View
                  key={`empty-${rowIndex}-${itemIndex}`}
                  pointerEvents="none"
                  style={[styles.key, styles.emptyKey, {width: keyWidth, height: KEY_HEIGHT}]}
                />
              );
            }

            return (
              <KeyboardKey
                key={`${item}-${rowIndex}-${itemIndex}`}
                item={item}
                keyWidth={keyWidth}
                onDigitPress={onDigitPress}
                onDeletePress={onDeletePress}
              />
            );
          })}
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    maxWidth: KEYBOARD_MAX_WIDTH,
    alignSelf: 'center',
    marginTop: "auto"
  },
  row: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  key: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyBackground: {
    ...StyleSheet.absoluteFill,
    backgroundColor: PRESSED_COLOR,
    borderRadius: 24,
  },
  emptyKey: {
    opacity: 0,
  },
  keyText: {
    color: TEXT_COLOR,
    fontSize: 24,
    fontWeight: '500',
  },
});
