import {createNativeStackNavigator} from '@react-navigation/native-stack';

import {DrugsCreateFormDosageScreen} from '../../screens/drugsCreate/DrugsCreateFormDosageScreen';
import {DrugsCreateMonthChooseScreen} from '../../screens/drugsCreate/DrugsCreateMonthChooseScreen';
import {DrugsCreateNotifyScreen} from '../../screens/drugsCreate/DrugsCreateNotifyScreen';
import {DrugsCreatePeriodicityScreen} from '../../screens/drugsCreate/DrugsCreatePeriodicityScreen.tsx';
import {DrugsCreateRegimenScreen} from '../../screens/drugsCreate/DrugsCreateRegimenScreen';
import {DrugsCreateScreen} from '../../screens/drugsCreate/DrugsCreateScreen';
import {DrugsCreateYearChooseScreen} from '../../screens/drugsCreate/DrugsCreateYearChooseScreen';

export type DrugsCreateScreenTabId = 'general' | 'intakes' | 'files';

export type DrugsCreateStackParamList = {
  DrugsCreateScreen:
    | {
        prescriptionId?: string;
        initialMonth?: number;
        initialYear?: number;
        activeTab?: DrugsCreateScreenTabId;
        openIntakeId?: string;
      }
    | undefined;
  DrugsCreateFormDosageScreen: undefined;
  DrugsCreateRegimenScreen: undefined;
  DrugsCreatePeriodicityScreen: undefined;
  DrugsCreateNotifyScreen: undefined;
  DrugsCreateMonthChooseScreen: {
    prescriptionId: string;
    initialMonth: number;
    initialYear: number;
    search?: string;
  };
  DrugsCreateYearChooseScreen: {
    prescriptionId: string;
    initialMonth: number;
    initialYear: number;
    search?: string;
  };
};

const Stack = createNativeStackNavigator<DrugsCreateStackParamList>();

export const DrugsCreateStack = () => {
  return (
    <Stack.Navigator
      initialRouteName="DrugsCreateScreen"
      screenOptions={{headerShown: false}}>
      <Stack.Screen name="DrugsCreateScreen" component={DrugsCreateScreen} />
      <Stack.Screen
        name="DrugsCreateFormDosageScreen"
        component={DrugsCreateFormDosageScreen}
      />
      <Stack.Screen name="DrugsCreateRegimenScreen" component={DrugsCreateRegimenScreen} />
      <Stack.Screen name="DrugsCreatePeriodicityScreen" component={DrugsCreatePeriodicityScreen} />
      <Stack.Screen name="DrugsCreateNotifyScreen" component={DrugsCreateNotifyScreen} />
      <Stack.Screen
        name="DrugsCreateMonthChooseScreen"
        component={DrugsCreateMonthChooseScreen}
      />
      <Stack.Screen
        name="DrugsCreateYearChooseScreen"
        component={DrugsCreateYearChooseScreen}
      />
    </Stack.Navigator>
  );
};
