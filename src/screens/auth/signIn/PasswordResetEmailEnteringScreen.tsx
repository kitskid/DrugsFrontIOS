import {useState} from 'react';
import {Image, StyleSheet, Text, View} from 'react-native';
import type {AxiosResponseHeaders, RawAxiosResponseHeaders} from 'axios';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {KeyboardAwareScrollView} from 'react-native-keyboard-aware-scroll-view';
import type {NativeStackNavigationProp, NativeStackScreenProps} from '@react-navigation/native-stack';
import {useMutation} from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import {useTranslation} from 'react-i18next';

import {ButtonMain} from '../../../shared/ui/ButtonMain.tsx';
import {InputMain} from '../../../shared/ui/InputMain.tsx';
import {IconMapper} from '../../../shared/ui/IconMapper.tsx';
import type {SignInStackParamList} from '../../../features/navigation/auth/SignInStack.tsx';
import type {AuthStackParamList} from '../../../features/navigation/auth/AuthStack.tsx';
import {apiAuth} from '../../../features/api/apiAuth.ts';
import {PASSWORD_RESET_SESSION_ID_HEADER} from '../../../features/api/index.ts';
import i18n from '../../../features/localisation/i18n.ts';

export const extractPasswordResetSessionId = (
    headers: RawAxiosResponseHeaders | AxiosResponseHeaders | undefined,
): string | null => {
    const passwordSessionIdFromGet =
        headers && typeof headers === 'object' && 'get' in headers && typeof headers.get === 'function'
            ? headers.get(PASSWORD_RESET_SESSION_ID_HEADER)
            : undefined;
    const passwordSessionIdRaw =
        passwordSessionIdFromGet ??
        (headers as Record<string, unknown> | undefined)?.[PASSWORD_RESET_SESSION_ID_HEADER] ??
        (headers as Record<string, unknown> | undefined)?.[PASSWORD_RESET_SESSION_ID_HEADER.toLowerCase()];

    const passwordSessionId = Array.isArray(passwordSessionIdRaw)
        ? passwordSessionIdRaw[0]
        : typeof passwordSessionIdRaw === 'string'
          ? passwordSessionIdRaw
          : null;

    if (typeof passwordSessionId !== 'string' || passwordSessionId.trim().length === 0) {
        return null;
    }

    return passwordSessionId.trim();
};

type PasswordResetEmailEnteringScreenProps = NativeStackScreenProps<
  SignInStackParamList,
  'PasswordResetEmailEntering'
>;

export const PasswordResetEmailEnteringScreen = ({navigation}: PasswordResetEmailEnteringScreenProps) => {
  const {t} = useTranslation('auth', {i18n});
  const insets = useSafeAreaInsets();
  const authNavigation = navigation.getParent<NativeStackNavigationProp<AuthStackParamList>>();
  const [email, setEmail] = useState<string>('');
  const [emailErrorText, setEmailErrorText] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {mutateAsync: passwordResetForgotRequestMutation} = useMutation({
    mutationFn: (emailValue: string) => apiAuth.signIn.passwordResetForgotRequest(emailValue),
  });

  const handleSubmit = async () => {
    if (isSubmitting) {
      return;
    }

    const normalizedEmail = email.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(normalizedEmail)) {
      setEmailErrorText(t('common.email_invalid'));
      return;
    }

    setEmailErrorText(null);
    setIsSubmitting(true);

    try {
      await AsyncStorage.removeItem(PASSWORD_RESET_SESSION_ID_HEADER);
      const response = await passwordResetForgotRequestMutation(normalizedEmail);
      const passwordSessionId = extractPasswordResetSessionId(response.headers);

      if (!passwordSessionId) {
        setEmailErrorText(t('common.server_error'));
        return;
      }

      await AsyncStorage.setItem(PASSWORD_RESET_SESSION_ID_HEADER, passwordSessionId);
      navigation.replace('PasswordResetCode');
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 429) {
        setEmailErrorText(t('common.too_many_requests'));
        return;
      }
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        setEmailErrorText(t('password_reset.user_not_found'));
        return;
      }

      setEmailErrorText(t('common.server_error'));
    } finally {
      setIsSubmitting(false);
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
          <Text style={styles.title}>{t('password_reset.email_title')}</Text>
          <InputMain
            icon={'mail'}
            label={t('password_reset.email_label')}
            placeholder={t('common.email_placeholder')}
            value={email}
            onChange={value => {
              setEmail(value);
              setEmailErrorText(null);
            }}
            errorText={emailErrorText}
            autoFocus
          />
          <View style={styles.infoCard}>
            <IconMapper icon={'info'} size={24} weight={1.5} color={'rgba(35, 142, 235, 1)'} />
            <Text style={styles.infoCardText}>{t('common.email_code_info')}</Text>
          </View>
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
                <ButtonMain onPress={handleSubmit} title={t('common.send_code')} isLoading={isSubmitting} />
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
  infoCard: {
    marginTop: 8,
    backgroundColor: 'rgba(35, 142, 235, 0.1)',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  infoCardText: {
    marginLeft: 14,
    color: 'rgba(29, 26, 73, 1)',
    flex: 1,
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
