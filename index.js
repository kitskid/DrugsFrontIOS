/**
 * @format
 */

import 'intl-pluralrules';
import 'react-native-gesture-handler';
import {AppRegistry} from 'react-native';
import notifee from '@notifee/react-native';
import App from './App';
import {name as appName} from './app.json';

// Оборачиваем в try/catch — без GoogleService-Info.plist Firebase не инициализирован
try {
  const {registerBackgroundNotificationHandler, registerNotifeeBackgroundPressHandler, registerNotifeeForegroundPressHandler} = require('./src/app/useFCMTokenRegistration');
  registerBackgroundNotificationHandler();
  registerNotifeeBackgroundPressHandler();
  registerNotifeeForegroundPressHandler();
} catch (e) {
  console.log('[FCM] Firebase не настроен, обработчики пропущены:', e.message);
}

notifee.registerForegroundService(() => new Promise(() => undefined));

AppRegistry.registerComponent(appName, () => App);
