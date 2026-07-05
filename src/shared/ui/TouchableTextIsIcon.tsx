import {Text, TouchableOpacity, type StyleProp, type TextStyle, type ViewStyle} from 'react-native';

import {IconMapper, type IconName} from './IconMapper.tsx';

type TouchableTextProps = {
    text: string;
    onPress: () => void;
    icon?: IconName;
    textColor?: string;
    styleContainer?: StyleProp<ViewStyle>;
    styleText?: StyleProp<TextStyle>;
};

export const TouchableTextIsIcon = ({
                                        text,
                                        onPress,
                                        icon,
                                        textColor = 'rgba(35, 142, 235, 1)',
                                        styleContainer,
                                        styleText,
                                    }: TouchableTextProps) => {
    return (
        <TouchableOpacity
            style={[styles.container, icon ? styles.containerWithIcon : null, styleContainer]}
            activeOpacity={0.8}
            hitSlop={8}
            onPress={onPress}>
            {icon && <IconMapper icon={icon} size={24} color={textColor} weight={1.5}/>}
            <Text style={[{color: textColor}, icon && styles.textWithIcon, styleText]}>
                {text}
            </Text>
        </TouchableOpacity>
    );
};

const styles = {
    container: {
        alignSelf: 'flex-start',
    } satisfies ViewStyle,
    containerWithIcon: {
        flexDirection: 'row',
        alignItems: 'center',
    } satisfies ViewStyle,
    textWithIcon: {
        marginLeft: 12,
    } satisfies TextStyle,
};
