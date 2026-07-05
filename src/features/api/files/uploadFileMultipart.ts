import AsyncStorage from '@react-native-async-storage/async-storage';
import {API_BASE} from '@env';
import {Platform} from 'react-native';
import RNFS from 'react-native-fs';

import {prepareFileNameForCache, sanitizeLogicalFileNameForUpload} from './sanitizeFileName.ts';
import {ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY, REFRESH_TOKEN_HEADER} from '../index.ts';

export type UploadedFileDto = {
  id: string;
  userId: string;
  fileName: string;
  fileSize: number;
  mimeType: string | null;
  uploadDate: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  status: 'PENDING' | 'CONFIRMED' | 'FAILED';
};

const UPLOAD_PROGRESS_MAX_BEFORE_RESPONSE = 99;

type UploadFields = {
  userId: string;
  description?: string;
  logicalFileName?: string;
};

type UploadProgressHandler = (progress: number) => void;

const base64ToArrayBuffer = (base64: string): ArrayBuffer => {
  const binary = global.atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index++) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes.buffer;
};

const buildMultipartFileContentDispositionLine = (originalFileName: string): string => {
  const asciiFallback = prepareFileNameForCache(originalFileName, 'upload.bin');
  const escapedFallback = asciiFallback.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  const encodedName = encodeURIComponent(originalFileName).replace(/'/g, '%27');

  return `Content-Disposition: form-data; name="file"; filename="${escapedFallback}"; filename*=UTF-8''${encodedName}`;
};

const readLocalFileBytesForUpload = async (fileUri: string): Promise<ArrayBuffer> => {
  const path = fileUri.replace(/^file:\/\//, '');
  const exists = await RNFS.exists(path);
  const stat = exists ? await RNFS.stat(path) : null;

  if (!exists || !stat || Number(stat.size) <= 0) {
    throw new Error('Файл для загрузки отсутствует в кэше или пустой');
  }

  const base64 = await RNFS.readFile(path, 'base64');
  return base64ToArrayBuffer(base64);
};

const readFileBytesForUpload = async (uri: string): Promise<ArrayBuffer> => {
  const normalizedUri = uri.trim();

  if (Platform.OS === 'android' && normalizedUri.startsWith('file:')) {
    return readLocalFileBytesForUpload(normalizedUri);
  }

  const response = await fetch(normalizedUri);

  if (!response.ok) {
    throw new Error('Не удалось прочитать файл для загрузки');
  }

  return response.arrayBuffer();
};

const buildMultipartBody = (
  fileBytes: ArrayBuffer,
  fileName: string,
  mimeType: string,
  fields: UploadFields,
): {body: Uint8Array; boundary: string} => {
  const boundary = `----drugsfront${Date.now().toString(36)}${Math.random()
    .toString(36)
    .slice(2, 10)}`;
  const encoder = new TextEncoder();
  const filePartHeader = encoder.encode(
    `--${boundary}\r\n${buildMultipartFileContentDispositionLine(fileName)}\r\nContent-Type: ${mimeType}\r\n\r\n`,
  );
  const filePartBody = new Uint8Array(fileBytes);
  const filePartFooter = encoder.encode('\r\n');
  const userPart = encoder.encode(
    `--${boundary}\r\nContent-Disposition: form-data; name="userId"\r\n\r\n${fields.userId}\r\n`,
  );

  const logicalFileName = fields.logicalFileName?.replace(/\r\n|\r|\n/g, ' ') ?? '';
  const logicalHead =
    logicalFileName !== ''
      ? encoder.encode(
          `--${boundary}\r\nContent-Disposition: form-data; name="logicalFileName"\r\n\r\n`,
        )
      : null;
  const logicalValue = logicalHead ? encoder.encode(logicalFileName) : null;
  const logicalFooter = logicalHead ? encoder.encode('\r\n') : null;
  const logicalPartLength =
    (logicalHead?.length ?? 0) + (logicalValue?.length ?? 0) + (logicalFooter?.length ?? 0);

  const descriptionPart =
    fields.description != null && fields.description !== ''
      ? encoder.encode(
          `--${boundary}\r\nContent-Disposition: form-data; name="description"\r\n\r\n${fields.description}\r\n`,
        )
      : null;
  const endPart = encoder.encode(`--${boundary}--\r\n`);

  const totalLength =
    userPart.length +
    logicalPartLength +
    (descriptionPart?.length ?? 0) +
    filePartHeader.length +
    filePartBody.length +
    filePartFooter.length +
    endPart.length;

  const body = new Uint8Array(totalLength);
  let offset = 0;

  body.set(userPart, offset);
  offset += userPart.length;

  if (logicalHead && logicalValue && logicalFooter) {
    body.set(logicalHead, offset);
    offset += logicalHead.length;
    body.set(logicalValue, offset);
    offset += logicalValue.length;
    body.set(logicalFooter, offset);
    offset += logicalFooter.length;
  }

  if (descriptionPart) {
    body.set(descriptionPart, offset);
    offset += descriptionPart.length;
  }

  body.set(filePartHeader, offset);
  offset += filePartHeader.length;
  body.set(filePartBody, offset);
  offset += filePartBody.length;
  body.set(filePartFooter, offset);
  offset += filePartFooter.length;
  body.set(endPart, offset);

  return {body, boundary};
};

const getAccessToken = async (): Promise<string | null> => {
  const accessToken = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);

  if (typeof accessToken === 'string' && accessToken.trim().length > 0) {
    return accessToken.trim();
  }

  return null;
};

const refreshAccessToken = async (): Promise<string | null> => {
  const refreshToken = await AsyncStorage.getItem(REFRESH_TOKEN_KEY);

  if (typeof refreshToken !== 'string' || refreshToken.trim().length === 0) {
    return null;
  }

  const response = await fetch(`${API_BASE}/api/auth/session/refresh`, {
    method: 'POST',
    headers: {
      [REFRESH_TOKEN_HEADER]: refreshToken.trim(),
    },
  });

  if (!response.ok) {
    return null;
  }

  const data = (await response.json()) as {accessToken?: string; refreshToken?: string};

  if (typeof data.accessToken === 'string' && data.accessToken.trim().length > 0) {
    await AsyncStorage.setItem(ACCESS_TOKEN_KEY, data.accessToken.trim());
  }

  if (typeof data.refreshToken === 'string' && data.refreshToken.trim().length > 0) {
    await AsyncStorage.setItem(REFRESH_TOKEN_KEY, data.refreshToken.trim());
  }

  return getAccessToken();
};

const postMultipartRawWithXhr = (
  url: string,
  body: Uint8Array,
  headers: Record<string, string>,
  signal: AbortSignal | undefined,
  onUploadProgress?: UploadProgressHandler,
): Promise<{status: number; responseText: string}> =>
  new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', url);
    xhr.responseType = 'text';

    Object.entries(headers).forEach(([key, value]) => {
      xhr.setRequestHeader(key, value);
    });

    const handleAbort = () => {
      xhr.abort();
    };

    if (signal) {
      if (signal.aborted) {
        reject(new Error('Upload canceled'));
        return;
      }

      signal.addEventListener('abort', handleAbort, {once: true});
    }

    xhr.upload.onprogress = event => {
      if (!event.lengthComputable || !onUploadProgress) {
        return;
      }

      const total = event.total > 0 ? event.total : body.byteLength;
      onUploadProgress(
        Math.min(
          UPLOAD_PROGRESS_MAX_BEFORE_RESPONSE,
          Math.round((event.loaded * 100) / total),
        ),
      );
    };

    xhr.onload = () => {
      resolve({status: xhr.status, responseText: xhr.responseText ?? ''});
    };

    xhr.onerror = () => {
      reject(new Error('Network Error'));
    };

    xhr.onabort = () => {
      reject(new Error('Upload canceled'));
    };

    xhr.send(body);
  });

