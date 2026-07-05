import {useEffect, useState} from 'react';
import {StyleProp, StyleSheet, Text, TextInput, TouchableOpacity, View, ViewStyle} from 'react-native';
import Animated, {
    FadeIn,
    FadeOut,
    interpolateColor,
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from 'react-native-reanimated';

import {IconMapper} from './IconMapper';

export type PasswordValidationRule = {
    text: string;
    isValid: (value: string) => boolean;
};

export const passwordValidationRules: PasswordValidationRule[] = [
    {
        text: 'Мин. 8 символов',
        isValid: value => value.length >= 8,
    },
    {
        text: 'Цифра (0–9)',
        isValid: value => /\d/.test(value),
    },
    {
        text: 'Символ (!@#)',
        isValid: value => /[!@#]/.test(value),
    },
    {
        text: 'Заглавные и строчные буквы (A–Z), (a–z)',
        isValid: value => /[A-Z]/.test(value) && /[a-z]/.test(value),
    },
];

export const isPasswordValid = (value: string): boolean => {
    return passwordValidationRules.every(rule => rule.isValid(value));
};

type PasswordInputProps = {
    value: string;
    onChange: (value: string) => void;
    isError?: boolean;
    errorText?: string | null;
    autoFocus?: boolean;
    label?: string;
    placeholder?: string;
    style?: StyleProp<ViewStyle>;
};

const ICON_COLOR = 'rgba(162, 160, 191, 1)';
const ERROR_COLOR = 'rgba(245, 33, 33, 1)';
const FOCUS_COLOR = 'rgba(56, 163, 255, 1)';
const PLACEHOLDER_COLOR = 'rgba(162, 160, 191, 1)';
const ANIMATION_DURATION = 180;

export const PasswordInput = ({
                                  value,
                                  onChange,
                                  isError = false,
                                  errorText,
                                  autoFocus = false,
                                  label,
                                  placeholder,
                                  style,
                              }: PasswordInputProps) => {
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const hasError = isError || typeof errorText === 'string';
    const hasErrorText = typeof errorText === 'string';
    const errorProgress = useSharedValue(hasError ? 1 : 0);
    const focusProgress = useSharedValue(autoFocus ? 1 : 0);

    useEffect(() => {
        errorProgress.value = withTiming(hasError ? 1 : 0, {
            duration: ANIMATION_DURATION,
        });
    }, [errorProgress, hasError]);

    const containerAnimatedStyle = useAnimatedStyle(() => ({
        borderColor: interpolateColor(
            errorProgress.value,
            [0, 1],
            [interpolateColor(focusProgress.value, [0, 1], ['transparent', FOCUS_COLOR]), ERROR_COLOR],
        ),
    }));

    return (
        <View style={style}>
            {label ? <Text style={styles.label}>{label}</Text> : null}
            <Animated.View style={[styles.container, containerAnimatedStyle]}>
                <View style={styles.leftIconContainer}>
                    <IconMapper weight={1.5} icon="lock-keyhole" size={24} color={ICON_COLOR}/>
                </View>

                <TextInput
                    value={value}
                    onChangeText={onChange}
                    autoFocus={autoFocus}
                    secureTextEntry={!isPasswordVisible}
                    placeholder={placeholder}
                    placeholderTextColor={PLACEHOLDER_COLOR}
                    onFocus={() => {
                        focusProgress.value = withTiming(1, {
                            duration: ANIMATION_DURATION,
                        });
                    }}
                    onBlur={() => {
                        focusProgress.value = withTiming(0, {
                            duration: ANIMATION_DURATION,
                        });
                    }}
                    style={styles.input}
                />

                <TouchableOpacity
                    activeOpacity={0.7}
                    hitSlop={8}
                    onPress={() => setIsPasswordVisible(prev => !prev)}
                    style={styles.rightIconButton}>
                    <IconMapper
                        weight={1.5}
                        icon={isPasswordVisible ? 'eye-off' : 'eye'}
                        size={24}
                        color={ICON_COLOR}
                    />
                </TouchableOpacity>
            </Animated.View>

            <View style={styles.errorSlot}>
                {hasErrorText ? (
                    <Animated.Text entering={FadeIn.duration(ANIMATION_DURATION)}
                                   exiting={FadeOut.duration(ANIMATION_DURATION)} style={styles.errorText}>
                        {errorText}
                    </Animated.Text>
                ) : null}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 24,
        backgroundColor: 'rgba(241, 240, 249, 1)',
        height: 48,
        borderWidth: 2,
    },
    leftIconContainer: {
        marginHorizontal: 12,
        marginVertical: 12,
    },
    input: {
        flex: 1,
        color: 'rgba(29, 26, 73, 1)',
        fontSize: 16,
    },
    rightIconButton: {
        marginHorizontal: 12,
        marginVertical: 12,
    },
    label: {
        marginLeft: 16,
        marginBottom: 6,
        color: 'rgba(134, 132, 168, 1)',
    },
    errorText: {
        color: ERROR_COLOR,
        fontSize: 12,
        marginLeft: 12
    },
    errorSlot: {
        height: 16,
        justifyContent: 'flex-end',
    },
});
