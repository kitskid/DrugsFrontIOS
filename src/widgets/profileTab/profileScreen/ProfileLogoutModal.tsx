import {forwardRef, useImperativeHandle, useRef} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {BottomSheetModal} from '@gorhom/bottom-sheet';
import {useTranslation} from 'react-i18next';

import {logout} from '../../../app/useAuth.ts';
import i18n from '../../../features/localisation/i18n.ts';
import {ButtonMain} from '../../../shared/ui/ButtonMain.tsx';
import {CenterModal} from '../../../shared/ui/modals/CenterModal.tsx';
import {InfoCard} from '../../../shared/ui/InfoCard.tsx';

export const ProfileLogoutModal = forwardRef<BottomSheetModal>((_, ref) => {
    const {t} = useTranslation('profile', {i18n});
    const sheetRef = useRef<BottomSheetModal>(null);

    useImperativeHandle(ref, () => sheetRef.current as BottomSheetModal, []);

    const dismiss = () => {
        sheetRef.current?.dismiss();
    };

    const handleLogoutPress = () => {
        dismiss();
        void logout();
    };

    return (
        <CenterModal ref={sheetRef}>
            <View style={styles.container}>
                <Text style={styles.title}>{t('logout_modal_title')}</Text>
                <InfoCard text={t('logout_modal_info')} style={styles.infoCard}/>
                <View style={styles.buttonsRow}>
                    <ButtonMain
                        title={t('logout_modal_no')}
                        variant="secondary"
                        onPress={dismiss}
                        style={styles.button}
                    />
                    <ButtonMain
                        title={t('logout_modal_yes')}
                        onPress={handleLogoutPress}
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
        paddingVertical: 24
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
