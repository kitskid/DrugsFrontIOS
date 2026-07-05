import {useEffect, useRef, useState} from 'react';
import {StyleSheet, View} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {BottomSheetModal} from '@gorhom/bottom-sheet';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useTranslation} from 'react-i18next';

import i18n from '../../features/localisation/i18n';
import {formatNotificationsSummary} from '../../features/api/drugs/formatNotificationsSummary.ts';
import {DrugsCreateStackParamList} from '../../features/navigation/DrugsCreateStack';
import {useAppSelector} from '../../features/redux/hooks';
import {hasAllFormDosageValues, isRegimenConfigured} from '../../features/redux/drugsCreate/drugsCreateSlice.ts';
import {LabelValueTouchableRightChevron} from '../../shared/ui/LabelValueTouchableRightChevron.tsx';
import {DrugsCreateNameModal} from './DrugsCreateNameModal.tsx';
import {DrugsCreateNoteModal} from './DrugsCreateNoteModal.tsx';
import {SwitchLabelIconCard} from '../../shared/ui/SwitchLabelIconCard';
import {InfoCard} from '../../shared/ui/InfoCard.tsx';

type DrugsCreateInfoTabProps = {
    drugName: string;
    note: string;
    isDrugNameError?: boolean;
    isFormDosageError?: boolean;
    isRegimenError?: boolean;
    saveValidationAttempt?: number;
    isReminderEnabled: boolean;
    onReminderEnabledChange: (value: boolean) => void;
    onDrugNameErrorAnimationEnd?: () => void;
    onFormDosageErrorAnimationEnd?: () => void;
    onRegimenErrorAnimationEnd?: () => void;
    onDrugNameSave: (value: string) => void;
    onNoteSave: (value: string) => void;
    shouldOpenNameModal?: boolean;
    onNameModalShown?: () => void;
};

