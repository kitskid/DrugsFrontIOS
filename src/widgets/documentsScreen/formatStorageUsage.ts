import type {TFunction} from 'i18next';

const FILE_SIZE_UNIT_KEYS = ['bytes', 'kb', 'mb', 'gb'] as const;

export const parseBytes = (value: string): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

export const formatFileCountLabel = (count: number, t: TFunction<'documents'>): string =>
  t('storage.fileCount', {count});

export const formatFolderCountLabel = (count: number, t: TFunction<'documents'>): string =>
  t('storage.folderCount', {count});

export const formatFileSize = (bytes: number, t: TFunction<'documents'>): string => {
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
