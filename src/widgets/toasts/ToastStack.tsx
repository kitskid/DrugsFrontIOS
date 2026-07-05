import {StyleSheet, View} from 'react-native';
import Animated, {LinearTransition} from 'react-native-reanimated';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import type {ToastItem as ToastItemModel} from '../../features/toasts/useToast';
import {ToastItem} from './ToastItem';

type ToastStackProps = {
  toasts: ToastItemModel[];
  onClose: (id: string) => void;
};

export const ToastStack = ({toasts, onClose}: ToastStackProps) => {
  const insets = useSafeAreaInsets();

  return (
    <View pointerEvents="box-none" style={[styles.wrapper, {top: insets.top + 8}]}>
      <Animated.View layout={LinearTransition.duration(180)} style={styles.list}>
        {toasts.map(toast => (
          <ToastItem key={toast.id} toast={toast} onClose={onClose} />
        ))}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 12,
    right: 12,
    zIndex: 1000,
    elevation: 1000,
  },
  list: {
    gap: 8,
  },
});
