import {Image, StyleSheet, Text, View} from 'react-native';
import {KeyboardAwareScrollView} from "react-native-keyboard-aware-scroll-view";
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {ButtonMain} from "../../../shared/ui/ButtonMain.tsx";
import type {NativeStackScreenProps} from "@react-navigation/native-stack";
import type {SignUpStackParamList} from "../../../features/navigation/auth/SignUpStack.tsx";
import {CodeEnterKeyboardInputs} from "../../../shared/ui/codeEnterKeyboardInputs/codeEnterKeyboardInputs.tsx";
import {useEffect, useRef, useState} from "react";
import {useMutation} from "@tanstack/react-query";
import {useTranslation} from "react-i18next";
import {apiAuth} from "../../../features/api/apiAuth.ts";
import axios from "axios";
import i18n from "../../../features/localisation/i18n.ts";
import type {AuthStackParamList} from "../../../features/navigation/auth/AuthStack.tsx";
import type {NativeStackNavigationProp} from "@react-navigation/native-stack";

type SignUpEmailConfirmScreenProps = NativeStackScreenProps<
    SignUpStackParamList,
    'SignUpEmailConfirm'
>;

export const SignUpEmailConfirmScreen = ({navigation}: SignUpEmailConfirmScreenProps) => {
    const {t} = useTranslation('auth', {i18n});
    const insets = useSafeAreaInsets();
    const authNavigation = navigation.getParent<NativeStackNavigationProp<AuthStackParamList>>();
    const [code, setCode] = useState('');
    const [codeErrorText, setCodeErrorText] = useState<string | null>(null);
    const previousCodeRef = useRef(code);
    const {mutateAsync: resendEmailCodeMutation} = useMutation({
        mutationFn: () => apiAuth.signUp.resendEmailCode(),
    });
    const {mutateAsync: confirmEmailCodeMutation, isPending: isConfirmPending} = useMutation({
        mutationFn: (code: string) => apiAuth.signUp.confirmEmailCode(code),
    });

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

    const handleConfirmPress = async () => {
        if (code.length < 5) {
            setCodeErrorText(t('common.field_required'));
            return;
        }

        setCodeErrorText(null);

        try {
            await confirmEmailCodeMutation(code);
            navigation.replace('SignUpPassword');
        } catch (error) {
            if (axios.isAxiosError(error) && error.response?.status === 401) {
                setCodeErrorText(t('common.invalid_code'));
                return;
            }

            setCodeErrorText(t('common.server_error'));
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
                    <Text style={styles.title}>{t('sign_up.confirm_email_title')}</Text>
                    <CodeEnterKeyboardInputs
                        onCodeChange={handleCodeChange}
                        onResendCodePress={async () => await resendEmailCodeMutation()}
                        errorText={codeErrorText}
                    />
                    <View style={styles.footer}>
                        <View style={styles.buttonsContainer}>
                            <View style={[styles.buttonWrapper, styles.buttonWrapperFirst]}>
                                <ButtonMain
                                    onPress={() => {
                                        if (authNavigation) {
                                            authNavigation.navigate('Start');
                                            return;
                                        }
                                        navigation.goBack();
                                    }}
                                    title={t('common.back')}
                                    variant={'secondary'}
                                />
                            </View>
                            <View style={styles.buttonWrapper}>
                                <ButtonMain
                                    onPress={handleConfirmPress}
                                    title={t('common.confirm')}
                                    isLoading={isConfirmPending}
                                />
                            </View>
                        </View>
                    </View>
                </View>
            </View>
        </KeyboardAwareScrollView>
    </>
};

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
