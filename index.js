/**
 * Entry point — React Native
 * Background handlers MUST be registered here (before AppRegistry)
 */
import {AppRegistry} from 'react-native';
import messaging from '@react-native-firebase/messaging';
import notifee, {EventType} from '@notifee/react-native';
import App from './App';
import {name as appName} from './app.json';

// ── Firebase: background message handler ────────────────────────────────────
messaging().setBackgroundMessageHandler(async remoteMessage => {
  console.log('[FCM Background]', remoteMessage);
});

// ── Notifee: background event handler ───────────────────────────────────────
notifee.onBackgroundEvent(async ({type, detail}) => {
  if (type === EventType.PRESS) {
    console.log('[Notifee Background] User pressed:', detail.notification?.id);
  }
  if (type === EventType.ACTION_PRESS) {
    console.log('[Notifee Background] Action pressed:', detail.pressAction?.id);
  }
});

AppRegistry.registerComponent(appName, () => App);
