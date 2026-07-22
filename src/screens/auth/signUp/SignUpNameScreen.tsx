import {Image, StyleSheet, Text, View} from 'react-native';
import {KeyboardAwareScrollView} from "react-native-keyboard-aware-scroll-view";
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {ButtonMain} from "../../../shared/ui/ButtonMain.tsx";
import type {NativeStackScreenProps} from "@react-navigation/native-stack";
import type {SignUpStackParamList} from "../../../features/navigation/auth/SignUpStack.tsx";
import {InputMain} from "../../../shared/ui/InputMain.tsx";
import {useState} from "react";
import {useMutation} from "@tanstack/react-query";
import {useTranslation} from "react-i18next";
import {IconMapper} from "../../../shared/ui/IconMapper.tsx";
import {apiAuth} from "../../../features/api/apiAuth.ts";
import i18n from "../../../features/localisation/i18n.ts";
import {triggerAuthSyncWithWelcome} from "../../../app/useAuth.ts";

type SignUpNameScreenProps = NativeStackScreenProps<
    SignUpStackParamList,
    'SignUpName'
>;

export const SignUpNameScreen = (_props: SignUpNameScreenProps) => {
    const {t} = useTranslation('auth', {i18n});
    const insets = useSafeAreaInsets();
    const [name, setName] = useState<string>('')
    const [nameErrorText, setNameErrorText] = useState<string | null>(null);
    const {mutateAsync: updateNameMutation, isPending: isUpdateNamePending} = useMutation({
        mutationFn: (name: string) => apiAuth.signUp.updateName(name),
    });

    const handleNameChange = (value: string) => {
        setName(value);
        if (nameErrorText && value.trim().length > 0) {
            setNameErrorText(null);
        }
    };

    const handleSavePress = async () => {
        const trimmedName = name.trim();

        if (trimmedName.length === 0) {
            setNameErrorText(t('sign_up.name_required'));
            return;
        }

        setNameErrorText(null);

        try {
            await updateNameMutation(trimmedName);
            triggerAuthSyncWithWelcome();
        } catch {
            setNameErrorText(t('common.server_error'));
        }
    };

    const handleSkipPress = () => {
        triggerAuthSyncWithWelcome();
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
                    <Text style={styles.title}>{t('sign_up.name_title')}</Text>
                    <InputMain
                        icon={'circle-user'}
                        value={name}
                        onChange={handleNameChange}
                        errorText={nameErrorText}
                        autoFocus={true}
                    />
                    <View style={styles.infoCard}>
                        <IconMapper icon="info" size={24} weight={1.5} color="rgba(35, 142, 235, 1)"/>
                        <Text style={styles.infoText}>{t('sign_up.name_info')}</Text>
                    </View>
                    <View style={styles.footer}>
                        <View style={styles.buttonsContainer}>
                            <ButtonMain
                                onPress={handleSavePress}
                                title={t('sign_up.save')}
                                isLoading={isUpdateNamePending}
                            />
                            <ButtonMain
                                onPress={handleSkipPress}
                                title={t('sign_up.skip')}
                                variant={'secondary'}
                            />
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
        marginTop: 20,
        borderRadius: 24,
        backgroundColor: 'rgba(35, 142, 235, 0.1)',
        padding: 12,
        flexDirection: 'row',
    },
    infoText: {
        marginLeft: 8,
        color: 'rgba(29, 26, 73, 1)',
    },
    footer: {
        marginTop: 'auto',
        paddingBottom: 16,
        paddingTop: 8
    },
    buttonsContainer: {
        gap: 12
    },
})
