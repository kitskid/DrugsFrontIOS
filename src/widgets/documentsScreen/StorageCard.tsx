import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {useTranslation} from 'react-i18next';

import i18n from '../../features/localisation/i18n.ts';
import {formatFileSize} from './formatStorageUsage.ts';
import {Skeleton} from '../../shared/ui/Skeleton.tsx';
import {StorageProgressCard} from './StorageProgressCard.tsx';

type StorageCardProps = {
  usedBytes: number;
  limitBytes: number;
  isLoading?: boolean;
};

export const StorageCard = ({usedBytes, limitBytes, isLoading}: StorageCardProps) => {
  const {t} = useTranslation('documents', {i18n});

  if (isLoading) {
    return (
      <Skeleton
        width="100%"
        height={125}
        borderRadius={28}
        style={styles.skeleton}
      />
    );
  }

  const usedRatio = limitBytes > 0 ? usedBytes / limitBytes : 0;
  const isLowStorage = 1 - usedRatio < 0.2;
  const percentage = Math.round(usedRatio * 100);
  const usedAmountColor = isLowStorage
    ? 'rgba(255, 102, 102, 1)'
    : 'rgba(29, 26, 73, 1)';

  return (
    <View style={styles.card}>
      <View style={styles.leftContent}>
        <View style={styles.usageRow}>
          <Text style={styles.label}>{t('storage.usedLabel')}</Text>
          <Text style={styles.usageText}>
            <Text style={[styles.usedAmount, {color: usedAmountColor}]}>
              {formatFileSize(usedBytes, t)}
            </Text>
            <Text style={styles.totalAmount}> / {formatFileSize(limitBytes, t)}</Text>
          </Text>
        </View>
        <TouchableOpacity activeOpacity={0.8} style={styles.button} onPress={() => {}}>
          <Text style={styles.buttonText}>{t('storage.increaseButton')}</Text>
        </TouchableOpacity>
      </View>
      <StorageProgressCard percentage={percentage} isLowStorage={isLowStorage} />
    </View>
  );
};

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: 'rgba(255, 255, 255, 1)',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 1)',
    borderRadius: 28,
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  leftContent: {
    flex: 1,
    marginRight: 24,
  },
  usageRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  label: {
    color: 'rgba(134, 132, 168, 1)',
  },
  usageText: {
    marginLeft: 10,
    fontSize: 20,
    fontWeight: '700',
  },
  usedAmount: {},
  totalAmount: {
    color: 'rgba(199, 198, 217, 1)',
  },
  button: {
    marginTop: 12,
    height: 40,
    borderRadius: 24,
    backgroundColor: 'rgba(35, 142, 235, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: 'rgba(35, 142, 235, 1)',
    fontWeight: '500',
  },
});
