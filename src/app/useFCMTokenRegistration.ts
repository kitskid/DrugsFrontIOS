import {useEffect, useRef} from 'react';
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
  AndroidCategory,
  AndroidImportance,
  AndroidVisibility,
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
import type {ManualCalendarEventStatus} from '../features/api/apiCalendar.ts';
import {useToast} from '../features/toasts/useToast';
import {getAndroidRingtoneTitle} from '../shared/native/nativeNotificationSound';

export const navigationRef = createNavigationContainerRef<AppStackParamList>();

type PushNavigationIntent = {
  prescriptionId: string;
  intakeId?: string;
};

type AlarmNavigationIntent = {
  prescriptionId: string;
  intakeId?: string;
  notificationTitle?: string;
  notificationBody?: string;
  customMedicationName?: string;
  doseAmount?: string;
  doseUnit?: string;
  doseForm?: string;
  notes?: string;
};

let pendingPushNavigationIntent: PushNavigationIntent | null = null;
let pendingAlarmNavigationIntent: AlarmNavigationIntent | null = null;

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

function buildAlarmNavigationIntent(
  data: Record<string, unknown> | undefined | null,
  meta?: {title?: string; body?: string},
): AlarmNavigationIntent | null {
  if (!isAtIntakeReminder(data)) {
    return null;
  }

  const prescriptionId =
    readPushDataString(data, 'prescriptionId') ??
    readPushDataString(data, 'recordId');
  if (!prescriptionId) {
    return null;
  }

  return {
    prescriptionId,
    intakeId: readPushDataString(data, 'intakeId'),
    notificationTitle:
      readPushMetaString(meta?.title) ?? readPushDataString(data, 'title'),
    notificationBody:
      readPushMetaString(meta?.body) ?? readPushDataString(data, 'message'),
    customMedicationName: readPushDataString(data, 'customMedicationName'),
    doseAmount: readPushDataString(data, 'doseAmount'),
    doseUnit: readPushDataString(data, 'doseUnit'),
    doseForm: readPushDataString(data, 'doseForm'),
    notes: readPushDataString(data, 'notes'),
  };
}

function navigateToMedicationAlarm(intent: AlarmNavigationIntent): boolean {
  if (!navigationRef.isReady()) {
    return false;
  }

  navigationRef.navigate('MedicationAlarm', {
    prescriptionId: intent.prescriptionId,
    intakeId: intent.intakeId,
    notificationTitle: intent.notificationTitle,
    notificationBody: intent.notificationBody,
    customMedicationName: intent.customMedicationName,
    doseAmount: intent.doseAmount,
    doseUnit: intent.doseUnit,
    doseForm: intent.doseForm,
    notes: intent.notes,
  });

  return true;
}

function requestAlarmNavigation(
  data: Record<string, unknown> | undefined | null,
  meta?: {title?: string; body?: string},
): void {
  void markPushNotificationAsRead(data);

  const intent = buildAlarmNavigationIntent(data, meta);
  if (!intent) {
    return;
  }

  pendingAlarmNavigationIntent = intent;
  if (navigateToMedicationAlarm(intent)) {
    pendingAlarmNavigationIntent = null;
  }
}

