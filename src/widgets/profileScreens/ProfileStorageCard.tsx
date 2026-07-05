import {useCallback} from 'react';
import {StyleSheet} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useQuery} from '@tanstack/react-query';

import {
  apiDocuments,
  getPatientFoldersContentsQueryKey,
  STORAGE_USAGE_SUMMARY_QUERY_KEY,
} from '../../features/api/apiDocuments.ts';
import type {ProfileTabStackParamList} from '../../features/navigation/tabs/ProfileTabStack.tsx';
import {HomeStorageCard} from '../homeScreen/header/HomeStorageCard.tsx';

type ProfileStorageCardNavigationProp =
  NativeStackNavigationProp<ProfileTabStackParamList>;

export const ProfileStorageCard = () => {
  const navigation = useNavigation<ProfileStorageCardNavigationProp>();

  const {data: storageUsageSummary, isLoading: isStorageUsageLoading} = useQuery(
    {
      queryKey: STORAGE_USAGE_SUMMARY_QUERY_KEY,
      queryFn: async () => {
        const response = await apiDocuments.getStorageUsageSummary();
        return response.data;
      },
      staleTime: Infinity,
    },
  );

  const {data: foldersContents, isLoading: isFoldersContentsLoading} = useQuery({
    queryKey: getPatientFoldersContentsQueryKey(),
    queryFn: async () => {
      const response = await apiDocuments.getPatientFoldersContents();
      return response.data;
    },
    staleTime: Infinity,
  });

  const foldersCount = foldersContents?.folders.length ?? 0;
  const isLoading = isStorageUsageLoading || isFoldersContentsLoading;

  const handlePress = useCallback(() => {
    navigation.navigate('DocumentsScreen');
  }, [navigation]);

  return (
    <HomeStorageCard
      storageUsage={storageUsageSummary}
      foldersCount={foldersCount}
      isLoading={isLoading}
      onPress={handlePress}
      style={styles.card}
    />
  );
};

const styles = StyleSheet.create({
  card: {
    marginTop: 0,
    marginBottom: 16,
  },
});
