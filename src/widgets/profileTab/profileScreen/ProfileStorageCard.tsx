import {Image, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {useTranslation} from 'react-i18next';

import i18n from '../../../features/localisation/i18n.ts';
import {IconMapper} from '../../../shared/ui/IconMapper.tsx';

export const ProfileStorageCard = () => {
  const {t} = useTranslation('profile', {i18n});
  return (
    <View style={styles.card}>
      <TouchableOpacity activeOpacity={0.7} onPress={() => {}} style={styles.touchable}>
        <Image source={require('../../../../assets/images/claude.png')} style={styles.image} />
        <View style={styles.textContainer}>
          <Text style={styles.title}>{t('storage_title')}</Text>
          <Text style={styles.subtitle}>{t('storage_subtitle')}</Text>
        </View>
        <View style={styles.iconContainer}>
          <IconMapper
            icon="chevron-right"
            size={24}
            color="rgba(199, 198, 217, 1)"
            weight={1.5}
          />
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(255, 255, 255, 1)',
    borderRadius: 28,
    marginBottom: 16,
  },
  touchable: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    height: 80,
    justifyContent: 'center',
  },
  image: {
    width: 44,
    height: 44,
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    color: 'rgba(29, 26, 73, 1)',
    fontWeight: '500',
    fontSize: 16,
  },
  subtitle: {
    marginTop: 4,
    color: 'rgba(134, 132, 168, 1)',
    fontSize: 13,
  },
  iconContainer: {
    marginHorizontal: 12,
  },
});
