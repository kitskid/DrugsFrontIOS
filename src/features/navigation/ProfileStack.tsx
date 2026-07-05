import {createNativeStackNavigator} from '@react-navigation/native-stack';

import {ProfileEmailChangeConfirmScreen} from '../../screens/profile/ProfileEmailChangeConfirmScreen.tsx';
import {ProfileEmailChangeNewEmailScreen} from '../../screens/profile/ProfileEmailChangeNewEmailScreen.tsx';
import {ProfileEmailChangePasswordScreen} from '../../screens/profile/ProfileEmailChangePasswordScreen.tsx';
import {ProfilePasswordChangeEmailScreen} from '../../screens/profile/ProfilePasswordChangeEmailScreen.tsx';
import {ProfilePasswordChangeNewPasswordScreen} from '../../screens/profile/ProfilePasswordChangeNewPasswordScreen.tsx';
import {ProfilePasswordChangeRepeatScreen} from '../../screens/profile/ProfilePasswordChangeRepeatScreen.tsx';
import {ProfileDeleteAccountScreen} from '../../screens/profile/ProfileDeleteAccountScreen.tsx';
import {ProfileAboutAppScreen} from '../../screens/profile/ProfileAboutAppScreen.tsx';
import {ProfileMealsScreen} from '../../screens/profile/ProfileMealsScreen.tsx';
import {ProfileUserAgreementScreen} from '../../screens/profile/ProfileUserAgreementScreen.tsx';

export type ProfileStackParamList = {
    ProfileEmailChangePassword: undefined;
    ProfileEmailChangeNewEmail: undefined;
    ProfileEmailChangeConfirm: undefined;
    ProfilePasswordChangeEmail: undefined;
    ProfilePasswordChangeNewPassword: undefined;
    ProfilePasswordChangeRepeat: undefined;
    ProfileUserAgreement: undefined;
    ProfileDeleteAccount: undefined;
    ProfileAboutApp: undefined;
    ProfileMeals: undefined;
};

const Stack = createNativeStackNavigator<ProfileStackParamList>();

export const ProfileStack = () => {
    return (
        <Stack.Navigator
            initialRouteName="ProfileEmailChangePassword"
            screenOptions={{headerShown: false}}>
            <Stack.Screen
                name="ProfileEmailChangePassword"
                component={ProfileEmailChangePasswordScreen}
            />
            <Stack.Screen
                name="ProfileEmailChangeNewEmail"
                component={ProfileEmailChangeNewEmailScreen}
            />
            <Stack.Screen
                name="ProfileEmailChangeConfirm"
                component={ProfileEmailChangeConfirmScreen}
            />
            <Stack.Screen
                name="ProfilePasswordChangeEmail"
                component={ProfilePasswordChangeEmailScreen}
            />
            <Stack.Screen
                name="ProfilePasswordChangeNewPassword"
                component={ProfilePasswordChangeNewPasswordScreen}
            />
            <Stack.Screen
                name="ProfilePasswordChangeRepeat"
                component={ProfilePasswordChangeRepeatScreen}
            />
            <Stack.Screen name="ProfileUserAgreement" component={ProfileUserAgreementScreen} />
            <Stack.Screen name="ProfileDeleteAccount" component={ProfileDeleteAccountScreen} />
            <Stack.Screen name="ProfileAboutApp" component={ProfileAboutAppScreen} />
            <Stack.Screen name="ProfileMeals" component={ProfileMealsScreen} />
        </Stack.Navigator>
    );
};
