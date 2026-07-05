import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {useTranslation} from 'react-i18next';

import i18n from '../../../../features/localisation/i18n';
import {IconMapper} from '../../../../shared/ui/IconMapper.tsx';

const ICON_COLOR = 'rgba(35, 142, 235, 1)';

type MealsEmptyCardProps = {
  onSpecifyPress: () => void;
};

export const MealsEmptyCard = ({onSpecifyPress}: MealsEmptyCardProps) => {
  const {t} = useTranslation('drugsCreate', {i18n});

  return (
    <View style={styles.card}>
      <View style={styles.iconCircle}>
        <IconMapper icon="meals" size={24} color={ICON_COLOR} weight={1.5} />
      </View>
      <Text style={styles.text}>{t('meals.emptyTitle')}</Text>
      <TouchableOpacity activeOpacity={0.7} onPress={onSpecifyPress} style={styles.button}>
        <Text style={styles.buttonText}>{t('meals.specifyButton')}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(35, 142, 235, 0.1)',
    borderRadius: 28,
    padding: 12,
    paddingRight: 16,
    marginHorizontal: 12,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(35, 142, 235, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    flex: 1,
    marginLeft: 10,
    color: ICON_COLOR,
    fontSize: 16,
    fontWeight: '500',
  },
  button: {
    height: 40,
    marginLeft: 10,
    paddingHorizontal: 16,
    borderRadius: 24,
    backgroundColor: ICON_COLOR,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: 'rgba(255, 255, 255, 1)',
    fontSize: 14,
    fontWeight: '500',
  },
});
