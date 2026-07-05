import {useEffect} from 'react';
import {createNavigationContainerRef} from '@react-navigation/native';
import {FirebaseApp, getApp, getApps, initializeApp} from '@react-native-firebase/app';
import {
  AuthorizationStatus,
  deleteToken,
  getMessaging,
  getToken,
  hasPermission,
  onMessage,
  onNotificationOpenedApp,
  getInitialNotification,
  onTokenRefresh,
  requestPermission,
  setBackgroundMessageHandler,
  type RemoteMessage,
} from '@react-native-firebase/messaging';
import DeviceInfo from 'react-native-device-info';
import * as RNLocalize from 'react-native-localize';
import {
  AppState,
  InteractionManager,
  PermissionsAndroid,
  Platform,
  type AppStateStatus,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import notifee, {
  AndroidImportance,
  AuthorizationStatus as NotifeeAuthorizationStatus,
  EventType,
  type AndroidAction,
  type Event,
} from '@notifee/react-native';
import {ENABLE_ANDROID_PUSH} from '@env';

import type {AppStackParamList} from './AppStack';
import {queryClient} from './useAuth';
import {CALENDAR_QUERY_KEY} from '../features/api/apiCalendar.ts';
import {apiAuth, type PushTokenPayload} from '../features/api/apiAuth.ts';
import {
  ACTIVE_MEDICATION_PRESCRIPTIONS_QUERY_KEY,
  MEDICATION_PRESCRIPTIONS_QUERY_KEY,
  apiDrugs,
} from '../features/api/drugs/apiDrugs.ts';
import {MEAL_SCHEDULE_QUERY_KEY} from '../features/api/meals/types.ts';
import {apiNotification, NOTIFICATIONS_QUERY_KEY, NOTIFICATIONS_UNREAD_COUNT_QUERY_KEY} from '../features/api/apiNotification.ts';
import type {CalendarEventStatus} from '../features/api/apiCalendar.ts';

export const navigationRef = createNavigationContainerRef<AppStackParamList>();

type PushNavigationIntent = {
  prescriptionId: string;
  intakeId?: string;
};

let pendingPushNavigationIntent: PushNavigationIntent | null = null;

function navigateToPrescriptionIntake(intent: PushNavigationIntent): boolean {
  if (!navigationRef.isReady()) {
    return false;
  }

  navigationRef.navigate('DrugsCreate', {
    screen: 'DrugsCreateScreen',
    params: {
      prescriptionId: intent.prescriptionId,
      activeTab: 'intakes',
      openIntakeId: intent.intakeId,
    },
  });

  return true;
}

// Stores the intent and tries to navigate immediately. If navigation is not
// ready yet (app launching from a cold start via a push tap), the intent stays
// pending and `flushPendingPushNavigationIntent` replays it once the authorized
// AppStack is mounted.
function requestPushNavigation(intent: PushNavigationIntent): void {
  pendingPushNavigationIntent = intent;
  if (navigateToPrescriptionIntake(intent)) {
    pendingPushNavigationIntent = null;
  }
}

export function flushPendingPushNavigationIntent(): void {
  if (!pendingPushNavigationIntent) {
    return;
  }

  if (navigateToPrescriptionIntake(pendingPushNavigationIntent)) {
    pendingPushNavigationIntent = null;
  }
}

const PUSH_NOTIFICATIONS_ENABLED =
  Platform.OS === 'android' && ENABLE_ANDROID_PUSH === 'true';

const firebaseConfig = Platform.select({
  android: {
    apiKey: 'AIzaSyAGY4ZrdUJ9enxjrK5-NrcpL2MEJavnk5A',
    appId: '1:940840246214:android:efe953d9cce9514846b0c7',
    messagingSenderId: '940840246214',
    projectId: 'drugs-fdc96',
    storageBucket: 'drugs-fdc96.firebasestorage.app',
  },
})!;

function getOrInitFirebase(): FirebaseApp | null {
  try {
    return getApp();
  } catch {
    try {
      return getApps()[0] ?? initializeApp(firebaseConfig);
    } catch {
      return null;
    }
  }
}

const firebaseApp: FirebaseApp | null = getOrInitFirebase();

function hasDefaultFirebaseApp(): boolean {
  try {
    getApp();
    return true;
  } catch {
    return false;
  }
}

function getMessagingInstance() {
  return getMessaging(firebaseApp ?? getApp());
}

export async function getCurrentFcmToken(): Promise<string | null> {
  if (!firebaseApp || !hasDefaultFirebaseApp()) {
    return null;
  }

  try {
    return await getToken(getMessagingInstance());
  } catch {
    return null;
  }
}

const PUSH_CHANNEL_ID = 'drugs-push-default-v2';
const PUSH_CHANNEL_SILENT_ID = 'drugs-push-silent-v2';
const PUSH_NOTIFICATIONS_ENABLED_KEY = 'push_notifications_enabled';
const SILENCE_MODE_ENABLED_KEY = 'push_silence_mode_enabled';
const PUSH_ENABLE_PENDING_KEY = 'push_enable_pending';
const PUSH_PERMISSION_REQUESTED_KEY = 'push_permission_requested';

async function getPushNotificationsPreference(): Promise<boolean | null> {
  const raw = await AsyncStorage.getItem(PUSH_NOTIFICATIONS_ENABLED_KEY);
  if (raw === null) {
    return null;
  }

  return raw === 'true';
}

async function setPushNotificationsPreference(enabled: boolean): Promise<void> {
  await AsyncStorage.setItem(
    PUSH_NOTIFICATIONS_ENABLED_KEY,
    enabled ? 'true' : 'false',
  );
}

async function getSilenceModePreference(): Promise<boolean> {
  const raw = await AsyncStorage.getItem(SILENCE_MODE_ENABLED_KEY);
  return raw === 'true';
}

async function setSilenceModePreference(enabled: boolean): Promise<void> {
  await AsyncStorage.setItem(SILENCE_MODE_ENABLED_KEY, enabled ? 'true' : 'false');
}

async function wasPushPermissionRequested(): Promise<boolean> {
  return (await AsyncStorage.getItem(PUSH_PERMISSION_REQUESTED_KEY)) === 'true';
}

async function markPushPermissionRequested(): Promise<void> {
  await AsyncStorage.setItem(PUSH_PERMISSION_REQUESTED_KEY, 'true');
}

let lastRegisteredToken: string | null = null;
let lastSyncedTimezone: string | null = null;
let isNotificationsSubscribed = false;
let unsubscribeForegroundMessages: (() => void) | undefined;
let unsubscribeNotificationPress: (() => void) | undefined;
let isBackgroundHandlerRegistered = false;
let isNotifeeBackgroundPressHandlerRegistered = false;

function logPushNotificationPress(source: string, payload: unknown) {
  console.log(`[Push press] ${source}:`, payload);
}

const PUSH_ACTION_COMPLETED = 'completed';
const PUSH_ACTION_MISSED = 'missed';
const PUSH_ACTION_DETAILS = 'details';

function buildAtIntakeAndroidActions(): AndroidAction[] {
  return [
    {title: 'Принято', pressAction: {id: PUSH_ACTION_COMPLETED}},
    {title: 'Пропущено', pressAction: {id: PUSH_ACTION_MISSED}},
    {title: 'Подробнее', pressAction: {id: PUSH_ACTION_DETAILS}},
  ];
}

function isAtIntakeReminder(
  data: Record<string, unknown> | undefined | null,
): boolean {
  return readPushDataString(data, 'reminderKind') === 'at_intake';
}

function invalidateIntakeRelatedQueries() {
  void queryClient.invalidateQueries({queryKey: NOTIFICATIONS_QUERY_KEY});
  void queryClient.invalidateQueries({queryKey: CALENDAR_QUERY_KEY});
  void queryClient.invalidateQueries({
    queryKey: ACTIVE_MEDICATION_PRESCRIPTIONS_QUERY_KEY,
  });
}

async function handleIntakeStatusFromPush(
  data: Record<string, unknown> | undefined | null,
  status: CalendarEventStatus,
): Promise<void> {
  const intakeId = readPushDataString(data, 'intakeId');
  if (!intakeId) {
    return;
  }

  try {
    await apiDrugs.updateMedicationIntakeStatus(intakeId, status);
    invalidateIntakeRelatedQueries();
  } catch {
    // ignore intake status update errors
  }
}

// Notifications are delivered via push, so any incoming message means the inbox
// and its unread counter on the server may have changed. Invalidate both so the
// bell badge (HomeScreen) and the list (NotificationsScreen) refetch.
function invalidateInboxQueries() {
  void queryClient.invalidateQueries({queryKey: NOTIFICATIONS_QUERY_KEY});
}

async function markPushNotificationAsRead(
  data: Record<string, unknown> | undefined | null,
): Promise<void> {
  const inboxId = readPushDataString(data, 'inboxId');
  if (!inboxId) {
    return;
  }

  try {
    await apiNotification.markAsRead([inboxId]);
    void queryClient.invalidateQueries({
      queryKey: NOTIFICATIONS_UNREAD_COUNT_QUERY_KEY,
    });
  } catch {
    // ignore mark-as-read errors
  }
}

function readPushDataString(
  data: Record<string, unknown> | undefined | null,
  key: string,
): string | undefined {
  const value = data?.[key];
  return typeof value === 'string' && value.trim().length > 0
    ? value.trim()
    : undefined;
}

function handlePushNavigation(data: Record<string, unknown> | undefined | null) {
  const prescriptionId =
    readPushDataString(data, 'prescriptionId') ??
    readPushDataString(data, 'recordId');

  if (!prescriptionId) {
    return;
  }

  requestPushNavigation({
    prescriptionId,
    intakeId: readPushDataString(data, 'intakeId'),
  });
}

async function handleNotifeePressEvent({type, detail}: Event): Promise<void> {
  if (type !== EventType.PRESS && type !== EventType.ACTION_PRESS) {
    return;
  }

  const data = detail.notification?.data as
    | Record<string, unknown>
    | undefined;
  const actionId = detail.pressAction?.id;

  logPushNotificationPress('Notifee', {
    type,
    notification: detail.notification,
    pressAction: detail.pressAction,
    data,
  });

  await markPushNotificationAsRead(data);

  if (type === EventType.ACTION_PRESS && actionId === PUSH_ACTION_COMPLETED) {
    await handleIntakeStatusFromPush(data, 'COMPLETED');
    return;
  }

  if (type === EventType.ACTION_PRESS && actionId === PUSH_ACTION_MISSED) {
    await handleIntakeStatusFromPush(data, 'MISSED');
    return;
  }

  handlePushNavigation(data);
}

export function registerNotifeeBackgroundPressHandler() {
  if (isNotifeeBackgroundPressHandlerRegistered) {
    return;
  }

  notifee.onBackgroundEvent(async event => {
    await handleNotifeePressEvent(event);
  });

  isNotifeeBackgroundPressHandlerRegistered = true;
}

async function isAndroidPostNotificationsPermissionGranted(): Promise<boolean> {
  if (Platform.OS !== 'android') {
    return true;
  }

  const apiLevel = typeof Platform.Version === 'number' ? Platform.Version : -1;
  if (apiLevel >= 33) {
    try {
      return await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
      );
    } catch {
      return false;
    }
  }

  try {
    const settings = await notifee.getNotificationSettings();
    return (
      settings.authorizationStatus === NotifeeAuthorizationStatus.AUTHORIZED ||
      settings.authorizationStatus === NotifeeAuthorizationStatus.PROVISIONAL
    );
  } catch {
    return false;
  }
}

