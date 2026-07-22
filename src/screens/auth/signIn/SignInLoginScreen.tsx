import {Image, StyleSheet, Text, View} from "react-native";
import {useSafeAreaInsets} from "react-native-safe-area-context";
import {KeyboardAwareScrollView} from "react-native-keyboard-aware-scroll-view";
import {ButtonMain} from "../../../shared/ui/ButtonMain.tsx";
import type {NativeStackScreenProps} from "@react-navigation/native-stack";
import {SignInStackParamList} from "../../../features/navigation/auth/SignInStack.tsx";
import {useState} from "react";
import {useMutation} from "@tanstack/react-query";
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from "axios";
import {useTranslation} from "react-i18next";
import {apiAuth} from "../../../features/api/apiAuth.ts";
import {ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY} from "../../../features/api/index.ts";
import i18n from "../../../features/localisation/i18n.ts";
import {triggerAuthSyncWithWelcome} from "../../../app/useAuth.ts";
import {useToast} from "../../../features/toasts/useToast.ts";
import {InputMain} from "../../../shared/ui/InputMain.tsx";
import {isPasswordValid, PasswordInput} from "../../../shared/ui/PasswordInput.tsx";
import {TouchableTextIsIcon} from "../../../shared/ui/TouchableTextIsIcon.tsx";

type SignInLoginScreenProps = NativeStackScreenProps<
    SignInStackParamList,
    'SignInLogin'
>;

export const SignInLoginScreen = ({navigation}: SignInLoginScreenProps) => {
    const {t} = useTranslation('auth', {i18n});
    const insets = useSafeAreaInsets();
    const [email, setEmail] = useState<string>('')
    const [password, setPassword] = useState<string>('')
    const [emailErrorText, setEmailErrorText] = useState<string | null>(null);
    const [passwordErrorText, setPasswordErrorText] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const {mutateAsync: loginMutation} = useMutation({
        mutationFn: ({email, password}: {email: string; password: string}) =>
            apiAuth.signIn.login(email, password),
    });
    const {showToast} = useToast();

    const handleSubmit = async () => {
        if (isSubmitting) {
            return;
        }

        let hasError = false;
        const trimmedEmail = email.trim();

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
            setEmailErrorText(t('common.email_invalid'));
            hasError = true;
        } else {
            setEmailErrorText(null);
        }

        if (!isPasswordValid(password)) {
            setPasswordErrorText(t('sign_in.password_invalid'));
            hasError = true;
        } else {
            setPasswordErrorText(null);
        }

        if (hasError) {
            return;
        }

        setIsSubmitting(true);

        try {
            const response = await loginMutation({email: trimmedEmail, password});
            const {accessToken, refreshToken} = response.data ?? {};

            if (typeof accessToken === 'string' && accessToken.trim().length > 0) {
                await AsyncStorage.setItem(ACCESS_TOKEN_KEY, accessToken.trim());
            }

            if (typeof refreshToken === 'string' && refreshToken.trim().length > 0) {
                await AsyncStorage.setItem(REFRESH_TOKEN_KEY, refreshToken.trim());
            }

            triggerAuthSyncWithWelcome();
        } catch (error) {
            if (axios.isAxiosError(error) && error.response?.status === 401) {
                showToast({variant: 'error', text: t('sign_in.invalid_credentials')});
                return;
            }

            showToast({variant: 'error', text: t('common.server_error')});
        } finally {
            setIsSubmitting(false);
        }
    };

    return <>
        <KeyboardAwareScrollView
            style={styles.container}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="always"
            showsVerticalScrollIndicator={false}
            enableOnAndroid>
            <View style={styles.inner}>
                <Image
                    source={require('../../../../assets/images/logo.png')}
                    style={styles.logo}
                />
                <View style={[styles.content, {paddingBottom: insets.bottom}]}>
                    <Text style={styles.title}>{t('sign_in.title')}</Text>
                    <InputMain icon={'mail'} label={t('common.email_label')} autoFocus placeholder={t('common.email_placeholder')} value={email}
                               onChange={value => {
                                   setEmail(value);
                                   setEmailErrorText(null);
                               }}
                               errorText={emailErrorText}/>
                    <PasswordInput value={password}
                                   onChange={value => {
                                       setPassword(value);
                                       setPasswordErrorText(null);
                                   }}
                                   errorText={passwordErrorText}
                                   label={t('common.password_label')}
                                   placeholder={t('common.password_placeholder')} style={styles.password}/>
                    <TouchableTextIsIcon
                        styleContainer={styles.forgotPasswordContainer}
                        styleText={styles.forgotPasswordText}
                        text={t('sign_in.forgot_password')}
                        onPress={() => {
                            navigation.navigate('PasswordResetEmailEntering');
                        }}
                    />
                    <View style={styles.footer}>
                        <View style={styles.buttonsContainer}>
                            <View style={[styles.buttonWrapper, styles.buttonWrapperFirst]}>
                                <ButtonMain
                                    onPress={() => {
                                        navigation.goBack();
                                    }}
                                    title={t('common.back')}
                                    variant={'secondary'}
                                />
                            </View>
                            <View style={styles.buttonWrapper}>
                                <ButtonMain
                                    onPress={handleSubmit}
                                    title={t('sign_in.submit')}
                                    isLoading={isSubmitting}
                                />
                            </View>
                        </View>
                    </View>
                </View>
            </View>
        </KeyboardAwareScrollView>
    </>
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'rgba(247, 246, 251, 1)',
    },
    scrollContent: {
        flexGrow: 1,
    },
    inner: {
        flex: 1,
    },
    logo: {
        width: 175,
        height: 32,
        alignSelf: 'center',
        marginTop: 12,
        marginBottom: 24,
    },
    content: {
        flex: 1,
        backgroundColor: 'rgba(255, 255, 255, 1)',
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        paddingHorizontal: 12,
        paddingTop: 32,
    },
    title: {
        textAlign: 'center',
        fontSize: 24,
        fontWeight: '700',
        color: 'rgba(29, 26, 73, 1)',
        marginBottom: 32,
    },
    password: {
        marginTop: 8,
        marginBottom: 16
    },
    forgotPasswordContainer: {
      alignSelf: 'center',
    },
    forgotPasswordText: {
      textAlign: 'center',
    },
    footer: {
        marginTop: 'auto',
        paddingBottom: 16,
        paddingTop: 8
    },
    buttonsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    buttonWrapper: {
        flex: 1,
    },
    buttonWrapperFirst: {
        marginRight: 12,
    },
})
