import {useCallback} from 'react';
import {StatusBar, StyleSheet, Text, View} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useTranslation} from 'react-i18next';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import i18n from '../../features/localisation/i18n';
import type {AuthStackParamList} from '../../features/navigation/auth/AuthStack';
import {ButtonMain} from '../../shared/ui/ButtonMain';
import {AuthStartHero} from '../../widgets/auth/AuthStartHero';

type StartScreenProps = NativeStackScreenProps<AuthStackParamList, 'Start'>;

export const StartScreen = ({navigation}: StartScreenProps) => {
    const {t} = useTranslation('auth', {i18n});
    const insets = useSafeAreaInsets();

    useFocusEffect(
        useCallback(() => {
            StatusBar.setBarStyle('light-content');
            return () => {
                StatusBar.setBarStyle('dark-content');
            };
        }, []),
    );

    return (
        <>
            <View style={styles.container}>
                <AuthStartHero topInset={insets.top}/>

                <View style={[styles.bottomContent, {paddingBottom: 24 + insets.bottom}]}>
                    <Text style={styles.title}>{t('start.title')}</Text>
                    <Text style={styles.subtitle}>{t('start.subtitle')}</Text>

                    <View style={styles.buttonsContainer}>
                        <ButtonMain
                            title={t('start.sign_in')}
                            onPress={() => {
                                navigation.navigate('SignIn');
                            }}
                        />
                        <Text style={styles.dividerText}>{t('start.or')}</Text>
                        <ButtonMain
                            title={t('start.create_account')}
                            variant="secondary"
                            onPress={() => {
                                navigation.navigate('SignUp');
                            }}
                        />
                    </View>
                </View>
            </View>
        </>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'rgba(255, 255, 255, 1)',
    },
    bottomContent: {
        backgroundColor: 'rgba(255, 255, 255, 1)',
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        marginTop: -28,
        paddingHorizontal: 12,
        paddingTop: 24,
        zIndex: 3,
    },
    title: {
        color: 'rgba(29, 26, 73, 1)',
        fontWeight: '700',
        fontSize: 24,
        textAlign: 'center',
    },
    subtitle: {
        marginTop: 16,
        color: 'rgba(134, 132, 168, 1)',
        fontSize: 16,
        textAlign: 'center',
    },
    buttonsContainer: {
        marginTop: 40,
    },
    dividerText: {
        marginVertical: 16,
        color: 'rgba(134, 132, 168, 1)',
        textAlign: 'center',
    },
});