async function getAndroidNotificationAuthorizationStatus(): Promise<number> {
  const granted = await isAndroidPostNotificationsPermissionGranted();
  return granted ? AuthorizationStatus.AUTHORIZED : AuthorizationStatus.DENIED;
}

async function invalidateFcmTokenOnDevice(): Promise<void> {
  if (!firebaseApp || !hasDefaultFirebaseApp() || Platform.OS !== 'android') {
    return;
  }

  try {
    await deleteToken(getMessagingInstance());
  } catch {
    // Token deletion may fail when FCM is already invalidated.
  }
}

async function handleNotificationPermissionRevoked(): Promise<void> {
  await AsyncStorage.removeItem(PUSH_ENABLE_PENDING_KEY);
  resetPushTokenRegistrationState();
  await invalidateFcmTokenOnDevice();
}

type RequestNotificationPermissionOptions = {
  openSettingsIfDenied?: boolean;
};

async function requestAndroidNotificationPermission(
  options?: RequestNotificationPermissionOptions,
): Promise<number> {
  try {
    const settings = await notifee.requestPermission();

    if (
      settings.authorizationStatus === NotifeeAuthorizationStatus.AUTHORIZED ||
      settings.authorizationStatus === NotifeeAuthorizationStatus.PROVISIONAL
    ) {
      return AuthorizationStatus.AUTHORIZED;
    }

    if (options?.openSettingsIfDenied) {
      await AsyncStorage.setItem(PUSH_ENABLE_PENDING_KEY, 'true');
      await notifee.openNotificationSettings();
    }
  } catch {
    if (options?.openSettingsIfDenied) {
      try {
        await AsyncStorage.setItem(PUSH_ENABLE_PENDING_KEY, 'true');
        await notifee.openNotificationSettings();
      } catch {
        // ignore settings navigation errors
      }
    }
  }

  return AuthorizationStatus.DENIED;
}

