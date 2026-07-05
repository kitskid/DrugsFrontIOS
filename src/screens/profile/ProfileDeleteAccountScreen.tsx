import {useEffect, useRef, useState} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import axios from 'axios';
import type {CompositeNavigationProp} from '@react-navigation/native';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useMutation} from '@tanstack/react-query';
import {useTranslation} from 'react-i18next';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import {logout} from '../../app/useAuth.ts';
import type {AppStackParamList} from '../../app/AppStack.tsx';
import {apiProfile} from '../../features/api/apiProfile.ts';
import i18n from '../../features/localisation/i18n.ts';
import {useToast} from '../../features/toasts/useToast.ts';
import type {ProfileStackParamList} from '../../features/navigation/ProfileStack.tsx';
import {ButtonMain} from '../../shared/ui/ButtonMain.tsx';
import {CodeEnterKeyboardInputs} from '../../shared/ui/codeEnterKeyboardInputs/codeEnterKeyboardInputs.tsx';
import {Header} from '../../shared/ui/Header.tsx';
import {InfoCard} from '../../shared/ui/InfoCard.tsx';
import {StatusBarAvoidContainer} from '../../shared/ui/StatusBarAvoidContainer.tsx';

const CODE_LENGTH = 5;

type ProfileDeleteAccountScreenProps = NativeStackScreenProps<
    ProfileStackParamList,
    'ProfileDeleteAccount'
>;

type ProfileDeleteAccountNavigationProp = CompositeNavigationProp<
    NativeStackNavigationProp<ProfileStackParamList, 'ProfileDeleteAccount'>,
    NativeStackNavigationProp<AppStackParamList>
>;

export const ProfileDeleteAccountScreen = (_props: ProfileDeleteAccountScreenProps) => {
    const {t} = useTranslation('profile', {i18n});
    const {showToast} = useToast();
    const insets = useSafeAreaInsets();
    const navigation = useNavigation<ProfileDeleteAccountNavigationProp>();
    const [code, setCode] = useState('');
    const [codeErrorText, setCodeErrorText] = useState<string | null>(null);
    const previousCodeRef = useRef(code);

    const {mutateAsync: requestDeleteAccountMutation} = useMutation({
        mutationFn: () => apiProfile.accountDelete.request(),
    });
    const {mutateAsync: confirmDeleteAccountMutation, isPending: isConfirmPending} = useMutation({
        mutationFn: (codeValue: string) => apiProfile.accountDelete.confirm(codeValue),
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

    useEffect(() => {
        void (async () => {
            try {
                await requestDeleteAccountMutation();
            } catch {
                setCodeErrorText(t('password_change_server_error'));
            }
        })();
    }, [requestDeleteAccountMutation, t]);

    const handleResendCodePress = async () => {
        try {
            await requestDeleteAccountMutation();
            setCodeErrorText(null);
        } catch {
            setCodeErrorText(t('password_change_server_error'));
        }
    };

    const handleConfirmPress = async () => {
        if (code.length < CODE_LENGTH) {
            setCodeErrorText(t('password_change_code_required'));
            return;
        }

        setCodeErrorText(null);

        try {
            await confirmDeleteAccountMutation(code);
            showToast({variant: 'success', text: t('delete_account_success')});
            await logout();
        } catch (error) {
            if (axios.isAxiosError(error) && error.response?.status === 401) {
                setCodeErrorText(t('password_change_wrong_code'));
                return;
            }

            setCodeErrorText(t('password_change_server_error'));
        }
    };

    return (
        <StatusBarAvoidContainer backgroundColor="rgba(255, 255, 255, 1)">
            <Header title={t('delete_account_screen_title')} />
            <View style={styles.screenContent}>
                <View style={styles.content}>
                    <InfoCard
                        isDanger
                        weightText={t('delete_account_modal_attention')}
                        text={t('delete_account_modal_info')}
                        style={styles.infoCard}
                    />
                    <Text style={styles.prompt}>{t('delete_account_enter_code')}</Text>
                    <CodeEnterKeyboardInputs
                        onCodeChange={handleCodeChange}
                        onResendCodePress={() => {
                            void handleResendCodePress();
                        }}
                        errorText={codeErrorText}
                    />
                </View>
                <View style={[styles.buttonsRow, {marginBottom: insets.bottom + 16}]}>
                    <ButtonMain
                        title={t('delete_account_cancel')}
                        variant="secondary"
                        onPress={goToProfileScreen}
                        style={styles.button}
                    />
                    <ButtonMain
                        title={t('delete_account_confirm')}
                        variant="danger"
                        onPress={() => {
                            void handleConfirmPress();
                        }}
                        isLoading={isConfirmPending}
                        style={styles.button}
                    />
                </View>
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
    infoCard: {
        marginTop: 12,
        flex: undefined,
    },
    prompt: {
        marginTop: 24,
        marginBottom: 24,
        textAlign: 'center',
        color: 'rgba(29, 26, 73, 1)',
    },
    buttonsRow: {
        flexDirection: 'row',
        gap: 12,
        marginHorizontal: 12,
    },
    button: {
        flex: 1,
    },
});