class UploadHttpError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}

const uploadOnce = async (
  body: Uint8Array,
  boundary: string,
  accessToken: string | null,
  signal?: AbortSignal,
  onUploadProgress?: UploadProgressHandler,
): Promise<UploadedFileDto> => {
  const headers: Record<string, string> = {
    'Content-Type': `multipart/form-data; boundary=${boundary}`,
  };

  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  const {status, responseText} = await postMultipartRawWithXhr(
    `${API_BASE}/api/files/upload`,
    body,
    headers,
    signal,
    onUploadProgress,
  );

  if (status < 200 || status >= 300) {
    throw new UploadHttpError(status, `Upload failed with status ${status}`);
  }

  return JSON.parse(responseText) as UploadedFileDto;
};

export const uploadFileMultipart = async (
  file: {uri: string; fileName: string; mimeType: string},
  fields: UploadFields,
  options?: {signal?: AbortSignal; onUploadProgress?: UploadProgressHandler},
): Promise<UploadedFileDto> => {
  const fileBytes = await readFileBytesForUpload(file.uri);
  const safeFileName = sanitizeLogicalFileNameForUpload(file.fileName, 'upload.bin');
  const safeMimeType = file.mimeType?.trim() || 'application/octet-stream';
  const {body, boundary} = buildMultipartBody(fileBytes, safeFileName, safeMimeType, {
    ...fields,
    logicalFileName: safeFileName,
  });

  let accessToken = await getAccessToken();

  try {
    return await uploadOnce(body, boundary, accessToken, options?.signal, options?.onUploadProgress);
  } catch (error) {
    if (!(error instanceof UploadHttpError) || error.statusCode !== 401) {
      throw error;
    }

    accessToken = await refreshAccessToken();

    if (!accessToken) {
      throw error;
    }

    return uploadOnce(body, boundary, accessToken, options?.signal, options?.onUploadProgress);
  }
};