function isNotificationPermissionEnabled(status: number): boolean {
  return status === AuthorizationStatus.AUTHORIZED || status === AuthorizationStatus.PROVISIONAL;
}

async function ensurePushNotificationChannel(): Promise<string> {
  if (Platform.OS !== 'android') {
    return PUSH_CHANNEL_ID;
  }

  return notifee.createChannel({
    id: PUSH_CHANNEL_ID,
    name: 'Drugs Push',
    importance: AndroidImportance.HIGH,
    sound: 'default',
    vibration: true,
  });
}

async function ensureSilentPushNotificationChannel(): Promise<string> {
  if (Platform.OS !== 'android') {
    return PUSH_CHANNEL_SILENT_ID;
  }

  return notifee.createChannel({
    id: PUSH_CHANNEL_SILENT_ID,
    name: 'Drugs Push (Silent)',
    importance: AndroidImportance.LOW,
    vibration: false,
  });
}

async function resolvePushNotificationChannelId(): Promise<string> {
  const isSilent = await getSilenceModePreference();
  return isSilent
    ? ensureSilentPushNotificationChannel()
    : ensurePushNotificationChannel();
}

export async function arePushNotificationsEnabled(): Promise<boolean> {
  try {
    const preference = await getPushNotificationsPreference();
    if (preference === false) {
      return false;
    }

    const permissionStatus = await getNotificationPermissionStatus();
    const permissionGranted = isNotificationPermissionEnabled(permissionStatus);
    if (preference === true) {
      return permissionGranted;
    }

    return permissionGranted;
  } catch {
    return false;
  }
}

