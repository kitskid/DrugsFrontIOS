import {useMemo} from 'react';
import {Image, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {useTranslation} from 'react-i18next';
import type {TFunction} from 'i18next';

import type {PatientFolderDto} from '../../features/api/apiDocuments.ts';
import i18n from '../../features/localisation/i18n.ts';
import {formatFileCountLabel, formatFileSize} from './formatStorageUsage.ts';
import {DEFAULT_BACKGROUND_IMAGE} from '../../shared/ui/drugs/drugsCardBackgroundIconRegistry.ts';
import {DrugsCardIconNameMapper} from '../../shared/ui/drugs/DrugsCardIconNameMapper.tsx';
import {IconMapper} from '../../shared/ui/IconMapper.tsx';

type FolderCardProps = {
  folder?: PatientFolderDto;
  isStorage?: boolean;
  storageSubtitle?: string;
  hideSubtitle?: boolean;
  isChevron?: boolean;
  isSelected?: boolean;
  onPress?: () => void;
};

const formatFolderSubtitle = (
  fileCount: number,
  totalSizeBytes: number,
  t: TFunction<'documents'>,
): string => {
  if (fileCount === 0) {
    return t('folder.empty');
  }

  return `${formatFileCountLabel(fileCount, t)} | ${formatFileSize(totalSizeBytes, t)}`;
};

export const FolderCard = ({
  folder,
  isStorage = false,
  storageSubtitle,
  hideSubtitle = false,
  isChevron = false,
  isSelected = false,
  onPress,
}: FolderCardProps) => {
  const {t} = useTranslation('documents', {i18n});

  const title = folder?.name ?? t('folder.storage');
  const subtitle = useMemo(() => {
    if (isStorage) {
      return storageSubtitle ?? t('folder.noSubtitle');
    }

    if (!folder) {
      return t('folder.noSubtitle');
    }

    return formatFolderSubtitle(folder.meta.filesCount, folder.meta.totalSizeBytes, t);
  }, [folder, isStorage, storageSubtitle, t]);

  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={onPress}
      style={[styles.container, isSelected && styles.selected]}>
      {isStorage ? (
        <Image
          source={require('../../../assets/images/claude.png')}
          style={styles.storageImage}
        />
      ) : (
        <DrugsCardIconNameMapper
          backgroundImage={folder?.backgroundImage ?? DEFAULT_BACKGROUND_IMAGE}
          medicationName={title}
          isFolder
        />
      )}
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2} ellipsizeMode="tail">
          {title}
        </Text>
        {hideSubtitle ? null : <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>
      {isChevron ? (
        <View style={styles.chevronContainer}>
          <IconMapper
            icon="chevron-right"
            size={24}
            color="rgba(199, 198, 217, 1)"
            weight={1.5}
          />
        </View>
      ) : null}
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
  selected: {
    backgroundColor: 'rgba(35, 142, 235, 0.1)',
    borderRadius: 16,
  },
  storageImage: {
    width: 44,
    height: 44,
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
  chevronContainer: {
    marginHorizontal: 12,
    justifyContent: 'center',
  },
});
