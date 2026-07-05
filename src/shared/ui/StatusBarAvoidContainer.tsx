import type {PropsWithChildren} from 'react';
import {StyleSheet, View} from 'react-native';
import type {StyleProp, ViewStyle} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

type StatusBarAvoidContainerProps = PropsWithChildren<{
  style?: StyleProp<ViewStyle>;
  backgroundColor?: string;
}>;

export const StatusBarAvoidContainer = ({
  children,
  style,
  backgroundColor,
}: StatusBarAvoidContainerProps) => {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        {paddingTop: insets.top, backgroundColor},
        style,
      ]}>
      <View style={styles.content}>{children}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
});