export async function setPushNotificationsEnabled(enabled: boolean): Promise<boolean> {
  try {
    if (!enabled) {
      await setPushNotificationsPreference(false);
      await AsyncStorage.removeItem(PUSH_ENABLE_PENDING_KEY);
      resetPushTokenRegistrationState();
      return true;
    }

    let permissionStatus = await getNotificationPermissionStatus();
    if (!isNotificationPermissionEnabled(permissionStatus)) {
      permissionStatus = await requestNotificationPermission({openSettingsIfDenied: true});
    }

    if (!isNotificationPermissionEnabled(permissionStatus)) {
      return false;
    }

    await AsyncStorage.removeItem(PUSH_ENABLE_PENDING_KEY);
    await setPushNotificationsPreference(true);
    await registerPushToken();
    return true;
  } catch {
    return false;
  }
}

export async function syncPushNotificationStateFromSystem(): Promise<boolean> {
  try {
    const permissionStatus = await getNotificationPermissionStatus();
    const permissionGranted = isNotificationPermissionEnabled(permissionStatus);
    const pending = await AsyncStorage.getItem(PUSH_ENABLE_PENDING_KEY);

    if (pending === 'true') {
      if (permissionGranted) {
        await AsyncStorage.removeItem(PUSH_ENABLE_PENDING_KEY);
        await setPushNotificationsPreference(true);
        await registerPushToken();
      }

      return permissionGranted;
    }

    const preference = await getPushNotificationsPreference();
    if (preference === false) {
      return false;
    }

    if (preference === true && !permissionGranted) {
      await handleNotificationPermissionRevoked();
      return false;
    }

    if (preference === true) {
      return permissionGranted;
    }

    return permissionGranted;
  } catch {
    return false;
  }
}

