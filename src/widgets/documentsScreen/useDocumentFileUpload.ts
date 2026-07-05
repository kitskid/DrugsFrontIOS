import {useCallback, useRef, useState} from 'react';
import axios from 'axios';
import {useQueryClient} from '@tanstack/react-query';
import {useTranslation} from 'react-i18next';

import {
  apiDocuments,
  getPatientFoldersContentsQueryKey,
  PATIENT_FOLDERS_SEARCH_QUERY_KEY,
  STORAGE_USAGE_SUMMARY_QUERY_KEY,
  type PatientFolderDocumentItemDto,
  type PatientFoldersContentsDto,
} from '../../features/api/apiDocuments.ts';
import {apiFiles} from '../../features/api/files/apiFiles.ts';
import type {SelectedFile} from '../../shared/ui/drugs/AddFileModal.tsx';
import i18n from '../../features/localisation/i18n.ts';
import {useToast} from '../../features/toasts/useToast.ts';

const DEFAULT_DOCUMENT_TYPE = 'other';

export type DocumentUploadingFileItem = {
  localId: string;
  fileName: string;
  fileType: string;
  sizeBytes: number;
  progress: number;
  sourceFile: SelectedFile;
};

type UseDocumentFileUploadParams = {
  folderId?: string;
};

type UploadRuntimeState = {
  abortController: AbortController;
  uploadedFileId?: string;
};

const createLocalFileId = (): string =>
  `file-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const getFileExtension = (fileName: string): string => {
  const lastDotIndex = fileName.lastIndexOf('.');

  if (lastDotIndex === -1) {
    return '';
  }

  return fileName.slice(lastDotIndex + 1).toLowerCase();
};

const isAbortError = (error: unknown): boolean => {
  if (axios.isAxiosError(error) && error.code === 'ERR_CANCELED') {
    return true;
  }

  return error instanceof Error && error.message === 'Upload canceled';
};

export const useDocumentFileUpload = ({folderId}: UseDocumentFileUploadParams = {}) => {
  const queryClient = useQueryClient();
  const {t} = useTranslation('documents', {i18n});
  const {showToast} = useToast();
  const [uploadingFiles, setUploadingFiles] = useState<DocumentUploadingFileItem[]>([]);
  const uploadRuntimeRef = useRef<Map<string, UploadRuntimeState>>(new Map());

  const invalidateFolderQueries = useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({queryKey: STORAGE_USAGE_SUMMARY_QUERY_KEY}),
      queryClient.invalidateQueries({queryKey: PATIENT_FOLDERS_SEARCH_QUERY_KEY}),
    ]);
  }, [queryClient]);

  const appendDocumentToFolderContentsCache = useCallback(
    (createdDocument: PatientFolderDocumentItemDto['document']) => {
      const contentsQueryKey = folderId
        ? getPatientFoldersContentsQueryKey(folderId)
        : getPatientFoldersContentsQueryKey();

      queryClient.setQueryData<PatientFoldersContentsDto>(contentsQueryKey, old => {
        if (!old) {
          return old;
        }

        const newFile: PatientFolderDocumentItemDto = {
          document: createdDocument,
          breadcrumb: old.breadcrumb,
        };

        if (old.files.some(item => item.document.id === createdDocument.id)) {
          return old;
        }

        return {
          ...old,
          files: [newFile, ...old.files],
        };
      });
    },
    [folderId, queryClient],
  );

  const removeUploadingFile = useCallback((localId: string) => {
    uploadRuntimeRef.current.delete(localId);
    setUploadingFiles(prev => prev.filter(file => file.localId !== localId));
  }, []);

  const cleanupUploadedFile = useCallback(async (uploadedFileId?: string) => {
    if (!uploadedFileId) {
      return;
    }

    try {
      await apiFiles.deleteFile(uploadedFileId);
    } catch {
      // Ignore cleanup errors after cancel or failed document creation.
    }
  }, []);

  const uploadSelectedFile = useCallback(
    async (selectedFile: SelectedFile, localId: string) => {
      const runtimeState: UploadRuntimeState = {
        abortController: new AbortController(),
      };
      uploadRuntimeRef.current.set(localId, runtimeState);

      try {
        const uploadResponse = await apiFiles.uploadFile(
          {
            uri: selectedFile.uri,
            fileName: selectedFile.fileName,
            mimeType: selectedFile.mimeType,
          },
          {
            signal: runtimeState.abortController.signal,
            onUploadProgress: progress => {
              setUploadingFiles(prev =>
                prev.map(file =>
                  file.localId === localId ? {...file, progress} : file,
                ),
              );
            },
          },
        );

        if (runtimeState.abortController.signal.aborted) {
          return;
        }

        const uploadedFile = uploadResponse.data;
        runtimeState.uploadedFileId = uploadedFile.id;

        setUploadingFiles(prev =>
          prev.map(file =>
            file.localId === localId
              ? {
                  ...file,
                  progress: 100,
                  sizeBytes: uploadedFile.fileSize,
                }
              : file,
          ),
        );

        const createResponse = await apiDocuments.createDocument(
          {
            type: DEFAULT_DOCUMENT_TYPE,
            fileName: uploadedFile.fileName ?? selectedFile.fileName,
            fileSize: uploadedFile.fileSize,
            mimeType: uploadedFile.mimeType ?? selectedFile.mimeType,
            fileId: uploadedFile.id,
            ...(folderId ? {folderId} : {}),
          },
          {signal: runtimeState.abortController.signal},
        );

        if (runtimeState.abortController.signal.aborted) {
          return;
        }

        appendDocumentToFolderContentsCache(createResponse.data);
        removeUploadingFile(localId);
        await invalidateFolderQueries();
      } catch (error) {
        if (runtimeState.abortController.signal.aborted || isAbortError(error)) {
          return;
        }

        await cleanupUploadedFile(runtimeState.uploadedFileId);
        removeUploadingFile(localId);
        showToast({variant: 'error', text: t('toasts.fileUploadError')});
      }
    },
    [
      appendDocumentToFolderContentsCache,
      cleanupUploadedFile,
      folderId,
      invalidateFolderQueries,
      removeUploadingFile,
      showToast,
      t,
    ],
  );

  const handleFileSelected = useCallback(
    (selectedFile: SelectedFile) => {
      const localId = createLocalFileId();
      const nextFile: DocumentUploadingFileItem = {
        localId,
        fileName: selectedFile.fileName,
        fileType: getFileExtension(selectedFile.fileName),
        sizeBytes: selectedFile.fileSize ?? 0,
        progress: 0,
        sourceFile: selectedFile,
      };

      setUploadingFiles(prev => [...prev, nextFile]);
      uploadSelectedFile(selectedFile, localId).catch(() => undefined);
    },
    [uploadSelectedFile],
  );

  const handleCancelUpload = useCallback(
    async (localId: string) => {
      const runtimeState = uploadRuntimeRef.current.get(localId);

      runtimeState?.abortController.abort();
      removeUploadingFile(localId);
      await cleanupUploadedFile(runtimeState?.uploadedFileId);
    },
    [cleanupUploadedFile, removeUploadingFile],
  );

  return {
    uploadingFiles,
    handleFileSelected,
    handleCancelUpload,
  };
};
