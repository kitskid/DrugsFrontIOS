import {forwardRef, useImperativeHandle, useRef} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import type {CompositeNavigationProp} from '@react-navigation/native';
import {useNavigation} from '@react-navigation/native';
import {BottomSheetModal} from '@gorhom/bottom-sheet';
import type {BottomTabNavigationProp} from '@react-navigation/bottom-tabs';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useTranslation} from 'react-i18next';

import type {AppStackParamList} from '../../../app/AppStack.tsx';
import type {TabsStackParamList} from '../../../app/TabsStack.tsx';
import i18n from '../../../features/localisation/i18n.ts';
import type {ProfileTabStackParamList} from '../../../features/navigation/tabs/ProfileTabStack.tsx';
import {ButtonMain} from '../../../shared/ui/ButtonMain.tsx';
import {InfoCard} from '../../../shared/ui/InfoCard.tsx';
import {CenterModal} from '../../../shared/ui/modals/CenterModal.tsx';

type ProfileEmailChangeModalNavigationProp = CompositeNavigationProp<
    NativeStackNavigationProp<ProfileTabStackParamList, 'ProfileScreen'>,
    CompositeNavigationProp<
        BottomTabNavigationProp<TabsStackParamList>,
        NativeStackNavigationProp<AppStackParamList>
    >
>;

export const ProfileEmailChangeModal = forwardRef<BottomSheetModal>((_, ref) => {
    const {t} = useTranslation('profile', {i18n});
    const navigation = useNavigation<ProfileEmailChangeModalNavigationProp>();
    const sheetRef = useRef<BottomSheetModal>(null);

    useImperativeHandle(ref, () => sheetRef.current as BottomSheetModal, []);

    const dismiss = () => {
        sheetRef.current?.dismiss();
    };

    const handleYesPress = () => {
        dismiss();
        navigation.navigate('Profile', {
            screen: 'ProfileEmailChangePassword',
        });
    };

    return (
        <CenterModal ref={sheetRef}>
            <View style={styles.container}>
                <Text style={styles.title}>{t('email_change_modal_title')}</Text>
                <InfoCard text={t('email_change_modal_info')} style={styles.infoCard}/>
                <View style={styles.buttonsRow}>
                    <ButtonMain
                        title={t('email_change_modal_no')}
                        variant="secondary"
                        onPress={dismiss}
                        style={styles.button}
                    />
                    <ButtonMain
                        title={t('email_change_modal_yes')}
                        onPress={handleYesPress}
                        style={styles.button}
                    />
                </View>
            </View>
        </CenterModal>
    );
});

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#fff',
        borderRadius: 24,
        paddingHorizontal: 16,
        paddingVertical: 24,
    },
    title: {
        color: 'rgba(29, 26, 73, 1)',
        fontSize: 16,
        fontWeight: '500',
        textAlign: 'center',
        marginBottom: 24,
    },
    infoCard: {
        flex: undefined,
    },
    buttonsRow: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 24,
    },
    button: {
        flex: 1,
    },
});