export function flushPendingAlarmNavigationIntent(): void {
  if (!pendingAlarmNavigationIntent) {
    return;
  }

  if (navigateToMedicationAlarm(pendingAlarmNavigationIntent)) {
    pendingAlarmNavigationIntent = null;
  }
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
const PUSH_CHANNEL_ALARM_ID = 'drugs-push-alarm-v1';
const PUSH_CHANNEL_ALARM_SILENT_ID = 'drugs-push-alarm-silent-v1';
const ACTIVE_AT_INTAKE_ALARM_NOTIFICATION_ID = 'at-intake-alarm-active';
const PUSH_NOTIFICATIONS_ENABLED_KEY = 'push_notifications_enabled';
const SILENCE_MODE_ENABLED_KEY = 'push_silence_mode_enabled';
const INTAKE_SPECIAL_SIGNAL_ENABLED_KEY = 'push_intake_special_signal_enabled';
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

let cachedIntakeSpecialSignalEnabled: boolean | null = null;

async function getIntakeSpecialSignalPreference(): Promise<boolean> {
  if (cachedIntakeSpecialSignalEnabled !== null) {
    return cachedIntakeSpecialSignalEnabled;
  }

  const raw = await AsyncStorage.getItem(INTAKE_SPECIAL_SIGNAL_ENABLED_KEY);
  // Default ON when the preference has never been set.
  cachedIntakeSpecialSignalEnabled = raw === null ? true : raw === 'true';
  return cachedIntakeSpecialSignalEnabled;
}

async function setIntakeSpecialSignalPreference(enabled: boolean): Promise<void> {
  cachedIntakeSpecialSignalEnabled = enabled;
  await AsyncStorage.setItem(
    INTAKE_SPECIAL_SIGNAL_ENABLED_KEY,
    enabled ? 'true' : 'false',
  );
}

async function shouldUseAtIntakeAlarm(
  data: Record<string, unknown> | undefined | null,
): Promise<boolean> {
  return isAtIntakeReminder(data) && (await getIntakeSpecialSignalPreference());
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
let isNotifeeForegroundPressHandlerRegistered = false;

function handleAtIntakePressSoundStop(event: Event): void {
  if (event.type !== EventType.PRESS && event.type !== EventType.ACTION_PRESS) {
    return;
  }

  const data = event.detail.notification?.data as
    | Record<string, unknown>
    | undefined;

  if (!isAtIntakeReminder(data)) {
    return;
  }

  void getIntakeSpecialSignalPreference().then(useAlarm => {
    if (useAlarm) {
      stopAtIntakeAlarmSoundImmediately();
    }
  });
}

function logPushNotificationPress(source: string, payload: unknown) {
  console.log(`[Push press] ${source}:`, payload);
}

const PUSH_ACTION_COMPLETED = 'completed';
const PUSH_ACTION_CANCELLED = 'cancelled';
/** Legacy / server action ids that map to CANCELLED. */
const PUSH_ACTION_MISSED = 'missed';
const PUSH_ACTION_SKIP = 'skip';

function isCancelPushAction(actionId: string | undefined): boolean {
  return (
    actionId === PUSH_ACTION_CANCELLED ||
    actionId === PUSH_ACTION_MISSED ||
    actionId === PUSH_ACTION_SKIP
  );
}

function buildAtIntakeAndroidActions(): AndroidAction[] {
  return [
    {title: 'Принято', pressAction: {id: PUSH_ACTION_COMPLETED}},
    {title: 'Отменено', pressAction: {id: PUSH_ACTION_CANCELLED}},
  ];
}

function normalizePushDataForNotifee(
  data: Record<string, unknown> | undefined,
): Record<string, string> {
  if (!data) {
    return {};
  }

  return Object.entries(data).reduce<Record<string, string>>((acc, [key, value]) => {
    if (value === undefined || value === null) {
      return acc;
    }

    acc[key] = typeof value === 'string' ? value : String(value);
    return acc;
  }, {});
}

function readPushMetaString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim().length > 0
    ? value.trim()
    : undefined;
}

function readPushTitleAndBody(remoteMessage: RemoteMessage): {
  title: string;
  body: string;
} {
  const data = remoteMessage.data as Record<string, unknown> | undefined;
  const message = readPushDataString(data, 'message');

  const title =
    readPushMetaString(remoteMessage.notification?.title) ??
    readPushDataString(data, 'title') ??
    'Напоминание';
  const body =
    message ??
    readPushMetaString(remoteMessage.notification?.body) ??
    readPushDataString(data, 'body') ??
    '';

  return {title, body};
}

function parseServerPushActions(
  data: Record<string, unknown> | undefined,
): AndroidAction[] | undefined {
  const rawActions = readPushDataString(data, 'actions');
  if (!rawActions) {
    return undefined;
  }

  try {
    const parsed = JSON.parse(rawActions) as unknown;
    if (!Array.isArray(parsed)) {
      return undefined;
    }

    const actions = parsed
      .map((item): AndroidAction | null => {
        if (!item || typeof item !== 'object') {
          return null;
        }

        const actionItem = item as {id?: unknown; action?: unknown; title?: unknown};
        const actionId =
          typeof actionItem.id === 'string'
            ? actionItem.id
            : typeof actionItem.action === 'string'
              ? actionItem.action
              : undefined;
        const actionTitle =
          typeof actionItem.title === 'string' ? actionItem.title : undefined;

        if (!actionId || !actionTitle || actionId === 'details') {
          return null;
        }

        return {
          title: actionTitle,
          pressAction: {id: actionId},
        };
      })
      .filter((action): action is AndroidAction => action !== null);

    return actions.length > 0 ? actions : undefined;
  } catch {
    return undefined;
  }
}

async function dismissAtIntakeAlarmNotification(): Promise<void> {
  try {
    await notifee.cancelNotification(ACTIVE_AT_INTAKE_ALARM_NOTIFICATION_ID);
    await notifee.stopForegroundService();
  } catch {
    // ignore when alarm notification or foreground service is not active
  }
}

async function dismissActiveAtIntakeAlarmIfNeeded(): Promise<void> {
  try {
    const displayedNotifications = await notifee.getDisplayedNotifications();
    const hasActiveAlarm = displayedNotifications.some(
      notification => notification.id === ACTIVE_AT_INTAKE_ALARM_NOTIFICATION_ID,
    );

    if (!hasActiveAlarm) {
      return;
    }

    await dismissAtIntakeAlarmNotification();
  } catch {
    // ignore when displayed notifications are unavailable
  }
}

function resolveAtIntakeNotificationId(
  pushData: Record<string, string>,
  useAtIntakeAlarm: boolean,
): string | undefined {
  if (useAtIntakeAlarm) {
    return ACTIVE_AT_INTAKE_ALARM_NOTIFICATION_ID;
  }

  return readPushDataString(pushData, 'reminderId');
}

export function stopAtIntakeAlarmSoundImmediately(): void {
  void notifee.cancelNotification(ACTIVE_AT_INTAKE_ALARM_NOTIFICATION_ID);
  void notifee.stopForegroundService();
}

export async function bootstrapAtIntakeAlarmSoundOnLaunch(): Promise<void> {
  try {
    const initialNotifeeNotification = await notifee.getInitialNotification();
    if (initialNotifeeNotification) {
      const data = initialNotifeeNotification.notification.data as
        | Record<string, unknown>
        | undefined;
      if (await shouldUseAtIntakeAlarm(data)) {
        stopAtIntakeAlarmSoundImmediately();
      }
    }
  } catch {
    // ignore launch bootstrap errors
  }
}

export {dismissAtIntakeAlarmNotification};

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
  status: ManualCalendarEventStatus,
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
  void markPushNotificationAsRead(data);

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

async function handlePushOpenFromNotification(
  data: Record<string, unknown> | undefined | null,
  meta?: {title?: string; body?: string},
): Promise<void> {
  if (isAtIntakeReminder(data)) {
    if (await shouldUseAtIntakeAlarm(data)) {
      stopAtIntakeAlarmSoundImmediately();
      await dismissAtIntakeAlarmNotification();
    }
    requestAlarmNavigation(data, meta);
    return;
  }

  handlePushNavigation(data);
}

async function handleNotifeePressEvent({type, detail}: Event): Promise<void> {
  if (type !== EventType.PRESS && type !== EventType.ACTION_PRESS) {
    return;
  }

  const data = detail.notification?.data as
    | Record<string, unknown>
    | undefined;
  const actionId = detail.pressAction?.id;
  const atIntakePush = isAtIntakeReminder(data);
  const useAtIntakeAlarm = atIntakePush && (await getIntakeSpecialSignalPreference());

  if (useAtIntakeAlarm) {
    stopAtIntakeAlarmSoundImmediately();
  }

  logPushNotificationPress('Notifee', {
    type,
    notification: detail.notification,
    pressAction: detail.pressAction,
    data,
  });

  await markPushNotificationAsRead(data);

  if (atIntakePush) {
    if (type === EventType.ACTION_PRESS && actionId === PUSH_ACTION_COMPLETED) {
      if (useAtIntakeAlarm) {
        await dismissAtIntakeAlarmNotification();
      } else if (detail.notification?.id) {
        await notifee.cancelNotification(detail.notification.id);
      }
      await handleIntakeStatusFromPush(data, 'COMPLETED');
      return;
    }

    if (
      type === EventType.ACTION_PRESS &&
      isCancelPushAction(actionId)
    ) {
      if (useAtIntakeAlarm) {
        await dismissAtIntakeAlarmNotification();
      } else if (detail.notification?.id) {
        await notifee.cancelNotification(detail.notification.id);
      }
      await handleIntakeStatusFromPush(data, 'CANCELLED');
      return;
    }

    if (useAtIntakeAlarm) {
      await dismissAtIntakeAlarmNotification();
    }
    requestAlarmNavigation(data, {
      title: detail.notification?.title,
      body: detail.notification?.body,
    });
    return;
  }

  if (type === EventType.ACTION_PRESS && actionId === PUSH_ACTION_COMPLETED) {
    await handleIntakeStatusFromPush(data, 'COMPLETED');
    if (detail.notification?.id) {
      await notifee.cancelNotification(detail.notification.id);
    }
    return;
  }

  if (type === EventType.ACTION_PRESS && isCancelPushAction(actionId)) {
    await handleIntakeStatusFromPush(data, 'CANCELLED');
    if (detail.notification?.id) {
      await notifee.cancelNotification(detail.notification.id);
    }
    return;
  }

  handlePushNavigation(data);
}

export function registerNotifeeBackgroundPressHandler() {
  if (isNotifeeBackgroundPressHandlerRegistered) {
    return;
  }

  notifee.onBackgroundEvent(async event => {
    handleAtIntakePressSoundStop(event);
    await handleNotifeePressEvent(event);
  });

  isNotifeeBackgroundPressHandlerRegistered = true;
}

export function registerNotifeeForegroundPressHandler() {
  if (isNotifeeForegroundPressHandlerRegistered) {
    return;
  }

  notifee.onForegroundEvent(event => {
    handleAtIntakePressSoundStop(event);
    void handleNotifeePressEvent(event);
  });

  isNotifeeForegroundPressHandlerRegistered = true;
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

async function ensureAlarmPushNotificationChannel(): Promise<string> {
  if (Platform.OS !== 'android') {
    return PUSH_CHANNEL_ALARM_ID;
  }

  return notifee.createChannel({
    id: PUSH_CHANNEL_ALARM_ID,
    name: 'Drugs Push (Alarm)',
    importance: AndroidImportance.HIGH,
    sound: 'default',
    vibration: true,
  });
}

async function ensureSilentAlarmPushNotificationChannel(): Promise<string> {
  if (Platform.OS !== 'android') {
    return PUSH_CHANNEL_ALARM_SILENT_ID;
  }

  return notifee.createChannel({
    id: PUSH_CHANNEL_ALARM_SILENT_ID,
    name: 'Drugs Push (Alarm Silent)',
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

async function resolveAlarmPushNotificationChannelId(): Promise<string> {
  const isSilent = await getSilenceModePreference();
  return isSilent
    ? ensureSilentAlarmPushNotificationChannel()
    : ensureAlarmPushNotificationChannel();
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
      ensureAlarmPushNotificationChannel(),
      ensureSilentAlarmPushNotificationChannel(),
    ]);
  }
}

export async function isIntakeSpecialSignalEnabled(): Promise<boolean> {
  return getIntakeSpecialSignalPreference();
}

export async function setIntakeSpecialSignalEnabled(enabled: boolean): Promise<void> {
  await setIntakeSpecialSignalPreference(enabled);
  if (!enabled) {
    await dismissAtIntakeAlarmNotification();
  }
}

export type IntakeSpecialSignalAlarmSoundInfo = {
  kind: 'default' | 'none' | 'custom';
  name?: string;
};

async function resolveAndroidNotificationSoundName(
  sound?: string,
  soundURI?: string,
): Promise<string | null> {
  if (soundURI) {
    const titleFromUri = await getAndroidRingtoneTitle(soundURI);
    if (titleFromUri) {
      return titleFromUri;
    }
  }

  if (sound === 'default') {
    const defaultTitle = await getAndroidRingtoneTitle('default');
    if (defaultTitle) {
      return defaultTitle;
    }
    return null;
  }

  const normalizedSound = sound?.trim();
  return normalizedSound || null;
}

export async function getIntakeSpecialSignalAlarmSoundInfo(): Promise<IntakeSpecialSignalAlarmSoundInfo> {
  if (Platform.OS !== 'android') {
    return {kind: 'default'};
  }

  await ensureAlarmPushNotificationChannel();
  const channel = await notifee.getChannel(PUSH_CHANNEL_ALARM_ID);
  if (!channel) {
    return {kind: 'default'};
  }

  if (!channel.soundURI && !channel.sound) {
    return {kind: 'none'};
  }

  const resolvedName = await resolveAndroidNotificationSoundName(
    channel.sound,
    channel.soundURI,
  );

  if (resolvedName) {
    return {kind: 'custom', name: resolvedName};
  }

  if (channel.sound === 'default' || channel.soundURI) {
    return {kind: 'default'};
  }

  return {kind: 'none'};
}

export async function openIntakeSpecialSignalAlarmSoundSettings(): Promise<void> {
  if (Platform.OS !== 'android') {
    return;
  }

  const channelId = await ensureAlarmPushNotificationChannel();
  await notifee.openNotificationSettings(channelId);
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

async function handleAtIntakeOpenInForeground(
  remoteMessage: RemoteMessage,
): Promise<void> {
  const data = remoteMessage.data as Record<string, unknown> | undefined;
  const {title, body} = readPushTitleAndBody(remoteMessage);

  if (await shouldUseAtIntakeAlarm(data)) {
    stopAtIntakeAlarmSoundImmediately();
    await dismissAtIntakeAlarmNotification();
  } else {
    await dismissActiveAtIntakeAlarmIfNeeded();
  }

  requestAlarmNavigation(data, {title, body});
}

function isAppInForeground(): boolean {
  return AppState.currentState === 'active';
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

  const {title, body} = readPushTitleAndBody(remoteMessage);
  const pushData = normalizePushDataForNotifee(
    remoteMessage.data as Record<string, unknown> | undefined,
  );
  const atIntakePush = isAtIntakeReminder(pushData);
  const useAtIntakeAlarm =
    atIntakePush && (await getIntakeSpecialSignalPreference());
  const isSilent = await getSilenceModePreference();
  const displayTitle =
    title.trim() ||
    readPushDataString(pushData, 'title') ||
    'Напоминание';
  const displayBody =
    body.trim() ||
    readPushDataString(pushData, 'message') ||
    readPushDataString(pushData, 'body') ||
    ' ';

  if (!atIntakePush && displayTitle.trim().length === 0 && displayBody.trim().length === 0) {
    return;
  }

  const channelId = useAtIntakeAlarm
    ? await resolveAlarmPushNotificationChannelId()
    : await resolvePushNotificationChannelId();

  if (atIntakePush && !useAtIntakeAlarm) {
    await dismissActiveAtIntakeAlarmIfNeeded();
  }

  const android: {
    channelId: string;
    smallIcon: string;
    pressAction: {id: string; launchActivity?: 'default'};
    actions?: AndroidAction[];
    category?: AndroidCategory;
    ongoing?: boolean;
    autoCancel?: boolean;
    asForegroundService?: boolean;
    loopSound?: boolean;
    importance?: AndroidImportance;
    sound?: string;
    visibility?: AndroidVisibility;
  } = {
    channelId,
    smallIcon: 'ic_notification',
    pressAction: {id: 'default'},
  };

  if (useAtIntakeAlarm) {
    android.category = AndroidCategory.ALARM;
    android.actions = buildAtIntakeAndroidActions();
    android.ongoing = true;
    android.autoCancel = false;
    android.pressAction = {id: 'default', launchActivity: 'default'};

    if (!isSilent) {
      android.asForegroundService = true;
      android.loopSound = true;
    }
  } else if (atIntakePush) {
    android.actions = buildAtIntakeAndroidActions();
    android.pressAction = {id: 'default', launchActivity: 'default'};
    android.autoCancel = true;
    android.visibility = AndroidVisibility.PUBLIC;

    if (!isSilent) {
      android.importance = AndroidImportance.HIGH;
      android.sound = 'default';
    }
  } else {
    const serverActions = parseServerPushActions(pushData);
    if (serverActions) {
      android.actions = serverActions;
    }
  }

  await notifee.displayNotification({
    id: resolveAtIntakeNotificationId(pushData, useAtIntakeAlarm),
    title: displayTitle,
    body: displayBody,
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

  const unsubscribeFirebaseOpened = onNotificationOpenedApp(messaging, remoteMessage => {
    logPushNotificationPress('Firebase onNotificationOpenedApp', remoteMessage);
    const data = remoteMessage?.data as Record<string, unknown> | undefined;

    void handlePushOpenFromNotification(data, {
      title: remoteMessage?.notification?.title,
      body: remoteMessage?.notification?.body,
    });
  });

  getInitialNotification(messaging)
    .then(remoteMessage => {
      if (!remoteMessage) {
        return;
      }

      logPushNotificationPress('Firebase getInitialNotification', remoteMessage);
      const data = remoteMessage.data as Record<string, unknown> | undefined;

      void handlePushOpenFromNotification(data, {
        title: remoteMessage.notification?.title,
        body: remoteMessage.notification?.body,
      });
    })
    .catch(() => undefined);

  notifee
    .getInitialNotification()
    .then(initialNotifeeNotification => {
      if (!initialNotifeeNotification) {
        return;
      }

      const data = initialNotifeeNotification.notification.data as
        | Record<string, unknown>
        | undefined;
      logPushNotificationPress('Notifee getInitialNotification', data);

      void handlePushOpenFromNotification(data, {
        title: initialNotifeeNotification.notification.title,
        body: initialNotifeeNotification.notification.body,
      });
    })
    .catch(() => undefined);

  return () => {
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

      const pushData = remoteMessage.data as Record<string, unknown> | undefined;
      if (isAppInForeground() && isAtIntakeReminder(pushData)) {
        await handleAtIntakeOpenInForeground(remoteMessage);
        return;
      }

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

export function handlePushNavigationReady(): void {
  flushPendingAlarmNavigationIntent();
  flushPendingPushNavigationIntent();
}

type UseFCMTokenRegistrationOptions = {
  isAuthReady: boolean;
  isAuthorized: boolean;
  shouldShowWelcome: boolean;
  connectivityIssue: boolean;
  autoRegister?: boolean;
};

export const useFCMTokenRegistration = (options: UseFCMTokenRegistrationOptions) => {
  const {
    isAuthReady,
    isAuthorized,
    shouldShowWelcome,
    connectivityIssue,
    autoRegister = true,
  } = options;
  const {showToast} = useToast();
  const connectivityToastShownRef = useRef(false);

  const isAuthorizedForRegistration = isAuthReady && isAuthorized;
  const isAppStackShown = isAuthReady && isAuthorized && !shouldShowWelcome;

  useEffect(() => {
    void bootstrapAtIntakeAlarmSoundOnLaunch();
  }, []);

  useEffect(() => {
    if (isAppStackShown) {
      flushPendingAlarmNavigationIntent();
      flushPendingPushNavigationIntent();
    }
  }, [isAppStackShown]);

  useEffect(() => {
    if (connectivityIssue && !isAuthReady) {
      if (!connectivityToastShownRef.current) {
        showToast({
          variant: 'warning',
          text: 'Проблема с интернет-соединением',
        });
        connectivityToastShownRef.current = true;
      }
      return;
    }

    connectivityToastShownRef.current = false;
  }, [connectivityIssue, isAuthReady, showToast]);

  useEffect(() => {
    if (!autoRegister || !isAuthorizedForRegistration) {
      if (!isAuthorizedForRegistration) {
        resetPushTokenRegistrationState();
      }
      return;
    }

    if (PUSH_NOTIFICATIONS_ENABLED) {
      void ensureNotificationPermissionAndRegisterToken();
      void Promise.all([
        ensurePushNotificationChannel(),
        ensureSilentPushNotificationChannel(),
        ensureAlarmPushNotificationChannel(),
        ensureSilentAlarmPushNotificationChannel(),
      ]);

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
  }, [isAuthorizedForRegistration, autoRegister]);
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
