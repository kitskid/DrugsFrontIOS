import {useRef} from 'react';
import {Pressable, ScrollView, StyleSheet, Text, View} from 'react-native';
import {BottomSheetModal} from '@gorhom/bottom-sheet';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useTranslation} from 'react-i18next';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import i18n from '../../features/localisation/i18n.ts';
import type {ProfileStackParamList} from '../../features/navigation/ProfileStack.tsx';
import {Header} from '../../shared/ui/Header.tsx';
import {InfoCard} from '../../shared/ui/InfoCard.tsx';
import {StatusBarAvoidContainer} from '../../shared/ui/StatusBarAvoidContainer.tsx';
import {TouchableTextIsIcon} from '../../shared/ui/TouchableTextIsIcon.tsx';
import {ProfileUserAgreementModal} from '../../widgets/profileScreens/ProfileUserAgreementModal.tsx';

const TOC_ITEMS = [
    '1. Overview',
    '2. Information We Collect',
    '3. How We Use Information',
    '4. Data Storage',
    '5. Data Sharing',
    '6. Data Protection',
    '7. User Rights',
    '8. Children\'s Privacy',
    '9. Medical Disclaimer',
    '10. Changes to This Privacy Policy',
    '11. Contact',
] as const;

const AGREEMENT_INTRO = [
    'Pills Tracker ("the App") is owned and operated by:',
    'LLC "Neoproxima"',
    'Identification number: 400469587',
    'Legal address: Georgia, Tbilisi, Gldani district, Niko Ketskhoveli street 16, floor 10, apartment 58, 0167',
    'Contact email: hello@neoproxima.pro',
];

const AGREEMENT_SECTIONS: { title: string; paragraphs: string[] }[] = [
    {
        title: '1. Overview',
        paragraphs: [
            'Pills Tracker is designed to help users manage medication intake, create schedules, receive reminders, and keep health-related notes for personal use.',
            'By using the App, you agree to this Privacy Policy.',
        ],
    },
    {
        title: '2. Information We Collect',
        paragraphs: [
            'Depending on how you use the App, we may collect and process:',
            'account information, such as name, email address, and login details;',
            'health-related information entered by the user, such as medication names, dosage schedules, intake times, meal-related instructions, reminders, and notes;',
            'technical information, such as device type, app version, operating system, and diagnostic data;',
            'notification-related data required to send reminders and service notifications.',
        ],
    },
    {
        title: '3. How We Use Information',
        paragraphs: [
            'We use information only to:',
            'provide and maintain the App\'s functionality;',
            'create and manage medication reminders and schedules;',
            'store and display user-entered health-related information;',
            'improve the stability, security, and performance of the App;',
            'provide support and respond to user requests.',
        ],
    },
    {
        title: '4. Data Storage',
        paragraphs: [
            'Personal and health-related data may be stored and processed on the user\'s device and on secure servers used for the operation of the App.',
        ],
    },
    {
        title: '5. Data Sharing',
        paragraphs: [
            'We do not sell, rent, or transfer personal data to third parties.',
            'We may disclose information only if required by applicable law or a lawful request from a competent authority.',
        ],
    },
    {
        title: '6. Data Protection',
        paragraphs: [
            'We take reasonable technical and organizational measures to protect personal data against unauthorized access, loss, misuse, alteration, or disclosure.',
        ],
    },
    {
        title: '7. User Rights',
        paragraphs: [
            'Users may request access to, correction of, or deletion of their personal data, as well as withdraw consent to data processing where applicable.',
            'To make such a request, please contact: hello@neoproxima.pro',
        ],
    },
    {
        title: '8. Children\'s Privacy',
        paragraphs: [
            'The App does not have a specific age restriction. Where required by applicable law, use of the App by children must be supervised or authorized by a parent or legal guardian.',
            'If we become aware that personal data was collected in violation of applicable law, we will take reasonable steps to delete it.',
        ],
    },
    {
        title: '9. Medical Disclaimer',
        paragraphs: [
            'Pills Tracker is not a medical provider and does not replace professional medical advice, diagnosis, or treatment.',
            'The App is intended only as a tool for organizing medication intake and reminders. Users are responsible for following the advice of their healthcare professionals.',
        ],
    },
    {
        title: '10. Changes to This Privacy Policy',
        paragraphs: [
            'We may update this Privacy Policy from time to time. The updated version will become effective once published in the App or otherwise made available to users.',
        ],
    },
    {
        title: '11. Contact',
        paragraphs: [
            'If you have any questions about this Privacy Policy, please contact:',
            'hello@neoproxima.pro',
        ],
    },
];

const AGREEMENT_EFFECTIVE_DATE = 'Effective date: June 12, 2026';

