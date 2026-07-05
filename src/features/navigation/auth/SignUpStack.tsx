import {createNativeStackNavigator} from '@react-navigation/native-stack';

import {SignUpPasswordScreen} from '../../../screens/auth/signUp/SignUpPasswordScreen';
import {SignUpEmailEnteringScreen} from '../../../screens/auth/signUp/SignUpEmailEnteringScreen';
import {SignUpEmailConfirmScreen} from '../../../screens/auth/signUp/SignUpEmailConfirmScreen';
import {SignUpNameScreen} from '../../../screens/auth/signUp/SignUpNameScreen.tsx';
import {SignUpPasswordRepeatScreen} from "../../../screens/auth/signUp/SignUpPasswordRepeatScreen.tsx";
import {StatusBarAvoidContainer} from "../../../shared/ui/StatusBarAvoidContainer.tsx";

export type SignUpStackParamList = {
    SignUpPassword: undefined;
    SignUpPasswordRepeat: undefined;
    SignUpEmailEntering: undefined;
    SignUpEmailConfirm: undefined;
    SignUpName: undefined;
};

const Stack = createNativeStackNavigator<SignUpStackParamList>();

export const SignUpStack = () => {
    return (
        <StatusBarAvoidContainer backgroundColor={'rgba(247, 246, 251, 1)'}>
            <Stack.Navigator
                initialRouteName="SignUpEmailEntering"
                screenOptions={{headerShown: false}}>
                <Stack.Screen name="SignUpEmailEntering" component={SignUpEmailEnteringScreen}/>
                <Stack.Screen name="SignUpEmailConfirm" component={SignUpEmailConfirmScreen}/>
                <Stack.Screen name="SignUpPassword" component={SignUpPasswordScreen}/>
                <Stack.Screen name="SignUpPasswordRepeat" component={SignUpPasswordRepeatScreen}/>
                <Stack.Screen name="SignUpName" component={SignUpNameScreen}/>
            </Stack.Navigator>
        </StatusBarAvoidContainer>
    );
};
