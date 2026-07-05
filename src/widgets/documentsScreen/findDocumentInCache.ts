import type {InfiniteData, QueryClient} from '@tanstack/react-query';

import {
  PATIENT_FOLDERS_CONTENTS_QUERY_KEY,
  PATIENT_FOLDERS_SEARCH_QUERY_KEY,
  type PatientFoldersContentsDto,
  type PatientFoldersSearchResponseDto,
} from '../../features/api/apiDocuments.ts';
import type {PrescriptionDocumentDto} from '../../features/api/drugs/apiDrugs.ts';

export const findDocumentInCache = (
  queryClient: QueryClient,
  documentId: string,
): PrescriptionDocumentDto | null => {
  const contentsQueries = queryClient.getQueriesData<PatientFoldersContentsDto>({
    queryKey: PATIENT_FOLDERS_CONTENTS_QUERY_KEY,
  });

  for (const [, data] of contentsQueries) {
    const file = data?.files.find(item => item.document.id === documentId);

    if (file) {
      return file.document;
    }
  }

  const searchQueries = queryClient.getQueriesData<
    InfiniteData<PatientFoldersSearchResponseDto>
  >({
    queryKey: PATIENT_FOLDERS_SEARCH_QUERY_KEY,
  });

  for (const [, data] of searchQueries) {
    for (const page of data?.pages ?? []) {
      const file = page.files.find(item => item.document.id === documentId);

      if (file) {
        return file.document;
      }
    }
  }

  return null;
};
