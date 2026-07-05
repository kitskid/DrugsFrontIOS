import {useState} from 'react';
import {Image, StyleSheet, Text, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {KeyboardAwareScrollView} from 'react-native-keyboard-aware-scroll-view';
import type {NativeStackNavigationProp, NativeStackScreenProps} from '@react-navigation/native-stack';
import {useMutation} from '@tanstack/react-query';
import axios from 'axios';

import {ButtonMain} from '../../../shared/ui/ButtonMain.tsx';
import {PasswordInput} from '../../../shared/ui/PasswordInput.tsx';
import type {SignInStackParamList} from '../../../features/navigation/auth/SignInStack.tsx';
import type {AuthStackParamList} from '../../../features/navigation/auth/AuthStack.tsx';
import {useToast} from '../../../features/toasts/useToast.ts';
import {apiAuth} from '../../../features/api/apiAuth.ts';

type PasswordResetRepeatScreenProps = NativeStackScreenProps<
    SignInStackParamList,
    'PasswordResetRepeat'
>;

export const PasswordResetRepeatScreen = ({navigation}: PasswordResetRepeatScreenProps) => {
    const insets = useSafeAreaInsets();
    const authNavigation = navigation.getParent<NativeStackNavigationProp<AuthStackParamList>>();
    const [passwordRepeat, setPasswordRepeat] = useState('');
    const [passwordRepeatErrorText, setPasswordRepeatErrorText] = useState<string | null>(null);
    const {showToast} = useToast();
    const {mutateAsync: passwordResetForgotResetRepeatMutation, isPending: isSubmitting} = useMutation({
        mutationFn: (passwordRepeatValue: string) =>
            apiAuth.signIn.passwordResetForgotResetRepeat(passwordRepeatValue),
    });

    const handlePasswordRepeatChange = (value: string) => {
        setPasswordRepeat(value);
        if (passwordRepeatErrorText) {
            setPasswordRepeatErrorText(null);
        }
    };

    const handleSubmit = async () => {
        if (passwordRepeat.trim().length === 0) {
            setPasswordRepeatErrorText('Данное поле обязательно');
            return;
        }

        setPasswordRepeatErrorText(null);

        try {
            await passwordResetForgotResetRepeatMutation(passwordRepeat);
            navigation.replace('SignInLogin');
            showToast({variant: 'success', text: 'Пароль успешно изменен'});
        } catch (error) {
            if (axios.isAxiosError(error) && error.response?.status === 429) {
                setPasswordRepeatErrorText('Слишком много запросов, попробуйте позже');
                return;
            }

            if (axios.isAxiosError(error) && error.response?.status === 400) {
                setPasswordRepeatErrorText('Пароли не совпадают');
                return;
            }

            setPasswordRepeatErrorText('Ошибка на сервере');
        }
    };

    return (
        <KeyboardAwareScrollView
            style={styles.container}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="always"
            showsVerticalScrollIndicator={false}
            enableOnAndroid>
            <View style={styles.inner}>
                <Image source={require('../../../../assets/images/logo.png')} style={styles.logo} />
                <View style={[styles.content, {paddingBottom: insets.bottom}]}>
                    <Text style={styles.title}>Повторите пароль</Text>
                    <PasswordInput
                        value={passwordRepeat}
                        onChange={handlePasswordRepeatChange}
                        errorText={passwordRepeatErrorText}
                        autoFocus
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
                                    title={'Вернуться'}
                                    variant={'secondary'}
                                />
                            </View>
                            <View style={styles.buttonWrapper}>
                                <ButtonMain
                                    onPress={handleSubmit}
                                    title={'Далее'}
                                    isLoading={isSubmitting}
                                />
                            </View>
                        </View>
                    </View>
                </View>
            </View>
        </KeyboardAwareScrollView>
    );
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
        paddingTop: 8,
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
});
