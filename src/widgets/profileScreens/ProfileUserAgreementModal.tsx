import {forwardRef, useImperativeHandle, useRef} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {BottomSheetModal} from '@gorhom/bottom-sheet';

import {ButtonMain} from '../../shared/ui/ButtonMain.tsx';
import {InfoCard} from '../../shared/ui/InfoCard.tsx';
import {BottomSheetMain} from '../../shared/ui/modals/BottomSheetMain.tsx';

const DANGER_WEIGHT_TEXT = 'Приложение перестанет работать при отзыве согласия!';
const DANGER_TEXT = 'Вы точно хотите отозвать согласие?';

export const ProfileUserAgreementModal = forwardRef<BottomSheetModal>((_, ref) => {
    const sheetRef = useRef<BottomSheetModal>(null);

    useImperativeHandle(ref, () => sheetRef.current as BottomSheetModal, []);

    const dismiss = () => {
        sheetRef.current?.dismiss();
    };

    return (
        <BottomSheetMain ref={sheetRef}>
            <View style={styles.content}>
                <Text style={styles.title}>Отзыв согласия</Text>
                <Text style={styles.attention}>Внимание!</Text>
                <InfoCard
                    isDanger
                    weightText={DANGER_WEIGHT_TEXT}
                    text={DANGER_TEXT}
                    style={styles.infoCard}
                />
                <View style={styles.buttonsRow}>
                    <ButtonMain
                        title="Нет, вернуться"
                        variant="secondary"
                        onPress={dismiss}
                        style={styles.button}
                    />
                    <ButtonMain
                        title="Да, отозвать"
                        variant="danger"
                        onPress={() => {
                        }}
                        style={styles.button}
                    />
                </View>
            </View>
        </BottomSheetMain>
    );
});

const styles = StyleSheet.create({
    content: {
        paddingTop: 12,
    },
    title: {
        textAlign: 'center',
        fontSize: 18,
        fontWeight: '500',
        color: 'rgba(29, 26, 73, 1)',
        marginBottom: 24,
    },
    attention: {
        textAlign: 'center',
        color: 'rgba(255, 102, 102, 1)',
        marginBottom: 24,
        fontWeight: 700,
        fontSize: 24
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
