import {createNativeStackNavigator} from '@react-navigation/native-stack';
import type {NavigatorScreenParams} from '@react-navigation/native';
import {StartScreen} from '../../../screens/auth/StartScreen';
import {SignUpStack, type SignUpStackParamList,} from './SignUpStack';
import {SignInStack, SignInStackParamList} from "./SignInStack.tsx";

export type AuthStackParamList = {
    Start: undefined;
    SignUp: NavigatorScreenParams<SignUpStackParamList> | undefined;
    SignIn: NavigatorScreenParams<SignInStackParamList> | undefined;
};

const Stack = createNativeStackNavigator<AuthStackParamList>();

export const AuthStack = () => {
    return (
        <Stack.Navigator initialRouteName="Start" screenOptions={{headerShown: false}}>
            <Stack.Screen name="Start" component={StartScreen}/>
            <Stack.Screen name="SignUp" component={SignUpStack}/>
            <Stack.Screen name='SignIn' component={SignInStack}/>
        </Stack.Navigator>
    );
};
