import {StyleSheet, TouchableOpacity} from 'react-native';
import type {StyleProp, TouchableOpacityProps, ViewStyle} from 'react-native';

import {IconMapper, type IconName} from './IconMapper';

type CircleIconButtonProps = {
  style?: StyleProp<ViewStyle>;
  backgroundColor?: string;
  icon: IconName;
  iconColor?: string;
  iconWeight?: number;
  onPress: TouchableOpacityProps['onPress'];
};

export const CircleIconButton = ({
  style,
  backgroundColor = 'rgba(35, 142, 235, 1)',
  icon,
  iconColor = 'rgba(255, 255, 255, 1)',
  iconWeight = 1.5,
  onPress,
}: CircleIconButtonProps) => {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      hitSlop={6}
      style={[styles.container, {backgroundColor}, style]}>
      <IconMapper icon={icon} size={24} color={iconColor} weight={iconWeight} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
