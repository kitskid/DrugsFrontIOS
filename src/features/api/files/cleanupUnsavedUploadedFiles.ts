import {apiFiles} from './apiFiles.ts';

export type UnsavedUploadedFileCandidate = {
  status: string;
  documentId?: string;
  serverFile?: {
    id: string;
  };
};

/** Server file ids that were uploaded in this session but not linked to a prescription yet. */
export const getUnsavedUploadedServerFileIds = (
  items: ReadonlyArray<UnsavedUploadedFileCandidate>,
): string[] => {
  const ids: string[] = [];

  items.forEach(item => {
    if (item.status !== 'uploaded' || item.documentId || !item.serverFile?.id) {
      return;
    }

    ids.push(item.serverFile.id);
  });

  return ids;
};

export const deleteUnsavedUploadedFiles = async (
  items: ReadonlyArray<UnsavedUploadedFileCandidate>,
): Promise<void> => {
  const fileIds = getUnsavedUploadedServerFileIds(items);

  if (fileIds.length === 0) {
    return;
  }

  await Promise.allSettled(fileIds.map(fileId => apiFiles.deleteFile(fileId)));
};
