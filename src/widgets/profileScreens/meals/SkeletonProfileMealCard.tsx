import {StyleSheet, View} from 'react-native';

import {Skeleton} from '../../../shared/ui/Skeleton.tsx';

const CHEVRON_SIZE = 24;

export const SkeletonProfileMealCard = () => {
  return (
    <View style={styles.card}>
      <View style={styles.touchable}>
        <View style={styles.textContainer}>
          <Skeleton width="38%" height={14} borderRadius={6} />
          <Skeleton width="78%" height={16} borderRadius={6} style={styles.mealsLine} />
        </View>
        <Skeleton width={CHEVRON_SIZE} height={CHEVRON_SIZE} borderRadius={12} style={styles.icon} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(255, 255, 255, 1)',
    borderRadius: 28,
    marginBottom: 16,
  },
  touchable: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    height: 80
  },
  textContainer: {
    flex: 1,
    marginRight: 12,
  },
  mealsLine: {
    marginTop: 8,
  },
  icon: {
    marginRight: 12,
  },
});
