import {createNativeStackNavigator} from '@react-navigation/native-stack';

import {DrugsScreen} from '../../../screens/drugsTab/DrugsScreen.tsx';

export type DrugsTabStackParamList = {
  DrugsScreen: undefined;
};

const Stack = createNativeStackNavigator<DrugsTabStackParamList>();

export const DrugsTabStack = () => {
  return (
    <Stack.Navigator initialRouteName="DrugsScreen" screenOptions={{headerShown: false}}>
      <Stack.Screen name="DrugsScreen" component={DrugsScreen} />
    </Stack.Navigator>
  );
};
