import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import Animated, {FadeInDown, FadeOutUp} from 'react-native-reanimated';

import type {ToastItem as ToastItemModel} from '../../features/toasts/useToast';
import {IconMapper} from '../../shared/ui/IconMapper';

type ToastItemProps = {
  toast: ToastItemModel;
  onClose: (id: string) => void;
};

const ENTER_EXIT_DURATION = 180;

const toastIconColor = 'rgba(255, 255, 255, 1)';
const toastIconWeight = 1.5;
const toastIconSize = 24;

const variantConfig: Record<
  ToastItemModel['variant'],
  {backgroundColor: string; icon: 'check' | 'triangle-alert'}
> = {
  success: {
    backgroundColor: 'rgba(113, 186, 0, 1)',
    icon: 'check',
  },
  error: {
    backgroundColor: 'rgba(255, 102, 102, 1)',
    icon: 'triangle-alert',
  },
  warning: {
    backgroundColor: 'rgba(255, 128, 0, 1)',
    icon: 'triangle-alert',
  },
};

export const ToastItem = ({toast, onClose}: ToastItemProps) => {
  const {backgroundColor, icon} = variantConfig[toast.variant];

  return (
    <Animated.View
      entering={FadeInDown.duration(ENTER_EXIT_DURATION)}
      exiting={FadeOutUp.duration(ENTER_EXIT_DURATION)}
      style={[styles.container, {backgroundColor}]}>
      <View style={styles.content}>
        <IconMapper
          icon={icon}
          color={toastIconColor}
          weight={toastIconWeight}
          size={toastIconSize}
        />
        <Text style={styles.text}>{toast.text}</Text>
      </View>

      <TouchableOpacity hitSlop={8} onPress={() => onClose(toast.id)} style={styles.closeButton}>
        <IconMapper
          icon="x"
          color={toastIconColor}
          weight={toastIconWeight}
          size={toastIconSize}
        />
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 48,
    borderRadius: 24,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  text: {
    color: 'rgba(255, 255, 255, 1)',
    marginLeft: 10,
    flexShrink: 1,
  },
  closeButton: {
    marginLeft: 8,
  },
});
