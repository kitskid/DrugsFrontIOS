import {Image, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import type {StyleProp, ViewStyle} from 'react-native';
import {useTranslation} from 'react-i18next';
import type {TFunction} from 'i18next';

import type {StorageUsageSummaryDto} from '../../../features/api/apiDocuments.ts';
import i18n from '../../../features/localisation/i18n.ts';
import {parseBytes} from '../../documentsScreen/formatStorageUsage.ts';
import {IconMapper} from '../../../shared/ui/IconMapper.tsx';
import {HomeStorageCardSkeleton} from './HomeStorageCardSkeleton.tsx';

type HomeStorageCardProps = {
  storageUsage?: StorageUsageSummaryDto;
  foldersCount?: number;
  isLoading?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
};

const FILE_SIZE_UNIT_KEYS = ['bytes', 'kb', 'mb', 'gb'] as const;

const formatLocalizedFileSize = (bytes: number, t: TFunction<'profile'>): string => {
  const units = FILE_SIZE_UNIT_KEYS.map(key => t(`storage.fileSizeUnits.${key}`));

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

const formatStorageSubtitle = (
  storageUsage: StorageUsageSummaryDto,
  foldersCount: number,
  t: TFunction<'profile'>,
): string => {
  const usedBytes = parseBytes(storageUsage.usedBytes);
  const limitBytes = parseBytes(storageUsage.limitBytes);

  return `${t('storage.folderCount', {count: foldersCount})} | ${t('storage.fileCount', {count: storageUsage.filesCount})} | ${formatLocalizedFileSize(usedBytes, t)} / ${formatLocalizedFileSize(limitBytes, t)}`;
};

export const HomeStorageCard = ({
  storageUsage,
  foldersCount = 0,
  isLoading,
  onPress,
  style,
}: HomeStorageCardProps) => {
  const {t} = useTranslation('profile', {i18n});

  const subtitle = storageUsage
    ? formatStorageSubtitle(storageUsage, foldersCount, t)
    : null;

  if (isLoading) {
    return <HomeStorageCardSkeleton style={style} />;
  }

  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={onPress}
      style={[styles.card, style]}>
      <Image
        source={require('../../../../assets/images/claude.png')}
        style={styles.image}
        resizeMode="contain"
      />
      <View style={styles.textContainer}>
        <Text style={styles.title}>{t('storage_title')}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      <IconMapper
        icon="chevron-right"
        size={24}
        color="rgba(199, 198, 217, 1)"
        weight={1.5}
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 1)',
    borderRadius: 28,
    paddingLeft: 12,
    paddingRight: 24,
    paddingVertical: 12,
    height: 72,
    justifyContent: 'center',
  },
  image: {
    width: 44,
    height: 44,
  },
  textContainer: {
    flex: 1,
    marginLeft: 10,
  },
  title: {
    color: 'rgba(29, 26, 73, 1)',
    fontWeight: '500',
    fontSize: 16,
  },
  subtitle: {
    marginTop: 4,
    color: 'rgba(134, 132, 168, 1)',
    fontSize: 13,
  },
});
