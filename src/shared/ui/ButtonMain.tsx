import {type ReactNode, useEffect, useRef, useState} from 'react';
import {
  ActivityIndicator,
  type StyleProp,
  StyleSheet,
  Text,
  TouchableOpacity,
  type TouchableOpacityProps,
  type ViewStyle,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

export type ButtonMainVariant = 'primary' | 'secondary' | 'danger' | 'outline';

type ButtonMainProps = {
  title: ReactNode;
  onPress: TouchableOpacityProps['onPress'];
  variant?: ButtonMainVariant;
  style?: StyleProp<ViewStyle>;
  isLoading?: boolean;
  disabled?: boolean;
};

const gradientStart = {x: 0, y: 0.5};
const gradientEnd = {x: 1, y: 0.5};
const LOADER_COLOR = 'rgba(255, 255, 255, 1)';
const LOADING_SHOW_DELAY_MS = 1000;

export const ButtonMain = ({
                             title,
                             onPress,
                             variant = 'primary',
                             style,
                             isLoading = false,
                             disabled = false,
                           }: ButtonMainProps) => {
  const [isLoadingVisible, setIsLoadingVisible] = useState<boolean>(false);
  const loadingDelayTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (isLoading) {
      if (loadingDelayTimeoutRef.current !== null) {
        clearTimeout(loadingDelayTimeoutRef.current);
      }

      loadingDelayTimeoutRef.current = setTimeout(() => {
        setIsLoadingVisible(true);
        loadingDelayTimeoutRef.current = null;
      }, LOADING_SHOW_DELAY_MS);

      return;
    }

    if (loadingDelayTimeoutRef.current !== null) {
      clearTimeout(loadingDelayTimeoutRef.current);
      loadingDelayTimeoutRef.current = null;
    }

    setIsLoadingVisible(false);
  }, [isLoading]);

  useEffect(() => {
    return () => {
      if (loadingDelayTimeoutRef.current !== null) {
        clearTimeout(loadingDelayTimeoutRef.current);
      }
    };
  }, []);

  const isSecondary = variant === 'secondary';
  const isPrimary = variant === 'primary';
  const isDanger = variant === 'danger';
  const isOutline = variant === 'outline';
  const isPressDisabled = isLoading || disabled;
  return (
      <TouchableOpacity
          activeOpacity={0.7}
          onPress={onPress}
          disabled={isPressDisabled}
          style={[
            styles.button,
            isSecondary && styles.secondaryButton,
            isDanger && styles.dangerButton,
            isOutline && styles.outlineButton,
            (disabled || isLoadingVisible) && styles.disabled,
            style,
          ]}>
        {isPrimary && (
            <LinearGradient
                colors={[
                  'rgba(143, 96, 219, 1)',
                  'rgba(45, 139, 221, 1)',
                  'rgba(143, 96, 219, 1)',
                ]}
                start={gradientStart}
                end={gradientEnd}
                locations={[0, 0.5, 1]}
                style={StyleSheet.absoluteFill}
            />
        )}
        {isLoadingVisible ? (
            <ActivityIndicator color={LOADER_COLOR} />
        ) : (
            <Text
              style={[
                styles.text,
                isSecondary && styles.secondaryText,
                isOutline && styles.outlineText,
              ]}>
              {title}
            </Text>
        )}
      </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    height: 48,
    borderRadius: 24,
  },
  secondaryButton: {
    backgroundColor: 'rgba(232, 231, 242, 1)',
  },
  dangerButton: {
    backgroundColor: 'rgba(255, 102, 102, 1)',
  },
  outlineButton: {
    backgroundColor: 'rgba(35, 142, 235, 0.15)',
  },
  disabled: {
    opacity: 0.7,
  },
  text: {
    color: 'rgba(255, 255, 255, 1)',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  secondaryText: {
    color: 'rgba(134, 132, 168, 1)',
  },
  outlineText: {
    color: 'rgba(35, 142, 235, 1)',
  },
});

