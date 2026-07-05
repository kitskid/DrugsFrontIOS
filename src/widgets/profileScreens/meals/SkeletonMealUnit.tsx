import {StyleSheet, View} from 'react-native';

import {Skeleton} from '../../../shared/ui/Skeleton.tsx';

const ICON_SIZE = 24;

export const SkeletonMealUnit = () => {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Skeleton width="42%" height={18} borderRadius={6} style={styles.name} />
        <View style={styles.actions}>
          <Skeleton width={ICON_SIZE} height={ICON_SIZE} borderRadius={12} />
          <Skeleton width={ICON_SIZE} height={ICON_SIZE} borderRadius={12} style={styles.deleteButton} />
        </View>
      </View>
      <Skeleton width="100%" height={48} borderRadius={24} style={styles.timePicker} />
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(255, 255, 255, 1)',
    borderRadius: 28,
    paddingHorizontal: 12,
    paddingVertical: 16,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    justifyContent: 'space-between',
  },
  name: {
    flex: 1,
    marginLeft: 16,
    marginRight: 40
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
  },
  deleteButton: {
    marginRight: 12,
  },
  timePicker: {
    marginTop: 16,
  },
});
