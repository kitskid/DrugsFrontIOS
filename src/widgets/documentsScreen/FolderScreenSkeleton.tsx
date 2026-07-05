import {StyleSheet, View} from 'react-native';

import {Skeleton} from '../../shared/ui/Skeleton.tsx';

const FILE_ROW_HEIGHT = 72;
const FILE_ROWS_COUNT = 4;

const FileRowSkeleton = () => (
  <View style={styles.fileRow}>
    <Skeleton width={48} height={48} borderRadius={14} />
    <View style={styles.rowText}>
      <Skeleton width="62%" height={16} borderRadius={6} />
      <Skeleton width="45%" height={13} borderRadius={6} style={styles.subtitle} />
    </View>
  </View>
);

export const FolderScreenSkeleton = () => (
  <View style={styles.filesContainer}>
    {Array.from({length: FILE_ROWS_COUNT}, (_, index) => (
      <FileRowSkeleton key={`file-skeleton-${index}`} />
    ))}
  </View>
);

const styles = StyleSheet.create({
  filesContainer: {
    marginTop: 12,
    backgroundColor: 'rgba(255, 255, 255, 1)',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingVertical: 8,
  },
  fileRow: {
    height: FILE_ROW_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  rowText: {
    flex: 1,
    marginLeft: 10,
  },
  subtitle: {
    marginTop: 8,
  },
});
