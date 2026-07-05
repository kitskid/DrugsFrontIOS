import {useEffect} from 'react';
import {StyleSheet, View} from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import {passwordValidationRules, PasswordInput} from './PasswordInput';

type PasswordInputWithCardsProps = {
  value: string;
  onChange: (value: string) => void;
  isError?: boolean;
  autoFocus?: boolean;
};

export const PasswordInputWithCards = ({
  value,
  onChange,
  isError = false,
  autoFocus = false,
}: PasswordInputWithCardsProps) => {
  const hasError = isError;
  const errorProgress = useSharedValue(hasError ? 1 : 0);

  useEffect(() => {
    errorProgress.value = withTiming(hasError ? 1 : 0, {
      duration: 180,
    });
  }, [errorProgress, hasError]);

  const cardTextAnimatedStyle = useAnimatedStyle(() => ({
    color: interpolateColor(
      errorProgress.value,
      [0, 1],
      ['rgba(29, 26, 73, 1)', 'rgba(245, 33, 33, 1)'],
    ),
  }));

  return (
    <View>
      <PasswordInput value={value} onChange={onChange} isError={isError} autoFocus={autoFocus} />

      <View style={styles.cardsContainer}>
        {passwordValidationRules.map(rule =>
          rule.isValid(value) ? null : (
            <View key={rule.text} style={styles.card}>
              <Animated.Text style={[styles.cardText, cardTextAnimatedStyle]}>
                {rule.text}
              </Animated.Text>
            </View>
          ),
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  cardsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: 4,
    rowGap: 8,
  },
  card: {
    backgroundColor: 'rgba(247, 246, 251, 1)',
    borderRadius: 1000,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  cardText: {
    color: 'rgba(29, 26, 73, 1)',
    fontSize: 16,
  },
});
