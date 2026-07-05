import {StyleSheet, View} from 'react-native';

import {Skeleton} from '../../shared/ui/Skeleton.tsx';

export const FolderCardSkeleton = () => (
  <View style={styles.container}>
    <Skeleton width={48} height={48} borderRadius={14} />
    <View style={styles.content}>
      <Skeleton width="55%" height={16} borderRadius={6} />
      <Skeleton width="40%" height={13} borderRadius={6} style={styles.subtitle} />
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    height: 72,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  content: {
    flex: 1,
    marginLeft: 10,
  },
  subtitle: {
    marginTop: 4,
  },
});
