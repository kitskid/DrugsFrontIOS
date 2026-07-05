import {StyleSheet, View} from 'react-native';

import {Skeleton} from '../../shared/ui/Skeleton.tsx';

const ICON_SIZE = 48;
const NAME_HEIGHT = 16;
const TYPE_HEIGHT = 13;
const TIME_HEIGHT = 13;
const TIME_WIDTH = 70;

export const SkeletonNotificationCard = () => {
  return (
    <View style={styles.card}>
      <Skeleton width={ICON_SIZE} height={ICON_SIZE} borderRadius={16} />

      <View style={styles.textColumn}>
        <Skeleton width="70%" height={NAME_HEIGHT} borderRadius={6} />
        <Skeleton
          width="40%"
          height={TYPE_HEIGHT}
          borderRadius={6}
          style={styles.typeLabel}
        />
      </View>

      <Skeleton
        width={TIME_WIDTH}
        height={TIME_HEIGHT}
        borderRadius={6}
        style={styles.time}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
    padding: 12,
  },
  textColumn: {
    flex: 1,
    marginLeft: 10,
  },
  typeLabel: {
    marginTop: 4,
  },
  time: {
    alignSelf: 'flex-end',
    marginLeft: 8,
  },
});