export async function syncPendingPushEnablement(): Promise<void> {
  await syncPushNotificationStateFromSystem();
}

export async function isSilenceModeEnabled(): Promise<boolean> {
  return getSilenceModePreference();
}

export async function setSilenceModeEnabled(enabled: boolean): Promise<void> {
  await setSilenceModePreference(enabled);
  if (Platform.OS === 'android') {
    await Promise.all([
      ensurePushNotificationChannel(),
      ensureSilentPushNotificationChannel(),
    ]);
  }
}

async function getNotificationPermissionStatus(): Promise<number> {
  if (Platform.OS === 'android') {
    return getAndroidNotificationAuthorizationStatus();
  }

  try {
    return hasPermission(getMessagingInstance());
  } catch {
    return AuthorizationStatus.DENIED;
  }
}

async function requestNotificationPermission(
  options?: RequestNotificationPermissionOptions,
): Promise<number> {
  if (Platform.OS === 'android') {
    return requestAndroidNotificationPermission(options);
  }

  return requestPermission(getMessagingInstance());
}

async function displayRemoteNotification(remoteMessage: RemoteMessage) {
  if (Platform.OS !== 'android') {
    return;
  }

  if (!(await arePushNotificationsEnabled())) {
    return;
  }

  const fallbackTitle = remoteMessage.data?.title;
  const fallbackBody = remoteMessage.data?.body ?? remoteMessage.data?.message;
  const title =
    remoteMessage.notification?.title ??
    (typeof fallbackTitle === 'string' ? fallbackTitle : 'Новое уведомление');
  const body =
    remoteMessage.notification?.body ??
    (typeof fallbackBody === 'string' ? fallbackBody : '');

  const channelId = await resolvePushNotificationChannelId();
  const pushData = remoteMessage.data ?? {};
  const android: {
    channelId: string;
    smallIcon: string;
    pressAction: {id: string};
    actions?: AndroidAction[];
  } = {
    channelId,
    smallIcon: 'ic_notification',
    pressAction: {id: 'default'},
  };

  if (isAtIntakeReminder(pushData)) {
    android.actions = buildAtIntakeAndroidActions();
  }

  await notifee.displayNotification({
    title,
    body,
    data: pushData,
    android,
  });
}

async function buildPayload(token: string): Promise<PushTokenPayload> {
  return {
    token,
    platform: 'ANDROID',
    deviceId: await DeviceInfo.getUniqueId(),
    name: DeviceInfo.getDeviceNameSync(),
    model: DeviceInfo.getModel(),
    osVersion: DeviceInfo.getSystemVersion(),
    appVersion: DeviceInfo.getVersion(),
    language: RNLocalize.getLocales()[0]?.languageTag ?? 'en',
    timezone: RNLocalize.getTimeZone(),
  };
}

async function syncUserTimezone() {
  const timezone = RNLocalize.getTimeZone();
  if (!timezone || timezone === lastSyncedTimezone) {
    return;
  }

  await apiAuth.updateTimezone({timezone});
  lastSyncedTimezone = timezone;

  void queryClient.invalidateQueries({queryKey: MEAL_SCHEDULE_QUERY_KEY});
  void queryClient.invalidateQueries({queryKey: MEDICATION_PRESCRIPTIONS_QUERY_KEY});
  void queryClient.invalidateQueries({queryKey: CALENDAR_QUERY_KEY});
}

