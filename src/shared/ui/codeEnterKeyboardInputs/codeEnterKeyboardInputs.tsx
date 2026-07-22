import {useEffect, useMemo, useState} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import Animated, {useAnimatedStyle, useSharedValue, withTiming} from 'react-native-reanimated';
import {useTranslation} from 'react-i18next';

import i18n from '../../../features/localisation/i18n';
import {CodeEnterKeyboard} from './codeEnterKeyboard';
import {CodeEnterInputs} from './codeEnterInputs';
import {TouchableTextIsIcon} from '../TouchableTextIsIcon.tsx';
import {IconMapper} from '../IconMapper';

const CODE_LENGTH = 5;
const RESEND_SECONDS = 60;
const ERROR_ANIMATION_DURATION = 180;
const ERROR_TEXT_HEIGHT = 16;
const ERROR_MARGIN_TOP = 8;

type CodeEnterKeyboardInputsProps = {
  errorText?: string | null;
  onCodeChange?: (code: string) => void;
  onResendCodePress?: () => void;
};

export const CodeEnterKeyboardInputs = ({
    errorText = null,
    onCodeChange,
    onResendCodePress,
}: CodeEnterKeyboardInputsProps) => {
    const {t} = useTranslation('auth', {i18n});
    const [values, setValues] = useState<string[]>(Array(CODE_LENGTH).fill(''));
    const [timeLeft, setTimeLeft] = useState(RESEND_SECONDS);
    const errorProgress = useSharedValue(0);

    const code = values.join('');
    const shouldShowError = Boolean(errorText);

    useEffect(() => {
        if (timeLeft <= 0) {
            return;
        }

        const intervalId = setInterval(() => {
            setTimeLeft(prevTime => Math.max(prevTime - 1, 0));
        }, 1000);

        return () => {
            clearInterval(intervalId);
        };
    }, [timeLeft]);

    useEffect(() => {
        onCodeChange?.(code);
    }, [code, onCodeChange]);

    useEffect(() => {
        errorProgress.value = withTiming(shouldShowError ? 1 : 0, {
            duration: ERROR_ANIMATION_DURATION,
        });
    }, [errorProgress, shouldShowError]);

    const errorTextSlotAnimatedStyle = useAnimatedStyle(() => ({
        height: errorProgress.value * ERROR_TEXT_HEIGHT,
        marginTop: errorProgress.value * ERROR_MARGIN_TOP,
        opacity: errorProgress.value,
    }));

    const handleDigitPress = (digit: string) => {
        setValues(prevValues => {
            const nextEmptyIndex = prevValues.findIndex(value => value === '');

            if (nextEmptyIndex === -1) {
                return prevValues;
            }

            const nextValues = [...prevValues];
            nextValues[nextEmptyIndex] = digit;
            return nextValues;
        });
    };

    const handleDeletePress = () => {
        setValues(prevValues => {
            const lastFilledIndex = [...prevValues].reverse().findIndex(value => value !== '');

            if (lastFilledIndex === -1) {
                return prevValues;
            }

            const nextValues = [...prevValues];
            const targetIndex = prevValues.length - 1 - lastFilledIndex;
            nextValues[targetIndex] = '';
            return nextValues;
        });
    };

    const timerText = useMemo(() => {
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        const minutesText = String(minutes).padStart(2, '0');
        const secondsText = String(seconds).padStart(2, '0');
        return t('common.resend_code_in', {time: `${minutesText}:${secondsText}`});
    }, [t, timeLeft]);

    const handleResendCodePress = () => {
        onResendCodePress?.();
        setTimeLeft(RESEND_SECONDS);
    };

    return (
        <View style={styles.container}>
            <CodeEnterInputs values={values} isError={shouldShowError}/>

            <Animated.View style={[styles.errorTextSlot, errorTextSlotAnimatedStyle]}>
                <Text style={styles.errorText}>{errorText}</Text>
            </Animated.View>

            <View style={styles.metaContainer}>
                {timeLeft > 0 ? (
                    <Text style={styles.timerText}>{timerText}</Text>
                ) : (
                        <TouchableTextIsIcon
                            text={t('common.resend_code')}
                            onPress={handleResendCodePress}
                            styleContainer={styles.resendButtonContainer}
                        />
                )}

                <View style={styles.infoCard}>
                    <IconMapper icon="info" size={24} weight={1.5} color="rgba(35, 142, 235, 1)"/>
                    <Text style={styles.infoText}>{t('common.code_arrival_info')}</Text>
                </View>
            </View>

            <CodeEnterKeyboard onDigitPress={handleDigitPress} onDeletePress={handleDeletePress}/>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        marginBottom: 20
    },
    metaContainer: {
        width: '100%',
        maxWidth: 360,
        alignSelf: 'center',
    },
    errorTextSlot: {
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    },
    errorText: {
        color: 'rgba(245, 33, 33, 1)',
        fontSize: 12,
        lineHeight: ERROR_TEXT_HEIGHT,
    },
    timerText: {
        marginTop: 24,
        textAlign: 'center',
        color: 'rgba(29, 26, 73, 1)',
    },
    resendButtonContainer: {
        marginTop: 24,
        marginHorizontal: "auto"
    },
    infoCard: {
        marginTop: 24,
        borderRadius: 24,
        backgroundColor: 'rgba(35, 142, 235, 0.1)',
        padding: 12,
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'center',
    },
    infoText: {
        marginLeft: 8,
        color: 'rgba(29, 26, 73, 1)',
    },
});
