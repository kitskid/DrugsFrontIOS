import {forwardRef, useEffect, useImperativeHandle, useRef, useState} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {BottomSheetModal} from '@gorhom/bottom-sheet';
import {useMutation} from '@tanstack/react-query';
import {useTranslation} from 'react-i18next';

import {apiAuth} from '../../../features/api/apiAuth.ts';
import {ME_STORAGE_KEY} from '../../../features/api/index.ts';
import i18n from '../../../features/localisation/i18n.ts';
import {ButtonMain} from '../../../shared/ui/ButtonMain.tsx';
import {BottomSheetInputMain} from '../../../shared/ui/modals/BottomSheetInputMain.tsx';
import {BottomSheetMain} from '../../../shared/ui/modals/BottomSheetMain.tsx';

type ProfileNameChangeModalProps = {
    initialName: string | null;
    onNameSaved: (name: string) => void;
};

const updateMeNameInStorage = async (newName: string) => {
    const raw = await AsyncStorage.getItem(ME_STORAGE_KEY);
    if (!raw) {
        return;
    }

    const me = JSON.parse(raw);
    me.name = newName;
    await AsyncStorage.setItem(ME_STORAGE_KEY, JSON.stringify(me));
};

export const ProfileNameChangeModal = forwardRef<BottomSheetModal, ProfileNameChangeModalProps>(
    ({initialName, onNameSaved}, ref) => {
        const {t} = useTranslation('profile', {i18n});
        const sheetRef = useRef<BottomSheetModal>(null);
        const [name, setName] = useState(initialName ?? '');
        const [errorText, setErrorText] = useState<string | null>(null);

        useImperativeHandle(ref, () => sheetRef.current as BottomSheetModal, []);

        useEffect(() => {
            setName(initialName ?? '');
        }, [initialName]);

        const {mutateAsync: updateNameMutation, isPending: isUpdateNamePending} = useMutation({
            mutationFn: (nextName: string) => apiAuth.signUp.updateName(nextName),
        });

        const dismiss = () => {
            sheetRef.current?.dismiss();
        };

        const handleSheetChange = (index: number) => {
            if (index >= 0) {
                setName(initialName ?? '');
                setErrorText(null);
            }
        };

        const onNameChange = (value: string) => {
            setName(value);
            if (errorText) {
                setErrorText(null);
            }
        };

        const handleSavePress = async () => {
            const trimmedName = name.trim();
            const normalizedInitial = (initialName ?? '').trim();

            if (trimmedName === normalizedInitial) {
                dismiss();
                return;
            }

            if (trimmedName.length === 0) {
                setErrorText(t('name_change_required_error'));
                return;
            }

            setErrorText(null);

            try {
                await updateNameMutation(trimmedName);
                await updateMeNameInStorage(trimmedName);
                onNameSaved(trimmedName);
                dismiss();
            } catch {
                setErrorText(t('name_change_server_error'));
            }
        };

        return (
            <BottomSheetMain
                ref={sheetRef}
                contentContainerStyle={styles.content}
                onChange={handleSheetChange}>
                <View>
                    <Text style={styles.title}>{t('name_label')}</Text>
                    <BottomSheetInputMain
                        icon="circle-user"
                        value={name}
                        onChange={onNameChange}
                        autoFocus
                        errorText={errorText}
                    />
                </View>

                <View style={styles.buttonsRow}>
                    <ButtonMain
                        title={t('name_change_back')}
                        variant="secondary"
                        onPress={dismiss}
                        style={styles.button}
                    />
                    <ButtonMain
                        title={t('name_change_save')}
                        onPress={() => {
                            void handleSavePress();
                        }}
                        isLoading={isUpdateNamePending}
                        style={styles.button}
                    />
                </View>
            </BottomSheetMain>
        );
    },
);

const styles = StyleSheet.create({
    content: {
        paddingTop: 8,
        justifyContent: 'space-between',
        minHeight: 220,
    },
    title: {
        textAlign: 'center',
        fontSize: 18,
        fontWeight: '500',
        color: 'rgba(29, 26, 73, 1)',
        marginBottom: 25,
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
