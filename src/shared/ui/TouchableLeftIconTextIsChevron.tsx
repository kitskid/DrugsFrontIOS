import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import type {TouchableOpacityProps} from 'react-native';

import {IconMapper, type IconName} from './IconMapper.tsx';

type TouchableLeftIconTextIsChevronProps = {
  icon: IconName;
  text: string;
  isChevron?: boolean;
  onPress: TouchableOpacityProps['onPress'];
};

export const TouchableLeftIconTextIsChevron = ({
  icon,
  text,
  isChevron = true,
  onPress,
}: TouchableLeftIconTextIsChevronProps) => {
  return (
    <TouchableOpacity activeOpacity={0.7} onPress={onPress} style={styles.container}>
      <IconMapper icon={icon} size={24} color="rgba(199, 198, 217, 1)" weight={1.5} />
      <Text style={styles.text}>{text}</Text>
      {isChevron ? (
        <View style={styles.chevronContainer}>
          <IconMapper
            icon="chevron-right"
            size={24}
            color="rgba(199, 198, 217, 1)"
            weight={1.5}
          />
        </View>
      ) : null}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 76,
    paddingHorizontal: 20,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  text: {
    flex: 1,
    marginLeft: 12,
    color: 'rgba(134, 132, 168, 1)',
  },
  chevronContainer: {
    marginHorizontal: 12,
  },
});
