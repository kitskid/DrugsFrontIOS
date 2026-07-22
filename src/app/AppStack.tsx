import type {NavigatorScreenParams} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';

import {
  DrugsCreateStack,
  type DrugsCreateStackParamList,
} from '../features/navigation/DrugsCreateStack';
import {
  ProfileStack,
  type ProfileStackParamList,
} from '../features/navigation/ProfileStack';
import {TabsStack, type TabsStackParamList} from './TabsStack';
import {MedicationAlarmScreen} from '../screens/alarm/MedicationAlarmScreen.tsx';

export type AppStackParamList = {
  Tabs: NavigatorScreenParams<TabsStackParamList> | undefined;
  DrugsCreate: NavigatorScreenParams<DrugsCreateStackParamList> | undefined;
  Profile: NavigatorScreenParams<ProfileStackParamList> | undefined;
  MedicationAlarm: {
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
};

const Stack = createNativeStackNavigator<AppStackParamList>();

export const AppStack = () => {
  return (
    <Stack.Navigator initialRouteName="Tabs" screenOptions={{headerShown: false}}>
      <Stack.Screen name="Tabs" component={TabsStack} />
      <Stack.Screen name="DrugsCreate" component={DrugsCreateStack} />
      <Stack.Screen name="Profile" component={ProfileStack} />
      <Stack.Screen
        name="MedicationAlarm"
        component={MedicationAlarmScreen}
        options={{gestureEnabled: false}}
      />
    </Stack.Navigator>
  );
};
