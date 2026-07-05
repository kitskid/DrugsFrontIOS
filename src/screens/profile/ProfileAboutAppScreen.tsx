import {Image, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useTranslation} from 'react-i18next';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import i18n from '../../features/localisation/i18n.ts';
import type {ProfileStackParamList} from '../../features/navigation/ProfileStack.tsx';
import {Header} from '../../shared/ui/Header.tsx';
import {StatusBarAvoidContainer} from '../../shared/ui/StatusBarAvoidContainer.tsx';

type ProfileAboutAppScreenProps = NativeStackScreenProps<ProfileStackParamList, 'ProfileAboutApp'>;

export const ProfileAboutAppScreen = (_props: ProfileAboutAppScreenProps) => {
    const {t} = useTranslation('profile', {i18n});
    const insets = useSafeAreaInsets();

    return (
        <StatusBarAvoidContainer backgroundColor="rgba(255, 255, 255, 1)">
            <Header title={t('about_app')} />
            <View style={styles.screen}>
                <View style={styles.content}>
                    <Image
                        source={require('../../../assets/images/logoLarge.png')}
                        style={styles.logo}
                    />
                    <Text style={styles.version}>{t('about_app_version')}</Text>
                    <TouchableOpacity
                        activeOpacity={0.8}
                        style={styles.updateButton}
                        onPress={() => {}}>
                        <Text style={styles.updateButtonText}>{t('about_app_check_updates')}</Text>
                    </TouchableOpacity>
                </View>
                <Text style={[styles.copyright, {marginBottom: insets.bottom + 32}]}>
                    {t('about_app_copyright')}
                </Text>
            </View>
        </StatusBarAvoidContainer>
    );
};

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        justifyContent: 'space-between',
    },
    content: {
        alignItems: 'center',
        backgroundColor: 'rgba(247, 246, 251, 1)',
        borderRadius: 28,
        marginTop: 16,
        paddingTop: 32,
        paddingBottom: 36,
    },
    logo: {
        width: 120,
        height: 98,
    },
    version: {
        marginTop: 20,
        fontSize: 16,
        fontWeight: '500',
        color: 'rgba(134, 132, 168, 1)',
    },
    updateButton: {
        marginTop: 32,
        backgroundColor: 'rgba(35, 142, 235, 0.15)',
        borderRadius: 24,
        paddingHorizontal: 24,
        paddingVertical: 16,
    },
    updateButtonText: {
        color: 'rgba(35, 142, 235, 1)',
        fontWeight: '500',
    },
    copyright: {
        textAlign: 'center',
        fontSize: 16,
        fontWeight: '500',
        color: 'rgba(134, 132, 168, 1)',
    },
});
