import {useCallback, useRef, useState} from 'react';
import {ScrollView, StyleSheet, View} from 'react-native';
import {
    isSilenceModeEnabled,
    setPushNotificationsEnabled,
    setSilenceModeEnabled,
    usePushNotificationSettingsSync
} from '../../app/useFCMTokenRegistration.ts';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type {CompositeNavigationProp} from '@react-navigation/native';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import type {BottomTabNavigationProp} from '@react-navigation/bottom-tabs';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useTranslation} from 'react-i18next';

import {BottomSheetModal} from '@gorhom/bottom-sheet';

import type {AppStackParamList} from '../../app/AppStack.tsx';
import type {TabsStackParamList} from '../../app/TabsStack.tsx';
import {ME_STORAGE_KEY} from '../../features/api/index.ts';
import {useMealScheduleQuery} from '../../features/api/meals/useMealScheduleQuery.ts';
import type {ProfileTabStackParamList} from '../../features/navigation/tabs/ProfileTabStack.tsx';
import i18n from '../../features/localisation/i18n.ts';
import {LabelValueTouchableRightChevron} from '../../shared/ui/LabelValueTouchableRightChevron.tsx';
import {StatusBarAvoidContainer} from '../../shared/ui/StatusBarAvoidContainer.tsx';
import {ProfileLanguageChandeCard} from '../../widgets/profileScreens/ProfileLanguageChandeCard.tsx';
import {ProfileEmailChangeModal} from '../../widgets/profileScreens/ProfileEmailChangeModal.tsx';
import {ProfileDeleteAccountModal} from '../../widgets/profileScreens/ProfileDeleteAccountModal.tsx';
import {ProfileLogoutModal} from '../../widgets/profileScreens/ProfileLogoutModal.tsx';
import {ProfileNameChangeModal} from '../../widgets/profileScreens/ProfileNameChangeModal.tsx';
import {ProfilePasswordChangeModal} from '../../widgets/profileScreens/ProfilePasswordChangeModal.tsx';
import {ProfileMealsCard} from '../../widgets/profileScreens/ProfileMealsCard.tsx';
import {SkeletonProfileMealCard} from '../../widgets/profileScreens/meals/SkeletonProfileMealCard.tsx';
import {ProfileStorageCard} from '../../widgets/profileScreens/ProfileStorageCard.tsx';
import {SwitchLabelIconCard} from '../../shared/ui/SwitchLabelIconCard.tsx';
import {TouchableLeftIconTextIsChevron} from '../../shared/ui/TouchableLeftIconTextIsChevron.tsx';
import {TouchableTextIsIcon} from "../../shared/ui/TouchableTextIsIcon.tsx";

type ProfileScreenNavigationProp = CompositeNavigationProp<
    NativeStackNavigationProp<ProfileTabStackParamList, 'ProfileScreen'>,
    CompositeNavigationProp<
        BottomTabNavigationProp<TabsStackParamList>,
        NativeStackNavigationProp<AppStackParamList>
    >
>;

