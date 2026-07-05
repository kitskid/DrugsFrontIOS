import {NativeModules, Platform} from 'react-native';

type DrugsFrontFileStorageNative = {
  saveToDownloads: (
    localPath: string,
    displayName: string,
    mimeType: string,
  ) => Promise<string>;
  saveImageToGallery: (
    localPath: string,
    displayName: string,
    mimeType: string,
  ) => Promise<string>;
  saveImageToPhotoLibrary: (localPath: string) => Promise<{location: string}>;
  saveDocumentToDownloads: (
    localPath: string,
    displayName: string,
  ) => Promise<{location: string; path: string}>;
};

const nativeModule = NativeModules.DrugsFrontFileStorage as
  | DrugsFrontFileStorageNative
  | undefined;

const stripFileScheme = (uri: string): string => uri.replace(/^file:\/\//, '');

export type SavedFileLocation = 'gallery' | 'downloads' | 'files';

export type SavedFileResult = {
  fileName: string;
  location: SavedFileLocation;
  locationLabel: string;
};

const getLocationLabel = (location: SavedFileLocation): string => {
  if (location === 'gallery') {
    return Platform.OS === 'ios' ? 'Фото' : 'Галерея';
  }

  if (location === 'downloads') {
    return 'Загрузки';
  }

  return 'Файлы → На iPhone → Pills Tracker → Downloads';
};

export const saveLocalFileToPublicStorage = async (
  localPath: string,
  fileName: string,
  mimeType: string,
  isImage: boolean,
): Promise<SavedFileResult> => {
  if (!nativeModule) {
    throw new Error('Модуль сохранения файлов недоступен');
  }

  const normalizedPath = stripFileScheme(localPath);

  if (Platform.OS === 'android') {
    if (isImage) {
      await nativeModule.saveImageToGallery(normalizedPath, fileName, mimeType);

      return {
        fileName,
        location: 'gallery',
        locationLabel: getLocationLabel('gallery'),
      };
    }

    await nativeModule.saveToDownloads(normalizedPath, fileName, mimeType);

    return {
      fileName,
      location: 'downloads',
      locationLabel: getLocationLabel('downloads'),
    };
  }

  if (isImage) {
    await nativeModule.saveImageToPhotoLibrary(normalizedPath);

    return {
      fileName,
      location: 'gallery',
      locationLabel: getLocationLabel('gallery'),
    };
  }

  await nativeModule.saveDocumentToDownloads(normalizedPath, fileName);

  return {
    fileName,
    location: 'files',
    locationLabel: getLocationLabel('files'),
  };
};
