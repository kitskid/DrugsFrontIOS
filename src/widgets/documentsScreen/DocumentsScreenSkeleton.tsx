import {StyleSheet, View} from 'react-native';

import {Skeleton} from '../../shared/ui/Skeleton.tsx';

const FOLDER_ROW_HEIGHT = 72;
const FILE_ROW_HEIGHT = 72;
const FOLDER_ROWS_COUNT = 3;
const FILE_ROWS_COUNT = 2;

const FolderRowSkeleton = () => (
  <View style={styles.folderRow}>
    <Skeleton width={48} height={48} borderRadius={14} />
    <View style={styles.rowText}>
      <Skeleton width="55%" height={16} borderRadius={6} />
      <Skeleton width="40%" height={13} borderRadius={6} style={styles.subtitle} />
    </View>
  </View>
);

const FileRowSkeleton = () => (
  <View style={styles.fileRow}>
    <Skeleton width={48} height={48} borderRadius={14} />
    <View style={styles.rowText}>
      <Skeleton width="62%" height={16} borderRadius={6} />
      <Skeleton width="45%" height={13} borderRadius={6} style={styles.subtitle} />
    </View>
  </View>
);

export const DocumentsScreenSkeleton = () => (
  <View>
    <Skeleton width={56} height={16} borderRadius={6} style={styles.sectionTitle} />
    <View style={styles.foldersContainer}>
      {Array.from({length: FOLDER_ROWS_COUNT}, (_, index) => (
        <FolderRowSkeleton key={`folder-skeleton-${index}`} />
      ))}
    </View>
    <Skeleton width={52} height={16} borderRadius={6} style={styles.filesTitle} />
    <View style={styles.filesContainer}>
      {Array.from({length: FILE_ROWS_COUNT}, (_, index) => (
        <FileRowSkeleton key={`file-skeleton-${index}`} />
      ))}
    </View>
  </View>
);

const styles = StyleSheet.create({
  sectionTitle: {
    marginTop: 24,
    marginLeft: 12,
  },
  foldersContainer: {
    marginTop: 16,
    backgroundColor: 'rgba(255, 255, 255, 1)',
    borderRadius: 28,
    paddingVertical: 8,
  },
  folderRow: {
    height: FOLDER_ROW_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  filesTitle: {
    marginTop: 24,
    marginLeft: 12,
  },
  filesContainer: {
    marginTop: 16,
    backgroundColor: 'rgba(255, 255, 255, 1)',
    borderRadius: 28,
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
