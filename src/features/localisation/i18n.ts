import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n from 'i18next';
import {initReactI18next} from 'react-i18next';

import enAuth from './en/auth.json';
import enCalendar from './en/calendar.json';
import enDocuments from './en/documents.json';
import enDrugsCreate from './en/drugsCreate.json';
import enHome from './en/home.json';
import enNotifications from './en/notifications.json';
import enProfile from './en/profile.json';
import enTimePickers from './en/timePickers.json';
import ruAuth from './ru/auth.json';
import ruCalendar from './ru/calendar.json';
import ruDocuments from './ru/documents.json';
import ruDrugsCreate from './ru/drugsCreate.json';
import ruHome from './ru/home.json';
import ruNotifications from './ru/notifications.json';
import ruProfile from './ru/profile.json';
import ruTimePickers from './ru/timePickers.json';

export const APP_LANGUAGE_STORAGE_KEY = 'appLanguage';

const resources = {
  en: {
    auth: enAuth,
    drugsCreate: enDrugsCreate,
    calendar: enCalendar,
    documents: enDocuments,
    home: enHome,
    notifications: enNotifications,
    profile: enProfile,
    timePickers: enTimePickers,
  },
  ru: {
    auth: ruAuth,
    drugsCreate: ruDrugsCreate,
    calendar: ruCalendar,
    documents: ruDocuments,
    home: ruHome,
    notifications: ruNotifications,
    profile: ruProfile,
    timePickers: ruTimePickers,
  },
} as const;

i18n.use(initReactI18next).init({
  resources,
  lng: 'ru',
  fallbackLng: 'ru',
  defaultNS: 'drugsCreate',
  interpolation: {
    escapeValue: false,
  },
});

AsyncStorage.getItem(APP_LANGUAGE_STORAGE_KEY).then((language: string | null) => {
  if (language === 'ru' || language === 'en') {
    i18n.changeLanguage(language);
  }
});

export default i18n;