async function registerTokenWithApi(token: string) {
  if (token === lastRegisteredToken) {
    return;
  }

  await apiAuth.pushNotifications.registerFcmToken(await buildPayload(token));
  lastRegisteredToken = token;
}

async function registerPushToken() {
  if (!firebaseApp || !hasDefaultFirebaseApp() || Platform.OS !== 'android') {
    return;
  }

  if (!(await arePushNotificationsEnabled())) {
    return;
  }

  const permissionGranted = await isAndroidPostNotificationsPermissionGranted();
  if (!permissionGranted) {
    return;
  }

  try {
    const token = await getToken(getMessagingInstance());
    if (!token) {
      return;
    }

    await registerTokenWithApi(token);
  } catch {
    // FCM token is unavailable when notification permission is revoked.
  }
}

async function ensureNotificationPermissionAndRegisterToken(): Promise<void> {
  const preference = await getPushNotificationsPreference();
  if (preference === false) {
    await syncUserTimezone();
    return;
  }

  const timezonePromise = syncUserTimezone();
  const currentStatus = await getNotificationPermissionStatus();

  if (isNotificationPermissionEnabled(currentStatus)) {
    await Promise.all([timezonePromise, registerPushToken()]);
    return;
  }

  if (await wasPushPermissionRequested()) {
    await timezonePromise;
    return;
  }

  await markPushPermissionRequested();
  const nextStatus = await requestNotificationPermission();
  if (!isNotificationPermissionEnabled(nextStatus)) {
    await timezonePromise;
    return;
  }

  await Promise.all([timezonePromise, registerPushToken()]);
}

function subscribeOnTokenRefresh() {
  if (!firebaseApp || !hasDefaultFirebaseApp()) {
    return undefined;
  }

  return onTokenRefresh(getMessagingInstance(), async (newToken) => {
    try {
      const permissionGranted = await isAndroidPostNotificationsPermissionGranted();
      if (!permissionGranted) {
        await handleNotificationPermissionRevoked();
        return;
      }

      const preference = await getPushNotificationsPreference();
      if (preference === false) {
        return;
      }

      await registerTokenWithApi(newToken);
    } catch {
      // ignore refresh registration errors
    }
  });
}

function subscribeToNotificationPress() {
  if (!firebaseApp || !hasDefaultFirebaseApp()) {
    return undefined;
  }

  const messaging = getMessagingInstance();

  const unsubscribeNotifeeForeground = notifee.onForegroundEvent(event => {
    void handleNotifeePressEvent(event);
  });

  const unsubscribeFirebaseOpened = onNotificationOpenedApp(messaging, remoteMessage => {
    logPushNotificationPress('Firebase onNotificationOpenedApp', remoteMessage);
    const data = remoteMessage?.data as Record<string, unknown> | undefined;
    void markPushNotificationAsRead(data);
    handlePushNavigation(data);
  });

  getInitialNotification(messaging)
    .then(remoteMessage => {
      if (remoteMessage) {
        logPushNotificationPress('Firebase getInitialNotification', remoteMessage);
        const data = remoteMessage.data as Record<string, unknown> | undefined;
        void markPushNotificationAsRead(data);
        handlePushNavigation(data);
      }
    })
    .catch(() => undefined);

  notifee
    .getInitialNotification()
    .then(initialNotifeeNotification => {
      if (initialNotifeeNotification) {
        const data = initialNotifeeNotification.notification.data as
          | Record<string, unknown>
          | undefined;
        logPushNotificationPress('Notifee getInitialNotification', data);
        void markPushNotificationAsRead(data);
        handlePushNavigation(data);
      }
    })
    .catch(() => undefined);

  return () => {
    unsubscribeNotifeeForeground();
    unsubscribeFirebaseOpened();
  };
}

