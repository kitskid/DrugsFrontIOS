import {StyleSheet, Text, TouchableOpacity, View, type StyleProp, type ViewStyle} from 'react-native';

const ACTIVE_BG = 'rgba(35, 142, 235, 1)';
const INACTIVE_BG = 'rgba(241, 240, 249, 1)';
const ACTIVE_TEXT = 'rgba(255, 255, 255, 1)';
const INACTIVE_TEXT = 'rgba(29, 26, 73, 1)';

type ActiveButtonProps = {
  label: string;
  isActive: boolean;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  containerStyle?: StyleProp<ViewStyle>;
};

export const ActiveButton = ({label, isActive, onPress, style, containerStyle}: ActiveButtonProps) => {
  return (
    <TouchableOpacity activeOpacity={0.8} onPress={onPress} style={containerStyle}>
      <View style={[styles.button, isActive ? styles.buttonActive : styles.buttonInactive, style]}>
        <Text style={isActive ? styles.buttonTextActive : styles.buttonTextInactive}>
          {label}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 1000,
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  buttonInactive: {
    backgroundColor: INACTIVE_BG,
  },
  buttonActive: {
    backgroundColor: ACTIVE_BG,
  },
  buttonTextInactive: {
    color: INACTIVE_TEXT,
  },
  buttonTextActive: {
    color: ACTIVE_TEXT,
  },
});
