import {useMemo} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {useTranslation} from 'react-i18next';
import type {CompositeNavigationProp} from '@react-navigation/native';
import type {BottomTabNavigationProp} from '@react-navigation/bottom-tabs';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';

import type {AppStackParamList} from '../../../app/AppStack.tsx';
import type {TabsStackParamList} from '../../../app/TabsStack.tsx';
import type {MedicationPrescriptionResponseDto} from '../../../features/api/drugs/apiDrugs.ts';
import i18n from '../../../features/localisation/i18n.ts';
import {Skeleton} from '../../../shared/ui/Skeleton.tsx';
import {TouchableTextIsIcon} from '../../../shared/ui/TouchableTextIsIcon.tsx';
import {ActiveDrugCard} from './ActiveDrugCard.tsx';
import {mapPrescriptionsToActiveDrugsMetrics} from './activeDrugsMetrics.ts';

type ActiveDrugsBlockNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<TabsStackParamList>,
  NativeStackNavigationProp<AppStackParamList>
>;

const ActiveDrugsBlockSkeleton = () => (
  <View style={styles.block}>
    <View style={styles.headerRow}>
      <Skeleton width={140} height={14} borderRadius={6} />
      <Skeleton width={120} height={14} borderRadius={6} />
    </View>
    <View style={styles.cardsContainer}>
      <View style={styles.skeletonCard}>
        <View style={styles.skeletonTopRow}>
          <Skeleton width={36} height={36} borderRadius={14} />
          <Skeleton width="52%" height={16} borderRadius={6} style={styles.skeletonTitle} />
          <Skeleton width={24} height={24} borderRadius={12} />
        </View>
        <Skeleton width="100%" height={8} borderRadius={1000} style={styles.skeletonProgress} />
        <Skeleton width="100%" height={8} borderRadius={1000} />
      </View>
    </View>
  </View>
);

type ActiveDrugsBlockProps = {
  prescriptions?: MedicationPrescriptionResponseDto[];
  isLoading: boolean;
};

export const ActiveDrugsBlock = ({prescriptions, isLoading}: ActiveDrugsBlockProps) => {
  const {t} = useTranslation('home', {i18n});
  const navigation = useNavigation<ActiveDrugsBlockNavigationProp>();

  const activeDrugs = useMemo(
    () => mapPrescriptionsToActiveDrugsMetrics(prescriptions),
    [prescriptions],
  );

  if (isLoading) {
    return <ActiveDrugsBlockSkeleton />;
  }

  if (activeDrugs.length === 0) {
    return null;
  }

  return (
    <View style={styles.block}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>{t('activeDrugs.title')}</Text>
        <TouchableTextIsIcon
          text={t('activeDrugs.goToList')}
          onPress={() => {
            navigation.navigate('DrugsTab');
          }}
        />
      </View>

      <View style={styles.cardsContainer}>
        {activeDrugs.map(drug => (
          <View key={drug.id}>
            <ActiveDrugCard
              drug={drug}
              onPress={() => {
                navigation.navigate('DrugsCreate', {
                  screen: 'DrugsCreateScreen',
                  params: {prescriptionId: drug.id},
                });
              }}
            />
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  block: {
    marginBottom: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
  },
  title: {
    color: 'rgba(134, 132, 168, 1)',
  },
  cardsContainer: {
    marginTop: 20,
    backgroundColor: 'rgba(255, 255, 255, 1)',
    borderRadius: 28,
    paddingTop: 16,
    paddingHorizontal: 12,
  },
  skeletonCard: {
    marginBottom: 20,
  },
  skeletonTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  skeletonTitle: {
    flex: 1,
    marginHorizontal: 10,
  },
  skeletonProgress: {
    marginTop: 16,
    marginBottom: 8,
  },
});
