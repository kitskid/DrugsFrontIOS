import {ScrollView, StyleSheet, Text, View} from 'react-native';
import {useTranslation} from 'react-i18next';

import i18n from '../../features/localisation/i18n';
import {IconMapper} from '../../shared/ui/IconMapper';
import {FileCard, type DrugsCreateFileItem} from './FileCard.tsx';

type DrugsCreateFilesTabProps = {
  files: DrugsCreateFileItem[];
  onCancelUpload: (localId: string) => void;
  onRetryUpload: (localId: string) => void;
  onDeleteFile: (localId: string) => void;
  onDownloadFile: (localId: string) => void;
  contentPaddingBottom?: number;
};

export const DrugsCreateFilesTab = ({
  files,
  onCancelUpload,
  onRetryUpload,
  onDeleteFile,
  onDownloadFile,
  contentPaddingBottom = 0,
}: DrugsCreateFilesTabProps) => {
  const {t} = useTranslation('drugsCreate', {i18n});

  if (files.length === 0) {
    return (
      <View
        style={[
          styles.emptyContainer,
          {paddingBottom: contentPaddingBottom},
        ]}>
        <IconMapper
          icon="file-search-corner"
          size={64}
          color="rgba(199, 198, 217, 1)"
          weight={0.5}
        />
        <Text style={styles.emptyText}>{t('filesTab.empty')}</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.list}
      contentContainerStyle={[
        styles.listContent,
        {paddingBottom: contentPaddingBottom},
      ]}
      showsVerticalScrollIndicator={false}
      nestedScrollEnabled>
      {files.map(file => (
        <FileCard
          key={file.localId}
          file={file}
          onCancelUpload={() => {
            onCancelUpload(file.localId);
          }}
          onRetryUpload={() => {
            onRetryUpload(file.localId);
          }}
          onDeleteFile={() => {
            onDeleteFile(file.localId);
          }}
          onDownloadFile={() => {
            onDownloadFile(file.localId);
          }}
        />
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  emptyContainer: {
    flex: 1,
    minHeight: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    marginTop: 12,
    color: 'rgba(162, 160, 191, 1)',
  },
  list: {
    flex: 1,
    marginTop: 12,
    minHeight: 0,
  },
  listContent: {
    gap: 8,
  },
});