export const DrugsCreateInfoTab = ({
                                       drugName,
                                       note,
                                       isDrugNameError = false,
                                       isFormDosageError = false,
                                       isRegimenError = false,
                                       saveValidationAttempt = 0,
                                       isReminderEnabled,
                                       onReminderEnabledChange,
                                       onDrugNameErrorAnimationEnd,
                                       onFormDosageErrorAnimationEnd,
                                       onRegimenErrorAnimationEnd,
                                       onDrugNameSave,
                                       onNoteSave,
                                       shouldOpenNameModal = false,
                                       onNameModalShown,
                                   }: DrugsCreateInfoTabProps) => {
    const navigation = useNavigation<NativeStackNavigationProp<DrugsCreateStackParamList>>();
    const {t} = useTranslation('drugsCreate', {i18n});
    const nameBottomSheetRef = useRef<BottomSheetModal>(null);
    const noteBottomSheetRef = useRef<BottomSheetModal>(null);
    const releaseDosage = useAppSelector(state => state.drugsCreate.releaseDosage);
    const regimen = useAppSelector(state => state.drugsCreate.regimen);
    const notifications = useAppSelector(state => state.drugsCreate.notifications);
    const isRegimenFilled = isRegimenConfigured(regimen);
    const regimenTypeText = isRegimenFilled ? t(`regimen.types.${regimen.regimenType}`) : '';

    const hasFormDosageValues = hasAllFormDosageValues(releaseDosage);
    const formDosageText = hasFormDosageValues
        ? `${releaseDosage.dosageAmount.trim()} ${releaseDosage.dosageUnit.trim()}, ${releaseDosage.releaseForm.trim()}`
        : '';
    const [isRegimenWarningVisible, setIsRegimenWarningVisible] = useState(true);
    const [isFormDosageInfoVisible, setIsFormDosageInfoVisible] = useState(true);
    const notifySummaryText = formatNotificationsSummary(
        notifications,
        isReminderEnabled,
        t,
        i18n.language,
    );

    useEffect(() => {
        if (!shouldOpenNameModal) {
            return;
        }
        const timeoutId = setTimeout(() => {
            nameBottomSheetRef.current?.present();
            onNameModalShown?.();
        }, 0);
        return () => clearTimeout(timeoutId);
    }, [onNameModalShown, shouldOpenNameModal]);

    useEffect(() => {
        if (isRegimenFilled || !drugName.trim()) {
            setIsRegimenWarningVisible(true);
        }
    }, [drugName, isRegimenFilled]);

    useEffect(() => {
        if (!isRegimenFilled || hasFormDosageValues) {
            setIsFormDosageInfoVisible(true);
        }
    }, [hasFormDosageValues, isRegimenFilled]);

    const shouldShowRegimenWarning = Boolean(drugName.trim()) && !isRegimenFilled && isRegimenWarningVisible;
    const shouldShowFormDosageInfo = isRegimenFilled && !hasFormDosageValues && isFormDosageInfoVisible;

    return (
        <View style={styles.container}>
            <View style={styles.card}>
                <LabelValueTouchableRightChevron
                    placeholder={t('infoTab.drugNamePlaceholder')}
                    filledText={drugName}
                    isError={isDrugNameError}
                    errorAnimationKey={saveValidationAttempt}
                    onErrorAnimationEnd={onDrugNameErrorAnimationEnd}
                    onPress={() => {
                        nameBottomSheetRef.current?.present();
                    }}
                />
                <View style={styles.divider}/>
                <LabelValueTouchableRightChevron
                    title={t('infoTab.formDosageTitle')}
                    placeholder={t('infoTab.formDosagePlaceholder')}
                    filledText={formDosageText}
                    isError={isFormDosageError}
                    errorAnimationKey={saveValidationAttempt}
                    onErrorAnimationEnd={onFormDosageErrorAnimationEnd}
                    onPress={() => {
                        navigation.navigate('DrugsCreateFormDosageScreen');
                    }}
                />
                {shouldShowFormDosageInfo &&
                    <InfoCard
                        style={styles.infoCard}
                        text={t('infoTab.formDosageInfoMessage')}
                        onClose={() => {
                            setIsFormDosageInfoVisible(false);
                        }}
                    />
                }
                <View style={styles.divider}/>
                <LabelValueTouchableRightChevron
                    title={t('infoTab.noteTitle')}
                    placeholder={t('infoTab.notePlaceholder')}
                    filledText={note}
                    onPress={() => {
                        noteBottomSheetRef.current?.present();
                    }}
                />
            </View>
            <View style={styles.card}>
                {shouldShowRegimenWarning &&
                    <InfoCard
                        style={styles.infoCardRegimen}
                        text={t('infoTab.regimenWarningMessage')}
                        isWarning
                        onClose={() => {
                            setIsRegimenWarningVisible(false);
                        }}
                    />
                }
                <LabelValueTouchableRightChevron
                    title={t('infoTab.regimenTitle')}
                    placeholder={t('infoTab.regimenPlaceholder')}
                    filledText={regimenTypeText}
                    isError={isRegimenError}
                    errorAnimationKey={saveValidationAttempt}
                    onErrorAnimationEnd={onRegimenErrorAnimationEnd}
                    onPress={() => {
                        navigation.navigate('DrugsCreateRegimenScreen');
                    }}
                />
            </View>
            {isRegimenFilled && (
                <View style={styles.card}>
                    <SwitchLabelIconCard
                        icon="bell"
                        text={t('infoTab.reminderTitle')}
                        isActive={isReminderEnabled}
                        setIsActive={onReminderEnabledChange}
                    />
                    <View style={styles.divider}/>
                    <LabelValueTouchableRightChevron
                        title={t('infoTab.notifyParamsTitle')}
                        placeholder={t('infoTab.notifyParamsPlaceholder')}
                        filledText={notifySummaryText}
                        onPress={() => {
                            navigation.navigate('DrugsCreateNotifyScreen');
                        }}
                    />
                </View>
            )}

            <DrugsCreateNameModal
                ref={nameBottomSheetRef}
                value={drugName}
                onSave={onDrugNameSave}
            />
            <DrugsCreateNoteModal
                ref={noteBottomSheetRef}
                value={note}
                onSave={onNoteSave}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingTop: 12
    },
    card: {
        backgroundColor: 'rgba(255, 255, 255, 1)',
        borderRadius: 28,
        marginBottom: 16
    },
    divider: {
        height: 1,
        backgroundColor: 'rgba(241, 240, 249, 1)',
        marginHorizontal: 20,
    },
    infoCard: {
        marginHorizontal: 20,
        marginBottom: 16,
        flex: undefined,
    },
    infoCardRegimen: {
        flex: undefined,
        marginHorizontal: 20,
        marginTop: 20
    }
});
