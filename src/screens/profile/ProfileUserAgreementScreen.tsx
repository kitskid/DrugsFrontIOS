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
    '1. Общие положения',
    '2. Использование Приложения',
    '3. Персональные и медицинские данные',
    '4. Права и обязанности пользователя',
    '5. Права и обязанности оператора',
    '6. Ограничение ответственности',
    '7. Заключительные положения',
] as const;

const AGREEMENT_INTRO =
    'Настоящее Пользовательское соглашение (далее — "Соглашение") регулирует использование мобильного приложения «ProfMed» (далее — "Приложение") и является публичной офертой для пользователей Приложения.';

const AGREEMENT_SECTIONS: { title: string; paragraphs: string[] }[] = [
    {
        title: '1. Общие положения',
        paragraphs: [
            '1.1. Используя Приложение, вы подтверждаете, что ознакомились с условиями настоящего Соглашения, Политикой конфиденциальности и Согласием на обработку персональных данных, и принимаете их полностью.',
            '1.2. Оператором персональных данных и владельцем Приложения является ООО "ПрофМед" (ИНН 1234567890, ОГРН 1234567890123, адрес: г. Москва, ул. Примерная, д. 1).',
        ],
    },
    {
        title: '2. Использование Приложения',
        paragraphs: [
            '2.1. Приложение предоставляет возможность вести медицинские записи, хранить результаты анализов, получать напоминания о приёме лекарств, отслеживать медицинские события и использовать иные сервисы, указанные в приложении.',
            '2.2. Для полноценного использования приложения необходимо зарегистрироваться и предоставить корректные персональные данные.',
        ],
    },
    {
        title: '3. Персональные и медицинские данные',
        paragraphs: [
            '3.1. При регистрации и использовании Приложения вы соглашаетесь на передачу, обработку и хранение ваших персональных и медицинских данных на серверах, расположенных на территории Российской Федерации.',
            '3.2. Оператор обязуется соблюдать требования законодательства РФ по защите персональных данных.',
            '3.3. Вы имеете право в любое время отозвать своё согласие на обработку персональных данных, обратившись по указанным в приложении контактам.',
        ],
    },
    {
        title: '4. Права и обязанности пользователя',
        paragraphs: [
            '4.1. Пользователь обязуется указывать достоверную информацию, не использовать приложение в противозаконных целях и не совершать действий, нарушающих права третьих лиц.',
            '4.2. Пользователь несёт ответственность за сохранность данных своей учётной записи, включая пароль и ПИН-код.',
            '4.3. Пользователь вправе удалять свой аккаунт и данные из приложения.',
        ],
    },
    {
        title: '5. Права и обязанности оператора',
        paragraphs: [
            '5.1. Оператор вправе изменять функционал приложения, условия использования и настоящее Соглашение с обязательной публикацией новой редакции.',
            '5.2. Оператор имеет право направлять пользователю уведомления, связанные с использованием приложения, сервисными, медицинскими или юридическими событиями.',
            '5.3. Оператор не несёт ответственности за достоверность и актуальность медицинских данных, внесённых пользователем.',
        ],
    },
    {
        title: '6. Ограничение ответственности',
        paragraphs: [
            '6.1. Приложение не является медицинским учреждением и не осуществляет медицинскую деятельность, рекомендации носят информационный характер и не заменяют консультацию врача.',
            '6.2. Оператор не гарантирует бесперебойную работу приложения и не несёт ответственности за возможные сбои, связанные с техническими причинами.',
        ],
    },
    {
        title: '7. Заключительные положения',
        paragraphs: [
            '7.1. Настоящее соглашение вступает в силу с момента начала использования приложения.',
            '7.2. Все споры, возникающие из данного соглашения, разрешаются в соответствии с законодательством Российской Федерации.',
            '7.3. Контакты для обращений: support@profmed.ru',
        ],
    },
];

const AGREEMENT_UPDATED = 'Обновлено: 12 июня 2024 г.';

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
                <Text style={styles.label}>Пользовательское соглашение</Text>

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

                <Text style={styles.bodyText}>{AGREEMENT_INTRO}</Text>

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

                <Text style={styles.bodyText}>{AGREEMENT_UPDATED}</Text>

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
        marginTop: 12
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
