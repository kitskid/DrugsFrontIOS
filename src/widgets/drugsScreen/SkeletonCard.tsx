import {StyleSheet, View} from 'react-native';

import {Skeleton} from '../../shared/ui/Skeleton.tsx';

const ICON_SIZE = 48;
const TITLE_HEIGHT = 16;
const SCHEDULE_HEIGHT = 13;
const SUBTITLE_HEIGHT = 13;

export const SkeletonCard = () => {
  return (
    <View style={styles.container}>
      <Skeleton width={ICON_SIZE} height={ICON_SIZE} borderRadius={14} />
      <View style={styles.content}>
        <View style={styles.titleRow}>
          <View style={styles.titleSkeletonWrap}>
            <Skeleton width="100%" height={TITLE_HEIGHT} borderRadius={6} />
          </View>
          <Skeleton width={60} height={SCHEDULE_HEIGHT} borderRadius={6} />
        </View>
        <Skeleton width="42%" height={SUBTITLE_HEIGHT} borderRadius={6} style={styles.subtitle} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  content: {
    flex: 1,
    marginLeft: 10,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  titleSkeletonWrap: {
    flex: 1,
    marginRight: 30,
  },
  subtitle: {
    marginTop: 6,
  },
});
