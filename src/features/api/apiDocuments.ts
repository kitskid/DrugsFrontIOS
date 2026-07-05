import {API_BASE} from '@env';
import type {QueryClient} from '@tanstack/react-query';

import type {PrescriptionBackgroundImageDto, PrescriptionDocumentDto} from './drugs/apiDrugs.ts';
import {apiClient} from './client.ts';
import {getStoredUserId} from './index.ts';

export type StorageUsageSummaryDto = {
  id: string;
  userId: string;
  usedBytes: string;
  limitBytes: string;
  filesCount: number;
  createdAt: string;
  updatedAt: string;
};

export type FolderBreadcrumbItemDto = {
  id: string;
  name: string;
};

export type FolderMetaDto = {
  filesCount: number;
  foldersCount: number;
  totalSizeBytes: number;
};

export type PatientFolderDto = {
  id: string;
  name: string;
  type: string;
  entityType?: string | null;
  entityId?: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  scope: string;
  backgroundImage?: PrescriptionBackgroundImageDto;
  meta: FolderMetaDto;
  breadcrumb: FolderBreadcrumbItemDto[];
};

export type PatientFolderDocumentItemDto = {
  document: PrescriptionDocumentDto;
  breadcrumb: FolderBreadcrumbItemDto[];
};

export type PatientFoldersContentsDto = {
  folder: PatientFolderDto;
  breadcrumb: FolderBreadcrumbItemDto[];
  folders: PatientFolderDto[];
  files: PatientFolderDocumentItemDto[];
};

export type PatientFoldersSearchResponseDto = {
  folders: PatientFolderDto[];
  files: PatientFolderDocumentItemDto[];
  meta: PaginationMetaDto;
};

export type PaginationMetaDto = {
  total: number;
  offset: number;
  limit: number;
  page: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
};

export type GetPatientFoldersContentsParams = {
  parentId?: string;
};

export type SearchPatientFoldersParams = {
  q?: string;
  limit?: number;
  offset?: number;
};

export type UpdateDocumentDto = {
  type?: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  description?: string | null;
  fileId?: string;
  folderId?: string | null;
};

export type CreateDocumentDto = {
  type: string;
  fileName: string;
  fileSize: number;
  mimeType?: string;
  description?: string | null;
  fileId: string;
  folderId?: string;
};

export const STORAGE_USAGE_SUMMARY_QUERY_KEY = ['storageUsageSummary'] as const;
export const PATIENT_FOLDERS_CONTENTS_QUERY_KEY = ['patientFoldersContents'] as const;
export const PATIENT_FOLDERS_SEARCH_QUERY_KEY = ['patientFoldersSearch'] as const;

export const getPatientFoldersContentsQueryKey = (parentId?: string) =>
  [...PATIENT_FOLDERS_CONTENTS_QUERY_KEY, parentId ?? 'root'] as const;

export const getPatientFoldersSearchQueryKey = (query: string) =>
  [...PATIENT_FOLDERS_SEARCH_QUERY_KEY, query] as const;

export const invalidateDocumentsQueries = (queryClient: QueryClient) =>
  Promise.all([
    queryClient.invalidateQueries({queryKey: PATIENT_FOLDERS_CONTENTS_QUERY_KEY}),
    queryClient.invalidateQueries({queryKey: PATIENT_FOLDERS_SEARCH_QUERY_KEY}),
    queryClient.invalidateQueries({queryKey: STORAGE_USAGE_SUMMARY_QUERY_KEY}),
  ]);

export const apiDocuments = {
  getStorageUsageSummary: async (userId?: string) => {
    const resolvedUserId = userId ?? (await getStoredUserId());

    return apiClient.get<StorageUsageSummaryDto>(
      `${API_BASE}/api/files/storage-usage/summary`,
      {
        params: {userId: resolvedUserId},
        requiresAuth: true,
      },
    );
  },

  getPatientFoldersContents: async (params: GetPatientFoldersContentsParams = {}) => {
    const {parentId} = params;

    return apiClient.get<PatientFoldersContentsDto>(
      `${API_BASE}/api/medicines/patients/folders`,
      {
        params: parentId ? {parentId} : undefined,
        requiresAuth: true,
      },
    );
  },

  searchPatientFolders: async ({q, limit, offset}: SearchPatientFoldersParams = {}) => {
    return apiClient.get<PatientFoldersSearchResponseDto>(
      `${API_BASE}/api/medicines/patients/folders/search`,
      {
        params: {
          ...(q ? {q} : {}),
          ...(limit !== undefined ? {limit} : {}),
          ...(offset !== undefined ? {offset} : {}),
        },
        requiresAuth: true,
      },
    );
  },

  createDocument: async (
    payload: CreateDocumentDto,
    options?: {signal?: AbortSignal},
  ) => {
    return apiClient.post<PrescriptionDocumentDto>(
      `${API_BASE}/api/medicines/documents`,
      payload,
      {
        requiresAuth: true,
        signal: options?.signal,
      },
    );
  },

  deleteDocument: async (documentId: string, options?: {signal?: AbortSignal}) => {
    await apiClient.delete(
      `${API_BASE}/api/medicines/documents/${encodeURIComponent(documentId)}`,
      {
        requiresAuth: true,
        signal: options?.signal,
      },
    );
  },

  updateDocument: async (
    documentId: string,
    payload: UpdateDocumentDto,
    options?: {signal?: AbortSignal},
  ) => {
    return apiClient.patch<PrescriptionDocumentDto>(
      `${API_BASE}/api/medicines/documents/${encodeURIComponent(documentId)}`,
      payload,
      {
        requiresAuth: true,
        signal: options?.signal,
      },
    );
  },
};
