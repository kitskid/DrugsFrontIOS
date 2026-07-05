import {useCallback} from 'react';
import {useFocusEffect} from '@react-navigation/native';
import {useQueryClient} from '@tanstack/react-query';

import {invalidateDocumentsQueries} from '../../features/api/apiDocuments.ts';

export const useDocumentsQueriesOnFocus = () => {
  const queryClient = useQueryClient();

  useFocusEffect(
    useCallback(() => {
      void invalidateDocumentsQueries(queryClient);
    }, [queryClient]),
  );
};
