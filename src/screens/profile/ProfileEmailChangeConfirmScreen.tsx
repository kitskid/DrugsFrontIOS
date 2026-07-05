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

import {triggerAuthSync} from '../../app/useAuth.ts';
import type {AppStackParamList} from '../../app/AppStack.tsx';
import {apiAuth} from '../../features/api/apiAuth.ts';
import {apiProfile} from '../../features/api/apiProfile.ts';
import {
    ACCESS_TOKEN_KEY,
    ME_STORAGE_KEY,
    REFRESH_TOKEN_KEY,
} from '../../features/api/index.ts';
import i18n from '../../features/localisation/i18n.ts';
import type {ProfileStackParamList} from '../../features/navigation/ProfileStack.tsx';
import {ButtonMain} from '../../shared/ui/ButtonMain.tsx';
import {CodeEnterKeyboardInputs} from '../../shared/ui/codeEnterKeyboardInputs/codeEnterKeyboardInputs.tsx';
import {Header} from '../../shared/ui/Header.tsx';
import {StatusBarAvoidContainer} from '../../shared/ui/StatusBarAvoidContainer.tsx';
import {useToast} from '../../features/toasts/useToast.ts';

const CODE_LENGTH = 5;

type ProfileEmailChangeConfirmScreenProps = NativeStackScreenProps<
    ProfileStackParamList,
    'ProfileEmailChangeConfirm'
>;

type ProfileEmailChangeConfirmNavigationProp = CompositeNavigationProp<
    NativeStackNavigationProp<ProfileStackParamList, 'ProfileEmailChangeConfirm'>,
    NativeStackNavigationProp<AppStackParamList>
>;

const persistTokenPair = async (data: unknown): Promise<void> => {
    if (data == null || typeof data !== 'object') {
        return;
    }

    const {accessToken, refreshToken} = data as {
        accessToken?: unknown;
        refreshToken?: unknown;
    };

    if (typeof accessToken === 'string' && accessToken.trim().length > 0) {
        await AsyncStorage.setItem(ACCESS_TOKEN_KEY, accessToken.trim());
    }

    if (typeof refreshToken === 'string' && refreshToken.trim().length > 0) {
        await AsyncStorage.setItem(REFRESH_TOKEN_KEY, refreshToken.trim());
    }
};

export const ProfileEmailChangeConfirmScreen = (_props: ProfileEmailChangeConfirmScreenProps) => {
    const {t} = useTranslation('profile', {i18n});
    const {showToast} = useToast();
    const insets = useSafeAreaInsets();
    const navigation = useNavigation<ProfileEmailChangeConfirmNavigationProp>();
    const [code, setCode] = useState('');
    const [codeErrorText, setCodeErrorText] = useState<string | null>(null);
    const previousCodeRef = useRef(code);

    const {mutateAsync: confirmEmailChangeMutation, isPending: isConfirmPending} = useMutation({
        mutationFn: (codeValue: string) => apiProfile.emailChange.confirm(codeValue),
    });
    const {mutateAsync: resendEmailChangeCodeMutation} = useMutation({
        mutationFn: () => apiProfile.emailChange.requestResend(),
    });

    const goToProfileScreen = () => {
        navigation.replace('Tabs', {
            screen: 'ProfileTab',
            params: {
                screen: 'ProfileScreen',
            },
        });
    };

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

    const handleResendCodePress = async () => {
        try {
            await resendEmailChangeCodeMutation();
            setCodeErrorText(null);
        } catch {
            setCodeErrorText(t('email_change_server_error'));
        }
    };

    const handleConfirmPress = async () => {
        if (code.length < CODE_LENGTH) {
            setCodeErrorText(t('email_change_code_required'));
            return;
        }

        setCodeErrorText(null);

        try {
            const confirmResponse = await confirmEmailChangeMutation(code);
            await persistTokenPair(confirmResponse.data);

            const meResponse = await apiAuth.me();
            const meData = meResponse.data;

            if (meData == null || typeof meData !== 'object') {
                setCodeErrorText(t('email_change_server_error'));
                return;
            }

            await AsyncStorage.setItem(ME_STORAGE_KEY, JSON.stringify(meData));
            triggerAuthSync();
            goToProfileScreen();
            showToast({variant: 'success', text: t('email_change_success')});
        } catch (error) {
            if (axios.isAxiosError(error) && error.response?.status === 401) {
                setCodeErrorText(t('email_change_wrong_code'));
                return;
            }

            setCodeErrorText(t('email_change_server_error'));
        }
    };

    return (
        <StatusBarAvoidContainer backgroundColor="rgba(255, 255, 255, 1)">
            <Header
                title={t('email_change_screen_title')}
                rightIcon="x"
                onRightIconPress={goToProfileScreen}
            />
            <View style={styles.screenContent}>
                <View style={styles.content}>
                    <Text style={styles.prompt}>{t('email_change_enter_code')}</Text>
                    <CodeEnterKeyboardInputs
                        onCodeChange={handleCodeChange}
                        onResendCodePress={() => {
                            void handleResendCodePress();
                        }}
                        errorText={codeErrorText}
                    />
                </View>
                <ButtonMain
                    title={t('email_change_confirm')}
                    onPress={() => {
                        void handleConfirmPress();
                    }}
                    isLoading={isConfirmPending}
                    style={[styles.confirmButton, {marginBottom: insets.bottom + 16}]}
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
    confirmButton: {
        marginHorizontal: 12,
    },
});
