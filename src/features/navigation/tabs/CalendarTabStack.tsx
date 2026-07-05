import {createNativeStackNavigator} from '@react-navigation/native-stack';

import {CalendarMonthChooseScreen} from '../../../screens/calendarTab/CalendarMonthChooseScreen.tsx';
import {CalendarScreen} from '../../../screens/calendarTab/CalendarScreen.tsx';
import {CalendarYearChooseScreen} from '../../../screens/calendarTab/CalendarYearChooseScreen.tsx';

export type CalendarTabStackParamList = {
  CalendarScreen: {initialMonth?: number; initialYear?: number} | undefined;
  CalendarMonthChooseScreen: {initialMonth: number; initialYear: number};
  CalendarYearChooseScreen: {initialMonth: number; initialYear: number};
};

const Stack = createNativeStackNavigator<CalendarTabStackParamList>();

export const CalendarTabStack = () => {
  return (
    <Stack.Navigator
      initialRouteName="CalendarScreen"
      screenOptions={{headerShown: false}}>
      <Stack.Screen name="CalendarScreen" component={CalendarScreen} />
      <Stack.Screen
        name="CalendarMonthChooseScreen"
        component={CalendarMonthChooseScreen}
      />
      <Stack.Screen
        name="CalendarYearChooseScreen"
        component={CalendarYearChooseScreen}
      />
    </Stack.Navigator>
  );
};
