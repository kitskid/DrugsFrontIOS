import {useCallback} from 'react';
import {
  Image,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  useFocusEffect,
  useNavigation,
  useRoute,
  type RouteProp,
} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useMutation, useQueryClient} from '@tanstack/react-query';
import {useTranslation} from 'react-i18next';
import LinearGradient from 'react-native-linear-gradient';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import type {AppStackParamList} from '../../app/AppStack.tsx';
import {dismissAtIntakeAlarmNotification} from '../../app/useFCMTokenRegistration.ts';
import {
  CALENDAR_QUERY_KEY,
  type ManualCalendarEventStatus,
} from '../../features/api/apiCalendar.ts';
import {
  ACTIVE_MEDICATION_PRESCRIPTIONS_QUERY_KEY,
  apiDrugs,
} from '../../features/api/drugs/apiDrugs.ts';
import {
  NOTIFICATIONS_QUERY_KEY,
  NOTIFICATIONS_UNREAD_COUNT_QUERY_KEY,
} from '../../features/api/apiNotification.ts';
import i18n from '../../features/localisation/i18n';

type MedicationAlarmScreenRoute = RouteProp<AppStackParamList, 'MedicationAlarm'>;
type MedicationAlarmScreenNavigation = NativeStackNavigationProp<
  AppStackParamList,
  'MedicationAlarm'
>;

const backgroundGradientStart = {x: 0, y: 1};
const backgroundGradientEnd = {x: 1, y: 0};

const formatAlarmDoseLabel = (
  doseAmount?: string,
  doseUnit?: string,
  doseForm?: string,
): string | null => {
  const parts: string[] = [];
  const amount = doseAmount?.trim();
  const unit = doseUnit?.trim();
  const form = doseForm?.trim();

  if (amount && unit) {
    parts.push(`${amount} ${unit}`);
  } else if (amount) {
    parts.push(amount);
  }

  if (form) {
    parts.push(form.charAt(0).toLowerCase() + form.slice(1));
  }

  return parts.length > 0 ? parts.join(', ') : null;
};

export const MedicationAlarmScreen = () => {
  const {t} = useTranslation('notifications', {i18n});
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<MedicationAlarmScreenNavigation>();
  const route = useRoute<MedicationAlarmScreenRoute>();
  const queryClient = useQueryClient();

  const {
    prescriptionId,
    intakeId,
    customMedicationName,
    doseAmount,
    doseUnit,
    doseForm,
    notes,
  } = route.params;

  const medicationName =
    customMedicationName?.trim() || t('alarmScreen.defaultMedicationName');
  const doseLabel = formatAlarmDoseLabel(doseAmount, doseUnit, doseForm);
  const notesText = notes?.trim() || '';
  const hasDetailsCard = Boolean(doseLabel || notesText.length > 0);

  useFocusEffect(
    useCallback(() => {
      StatusBar.setBarStyle('light-content');
      return () => {
        StatusBar.setBarStyle('dark-content');
      };
    }, []),
  );

  const closeAlarm = useCallback(() => {
    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }

    navigation.navigate('Tabs');
  }, [navigation]);

  const openIntakeDetails = useCallback(() => {
    navigation.navigate('DrugsCreate', {
      screen: 'DrugsCreateScreen',
      params: {
        prescriptionId,
        activeTab: 'intakes',
        openIntakeId: intakeId,
      },
    });
  }, [intakeId, navigation, prescriptionId]);

  const invalidateIntakeData = useCallback(async () => {
    await Promise.allSettled([
      queryClient.invalidateQueries({queryKey: CALENDAR_QUERY_KEY}),
      queryClient.invalidateQueries({
        queryKey: ACTIVE_MEDICATION_PRESCRIPTIONS_QUERY_KEY,
      }),
      queryClient.invalidateQueries({queryKey: NOTIFICATIONS_QUERY_KEY}),
      queryClient.invalidateQueries({
        queryKey: NOTIFICATIONS_UNREAD_COUNT_QUERY_KEY,
      }),
    ]);
  }, [queryClient]);

  const {mutate: updateIntakeStatus, isPending} = useMutation({
    mutationFn: async (status: ManualCalendarEventStatus) => {
      if (!intakeId) {
        throw new Error('No intake selected');
      }

      return apiDrugs.updateMedicationIntakeStatus(intakeId, status);
    },
    onSuccess: () => {
      invalidateIntakeData().catch(() => undefined);
      void dismissAtIntakeAlarmNotification();
      closeAlarm();
    },
    onError: () => {
      openIntakeDetails();
    },
  });

  const handleMarkCompleted = useCallback(() => {
    if (!intakeId) {
      openIntakeDetails();
      return;
    }
    updateIntakeStatus('COMPLETED');
  }, [intakeId, openIntakeDetails, updateIntakeStatus]);

  const handleMarkCancelled = useCallback(() => {
    if (!intakeId) {
      openIntakeDetails();
      return;
    }
    updateIntakeStatus('CANCELLED');
  }, [intakeId, openIntakeDetails, updateIntakeStatus]);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['rgba(122, 63, 216, 1)', 'rgba(77, 172, 255, 1)']}
        start={backgroundGradientStart}
        end={backgroundGradientEnd}
        style={StyleSheet.absoluteFill}
      />

      <View
        style={[
          styles.screen,
          {
            paddingTop: insets.top,
            paddingBottom: 23 + insets.bottom,
          },
        ]}>
        <Image
          source={require('../../../assets/images/logoOutline.png')}
          style={styles.logo}
        />

        <View style={styles.content}>
          <Text style={styles.takeMedicationText}>
            {t('alarmScreen.takeMedication')}
          </Text>
          <Text style={styles.medicationName}>{medicationName}</Text>

          {hasDetailsCard ? (
            <View style={styles.detailsCard}>
              {doseLabel ? (
                <Text style={styles.doseText}>{doseLabel}</Text>
              ) : null}
              {notesText.length > 0 ? (
                <Text
                  style={[
                    styles.notesText,
                    doseLabel ? styles.notesTextWithDose : null,
                  ]}>
                  {notesText}
                </Text>
              ) : null}
            </View>
          ) : null}
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.button, styles.skipButton]}
            onPress={handleMarkCancelled}
            disabled={isPending}
            activeOpacity={0.8}>
            <Text style={styles.buttonText}>
              {t('alarmScreen.actions.skip')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.acceptButton]}
            onPress={handleMarkCompleted}
            disabled={isPending}
            activeOpacity={0.8}>
            <Text style={styles.buttonText}>
              {t('alarmScreen.actions.accept')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  screen: {
    flex: 1,
    paddingHorizontal: 12,
  },
  logo: {
    marginTop: 40,
    width: 220,
    height: 40,
    alignSelf: 'center',
    resizeMode: 'contain',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  takeMedicationText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 1)',
    textAlign: 'center',
  },
  medicationName: {
    marginTop: 12,
    fontSize: 28,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 1)',
    textAlign: 'center',
  },
  detailsCard: {
    marginTop: 24,
    alignSelf: 'stretch',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 28,
    paddingVertical: 20,
    paddingHorizontal: 32,
    alignItems: 'center',
  },
  doseText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 1)',
    textAlign: 'center',
  },
  notesText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 1)',
    textAlign: 'center',
  },
  notesTextWithDose: {
    marginTop: 16,
  },
  actions: {
    flexDirection: 'row',
    columnGap: 12,
  },
  button: {
    flex: 1,
    height: 62,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  acceptButton: {
    backgroundColor: 'rgba(116, 183, 0, 1)',
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 1)',
    textAlign: 'center',
  },
});
