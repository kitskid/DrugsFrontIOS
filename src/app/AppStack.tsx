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

export type AppStackParamList = {
  Tabs: NavigatorScreenParams<TabsStackParamList> | undefined;
  DrugsCreate: NavigatorScreenParams<DrugsCreateStackParamList> | undefined;
  Profile: NavigatorScreenParams<ProfileStackParamList> | undefined;
};

const Stack = createNativeStackNavigator<AppStackParamList>();

export const AppStack = () => {
  return (
    <Stack.Navigator initialRouteName="Tabs" screenOptions={{headerShown: false}}>
      <Stack.Screen name="Tabs" component={TabsStack} />
      <Stack.Screen name="DrugsCreate" component={DrugsCreateStack} />
      <Stack.Screen name="Profile" component={ProfileStack} />
    </Stack.Navigator>
  );
};
