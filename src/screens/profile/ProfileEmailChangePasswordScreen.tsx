import {useState} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import axios from 'axios';
import type {CompositeNavigationProp} from '@react-navigation/native';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useMutation} from '@tanstack/react-query';
import {useTranslation} from 'react-i18next';
import {KeyboardAwareScrollView} from 'react-native-keyboard-aware-scroll-view';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import type {AppStackParamList} from '../../app/AppStack.tsx';
import {apiProfile} from '../../features/api/apiProfile.ts';
import i18n from '../../features/localisation/i18n.ts';
import type {ProfileStackParamList} from '../../features/navigation/ProfileStack.tsx';
import {ButtonMain} from '../../shared/ui/ButtonMain.tsx';
import {Header} from '../../shared/ui/Header.tsx';
import {PasswordInput} from '../../shared/ui/PasswordInput.tsx';
import {StatusBarAvoidContainer} from '../../shared/ui/StatusBarAvoidContainer.tsx';

type ProfileEmailChangePasswordScreenProps = NativeStackScreenProps<
    ProfileStackParamList,
    'ProfileEmailChangePassword'
>;

type ProfileEmailChangePasswordNavigationProp = CompositeNavigationProp<
    NativeStackNavigationProp<ProfileStackParamList, 'ProfileEmailChangePassword'>,
    NativeStackNavigationProp<AppStackParamList>
>;

export const ProfileEmailChangePasswordScreen = (_props: ProfileEmailChangePasswordScreenProps) => {
    const {t} = useTranslation('profile', {i18n});
    const insets = useSafeAreaInsets();
    const navigation = useNavigation<ProfileEmailChangePasswordNavigationProp>();
    const [password, setPassword] = useState('');
    const [passwordErrorText, setPasswordErrorText] = useState<string | null>(null);

    const {mutateAsync: verifyPasswordMutation, isPending: isVerifyPasswordPending} = useMutation({
        mutationFn: (currentPassword: string) => apiProfile.emailChange.verifyPassword(currentPassword),
    });

    const goToProfileScreen = () => {
        navigation.replace('Tabs', {
            screen: 'ProfileTab',
            params: {
                screen: 'ProfileScreen',
            },
        });
    };

    const handlePasswordChange = (value: string) => {
        setPassword(value);
        if (passwordErrorText) {
            setPasswordErrorText(null);
        }
    };

    const handleNextPress = async () => {
        if (!password.trim()) {
            setPasswordErrorText(t('email_change_password_required'));
            return;
        }

        setPasswordErrorText(null);

        try {
            await verifyPasswordMutation(password);
            navigation.replace('ProfileEmailChangeNewEmail');
        } catch (error) {
            if (axios.isAxiosError(error) && error.response?.status === 401) {
                setPasswordErrorText(t('email_change_wrong_password'));
            }
        }
    };

    return (
        <StatusBarAvoidContainer backgroundColor="rgba(255, 255, 255, 1)">
            <Header
                title={t('email_change_screen_title')}
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
                        <Text style={styles.prompt}>{t('email_change_enter_password')}</Text>
                        <PasswordInput
                            value={password}
                            onChange={handlePasswordChange}
                            errorText={passwordErrorText}
                            autoFocus
                            style={styles.passwordInput}
                        />
                    </View>
                    <ButtonMain
                        title={t('email_change_next')}
                        onPress={() => {
                            void handleNextPress();
                        }}
                        isLoading={isVerifyPasswordPending}
                        style={[styles.nextButton, {marginBottom: insets.bottom + 16}]}
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
    nextButton: {
        marginHorizontal: 12,
    },
});