export const ProfileScreen = () => {
    const {t} = useTranslation('profile', {i18n});
    const navigation = useNavigation<ProfileScreenNavigationProp>();
    const [name, setName] = useState<string | null>(null);
    const [email, setEmail] = useState<string | null>(null);
    const [isSilenceMode, setIsSilenceMode] = useState<boolean>(false);
    const [isNotify, setIsNotify] = useState<boolean>(false);
    const logoutModalRef = useRef<BottomSheetModal>(null);
    const deleteAccountModalRef = useRef<BottomSheetModal>(null);
    const nameModalRef = useRef<BottomSheetModal>(null);
    const emailModalRef = useRef<BottomSheetModal>(null);
    const passwordModalRef = useRef<BottomSheetModal>(null);
    const {isPending: isMealSchedulePending, refetch: refetchMealSchedule} = useMealScheduleQuery();

    const loadProfileData = useCallback(async () => {
        const raw = await AsyncStorage.getItem(ME_STORAGE_KEY);
        if (!raw) {
            return;
        }
        const me = JSON.parse(raw);
        setName(me.name || null);
        setEmail(me.email);
    }, []);

    const handlePushStateChange = useCallback((pushEnabled: boolean) => {
        setIsNotify(pushEnabled);
    }, []);

    usePushNotificationSettingsSync(handlePushStateChange);

    const loadSilenceModeSetting = useCallback(async () => {
        setIsSilenceMode(await isSilenceModeEnabled());
    }, []);

    const handleSilenceModeToggle = useCallback((enabled: boolean) => {
        setIsSilenceMode(enabled);
        void setSilenceModeEnabled(enabled);
    }, []);

    const handlePushNotificationsToggle = useCallback((enabled: boolean) => {
        setIsNotify(enabled);
        void (async () => {
            const success = await setPushNotificationsEnabled(enabled);
            if (!success) {
                setIsNotify(false);
            }
        })();
    }, []);

    useFocusEffect(
        useCallback(() => {
            void loadProfileData();
            void loadSilenceModeSetting();
            void refetchMealSchedule();
        }, [loadProfileData, loadSilenceModeSetting, refetchMealSchedule]),
    );

    return (
        <StatusBarAvoidContainer backgroundColor="rgba(247, 246, 251, 1)">
            <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}>
                <View style={styles.card}>
                    <LabelValueTouchableRightChevron
                        title={t('name_label')}
                        placeholder={t('name_placeholder')}
                        filledText={name ?? undefined}
                        onPress={() => {
                            nameModalRef.current?.present();
                        }}
                    />
                    <View style={styles.divider}/>
                    <LabelValueTouchableRightChevron
                        title={t('email_label')}
                        filledText={email ?? undefined}
                        onPress={() => {
                            emailModalRef.current?.present();
                        }}
                    />
                </View>
                <ProfileStorageCard/>
                {isMealSchedulePending ? <SkeletonProfileMealCard /> : <ProfileMealsCard />}
                <View style={styles.card}>
                    <SwitchLabelIconCard
                        icon="moon"
                        text={t('silence_mode')}
                        isActive={isSilenceMode}
                        setIsActive={handleSilenceModeToggle}
                    />
                    <View style={styles.divider}/>
                    <SwitchLabelIconCard
                        icon="bell"
                        text={t('push_notifications')}
                        isActive={isNotify}
                        setIsActive={handlePushNotificationsToggle}
                    />
                </View>
                <View style={styles.card}>
                    <TouchableLeftIconTextIsChevron
                        icon="lock-keyhole"
                        text={t('password')}
                        onPress={() => {
                            passwordModalRef.current?.present();
                        }}
                    />
                    <View style={styles.divider}/>
                    <TouchableLeftIconTextIsChevron
                        icon="file-text"
                        text={t('user_agreement')}
                        onPress={() => {
                            navigation.navigate('Profile', {
                                screen: 'ProfileUserAgreement',
                            });
                        }}
                    />
                    <View style={styles.divider}/>
                    <TouchableLeftIconTextIsChevron
                        icon="info"
                        text={t('about_app')}
                        onPress={() => {
                            navigation.navigate('Profile', {
                                screen: 'ProfileAboutApp',
                            });
                        }}
                    />
                </View>
                <ProfileLanguageChandeCard text={t('language_label')}/>
                <View style={styles.card}>
                    <TouchableLeftIconTextIsChevron
                        icon="log-out"
                        text={t('logout')}
                        onPress={() => {
                            logoutModalRef.current?.present();
                        }}
                        isChevron={false}
                    />
                </View>
                <TouchableTextIsIcon
                    text={t('delete_account')}
                    icon="trash-2"
                    textColor="rgba(255, 102, 102, 1)"
                    onPress={() => {
                        deleteAccountModalRef.current?.present();
                    }}
                    styleContainer={styles.deleteButton}
                />
            </ScrollView>

            <ProfileNameChangeModal
                ref={nameModalRef}
                initialName={name}
                onNameSaved={setName}
            />
            <ProfileEmailChangeModal ref={emailModalRef} />
            <ProfilePasswordChangeModal ref={passwordModalRef} />
            <ProfileLogoutModal ref={logoutModalRef} />
            <ProfileDeleteAccountModal ref={deleteAccountModalRef} />
        </StatusBarAvoidContainer>
    );
};

const styles = StyleSheet.create({
    scroll: {
        flex: 1,
    },
    scrollContent: {
        paddingVertical: 12,
        paddingBottom: 12,
    },
    card: {
        backgroundColor: 'rgba(255, 255, 255, 1)',
        borderRadius: 28,
        marginBottom: 16,
    },
    divider: {
        height: 1,
        backgroundColor: 'rgba(241, 240, 249, 1)',
        marginHorizontal: 20,
    },
    deleteButton: {
        marginHorizontal: 'auto',
        marginVertical: 16,
    },
});
