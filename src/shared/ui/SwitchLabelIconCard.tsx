import {StyleProp, StyleSheet, Text, View, ViewStyle} from 'react-native';

import {IconMapper, IconName} from './IconMapper';
import {Switch} from './Switch';

type SwitchLabelIconCardProps = {
  icon: IconName;
  text: string;
  isActive: boolean;
  setIsActive: (value: boolean) => void;
  style?: StyleProp<ViewStyle>;
};

export const SwitchLabelIconCard = ({
  icon,
  text,
  isActive,
  setIsActive,
  style,
}: SwitchLabelIconCardProps) => {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.content}>
        <IconMapper
          icon={icon}
          size={24}
          color="rgba(199, 198, 217, 1)"
          weight={1.5}
        />
        <Text style={styles.text}>{text}</Text>
      </View>

      <Switch isActive={isActive} setIsActive={setIsActive} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 76,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
    marginRight: 12,
  },
  text: {
    color: 'rgba(134, 132, 168, 1)',
    marginLeft: 12,
  },
});
