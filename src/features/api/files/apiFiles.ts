import {API_BASE} from '@env';

import {apiClient} from '../client.ts';
import {getStoredUserId} from '../index.ts';
import {downloadFileToDevice} from './downloadFileToDevice.ts';
import {uploadFileMultipart, type UploadedFileDto} from './uploadFileMultipart.ts';

export type FileDto = UploadedFileDto;

export type UploadFilePayload = {
  uri: string;
  fileName: string;
  mimeType: string;
  userId?: string;
  description?: string;
};

export type UploadFileOptions = {
  signal?: AbortSignal;
  onUploadProgress?: (progress: number) => void;
};

export type DownloadFileOptions = {
  signal?: AbortSignal;
  onDownloadProgress?: (progress: number) => void;
};

export type DownloadFileResponse = {
  data: ArrayBuffer;
  contentType?: string;
  contentDisposition?: string;
};

const getHeaderValue = (headers: unknown, name: string): string | undefined => {
  if (headers == null || typeof headers !== 'object') {
    return undefined;
  }

  const normalizedName = name.toLowerCase();
  const record = headers as Record<string, unknown>;

  for (const [key, value] of Object.entries(record)) {
    if (key.toLowerCase() !== normalizedName) {
      continue;
    }

    if (typeof value === 'string') {
      return value;
    }

    if (Array.isArray(value) && typeof value[0] === 'string') {
      return value[0];
    }
  }

  return undefined;
};

const DOWNLOAD_PROGRESS_MAX_BEFORE_SAVE = 99;

export const apiFiles = {
  uploadFile: async (
    {
      uri,
      fileName,
      mimeType,
      userId,
      description,
    }: UploadFilePayload,
    options?: UploadFileOptions,
  ) => {
    const resolvedUserId = userId ?? (await getStoredUserId());
    const data = await uploadFileMultipart(
      {
        uri,
        fileName,
        mimeType: mimeType || 'application/octet-stream',
      },
      {
        userId: resolvedUserId,
        description,
        logicalFileName: fileName,
      },
      options,
    );

    return {data};
  },

  downloadFile: async (fileId: string, options?: DownloadFileOptions) => {
    const response = await apiClient.get<ArrayBuffer>(
      `${API_BASE}/api/files/${encodeURIComponent(fileId)}/download`,
      {
        requiresAuth: true,
        responseType: 'arraybuffer',
        signal: options?.signal,
        onDownloadProgress: event => {
          if (!options?.onDownloadProgress || !event.total) {
            return;
          }

          options.onDownloadProgress(
            Math.min(
              DOWNLOAD_PROGRESS_MAX_BEFORE_SAVE,
              Math.round((event.loaded * 100) / event.total),
            ),
          );
        },
      },
    );

    return {
      data: response.data,
      contentType: getHeaderValue(response.headers, 'content-type'),
      contentDisposition: getHeaderValue(response.headers, 'content-disposition'),
    } satisfies DownloadFileResponse;
  },

  downloadFileToDevice: async (
    fileId: string,
    fallbackFileName: string,
    options?: DownloadFileOptions,
  ) => {
    const response = await apiFiles.downloadFile(fileId, options);

    options?.onDownloadProgress?.(100);

    return downloadFileToDevice({
      data: response.data,
      contentType: response.contentType,
      contentDisposition: response.contentDisposition,
      fallbackFileName,
    });
  },

  deleteFile: async (fileId: string, options?: {signal?: AbortSignal}) => {
    await apiClient.delete(`${API_BASE}/api/files/${encodeURIComponent(fileId)}`, {
      requiresAuth: true,
      signal: options?.signal,
    });
  },
};
