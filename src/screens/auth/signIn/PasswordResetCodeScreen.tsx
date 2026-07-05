import {useEffect, useRef, useState} from 'react';
import {Image, StyleSheet, Text, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {KeyboardAwareScrollView} from 'react-native-keyboard-aware-scroll-view';
import type {NativeStackNavigationProp, NativeStackScreenProps} from '@react-navigation/native-stack';
import {useMutation} from '@tanstack/react-query';
import axios from 'axios';

import {ButtonMain} from '../../../shared/ui/ButtonMain.tsx';
import {CodeEnterKeyboardInputs} from '../../../shared/ui/codeEnterKeyboardInputs/codeEnterKeyboardInputs.tsx';
import type {SignInStackParamList} from '../../../features/navigation/auth/SignInStack.tsx';
import type {AuthStackParamList} from '../../../features/navigation/auth/AuthStack.tsx';
import {apiAuth} from '../../../features/api/apiAuth.ts';

type PasswordResetCodeScreenProps = NativeStackScreenProps<SignInStackParamList, 'PasswordResetCode'>;

export const PasswordResetCodeScreen = ({navigation}: PasswordResetCodeScreenProps) => {
  const insets = useSafeAreaInsets();
  const authNavigation = navigation.getParent<NativeStackNavigationProp<AuthStackParamList>>();
  const [code, setCode] = useState('');
  const [codeErrorText, setCodeErrorText] = useState<string | null>(null);
  const previousCodeRef = useRef(code);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {mutateAsync: resendForgotCodeMutation} = useMutation({
    mutationFn: () => apiAuth.signIn.passwordResetForgotResend(),
  });
  const {mutateAsync: confirmForgotCodeMutation} = useMutation({
    mutationFn: (codeValue: string) => apiAuth.signIn.passwordResetForgotConfirm(codeValue),
  });

  const handleCodeChange = (nextCode: string) => {
    setCode(nextCode);
  };

  useEffect(() => {
    const hasCodeChanged = previousCodeRef.current !== code;

    if (hasCodeChanged && codeErrorText !== null) {
      setCodeErrorText(null);
    }

    previousCodeRef.current = code;
  }, [code, codeErrorText]);

  const handleConfirmPress = async () => {
    if (isSubmitting) {
      return;
    }

    if (code.length < 5) {
      setCodeErrorText('Поле обязательно для заполнения');
      return;
    }

    setCodeErrorText(null);
    setIsSubmitting(true);

    try {
      await confirmForgotCodeMutation(code);
      navigation.replace('PasswordResetNewPassword');
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        setCodeErrorText('Неверный код');
        return;
      }

      setCodeErrorText('Ошибка на сервере');
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
          <Text style={styles.title}>Подтвердите сброс пароля</Text>
          <CodeEnterKeyboardInputs
            onCodeChange={handleCodeChange}
            onResendCodePress={async () => {
              try {
                await resendForgotCodeMutation();
              } catch {
                setCodeErrorText('Ошибка на сервере');
              }
            }}
            errorText={codeErrorText}
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
                  title={'Вернуться'}
                  variant={'secondary'}
                />
              </View>
              <View style={styles.buttonWrapper}>
                <ButtonMain onPress={handleConfirmPress} title={'Подтвердить'} isLoading={isSubmitting} />
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
