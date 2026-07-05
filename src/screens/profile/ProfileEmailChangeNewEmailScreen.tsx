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
import {InfoCard} from '../../shared/ui/InfoCard.tsx';
import {InputMain} from '../../shared/ui/InputMain.tsx';
import {StatusBarAvoidContainer} from '../../shared/ui/StatusBarAvoidContainer.tsx';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type ProfileEmailChangeNewEmailScreenProps = NativeStackScreenProps<
    ProfileStackParamList,
    'ProfileEmailChangeNewEmail'
>;

type ProfileEmailChangeNewEmailNavigationProp = CompositeNavigationProp<
    NativeStackNavigationProp<ProfileStackParamList, 'ProfileEmailChangeNewEmail'>,
    NativeStackNavigationProp<AppStackParamList>
>;

export const ProfileEmailChangeNewEmailScreen = (_props: ProfileEmailChangeNewEmailScreenProps) => {
    const {t} = useTranslation('profile', {i18n});
    const insets = useSafeAreaInsets();
    const navigation = useNavigation<ProfileEmailChangeNewEmailNavigationProp>();
    const [email, setEmail] = useState('');
    const [emailErrorText, setEmailErrorText] = useState<string | null>(null);

    const {mutateAsync: requestEmailChangeMutation, isPending: isRequestPending} = useMutation({
        mutationFn: (newEmail: string) => apiProfile.emailChange.request(newEmail),
    });

    const goToProfileScreen = () => {
        navigation.replace('Tabs', {
            screen: 'ProfileTab',
            params: {
                screen: 'ProfileScreen',
            },
        });
    };

    const handleEmailChange = (value: string) => {
        setEmail(value);
        if (emailErrorText) {
            setEmailErrorText(null);
        }
    };

    const handleNextPress = async () => {
        const normalizedEmail = email.trim();

        if (!normalizedEmail) {
            setEmailErrorText(t('email_change_email_required'));
            return;
        }

        if (!EMAIL_REGEX.test(normalizedEmail)) {
            setEmailErrorText(t('email_change_invalid_email'));
            return;
        }

        setEmailErrorText(null);

        try {
            await requestEmailChangeMutation(normalizedEmail);
            navigation.replace('ProfileEmailChangeConfirm');
        } catch (error) {
            if (axios.isAxiosError(error) && error.response?.status === 400) {
                setEmailErrorText(t('email_change_invalid_email'));
                return;
            }

            if (axios.isAxiosError(error) && error.response?.status === 409) {
                setEmailErrorText(t('email_change_email_taken'));
                return;
            }

            setEmailErrorText(t('email_change_server_error'));
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
                        <Text style={styles.prompt}>{t('email_change_enter_new_email')}</Text>
                        <InputMain
                            icon="mail"
                            value={email}
                            onChange={handleEmailChange}
                            errorText={emailErrorText}
                            autoFocus
                            style={styles.emailInput}
                        />
                        <InfoCard text={t('email_change_new_email_info')} style={styles.infoCard} />
                    </View>
                    <ButtonMain
                        title={t('email_change_next')}
                        onPress={() => {
                            void handleNextPress();
                        }}
                        isLoading={isRequestPending}
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
    emailInput: {
        marginTop: 24,
    },
    infoCard: {
        marginTop: 8,
        flex: undefined,
    },
    nextButton: {
        marginHorizontal: 12,
    },
});
