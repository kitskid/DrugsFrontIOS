/**
 * App.tsx — стартовый шаблон с поддержкой push-уведомлений
 * Firebase Cloud Messaging + Notifee
 */
import React, {useEffect} from 'react';
import {
  Alert,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import messaging from '@react-native-firebase/messaging';
import notifee, {AndroidImportance} from '@notifee/react-native';

// ── Запрос разрешения на push-уведомления (iOS) ─────────────────────────────
async function requestUserPermission() {
  const authStatus = await messaging().requestPermission();
  const enabled =
    authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
    authStatus === messaging.AuthorizationStatus.PROVISIONAL;

  if (enabled) {
    const token = await messaging().getToken();
    console.log('[FCM] Token:', token);
    // TODO: отправьте token на ваш backend
  }
}

// ── Отображение уведомления через Notifee ───────────────────────────────────
async function displayNotification(title: string, body: string) {
  const channelId = await notifee.createChannel({
    id: 'default',
    name: 'Default Channel',
    importance: AndroidImportance.HIGH,
  });

  await notifee.displayNotification({
    title,
    body,
    android: {channelId, pressAction: {id: 'default'}},
  });
}

function App(): React.JSX.Element {
  useEffect(() => {
    // Запрашиваем разрешение и получаем FCM-токен
    requestUserPermission();

    // Foreground message handler
    const unsubscribeFCM = messaging().onMessage(async remoteMessage => {
      console.log('[FCM Foreground]', remoteMessage);
      const title = remoteMessage.notification?.title ?? 'Уведомление';
      const body = remoteMessage.notification?.body ?? '';
      await displayNotification(title, body);
    });

    // Notifee foreground events
    const unsubscribeNotifee = notifee.onForegroundEvent(({type, detail}) => {
      console.log('[Notifee Foreground] type:', type, 'id:', detail.notification?.id);
    });

    // Обработка тапа по уведомлению когда приложение было в background/quit
    messaging()
      .getInitialNotification()
      .then(remoteMessage => {
        if (remoteMessage) {
          console.log('[FCM] Opened from quit state:', remoteMessage);
        }
      });

    const unsubscribeBackground = messaging().onNotificationOpenedApp(
      remoteMessage => {
        console.log('[FCM] Opened from background:', remoteMessage);
      },
    );

    return () => {
      unsubscribeFCM();
      unsubscribeNotifee();
      unsubscribeBackground();
    };
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>DrugsFront iOS</Text>
        <Text style={styles.subtitle}>
          Firebase Messaging + Notifee настроены ✓
        </Text>
        <Text style={styles.hint}>
          Замените GoogleService-Info.plist на настоящий файл из Firebase
          Console, затем перенесите сюда код вашего приложения.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#fff'},
  content: {flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24},
  title: {fontSize: 26, fontWeight: '700', marginBottom: 8, color: '#1a1a1a'},
  subtitle: {fontSize: 16, color: '#4CAF50', marginBottom: 20},
  hint: {fontSize: 13, color: '#888', textAlign: 'center', lineHeight: 20},
});

export default App;
