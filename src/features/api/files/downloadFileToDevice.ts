import RNFS from 'react-native-fs';

import {
  saveLocalFileToPublicStorage,
  type SavedFileResult,
} from './nativeFileStorage.ts';
import {prepareFileNameForCache, sanitizeLogicalFileNameForUpload} from './sanitizeFileName.ts';

type DownloadFileToDeviceParams = {
  data: ArrayBuffer;
  contentType?: string | null;
  contentDisposition?: string | null;
  fallbackFileName: string;
};

const MIME_EXTENSION_MAP: Record<string, string> = {
  'application/pdf': 'pdf',
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/heic': 'heic',
  'image/heif': 'heif',
  'application/msword': 'doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'application/vnd.ms-excel': 'xls',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
  'application/vnd.ms-powerpoint': 'ppt',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
  'text/plain': 'txt',
  'text/csv': 'csv',
};

const EXTENSION_MIME_MAP: Record<string, string> = {
  pdf: 'application/pdf',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  heic: 'image/heic',
  heif: 'image/heif',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xls: 'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ppt: 'application/vnd.ms-powerpoint',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  txt: 'text/plain',
  csv: 'text/csv',
};

const parseFileNameFromContentDisposition = (headerValue?: string | null): string | undefined => {
  if (!headerValue) {
    return undefined;
  }

  const starMatch = headerValue.match(/filename\*\s*=\s*UTF-8''([^;]+)/i);

  if (starMatch?.[1]) {
    try {
      return decodeURIComponent(starMatch[1].trim());
    } catch {
      return starMatch[1].trim();
    }
  }

  const quotedMatch = headerValue.match(/filename\s*=\s*"([^"]+)"/i);

  if (quotedMatch?.[1]) {
    return quotedMatch[1].trim();
  }

  const plainMatch = headerValue.match(/filename\s*=\s*([^;]+)/i);

  return plainMatch?.[1]?.trim();
};

const normalizeMimeType = (value?: string | null): string => {
  const mimeType = value?.split(';')[0]?.trim().toLowerCase();

  return mimeType && mimeType.length > 0 ? mimeType : 'application/octet-stream';
};

const mimeTypeFromFileName = (fileName: string): string | undefined => {
  const extension = fileName.split('.').pop()?.toLowerCase();

  if (!extension) {
    return undefined;
  }

  return EXTENSION_MIME_MAP[extension];
};

const resolveMimeType = (contentType: string | null | undefined, fileName: string): string => {
  const normalizedHeaderMime = normalizeMimeType(contentType);

  if (normalizedHeaderMime !== 'application/json' && normalizedHeaderMime !== 'application/octet-stream') {
    return normalizedHeaderMime;
  }

  return mimeTypeFromFileName(fileName) ?? normalizedHeaderMime;
};

const ensureFileExtension = (fileName: string, mimeType: string): string => {
  if (/\.[A-Za-z0-9]{1,8}$/.test(fileName)) {
    return fileName;
  }

  const extension = MIME_EXTENSION_MAP[mimeType];

  return extension ? `${fileName}.${extension}` : fileName;
};

const getDefaultFileName = (mimeType: string): string => {
  const extension = MIME_EXTENSION_MAP[mimeType];

  return extension ? `download.${extension}` : 'download.bin';
};

const ensureUniqueFilePath = async (directoryPath: string, fileName: string): Promise<string> => {
  const dotIndex = fileName.lastIndexOf('.');
  const baseName = dotIndex > 0 ? fileName.slice(0, dotIndex) : fileName;
  const extension = dotIndex > 0 ? fileName.slice(dotIndex) : '';

  let candidate = `${directoryPath}/${fileName}`;
  let suffix = 1;

  while (await RNFS.exists(candidate)) {
    candidate = `${directoryPath}/${baseName}_${suffix}${extension}`;
    suffix += 1;
  }

  return candidate;
};

const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  let binary = '';

  for (let index = 0; index < bytes.length; index += chunkSize) {
    const chunk = bytes.subarray(index, index + chunkSize);
    let chunkBinary = '';

    for (let chunkIndex = 0; chunkIndex < chunk.length; chunkIndex++) {
      chunkBinary += String.fromCharCode(chunk[chunkIndex]);
    }

    binary += chunkBinary;
  }

  return globalThis.btoa(binary);
};

const isImageMimeType = (mimeType: string): boolean => mimeType.startsWith('image/');

export const downloadFileToDevice = async ({
  data,
  contentType,
  contentDisposition,
  fallbackFileName,
}: DownloadFileToDeviceParams): Promise<SavedFileResult> => {
  const responseFileName = parseFileNameFromContentDisposition(contentDisposition);
  const logicalFileName = sanitizeLogicalFileNameForUpload(
    responseFileName ?? fallbackFileName,
    'download.bin',
  );
  const mimeType = resolveMimeType(contentType, logicalFileName);
  const fileName = ensureFileExtension(logicalFileName, mimeType);
  const storageFileName = prepareFileNameForCache(fileName, getDefaultFileName(mimeType));
  const tempDirectoryPath = `${RNFS.CachesDirectoryPath}/download-export`;

  await RNFS.mkdir(tempDirectoryPath);

  const tempFilePath = await ensureUniqueFilePath(tempDirectoryPath, storageFileName);

  await RNFS.writeFile(tempFilePath, arrayBufferToBase64(data), 'base64');

  try {
    return await saveLocalFileToPublicStorage(
      tempFilePath,
      storageFileName,
      mimeType,
      isImageMimeType(mimeType),
    );
  } finally {
    await RNFS.unlink(tempFilePath).catch(() => {});
  }
};

export type {SavedFileResult};
