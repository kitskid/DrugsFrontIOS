import {StyleSheet, Text, View} from 'react-native';
import {useTranslation} from 'react-i18next';

import i18n from '../../features/localisation/i18n.ts';
import {CircleIconButton} from '../../shared/ui/CircleIconButton.tsx';
import {FileIcon} from '../../shared/ui/drugs/FileIcon.tsx';
import {formatFileSize} from './formatStorageUsage.ts';

const ACTION_ICON_COLOR = 'rgba(199, 198, 217, 1)';

type FileUploadCardProps = {
  fileName: string;
  fileType: string;
  sizeBytes: number;
  progress: number;
  localId: string;
  onCancelUpload: () => void;
};

export const FileUploadCard = ({
  fileName,
  fileType,
  sizeBytes,
  progress,
  localId,
  onCancelUpload,
}: FileUploadCardProps) => {
  const {t} = useTranslation('documents', {i18n});

  return (
    <View style={styles.container}>
      <FileIcon fileType={fileType} id={localId} />
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2} ellipsizeMode="tail">
          {fileName}
        </Text>
        <View style={styles.metaRow}>
          <Text style={styles.sizeText}>{formatFileSize(sizeBytes, t)}</Text>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, {width: `${progress}%`}]} />
          </View>
          <Text style={styles.percentText}>{progress}%</Text>
        </View>
      </View>
      <CircleIconButton
        icon="x"
        backgroundColor="transparent"
        iconColor={ACTION_ICON_COLOR}
        onPress={onCancelUpload}
      />
    </View>
  );
};

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
    marginRight: 4,
  },
  title: {
    color: 'rgba(29, 26, 73, 1)',
    fontSize: 16,
    fontWeight: '500',
  },
  metaRow: {
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  sizeText: {
    color: 'rgba(29, 26, 73, 0.6)',
    fontSize: 13,
  },
  progressTrack: {
    flex: 1,
    height: 4,
    marginLeft: 8,
    borderRadius: 100,
    backgroundColor: 'rgba(35, 142, 235, 0.2)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 100,
    backgroundColor: 'rgba(35, 142, 235, 1)',
  },
  percentText: {
    marginLeft: 4,
    color: 'rgba(29, 26, 73, 1)',
    fontSize: 13,
  },
});
