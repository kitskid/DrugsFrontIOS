import {useCallback, useEffect, useState} from 'react';
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useTranslation} from 'react-i18next';

import {APP_LANGUAGE_STORAGE_KEY} from '../../features/localisation/i18n.ts';
import {IconMapper} from '../../shared/ui/IconMapper.tsx';

type AppLanguage = 'en' | 'ru';

type ProfileLanguageChandeCardProps = {
  text: string;
};

export const ProfileLanguageChandeCard = ({text}: ProfileLanguageChandeCardProps) => {
  const {i18n: i18nInstance} = useTranslation();
  const [language, setLanguage] = useState<AppLanguage>(
    i18nInstance.language === 'en' ? 'en' : 'ru',
  );

  useEffect(() => {
    const handleLanguageChanged = (lng: string) => {
      setLanguage(lng === 'en' ? 'en' : 'ru');
    };

    i18nInstance.on('languageChanged', handleLanguageChanged);
    return () => {
      i18nInstance.off('languageChanged', handleLanguageChanged);
    };
  }, [i18nInstance]);

  const changeLanguage = useCallback(async (lng: AppLanguage) => {
    if (language === lng) {
      return;
    }

    await i18nInstance.changeLanguage(lng);
    await AsyncStorage.setItem(APP_LANGUAGE_STORAGE_KEY, lng);
    setLanguage(lng);
  }, [i18nInstance, language]);

  return (
    <View style={styles.card}>
      <View style={styles.content}>
        <View style={styles.labelRow}>
          <IconMapper icon="languages" size={24} color="rgba(199, 198, 217, 1)" weight={1.5} />
          <Text style={styles.label}>{text}</Text>
        </View>
        <View style={styles.buttons}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => changeLanguage('en')}
            style={[styles.button, language === 'en' ? styles.buttonActive : styles.buttonInactive]}>
            <Text
              style={[
                styles.buttonText,
                language === 'en' ? styles.buttonTextActive : styles.buttonTextInactive,
              ]}>
              EN
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => changeLanguage('ru')}
            style={[styles.button, language === 'ru' ? styles.buttonActive : styles.buttonInactive]}>
            <Text
              style={[
                styles.buttonText,
                language === 'ru' ? styles.buttonTextActive : styles.buttonTextInactive,
              ]}>
              RU
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(255, 255, 255, 1)',
    borderRadius: 28,
    marginBottom: 16,
  },
  content: {
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
    marginRight: 12,
  },
  label: {
    marginLeft: 12,
    color: 'rgba(134, 132, 168, 1)',
  },
  buttons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  button: {
    width: 48,
    height: 48,
    borderRadius: 1000,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonActive: {
    backgroundColor: 'rgba(35, 142, 235, 1)',
  },
  buttonInactive: {
    backgroundColor: 'rgba(241, 240, 249, 1)',
  },
  buttonText: {},
  buttonTextActive: {
    color: 'rgba(255, 255, 255, 1)',
  },
  buttonTextInactive: {
    color: 'rgba(29, 26, 73, 1)',
  },
});
