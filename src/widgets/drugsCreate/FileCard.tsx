import {StyleSheet, Text, View} from 'react-native';
import {useTranslation} from 'react-i18next';

import type {FileDto} from '../../features/api/files/apiFiles.ts';
import i18n from '../../features/localisation/i18n';
import {CircleIconButton} from '../../shared/ui/CircleIconButton.tsx';
import {FileIcon} from '../../shared/ui/drugs/FileIcon.tsx';

const ACTION_ICON_COLOR = 'rgba(199, 198, 217, 1)';

export type DrugsCreateFileStatus = 'uploading' | 'uploaded' | 'error';

export type DrugsCreateFileItem = {
  localId: string;
  fileName: string;
  fileType: string;
  sizeBytes: number;
  status: DrugsCreateFileStatus;
  progress?: number;
  isDownloading?: boolean;
  serverFile?: FileDto;
  documentId?: string;
  sourceFile?: {
    uri: string;
    mimeType: string;
  };
};

type FileCardProps = {
  file: DrugsCreateFileItem;
  onCancelUpload?: () => void;
  onRetryUpload?: () => void;
  onDeleteFile?: () => void;
  onDownloadFile?: () => void;
};

const FILE_SIZE_UNIT_KEYS = ['bytes', 'kb', 'mb', 'gb'] as const;

const formatFileSize = (bytes: number, units: string[]): string => {
  if (bytes <= 0) {
    return `0 ${units[0]}`;
  }

  const unitIndex = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1,
  );
  const value = bytes / 1024 ** unitIndex;
  const rounded = Math.round(value * 10) / 10;
  const formatted = Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);

  return `${formatted} ${units[unitIndex]}`;
};

const renderMetaRow = (file: DrugsCreateFileItem, uploadErrorText: string, sizeUnits: string[]) => {
  if (file.status === 'error') {
    return <Text style={styles.errorText}>{uploadErrorText}</Text>;
  }

  if (file.status === 'uploading' || file.isDownloading) {
    const progress = file.progress ?? 0;

    return (
      <View style={styles.metaRow}>
        <Text style={styles.sizeText}>{formatFileSize(file.sizeBytes, sizeUnits)}</Text>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, {width: `${progress}%`}]} />
        </View>
        <Text style={styles.percentText}>{progress}%</Text>
      </View>
    );
  }

  return <Text style={styles.sizeText}>{formatFileSize(file.sizeBytes, sizeUnits)}</Text>;
};

const renderActions = (
  file: DrugsCreateFileItem,
  onCancelUpload?: () => void,
  onRetryUpload?: () => void,
  onDeleteFile?: () => void,
  onDownloadFile?: () => void,
) => {
  if (file.status === 'uploading') {
    return (
      <CircleIconButton
        icon="x"
        backgroundColor="transparent"
        iconColor={ACTION_ICON_COLOR}
        onPress={onCancelUpload}
      />
    );
  }

  if (file.status === 'uploaded') {
    return (
      <>
        {!file.isDownloading && (
          <CircleIconButton
            icon="download"
            backgroundColor="transparent"
            iconColor={ACTION_ICON_COLOR}
            onPress={onDownloadFile}
          />
        )}
        <CircleIconButton
          icon="trash-2"
          backgroundColor="transparent"
          iconColor={ACTION_ICON_COLOR}
          onPress={onDeleteFile}
        />
      </>
    );
  }

  return (
    <>
      <CircleIconButton
        icon="refresh-ccw"
        backgroundColor="transparent"
        iconColor={ACTION_ICON_COLOR}
        onPress={onRetryUpload}
      />
      <CircleIconButton
        icon="x"
        backgroundColor="transparent"
        iconColor={ACTION_ICON_COLOR}
        onPress={onDeleteFile}
      />
    </>
  );
};

export const FileCard = ({
  file,
  onCancelUpload,
  onRetryUpload,
  onDeleteFile,
  onDownloadFile,
}: FileCardProps) => {
  const {t} = useTranslation('drugsCreate', {i18n});
  const sizeUnits = FILE_SIZE_UNIT_KEYS.map(key => t(`filesTab.fileSizeUnits.${key}`));

  return (
    <View style={styles.container}>
      <FileIcon fileType={file.fileType} id={file.localId} />
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2} ellipsizeMode="tail">
          {file.fileName}
        </Text>
        <View style={styles.metaContainer}>
          {renderMetaRow(file, t('filesTab.uploadError'), sizeUnits)}
        </View>
      </View>
      <View style={styles.actions}>
        {renderActions(
          file,
          onCancelUpload,
          onRetryUpload,
          onDeleteFile,
          onDownloadFile,
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 1)',
    borderRadius: 28,
    paddingVertical: 16,
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
  metaContainer: {
    marginTop: 6,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sizeText: {
    color: 'rgba(29, 26, 73, 0.6)',
    fontSize: 13,
  },
  errorText: {
    color: 'rgba(255, 102, 102, 1)',
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
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
