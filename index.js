/**
 * @format
 * Entry point — background handlers MUST be registered before AppRegistry
 */
import 'react-native-gesture-handler';
import {AppRegistry} from 'react-native';
import messaging from '@react-native-firebase/messaging';
import notifee, {EventType} from '@notifee/react-native';
import App from './App';
import {name as appName} from './app.json';

// ── Firebase: background message handler ──────────────────────────────────
messaging().setBackgroundMessageHandler(async remoteMessage => {
  console.log('[FCM Background]', remoteMessage);
});

// ── Notifee: background event handler ─────────────────────────────────────
notifee.onBackgroundEvent(async ({type, detail}) => {
  if (type === EventType.PRESS) {
    console.log('[Notifee Background] Pressed:', detail.notification?.id);
  }
  if (type === EventType.ACTION_PRESS) {
    console.log('[Notifee Background] Action:', detail.pressAction?.id);
  }
});

AppRegistry.registerComponent(appName, () => App);