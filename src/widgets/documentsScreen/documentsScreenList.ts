import type {PatientFolderDocumentItemDto} from '../../features/api/apiDocuments.ts';
import type {DocumentUploadingFileItem} from './useDocumentFileUpload.ts';

export type DocumentsScreenListItem =
  | {type: 'upload'; key: string; upload: DocumentUploadingFileItem}
  | {type: 'file'; key: string; file: PatientFolderDocumentItemDto};

export const buildDocumentsScreenListItems = (
  uploadingFiles: DocumentUploadingFileItem[],
  files: PatientFolderDocumentItemDto[],
): DocumentsScreenListItem[] => {
  const uploadItems = uploadingFiles.map(upload => ({
    type: 'upload' as const,
    key: upload.localId,
    upload,
  }));
  const fileItems = files.map(file => ({
    type: 'file' as const,
    key: file.document.id,
    file,
  }));

  return [...uploadItems, ...fileItems];
};
