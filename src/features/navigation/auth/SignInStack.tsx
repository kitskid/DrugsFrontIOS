import {createNativeStackNavigator} from "@react-navigation/native-stack";
import {StatusBarAvoidContainer} from "../../../shared/ui/StatusBarAvoidContainer.tsx";
import {SignInLoginScreen} from "../../../screens/auth/signIn/SignInLoginScreen.tsx";
import {PasswordResetEmailEnteringScreen} from "../../../screens/auth/signIn/PasswordResetEmailEnteringScreen.tsx";
import {PasswordResetCodeScreen} from "../../../screens/auth/signIn/PasswordResetCodeScreen.tsx";
import {PasswordResetNewPasswordScreen} from "../../../screens/auth/signIn/PasswordResetNewPasswordScreen.tsx";
import {PasswordResetRepeatScreen} from "../../../screens/auth/signIn/PasswordResetRepeatScreen.tsx";

export type SignInStackParamList = {
    SignInLogin: undefined;
    PasswordResetEmailEntering: undefined;
    PasswordResetCode: undefined;
    PasswordResetNewPassword: undefined;
    PasswordResetRepeat: undefined;
};

const Stack = createNativeStackNavigator<SignInStackParamList>();

export const SignInStack = () => {
    return (
        <StatusBarAvoidContainer backgroundColor={'rgba(247, 246, 251, 1)'}>
            <Stack.Navigator
                initialRouteName="SignInLogin"
                screenOptions={{headerShown: false}}>
                <Stack.Screen name='SignInLogin' component={SignInLoginScreen}/>
                <Stack.Screen name='PasswordResetEmailEntering' component={PasswordResetEmailEnteringScreen}/>
                <Stack.Screen name='PasswordResetCode' component={PasswordResetCodeScreen}/>
                <Stack.Screen name='PasswordResetNewPassword' component={PasswordResetNewPasswordScreen}/>
                <Stack.Screen name='PasswordResetRepeat' component={PasswordResetRepeatScreen}/>
            </Stack.Navigator>

        </StatusBarAvoidContainer>
    )
}
