import {StyleSheet, Text, TouchableOpacity, View, ViewStyle} from 'react-native';

import {IconMapper} from './IconMapper.tsx';

type WarningCardProps = {
    text: string;
    topText?: string;
    weightText?: string;
    style?: ViewStyle;
    isWarning?: boolean;
    isDanger?: boolean;
    onClose?: () => void;
};

export const InfoCard = ({text, topText, weightText, style, isWarning, isDanger, onClose}: WarningCardProps) => {
    const iconName = isDanger || isWarning ? 'triangle-alert' : 'info';
    const iconColor = isDanger
        ? 'rgba(245, 33, 33, 1)'
        : isWarning
          ? 'rgba(255, 128, 0, 1)'
          : 'rgba(35, 142, 235, 1)';
    const containerBackgroundColor = isDanger
        ? 'rgba(245, 33, 33, 0.1)'
        : isWarning
          ? 'rgba(255, 128, 0, 0.1)'
          : 'rgba(35, 142, 235, 0.1)';
    const textColor = isDanger ? 'rgba(245, 33, 33, 1)' : 'rgba(29, 26, 73, 1)';

    const hasMultiLineText = Boolean(topText || weightText);
    const textStyle = [styles.text, {color: textColor}, onClose && styles.textWithClose];

    return (
        <View
            style={[
                styles.container,
                hasMultiLineText ? styles.containerTopAligned : null,
                {backgroundColor: containerBackgroundColor},
                style,
            ]}>
            <View style={styles.icon}>
                <IconMapper icon={iconName} size={24} color={iconColor} weight={1.5}/>
            </View>
            <View style={styles.textColumn}>
                {topText ? (
                    <>
                        <Text style={textStyle}>{topText}</Text>
                        <Text style={[...textStyle, styles.textBelowWeight]}>{text}</Text>
                    </>
                ) : weightText ? (
                    <>
                        <Text
                            style={[
                                styles.weightText,
                                {color: textColor},
                                onClose && styles.textWithClose,
                            ]}>
                            {weightText}
                        </Text>
                        <Text style={[...textStyle, styles.textBelowWeight]}>{text}</Text>
                    </>
                ) : (
                    <Text style={textStyle}>{text}</Text>
                )}
            </View>
            {onClose && (
                <TouchableOpacity style={styles.closeButton} onPress={onClose} hitSlop={16}>
                    <IconMapper icon="x" size={24} color="rgba(162, 160, 191, 1)"/>
                </TouchableOpacity>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        borderRadius: 24,
        padding: 12,
        flexDirection: 'row',
        alignItems: 'center',
        columnGap: 10,
        position: 'relative',
    },
    containerTopAligned: {
        alignItems: 'flex-start',
    },
    icon: {
        marginBottom: 'auto',
    },
    textColumn: {
        flex: 1,
    },
    weightText: {
        fontSize: 16,
        fontWeight: '500',
    },
    text: {},
    textBelowWeight: {
        marginTop: 8,
    },
    textWithClose: {
        paddingRight: 28,
    },
    closeButton: {
        position: 'absolute',
        top: 12,
        right: 12,
    },
});
