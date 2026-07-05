import {
    forwardRef,
    useCallback,
    useEffect,
    useImperativeHandle,
    useRef,
    useState,
} from 'react';
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {BottomSheetModal} from '@gorhom/bottom-sheet';
import {useMutation, useQueryClient} from '@tanstack/react-query';
import {useTranslation} from 'react-i18next';

import {
    CALENDAR_QUERY_KEY,
    type CalendarEventStatus,
} from '../../../features/api/apiCalendar.ts';
import {
    ACTIVE_MEDICATION_PRESCRIPTIONS_QUERY_KEY,
    apiDrugs,
} from '../../../features/api/drugs/apiDrugs.ts';
import i18n from '../../../features/localisation/i18n';
import {ButtonMain} from '../ButtonMain.tsx';
import {BottomSheetMain} from '../modals/BottomSheetMain.tsx';

export type StatusChangeModalItem = {
    intakeId: string;
    prescriptionId: string | null;
    status: CalendarEventStatus;
};

type StatusChangeModalProps = {
    item: StatusChangeModalItem | null;
    showOpenProfileButton?: boolean;
    onOpenProfile?: (prescriptionId: string) => void;
    onStatusUpdated?: (status: CalendarEventStatus) => void;
};

const STATUS_OPTION_KEYS: ReadonlyArray<{
    status: CalendarEventStatus;
    labelKey: 'scheduled' | 'completed' | 'missed';
}> = [
    {status: 'SCHEDULED', labelKey: 'scheduled'},
    {status: 'COMPLETED', labelKey: 'completed'},
    {status: 'MISSED', labelKey: 'missed'},
];

export const StatusChangeModal = forwardRef<BottomSheetModal, StatusChangeModalProps>(
    ({item, showOpenProfileButton = false, onOpenProfile, onStatusUpdated}, ref) => {
        const {t} = useTranslation('calendar', {i18n});
        const sheetRef = useRef<BottomSheetModal>(null);
        const queryClient = useQueryClient();
        const [selectedStatus, setSelectedStatus] = useState<CalendarEventStatus>(
            item?.status ?? 'SCHEDULED',
        );

        useImperativeHandle(ref, () => sheetRef.current as BottomSheetModal, []);

        useEffect(() => {
            if (item) {
                setSelectedStatus(item.status);
            }
        }, [item]);

        const {mutate: updateStatus, isPending} = useMutation({
            mutationFn: (status: CalendarEventStatus) => {
                if (!item) {
                    return Promise.reject(new Error('No intake selected'));
                }

                return apiDrugs.updateMedicationIntakeStatus(item.intakeId, status);
            },
            onSuccess: (_data, status) => {
                void queryClient.invalidateQueries({queryKey: CALENDAR_QUERY_KEY});
                void queryClient.invalidateQueries({
                    queryKey: ACTIVE_MEDICATION_PRESCRIPTIONS_QUERY_KEY,
                });
                onStatusUpdated?.(status);
                sheetRef.current?.dismiss();
            },
        });

        const handleDonePress = useCallback(() => {
            updateStatus(selectedStatus);
        }, [selectedStatus, updateStatus]);

        const handleOpenProfilePress = useCallback(() => {
            const prescriptionId = item?.prescriptionId;

            if (!prescriptionId) {
                return;
            }

            sheetRef.current?.dismiss();
            onOpenProfile?.(prescriptionId);
        }, [item?.prescriptionId, onOpenProfile]);

        return (
            <BottomSheetMain ref={sheetRef} contentContainerStyle={styles.sheetContent}>
                <Text style={styles.title}>{t('statusChangeModal.title')}</Text>

                <View style={styles.statusRow}>
                    {STATUS_OPTION_KEYS.map(option => {
                        const isActive = option.status === selectedStatus;

                        return (
                            <TouchableOpacity
                                key={option.status}
                                activeOpacity={0.7}
                                onPress={() => setSelectedStatus(option.status)}
                                style={[
                                    styles.statusButton,
                                    isActive ? styles.statusButtonActive : styles.statusButtonInactive,
                                ]}>
                                <Text
                                    style={[
                                        styles.statusButtonText,
                                        isActive
                                            ? styles.statusButtonTextActive
                                            : styles.statusButtonTextInactive,
                                    ]}>
                                    {t(`intakeStatus.${option.labelKey}`)}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                <View style={styles.actions}>
                    {showOpenProfileButton ? (
                        <ButtonMain
                            title={t('statusChangeModal.openProfile')}
                            variant="outline"
                            onPress={handleOpenProfilePress}
                        />
                    ) : null}
                    <ButtonMain
                        title={t('statusChangeModal.done')}
                        onPress={handleDonePress}
                        isLoading={isPending}
                    />
                </View>
            </BottomSheetMain>
        );
    },
);

const styles = StyleSheet.create({
    sheetContent: {
        paddingHorizontal: 12
    },
    title: {
        color: 'rgba(134, 132, 168, 1)',
        marginLeft: 16
    },
    statusRow: {
        marginTop: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    statusButton: {
        padding: 16,
        borderRadius: 1000,
    },
    statusButtonActive: {
        backgroundColor: 'rgba(35, 142, 235, 1)',
    },
    statusButtonInactive: {
        backgroundColor: 'rgba(241, 240, 249, 1)',
    },
    statusButtonText: {
        textAlign: 'center',
    },
    statusButtonTextActive: {
        color: 'rgba(255, 255, 255, 1)',
    },
    statusButtonTextInactive: {
        color: 'rgba(29, 26, 73, 1)',
    },
    actions: {
        marginTop: 36,
        rowGap: 12,
    },
});