function subscribeToNotifications() {
  if (!firebaseApp || !hasDefaultFirebaseApp() || isNotificationsSubscribed) {
    return undefined;
  }

  unsubscribeForegroundMessages = onMessage(getMessagingInstance(), async (remoteMessage) => {
    try {
      const permissionGranted = await isAndroidPostNotificationsPermissionGranted();
      if (!permissionGranted) {
        return;
      }

      if (!(await arePushNotificationsEnabled())) {
        return;
      }

      invalidateInboxQueries();
      await displayRemoteNotification(remoteMessage);
    } catch {
      // ignore foreground display errors
    }
  });

  unsubscribeNotificationPress = subscribeToNotificationPress();
  registerBackgroundNotificationHandler();
  isNotificationsSubscribed = true;

  return () => {
    unsubscribeForegroundMessages?.();
    unsubscribeForegroundMessages = undefined;
    unsubscribeNotificationPress?.();
    unsubscribeNotificationPress = undefined;
    isNotificationsSubscribed = false;
  };
}

export function registerBackgroundNotificationHandler() {
  if (!firebaseApp || !hasDefaultFirebaseApp() || isBackgroundHandlerRegistered) {
    return;
  }

  setBackgroundMessageHandler(getMessagingInstance(), async (remoteMessage) => {
    try {
      const permissionGranted = await isAndroidPostNotificationsPermissionGranted();
      if (!permissionGranted) {
        return;
      }

      if (!(await arePushNotificationsEnabled())) {
        return;
      }

      invalidateInboxQueries();

      const pushData = remoteMessage.data as Record<string, unknown> | undefined;
      if (remoteMessage.notification && !isAtIntakeReminder(pushData)) {
        return;
      }

      await displayRemoteNotification(remoteMessage);
    } catch {
      // ignore background display errors
    }
  });

  isBackgroundHandlerRegistered = true;
}

function resetPushTokenRegistrationState() {
  lastRegisteredToken = null;
  lastSyncedTimezone = null;
}

async function handleAppBecameActive(): Promise<void> {
  try {
    const preference = await getPushNotificationsPreference();
    if (preference !== true) {
      return;
    }

    const permissionGranted = await isAndroidPostNotificationsPermissionGranted();
    if (!permissionGranted) {
      await handleNotificationPermissionRevoked();
    }
  } catch {
    // ignore resume sync errors
  }
}

type UseFCMTokenRegistrationOptions = {
  isAuthorized: boolean;
  autoRegister?: boolean;
};

export const useFCMTokenRegistration = (options: UseFCMTokenRegistrationOptions) => {
  const {isAuthorized, autoRegister = true} = options;

  useEffect(() => {
    if (!autoRegister || !isAuthorized) {
      if (!isAuthorized) {
        resetPushTokenRegistrationState();
      }
      return;
    }

    if (PUSH_NOTIFICATIONS_ENABLED) {
      void ensureNotificationPermissionAndRegisterToken();

      const unsubscribeNotifications = subscribeToNotifications();
      const unsubscribeTokenRefresh = subscribeOnTokenRefresh();
      const appStateSubscription = AppState.addEventListener(
        'change',
        (nextState: AppStateStatus) => {
          if (nextState !== 'active') {
            return;
          }

          InteractionManager.runAfterInteractions(() => {
            void handleAppBecameActive();
          });
        },
      );

      return () => {
        appStateSubscription.remove();
        unsubscribeTokenRefresh?.();
        unsubscribeNotifications?.();
        resetPushTokenRegistrationState();
      };
    }

    void syncUserTimezone();

    return () => {
      resetPushTokenRegistrationState();
    };
  }, [isAuthorized, autoRegister]);
};

export function usePushNotificationSettingsSync(
  onStateChange: (pushEnabled: boolean) => void,
): void {
  useEffect(() => {
    let isMounted = true;

    const refresh = async () => {
      const pushEnabled = await syncPushNotificationStateFromSystem();
      if (isMounted) {
        onStateChange(pushEnabled);
      }
    };

    void refresh();

    const subscription = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (nextState === 'active') {
        InteractionManager.runAfterInteractions(() => {
          void refresh();
        });
      }
    });

    return () => {
      isMounted = false;
      subscription.remove();
    };
  }, [onStateChange]);
}
