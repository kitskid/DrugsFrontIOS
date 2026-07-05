import {keepLocalCopy} from '@react-native-documents/picker';
import {Platform} from 'react-native';
import RNFS from 'react-native-fs';

import {
  getNotEmptyFileName,
  prepareFileNameForCache,
  sanitizeLogicalFileNameForUpload,
} from './sanitizeFileName.ts';

export type ConvertibleMime = {extension: string | null; mimeType: string};

export const normalizeFileUriForUpload = (uri: string): string => {
  const value = uri.trim();

  if (!value) {
    return value;
  }

  if (value.startsWith('file://') || value.startsWith('content://')) {
    return value;
  }

  if (/^[a-zA-Z][a-zA-Z+\-.]*:/.test(value)) {
    return value;
  }

  return `file://${value}`;
};

export const mimeForAttachment = (ext: string, pickerMime?: string | null): string => {
  const pickerType = pickerMime?.trim();

  if (pickerType && pickerType.includes('/')) {
    return pickerType;
  }

  const normalizedExt = ext.toUpperCase();

  if (normalizedExt === 'PDF') {
    return 'application/pdf';
  }

  if (normalizedExt === 'PNG') {
    return 'image/png';
  }

  if (normalizedExt === 'JPG' || normalizedExt === 'JPEG') {
    return 'image/jpeg';
  }

  if (normalizedExt === 'DOC') {
    return 'application/msword';
  }

  if (normalizedExt === 'DOCX') {
    return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  }

  if (normalizedExt === 'XLS') {
    return 'application/vnd.ms-excel';
  }

  if (normalizedExt === 'XLSX') {
    return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
  }

  if (normalizedExt === 'PPT') {
    return 'application/vnd.ms-powerpoint';
  }

  if (normalizedExt === 'PPTX') {
    return 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
  }

  if (normalizedExt === 'CSV') {
    return 'text/csv';
  }

  if (normalizedExt === 'TXT') {
    return 'text/plain';
  }

  return 'application/octet-stream';
};

const ensureFileName = (name: string, mimeType: string): string => {
  const base = getNotEmptyFileName(name, 'file');

  if (base.includes('.')) {
    return base;
  }

  if (mimeType.includes('pdf')) {
    return `${base}.pdf`;
  }

  if (mimeType.includes('png')) {
    return `${base}.png`;
  }

  if (mimeType.includes('jpeg') || mimeType.includes('jpg')) {
    return `${base}.jpg`;
  }

  return `${base}.bin`;
};

const ensureUploadMime = (mimeType: string): string => {
  const value = mimeType?.trim();

  if (value && value.includes('/')) {
    return value;
  }

  return 'application/octet-stream';
};

/** content:// нельзя отдать в multipart напрямую — копируем в локальный file://. */
const copyContentUriToCache = async (
  uri: string,
  safeName: string,
  convertVirtualFileToType?: string,
): Promise<string> => {
  // Обычный файл (Загрузки, память устройства): RNFS читает content:// через ContentResolver.
  if (!convertVirtualFileToType) {
    const destPath = `${RNFS.CachesDirectoryPath}/${Date.now()}_${safeName}`;
    await RNFS.copyFile(uri, destPath);
    const stat = (await RNFS.exists(destPath)) ? await RNFS.stat(destPath) : null;

    if (!stat || Number(stat.size) <= 0) {
      await RNFS.unlink(destPath).catch(() => {});
      throw new Error('Не удалось скопировать файл в локальное хранилище');
    }

    return `file://${destPath}`;
  }

  // Виртуальный файл (Google Docs/Sheets): экспорт умеет только keepLocalCopy.
  const [copy] = await keepLocalCopy({
    files: [{uri, fileName: safeName, convertVirtualFileToType}],
    destination: 'cachesDirectory',
  });

  if (copy.status !== 'success') {
    throw new Error(copy.copyError);
  }

  const localUri = normalizeFileUriForUpload(copy.localUri);
  const stat = (await RNFS.exists(localUri.replace(/^file:\/\//, '')))
    ? await RNFS.stat(localUri.replace(/^file:\/\//, ''))
    : null;

  if (!stat || Number(stat.size) <= 0) {
    throw new Error('Файл в кэше пустой или недоступен после экспорта');
  }

  return localUri;
};

export const resolveDocumentForUpload = async (input: {
  uri: string;
  fileName: string;
  mimeType: string;
  isVirtual?: boolean | null;
  convertibleToMimeTypes?: ConvertibleMime[] | null;
}): Promise<{uri: string; name: string; type: string}> => {
  const type = ensureUploadMime(input.mimeType);
  const name = ensureFileName(input.fileName, type);
  const safeName = prepareFileNameForCache(name, 'upload.bin');
  const logicalName = sanitizeLogicalFileNameForUpload(name, 'upload.bin');

  if (Platform.OS === 'android' && input.uri.startsWith('content:')) {
    let convertVirtualFileToType: string | undefined;

    if (input.isVirtual && input.convertibleToMimeTypes?.length) {
      const pdf = input.convertibleToMimeTypes.find(item => item.mimeType === 'application/pdf');
      convertVirtualFileToType = (pdf ?? input.convertibleToMimeTypes[0]).mimeType;
    }

    const localUri = await copyContentUriToCache(input.uri, safeName, convertVirtualFileToType);

    return {uri: localUri, name: logicalName, type};
  }

  return {uri: normalizeFileUriForUpload(input.uri), name: logicalName, type};
};

export const buildUploadFilePayload = (prepared: {
  uri: string;
  name: string;
  type: string;
}): {uri: string; fileName: string; mimeType: string} => ({
  uri: normalizeFileUriForUpload(prepared.uri),
  fileName: sanitizeLogicalFileNameForUpload(prepared.name, 'upload.bin'),
  mimeType: ensureUploadMime(prepared.type),
});
