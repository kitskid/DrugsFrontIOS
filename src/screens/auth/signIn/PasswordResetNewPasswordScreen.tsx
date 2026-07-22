import {useState} from 'react';
import {Image, StyleSheet, Text, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {KeyboardAwareScrollView} from 'react-native-keyboard-aware-scroll-view';
import type {NativeStackNavigationProp, NativeStackScreenProps} from '@react-navigation/native-stack';
import {useMutation} from '@tanstack/react-query';
import {useTranslation} from 'react-i18next';

import {ButtonMain} from '../../../shared/ui/ButtonMain.tsx';
import {PasswordInputWithCards} from '../../../shared/ui/PasswordInputWithCards.tsx';
import {isPasswordValid} from '../../../shared/ui/PasswordInput.tsx';
import type {SignInStackParamList} from '../../../features/navigation/auth/SignInStack.tsx';
import type {AuthStackParamList} from '../../../features/navigation/auth/AuthStack.tsx';
import {useToast} from '../../../features/toasts/useToast.ts';
import {apiAuth} from '../../../features/api/apiAuth.ts';
import i18n from '../../../features/localisation/i18n.ts';

type PasswordResetNewPasswordScreenProps = NativeStackScreenProps<
  SignInStackParamList,
  'PasswordResetNewPassword'
>;

export const PasswordResetNewPasswordScreen = ({navigation}: PasswordResetNewPasswordScreenProps) => {
  const {t} = useTranslation('auth', {i18n});
  const insets = useSafeAreaInsets();
  const authNavigation = navigation.getParent<NativeStackNavigationProp<AuthStackParamList>>();
  const [password, setPassword] = useState<string>('');
  const [isPasswordError, setIsPasswordError] = useState<boolean>(false);
  const {showToast} = useToast();
  const {mutateAsync: passwordResetForgotResetMutation, isPending: isSubmitting} = useMutation({
    mutationFn: (passwordValue: string) => apiAuth.signIn.passwordResetForgotReset(passwordValue),
  });

  const handleSubmit = async () => {
    if (isSubmitting) {
      return;
    }

    if (password.trim().length === 0 || !isPasswordValid(password)) {
      setIsPasswordError(true);
      return;
    }

    setIsPasswordError(false);

    try {
      await passwordResetForgotResetMutation(password);
      navigation.replace('PasswordResetRepeat');
    } catch {
      showToast({variant: 'error', text: t('common.server_error')});
    }
  };

  return (
    <KeyboardAwareScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="always"
      showsVerticalScrollIndicator={false}
      enableOnAndroid>
      <View style={styles.inner}>
        <Image source={require('../../../../assets/images/logo.png')} style={styles.logo} />
        <View style={[styles.content, {paddingBottom: insets.bottom}]}>
          <Text style={styles.title}>{t('password_reset.new_password_title')}</Text>
          <PasswordInputWithCards
            value={password}
            onChange={value => {
              setPassword(value);
              setIsPasswordError(false);
            }}
            isError={isPasswordError}
            autoFocus
          />
          <View style={styles.footer}>
            <View style={styles.buttonsContainer}>
              <View style={[styles.buttonWrapper, styles.buttonWrapperFirst]}>
                <ButtonMain
                  onPress={() => {
                    if (authNavigation) {
                      authNavigation.navigate('Start');
                      return;
                    }
                    navigation.goBack();
                  }}
                  title={t('common.back')}
                  variant={'secondary'}
                />
              </View>
              <View style={styles.buttonWrapper}>
                <ButtonMain onPress={handleSubmit} title={t('common.next')} isLoading={isSubmitting} />
              </View>
            </View>
          </View>
        </View>
      </View>
    </KeyboardAwareScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(247, 246, 251, 1)',
  },
  scrollContent: {
    flexGrow: 1,
  },
  inner: {
    flex: 1,
  },
  logo: {
    width: 175,
    height: 32,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 24,
  },
  content: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 1)',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 12,
    paddingTop: 32,
  },
  title: {
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '700',
    color: 'rgba(29, 26, 73, 1)',
    marginBottom: 32,
  },
  footer: {
    marginTop: 'auto',
    paddingBottom: 16,
    paddingTop: 8,
  },
  buttonsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonWrapper: {
    flex: 1,
  },
  buttonWrapperFirst: {
    marginRight: 12,
  },
});
