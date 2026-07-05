import {useEffect, useRef, useState} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type {CompositeNavigationProp} from '@react-navigation/native';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useMutation} from '@tanstack/react-query';
import {useTranslation} from 'react-i18next';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import type {AppStackParamList} from '../../app/AppStack.tsx';
import {apiAuth} from '../../features/api/apiAuth.ts';
import {ME_STORAGE_KEY, PASSWORD_RESET_SESSION_ID_HEADER} from '../../features/api/index.ts';
import i18n from '../../features/localisation/i18n.ts';
import type {ProfileStackParamList} from '../../features/navigation/ProfileStack.tsx';
import {ButtonMain} from '../../shared/ui/ButtonMain.tsx';
import {CodeEnterKeyboardInputs} from '../../shared/ui/codeEnterKeyboardInputs/codeEnterKeyboardInputs.tsx';
import {Header} from '../../shared/ui/Header.tsx';
import {extractPasswordResetSessionId} from '../auth/signIn/PasswordResetEmailEnteringScreen.tsx';
import {StatusBarAvoidContainer} from '../../shared/ui/StatusBarAvoidContainer.tsx';

const CODE_LENGTH = 5;

type ProfilePasswordChangeEmailScreenProps = NativeStackScreenProps<
    ProfileStackParamList,
    'ProfilePasswordChangeEmail'
>;

type ProfilePasswordChangeEmailNavigationProp = CompositeNavigationProp<
    NativeStackNavigationProp<ProfileStackParamList, 'ProfilePasswordChangeEmail'>,
    NativeStackNavigationProp<AppStackParamList>
>;

export const ProfilePasswordChangeEmailScreen = (_props: ProfilePasswordChangeEmailScreenProps) => {
    const {t} = useTranslation('profile', {i18n});
    const insets = useSafeAreaInsets();
    const navigation = useNavigation<ProfilePasswordChangeEmailNavigationProp>();
    const [code, setCode] = useState('');
    const [codeErrorText, setCodeErrorText] = useState<string | null>(null);
    const [isInitialRequestDone, setIsInitialRequestDone] = useState(false);
    const previousCodeRef = useRef(code);

    const {mutateAsync: passwordResetForgotRequestMutation} = useMutation({
        mutationFn: (email: string) => apiAuth.signIn.passwordResetForgotRequest(email),
    });
    const {mutateAsync: resendForgotCodeMutation} = useMutation({
        mutationFn: () => apiAuth.signIn.passwordResetForgotResend(),
    });
    const {mutateAsync: confirmForgotCodeMutation, isPending: isConfirmPending} = useMutation({
        mutationFn: (codeValue: string) => apiAuth.signIn.passwordResetForgotConfirm(codeValue),
    });

    const goToProfileScreen = () => {
        navigation.replace('Tabs', {
            screen: 'ProfileTab',
            params: {
                screen: 'ProfileScreen',
            },
        });
    };

    const requestPasswordResetCode = async () => {
        const raw = await AsyncStorage.getItem(ME_STORAGE_KEY);

        if (!raw) {
            setCodeErrorText(t('password_change_server_error'));
            return;
        }

        const me = JSON.parse(raw) as {email?: unknown};
        const email = typeof me.email === 'string' ? me.email.trim() : '';

        if (!email) {
            setCodeErrorText(t('password_change_server_error'));
            return;
        }

        await AsyncStorage.removeItem(PASSWORD_RESET_SESSION_ID_HEADER);
        const response = await passwordResetForgotRequestMutation(email);
        const passwordSessionId = extractPasswordResetSessionId(response.headers);

        if (!passwordSessionId) {
            setCodeErrorText(t('password_change_server_error'));
            return;
        }

        await AsyncStorage.setItem(PASSWORD_RESET_SESSION_ID_HEADER, passwordSessionId);
        setCodeErrorText(null);
    };

    useEffect(() => {
        let isCancelled = false;

        (async () => {
            try {
                await requestPasswordResetCode();
            } catch (error) {
                if (!isCancelled) {
                    if (axios.isAxiosError(error) && error.response?.status === 429) {
                        setCodeErrorText(t('password_change_too_many_requests'));
                        return;
                    }

                    setCodeErrorText(t('password_change_server_error'));
                }
            } finally {
                if (!isCancelled) {
                    setIsInitialRequestDone(true);
                }
            }
        })();

        return () => {
            isCancelled = true;
        };
    }, []);

    const handleCodeChange = (nextCode: string) => {
        setCode(nextCode);
    };

    useEffect(() => {
        const hasCodeChanged = previousCodeRef.current !== code;

        if (hasCodeChanged && codeErrorText !== null) {
            setCodeErrorText(null);
        }

        previousCodeRef.current = code;
    }, [code, codeErrorText]);

    const handleNextPress = async () => {
        if (!isInitialRequestDone) {
            return;
        }

        if (code.length < CODE_LENGTH) {
            setCodeErrorText(t('password_change_code_required'));
            return;
        }

        setCodeErrorText(null);

        try {
            await confirmForgotCodeMutation(code);
            navigation.replace('ProfilePasswordChangeNewPassword');
        } catch (error) {
            if (axios.isAxiosError(error) && error.response?.status === 401) {
                setCodeErrorText(t('password_change_wrong_code'));
                return;
            }

            setCodeErrorText(t('password_change_server_error'));
        }
    };

    const handleResendCodePress = async () => {
        try {
            await resendForgotCodeMutation();
            setCodeErrorText(null);
        } catch {
            setCodeErrorText(t('password_change_server_error'));
        }
    };

    return (
        <StatusBarAvoidContainer backgroundColor="rgba(255, 255, 255, 1)">
            <Header
                title={t('password_change_screen_title')}
                rightIcon="x"
                onRightIconPress={goToProfileScreen}
            />
            <View style={styles.screenContent}>
                <View style={styles.content}>
                    <Text style={styles.prompt}>{t('password_change_enter_code')}</Text>
                    <CodeEnterKeyboardInputs
                        onCodeChange={handleCodeChange}
                        onResendCodePress={() => {
                            void handleResendCodePress();
                        }}
                        errorText={codeErrorText}
                    />
                </View>
                <ButtonMain
                    title={t('email_change_next')}
                    onPress={() => {
                        void handleNextPress();
                    }}
                    isLoading={isConfirmPending || !isInitialRequestDone}
                    style={[styles.nextButton, {marginBottom: insets.bottom + 16}]}
                />
            </View>
        </StatusBarAvoidContainer>
    );
};

const styles = StyleSheet.create({
    screenContent: {
        flex: 1,
        justifyContent: 'space-between',
    },
    content: {
        flex: 1,
        paddingHorizontal: 12,
    },
    prompt: {
        marginTop: 28,
        marginBottom: 24,
        textAlign: 'center',
        color: 'rgba(29, 26, 73, 1)',
    },
    nextButton: {
        marginHorizontal: 12,
    },
});
