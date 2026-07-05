import {Image, StyleSheet, Text, View} from 'react-native';
import {KeyboardAwareScrollView} from "react-native-keyboard-aware-scroll-view";
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {ButtonMain} from "../../../shared/ui/ButtonMain.tsx";
import type {NativeStackScreenProps} from "@react-navigation/native-stack";
import type {SignUpStackParamList} from "../../../features/navigation/auth/SignUpStack.tsx";
import {InputMain} from "../../../shared/ui/InputMain.tsx";
import {useState} from "react";
import {IconMapper} from "../../../shared/ui/IconMapper.tsx";
import {useMutation} from "@tanstack/react-query";
import {apiAuth} from "../../../features/api/apiAuth.ts";
import axios from "axios";
import {Checkbox} from "../../../shared/ui/Checkbox.tsx";
import {TouchableTextIsIcon} from "../../../shared/ui/TouchableTextIsIcon.tsx";
import Animated, {FadeIn} from "react-native-reanimated";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {SESSION_ID_HEADER} from "../../../features/api/index.ts";
import type {AuthStackParamList} from "../../../features/navigation/auth/AuthStack.tsx";
import type {NativeStackNavigationProp} from "@react-navigation/native-stack";

type SignUpEmailEnteringScreenProps = NativeStackScreenProps<
    SignUpStackParamList,
    'SignUpEmailEntering'
>;

export const SignUpEmailEnteringScreen = ({navigation}: SignUpEmailEnteringScreenProps) => {
    const insets = useSafeAreaInsets();
    const authNavigation = navigation.getParent<NativeStackNavigationProp<AuthStackParamList>>();
    const [email, setEmail] = useState<string>('')
    const [emailErrorText, setEmailErrorText] = useState<string | null>(null);
    const [isAgreementError, setIsAgreementError] = useState<boolean>(false);
    const [isChecked, setIsChecked] = useState<boolean>(false);
    const {mutateAsync: addEmailMutation, isPending: isAddEmailPending} = useMutation({
        mutationFn: ({email, acceptedUserAgreement}: { email: string; acceptedUserAgreement: boolean }) =>
            apiAuth.signUp.addEmail(email, acceptedUserAgreement),
    });

    const handleEmailChange = (value: string) => {
        setEmail(value);
        if (emailErrorText !== null) {
            setEmailErrorText(null);
        }
    };

    const handleCheckboxChange = (value: boolean) => {
        setIsChecked(value);
        if (isAgreementError) {
            setIsAgreementError(false);
        }
    };

    const handleSubmit = async () => {
        const normalizedEmail = email.trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        let hasError = false;

        if (!emailRegex.test(normalizedEmail)) {
            setEmailErrorText('Неверный формат E-mail');
            hasError = true;
        } else {
            setEmailErrorText(null);
        }

        if (!isChecked) {
            setIsAgreementError(true);
            hasError = true;
        } else {
            setIsAgreementError(false);
        }

        if (hasError) {
            return;
        }

        try {
            await AsyncStorage.removeItem(SESSION_ID_HEADER);
            const response = await addEmailMutation({
                email: normalizedEmail,
                acceptedUserAgreement: isChecked,
            });
            const headers = response.headers;
            const sessionIdFromGet =
                headers && typeof headers === 'object' && 'get' in headers && typeof headers.get === 'function'
                    ? headers.get(SESSION_ID_HEADER)
                    : undefined;
            const sessionIdRaw =
                sessionIdFromGet ??
                (headers as Record<string, unknown> | undefined)?.[SESSION_ID_HEADER] ??
                (headers as Record<string, unknown> | undefined)?.[SESSION_ID_HEADER.toLowerCase()];

            const sessionId = Array.isArray(sessionIdRaw)
                ? sessionIdRaw[0]
                : typeof sessionIdRaw === 'string'
                    ? sessionIdRaw
                    : null;

            if (typeof sessionId !== 'string' || sessionId.trim().length === 0) {
                setEmailErrorText('Ошибка на сервере');
                return;
            }

            await AsyncStorage.setItem(SESSION_ID_HEADER, sessionId.trim());
            navigation.replace('SignUpEmailConfirm');
        } catch (error) {
            if (axios.isAxiosError(error) && error.response?.status === 400) {
                setEmailErrorText('Неверный формат E-mail');
                return;
            }
            if (axios.isAxiosError(error) && error.response?.status === 409) {
                setEmailErrorText('E-mail уже занят');
                return;
            }

            setEmailErrorText('Ошибка на сервере');
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
                    <Text style={styles.title}>Введите E-mail</Text>
                    <InputMain
                        icon={'mail'}
                        value={email}
                        onChange={handleEmailChange}
                        errorText={emailErrorText}
                        autoFocus
                    />
                    <View style={styles.infoCard}>
                        <IconMapper icon={'info'} size={24} weight={1.5} color={'rgba(35, 142, 235, 1)'}/>
                        <Text style={styles.infoCardText}>
                            На указанный E-mail будет отправлен код подтверждения.{'\n\n'}
                            Убедитесь, что адрес введен правильно.{'\n'}
                            Проверьте папку "Спам", если письмо не пришло.
                        </Text>
                    </View>
                    <View style={styles.footer}>
                        <View style={styles.agreementContainer}>
                            <View
                                style={[
                                    styles.checkboxContainer,
                                    isAgreementError && styles.checkboxContainerWithError,
                                ]}>
                                <Checkbox
                                    style={[
                                        styles.checkbox,
                                        isAgreementError && styles.checkboxWithError,
                                    ]}
                                    isChecked={isChecked}
                                    setIsChecked={handleCheckboxChange}
                                    isError={isAgreementError}
                                />
                                <View style={styles.agreementTextContainer}>
                                    <View style={styles.agreementRow}>
                                        <Text>Принимаю </Text>
                                        <TouchableTextIsIcon text={'пользовательское соглашение'} onPress={() => {
                                        }}/>
                                    </View>

                                    {isAgreementError ? (
                                        <Animated.Text
                                            entering={FadeIn.duration(180)}
                                            style={styles.checkboxErrorText}>
                                            Необходимо принять пользовательское соглашение
                                        </Animated.Text>
                                    ) : null}
                                </View>
                            </View>
                        </View>
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
                                    title={'Отправить код'}
                                    isLoading={isAddEmailPending}
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
    infoCard: {
        marginTop: 8,
        backgroundColor: 'rgba(35, 142, 235, 0.1)',
        borderRadius: 16,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    infoCardText: {
        marginLeft: 14,
        color: 'rgba(29, 26, 73, 1)',
        flex: 1,
    },
    footer: {
        marginTop: 'auto',
        paddingBottom: 16,
        paddingTop: 8
    },
    agreementContainer: {
        marginBottom: 24,
    },
    checkboxContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    checkboxContainerWithError: {
        alignItems: 'flex-start',
    },
    checkbox: {
        marginHorizontal: 12,
    },
    checkboxWithError: {
        marginTop: 2,
    },
    agreementTextContainer: {
        flexShrink: 1,
    },
    agreementRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    checkboxErrorText: {
        marginTop: 4,
        color: 'rgba(245, 33, 33, 1)',
        fontSize: 12,
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