const INFO_CARD_WEIGHT_TEXT = 'Вы подтвердили своё согласие с пользовательским соглашением';
const INFO_CARD_TEXT = 'Отзыв согласия приведёт к невозможности работы приложения';

type ProfileUserAgreementScreenProps = NativeStackScreenProps<
    ProfileStackParamList,
    'ProfileUserAgreement'
>;

export const ProfileUserAgreementScreen = (_props: ProfileUserAgreementScreenProps) => {
    const {t} = useTranslation('profile', {i18n});
    const insets = useSafeAreaInsets();
    const scrollRef = useRef<ScrollView>(null);
    const sectionOffsetsRef = useRef<Record<number, number>>({});
    const revokeConsentModalRef = useRef<BottomSheetModal>(null);

    const scrollToSection = (sectionIndex: number) => {
        const offsetY = sectionOffsetsRef.current[sectionIndex];
        if (offsetY == null) {
            return;
        }
        scrollRef.current?.scrollTo({y: offsetY, animated: true});
    };

    const handleSectionLayout = (sectionIndex: number, y: number) => {
        sectionOffsetsRef.current[sectionIndex] = y;
    };

    return (
        <StatusBarAvoidContainer backgroundColor="rgba(255, 255, 255, 1)">
            <Header
                title={t('user_agreement')}
                rightIcon="download"
                onRightIconPress={() => {
                }}
            />
            <ScrollView
                ref={scrollRef}
                style={styles.scroll}
                contentContainerStyle={[styles.scrollContent, {paddingBottom: insets.bottom + 16}]}
                showsVerticalScrollIndicator={false}>
                <Text style={styles.label}>Privacy Policy</Text>
                <Text style={styles.subtitle}>Pills Tracker</Text>
                <Text style={styles.bodyText}>{AGREEMENT_EFFECTIVE_DATE}</Text>

                <View style={styles.tocBlock}>
                    {TOC_ITEMS.map((item, index) => (
                        <Pressable
                            key={item}
                            onPress={() => {
                                scrollToSection(index);
                            }}
                            style={[styles.tocItem, index > 0 && styles.tocItemSpacing]}>
                            <Text style={styles.tocText}>{item}</Text>
                        </Pressable>
                    ))}
                </View>

                {AGREEMENT_INTRO.map(paragraph => (
                    <Text key={paragraph} style={styles.bodyText}>
                        {paragraph}
                    </Text>
                ))}

                {AGREEMENT_SECTIONS.map((section, sectionIndex) => (
                    <View
                        key={section.title}
                        onLayout={event => {
                            handleSectionLayout(sectionIndex, event.nativeEvent.layout.y);
                        }}>
                        <Text style={styles.sectionTitle}>{section.title}</Text>
                        {section.paragraphs.map(paragraph => (
                            <Text key={paragraph} style={styles.bodyText}>
                                {paragraph}
                            </Text>
                        ))}
                    </View>
                ))}

                <InfoCard
                    weightText={INFO_CARD_WEIGHT_TEXT}
                    text={INFO_CARD_TEXT}
                    style={styles.infoCard}
                />

                <TouchableTextIsIcon
                    text="Отозвать согласие"
                    icon="ban"
                    textColor="rgba(255, 102, 102, 1)"
                    onPress={() => {
                        revokeConsentModalRef.current?.present();
                    }}
                    styleContainer={styles.revokeButton}
                />
            </ScrollView>
            <ProfileUserAgreementModal ref={revokeConsentModalRef} />
        </StatusBarAvoidContainer>
    );
};

const styles = StyleSheet.create({
    scroll: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 20,
    },
    label: {
        fontWeight: 700,
        fontSize: 20,
        color: 'rgba(29, 26, 73, 1)',
        marginTop: 12,
    },
    subtitle: {
        fontWeight: 700,
        fontSize: 16,
        color: 'rgba(29, 26, 73, 1)',
        marginTop: 8,
        marginBottom: 12,
    },
    tocBlock: {
        marginTop: 24,
        marginBottom: 24,
    },
    tocItem: {
        alignSelf: 'flex-start',
    },
    tocItemSpacing: {
        marginTop: 20,
    },
    tocText: {
        color: 'rgba(35, 142, 235, 1)',
    },
    bodyText: {
        color: 'rgba(29, 26, 73, 1)',
        marginBottom: 12,
    },
    sectionTitle: {
        color: 'rgba(29, 26, 73, 1)',
        fontWeight: '700',
        marginBottom: 12,
        marginTop: 4,
    },
    infoCard: {
        marginTop: 24,
    },
    revokeButton: {
        marginTop: 36,
        alignSelf: 'center',
    },
});
