import {useMemo} from 'react';
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {useTranslation} from 'react-i18next';

import type {PrescriptionDocumentDto} from '../../features/api/drugs/apiDrugs.ts';
import i18n from '../../features/localisation/i18n.ts';
import {FileIcon} from '../../shared/ui/drugs/FileIcon.tsx';
import {formatDocumentUploadedDate} from './formatDocumentDate.ts';
import {formatFileSize} from './formatStorageUsage.ts';

type FileCardProps = {
  document: PrescriptionDocumentDto;
  onPress?: () => void;
};

const getFileExtension = (fileName: string): string => {
  const lastDotIndex = fileName.lastIndexOf('.');

  if (lastDotIndex === -1) {
    return '';
  }

  return fileName.slice(lastDotIndex + 1).toLowerCase();
};

const resolveFileIconType = (fileName: string, mimeType?: string): string => {
  const extension = getFileExtension(fileName);

  if (extension) {
    return extension;
  }

  const mimeSubtype = mimeType?.split('/').pop()?.toLowerCase();
  return mimeSubtype ?? 'file';
};

export const FileCard = ({document, onPress}: FileCardProps) => {
  const {t} = useTranslation('documents', {i18n});
  const {t: tTimePickers} = useTranslation('timePickers', {i18n});

  const subtitle = useMemo(() => {
    const uploadedAt = document.uploadDate ?? document.createdAt ?? '';
    return `${formatDocumentUploadedDate(uploadedAt, tTimePickers)} | ${formatFileSize(document.fileSize, t)}`;
  }, [document, t, tTimePickers]);

  const fileType = resolveFileIconType(document.fileName, document.mimeType);

  return (
    <TouchableOpacity activeOpacity={0.75} onPress={onPress} style={styles.container}>
      <FileIcon fileType={fileType} id={document.id} />
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2} ellipsizeMode="tail">
          {document.fileName}
        </Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
    </TouchableOpacity>
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
  },
  title: {
    color: 'rgba(29, 26, 73, 1)',
    fontSize: 16,
    fontWeight: '500',
  },
  subtitle: {
    marginTop: 4,
    color: 'rgba(134, 132, 168, 1)',
    fontSize: 13,
  },
});
