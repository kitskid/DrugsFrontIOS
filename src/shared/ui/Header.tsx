import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import type {TouchableOpacityProps} from 'react-native';
import {useNavigation} from '@react-navigation/native';

import {CircleIconButton} from './CircleIconButton';
import {IconMapper, type IconName} from './IconMapper';

type HeaderProps = {
  title: string;
  backgroundColor?: string;
  rightIcon?: IconName;
  onRightIconPress?: TouchableOpacityProps['onPress'];
};

export const Header = ({
  title,
  backgroundColor = 'rgba(255, 255, 255, 1)',
  rightIcon,
  onRightIconPress,
}: HeaderProps) => {
  const navigation = useNavigation();

  return (
    <View style={[styles.container, {backgroundColor}]}>
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => {
          navigation.goBack();
        }}
        style={styles.backButton}>
        <View style={styles.iconWrapper}>
          <IconMapper
            icon="chevron-left"
            size={24}
            weight={1.5}
            color="rgba(29, 26, 73, 1)"
          />
        </View>
        <Text style={styles.title}>{title}</Text>
      </TouchableOpacity>
      {rightIcon ? (
        <CircleIconButton
          style={styles.rightIconButton}
          backgroundColor="transparent"
          iconColor="rgba(162, 160, 191, 1)"
          icon={rightIcon}
          onPress={onRightIconPress ?? (() => {})}
        />
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 48,
    justifyContent: 'space-between',
    alignItems: 'center',
    flexDirection: 'row',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconWrapper: {
    marginLeft: 12,
    marginRight: 12,
  },
  title: {
    color: 'rgba(29, 26, 73, 1)',
    fontSize: 18,
    fontWeight: '600',
  },
  rightIconButton: {
    marginRight: 12,
  },
});
