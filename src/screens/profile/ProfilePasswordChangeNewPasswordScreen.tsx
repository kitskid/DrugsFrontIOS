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
import {isPasswordValid} from '../../shared/ui/PasswordInput.tsx';
import {PasswordInputWithCards} from '../../shared/ui/PasswordInputWithCards.tsx';
import {StatusBarAvoidContainer} from '../../shared/ui/StatusBarAvoidContainer.tsx';

type ProfilePasswordChangeNewPasswordScreenProps = NativeStackScreenProps<
    ProfileStackParamList,
    'ProfilePasswordChangeNewPassword'
>;

type ProfilePasswordChangeNewPasswordNavigationProp = CompositeNavigationProp<
    NativeStackNavigationProp<ProfileStackParamList, 'ProfilePasswordChangeNewPassword'>,
    NativeStackNavigationProp<AppStackParamList>
>;

export const ProfilePasswordChangeNewPasswordScreen = (
    _props: ProfilePasswordChangeNewPasswordScreenProps,
) => {
    const {t} = useTranslation('profile', {i18n});
    const insets = useSafeAreaInsets();
    const navigation = useNavigation<ProfilePasswordChangeNewPasswordNavigationProp>();
    const [password, setPassword] = useState('');
    const [isPasswordError, setIsPasswordError] = useState(false);

    const {mutateAsync: resetAuthMutation, isPending: isResetAuthPending} = useMutation({
        mutationFn: (passwordValue: string) => apiProfile.passwordChange.resetAuth(passwordValue),
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
        if (isPasswordError) {
            setIsPasswordError(false);
        }
    };

    const handleNextPress = async () => {
        if (password.trim().length === 0 || !isPasswordValid(password)) {
            setIsPasswordError(true);
            return;
        }

        setIsPasswordError(false);

        try {
            await resetAuthMutation(password);
            navigation.replace('ProfilePasswordChangeRepeat');
        } catch (error) {
            if (axios.isAxiosError(error) && error.response?.status === 429) {
                setIsPasswordError(true);
                return;
            }

            setIsPasswordError(true);
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
                        <Text style={styles.prompt}>{t('password_change_enter_new_password')}</Text>
                        <View style={styles.passwordInput}>
                            <PasswordInputWithCards
                                value={password}
                                onChange={handlePasswordChange}
                                isError={isPasswordError}
                                autoFocus
                            />
                        </View>
                    </View>
                    <ButtonMain
                        title={t('email_change_next')}
                        onPress={() => {
                            void handleNextPress();
                        }}
                        isLoading={isResetAuthPending}
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
