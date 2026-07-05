import {useState} from 'react';
import {Image, StyleSheet, Text, View,} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import type {NativeStackNavigationProp, NativeStackScreenProps} from '@react-navigation/native-stack';
import {KeyboardAwareScrollView} from 'react-native-keyboard-aware-scroll-view';
import {useMutation} from "@tanstack/react-query";
import {PasswordInputWithCards} from "../../../shared/ui/PasswordInputWithCards.tsx";
import {ButtonMain} from "../../../shared/ui/ButtonMain.tsx";
import type {SignUpStackParamList} from '../../../features/navigation/auth/SignUpStack';
import {isPasswordValid} from "../../../shared/ui/PasswordInput.tsx";
import {apiAuth} from "../../../features/api/apiAuth.ts";
import axios from "axios";
import {useToast} from "../../../features/toasts/useToast.ts";
import type {AuthStackParamList} from "../../../features/navigation/auth/AuthStack.tsx";

type SignUpPasswordScreenProps = NativeStackScreenProps<
    SignUpStackParamList,
    'SignUpPassword'
>;

export const SignUpPasswordScreen = ({navigation}: SignUpPasswordScreenProps) => {
    const insets = useSafeAreaInsets();
    const authNavigation = navigation.getParent<NativeStackNavigationProp<AuthStackParamList>>();
    const [password, setPassword] = useState<string>('');
    const [isPasswordError, setIsPasswordError] = useState<boolean>(false);
    const {showToast} = useToast();
    const {mutateAsync: passwordAgreementMutation, isPending: isPasswordAgreementPending} = useMutation({
        mutationFn: (passwordValue: string) => apiAuth.signUp.passwordAgreement(passwordValue),
    });

    const clearErrors = () => {
        setIsPasswordError(false);
    };

    const handlePasswordChange = (value: string) => {
        setPassword(value);
        clearErrors();
    };

    const handleSubmit = async () => {
        if (password.trim().length === 0) {
            setIsPasswordError(true);
            return;
        }

        if (!isPasswordValid(password)) {
            setIsPasswordError(true);
            return;
        }

        try {
            setIsPasswordError(false);
            await passwordAgreementMutation(password);
            navigation.replace('SignUpPasswordRepeat');
        } catch (error) {
            if (axios.isAxiosError(error) && error.response?.status === 429) {
                showToast({variant: 'error', text: 'Слишком много запросов, попробуйте позже'});
                return;
            }
            setIsPasswordError(true);
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
                <Image
                    source={require('../../../../assets/images/logo.png')}
                    style={styles.logo}
                />
                <View style={[styles.content, {paddingBottom: insets.bottom}]}>
                    <Text style={styles.title}>Создайте пароль</Text>
                    <PasswordInputWithCards
                        value={password}
                        onChange={handlePasswordChange}
                        isError={isPasswordError}
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
                                    isLoading={isPasswordAgreementPending}
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
});
