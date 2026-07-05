import {useState} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type {CompositeNavigationProp} from '@react-navigation/native';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useMutation} from '@tanstack/react-query';
import {useTranslation} from 'react-i18next';
import {KeyboardAwareScrollView} from 'react-native-keyboard-aware-scroll-view';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import {triggerAuthSync} from '../../app/useAuth.ts';
import type {AppStackParamList} from '../../app/AppStack.tsx';
import {apiAuth} from '../../features/api/apiAuth.ts';
import {apiProfile} from '../../features/api/apiProfile.ts';
import {
    ME_STORAGE_KEY,
    PASSWORD_RESET_SESSION_ID_HEADER,
} from '../../features/api/index.ts';
import i18n from '../../features/localisation/i18n.ts';
import type {ProfileStackParamList} from '../../features/navigation/ProfileStack.tsx';
import {ButtonMain} from '../../shared/ui/ButtonMain.tsx';
import {Header} from '../../shared/ui/Header.tsx';
import {PasswordInput} from '../../shared/ui/PasswordInput.tsx';
import {StatusBarAvoidContainer} from '../../shared/ui/StatusBarAvoidContainer.tsx';
import {useToast} from '../../features/toasts/useToast.ts';

type ProfilePasswordChangeRepeatScreenProps = NativeStackScreenProps<
    ProfileStackParamList,
    'ProfilePasswordChangeRepeat'
>;

type ProfilePasswordChangeRepeatNavigationProp = CompositeNavigationProp<
    NativeStackNavigationProp<ProfileStackParamList, 'ProfilePasswordChangeRepeat'>,
    NativeStackNavigationProp<AppStackParamList>
>;

export const ProfilePasswordChangeRepeatScreen = (_props: ProfilePasswordChangeRepeatScreenProps) => {
    const {t} = useTranslation('profile', {i18n});
    const {showToast} = useToast();
    const insets = useSafeAreaInsets();
    const navigation = useNavigation<ProfilePasswordChangeRepeatNavigationProp>();
    const [passwordRepeat, setPasswordRepeat] = useState('');
    const [passwordRepeatErrorText, setPasswordRepeatErrorText] = useState<string | null>(null);

    const {mutateAsync: resetAuthRepeatMutation, isPending: isResetAuthRepeatPending} = useMutation({
        mutationFn: (passwordRepeatValue: string) =>
            apiProfile.passwordChange.resetAuthRepeat(passwordRepeatValue),
    });

    const goToProfileScreen = () => {
        navigation.replace('Tabs', {
            screen: 'ProfileTab',
            params: {
                screen: 'ProfileScreen',
            },
        });
    };

    const handlePasswordRepeatChange = (value: string) => {
        setPasswordRepeat(value);
        if (passwordRepeatErrorText) {
            setPasswordRepeatErrorText(null);
        }
    };

    const handleSavePress = async () => {
        if (passwordRepeat.trim().length === 0) {
            setPasswordRepeatErrorText(t('password_change_repeat_required'));
            return;
        }

        setPasswordRepeatErrorText(null);

        try {
            await resetAuthRepeatMutation(passwordRepeat);

            const meResponse = await apiAuth.me();
            const meData = meResponse.data;

            if (meData == null || typeof meData !== 'object') {
                setPasswordRepeatErrorText(t('password_change_server_error'));
                return;
            }

            await AsyncStorage.setItem(ME_STORAGE_KEY, JSON.stringify(meData));
            await AsyncStorage.removeItem(PASSWORD_RESET_SESSION_ID_HEADER);
            triggerAuthSync();
            goToProfileScreen();
            showToast({variant: 'success', text: t('password_change_success')});
        } catch (error) {
            if (axios.isAxiosError(error) && error.response?.status === 429) {
                setPasswordRepeatErrorText(t('password_change_too_many_requests'));
                return;
            }

            if (axios.isAxiosError(error) && error.response?.status === 400) {
                setPasswordRepeatErrorText(t('password_change_password_mismatch'));
                return;
            }

            setPasswordRepeatErrorText(t('password_change_server_error'));
        }
    };

    return (
        <StatusBarAvoidContainer backgroundColor="rgba(255, 255, 255, 1)">
            <Header
                title={t('password_change_screen_title')}
                rightIcon="x"
                onRightIconPress={goToProfileScreen}
            />
            <KeyboardAwareScrollView
                style={styles.scroll}
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="always"
                showsVerticalScrollIndicator={false}
                enableOnAndroid>
                <View style={styles.inner}>
                    <View style={styles.content}>
                        <Text style={styles.prompt}>{t('password_change_repeat_new_password')}</Text>
                        <PasswordInput
                            value={passwordRepeat}
                            onChange={handlePasswordRepeatChange}
                            errorText={passwordRepeatErrorText}
                            autoFocus
                            style={styles.passwordInput}
                        />
                    </View>
                    <ButtonMain
                        title={t('password_change_save_new_password')}
                        onPress={() => {
                            void handleSavePress();
                        }}
                        isLoading={isResetAuthRepeatPending}
                        style={[styles.saveButton, {marginBottom: insets.bottom + 16}]}
                    />
                </View>
            </KeyboardAwareScrollView>
        </StatusBarAvoidContainer>
    );
};

const styles = StyleSheet.create({
    scroll: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
    },
    inner: {
        flex: 1,
        justifyContent: 'space-between',
    },
    content: {
        paddingHorizontal: 12,
    },
    prompt: {
        marginTop: 28,
        textAlign: 'center',
        color: 'rgba(29, 26, 73, 1)',
    },
    passwordInput: {
        marginTop: 24,
    },
    saveButton: {
        marginHorizontal: 12,
    },
});
