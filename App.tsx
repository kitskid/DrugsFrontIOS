import {memo} from 'react';
import {StatusBar} from 'react-native';
import {BottomSheetModalProvider} from '@gorhom/bottom-sheet';
import {NavigationContainer} from '@react-navigation/native';
import {QueryClientProvider} from '@tanstack/react-query';
import {Provider} from 'react-redux';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {SafeAreaProvider} from 'react-native-safe-area-context';

import './src/features/api/client';

import {AppStack} from './src/app/AppStack';
import {queryClient, useAuth} from './src/app/useAuth';
import {
  handlePushNavigationReady,
  navigationRef,
  useFCMTokenRegistration,
} from './src/app/useFCMTokenRegistration';
import {AuthStack} from './src/features/navigation/auth/AuthStack';
import {store} from './src/features/redux/store';
import {SplashScreen} from './src/screens/auth/SplashScreen';
import {WelcomeScreen} from './src/screens/auth/WelcomeScreen.tsx';
import {ToastsProvider} from './src/widgets/toasts/ToastsProvider';
import './src/features/localisation/i18n';

// memo prevents parent re-renders (e.g. ToastsProvider toast show/hide)
// from cascading into the navigation tree and recreating RNSScreen* shadow nodes.
// AppNavigation still re-renders on its own hook changes (useAuth, useFCMTokenRegistration).
const AppNavigation = memo(() => {
  const {isAuthReady, isAuthorized, shouldShowWelcome, connectivityIssue} = useAuth();

  useFCMTokenRegistration({
    isAuthReady,
    isAuthorized,
    shouldShowWelcome,
    connectivityIssue,
  });

  return (
    <NavigationContainer ref={navigationRef} onReady={handlePushNavigationReady}>
      {!isAuthReady ? (
        <SplashScreen/>
      ) : isAuthorized ? (
        shouldShowWelcome ?
        <WelcomeScreen/>
        :
        <AppStack/>
      ) : (
        <AuthStack/>
      )}
    </NavigationContainer>
  );
});

export const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <Provider store={store}>
        <GestureHandlerRootView style={{flex: 1}}>
          <SafeAreaProvider>
            <StatusBar
              barStyle={'dark-content'}
              translucent
              backgroundColor="transparent"
            />
            <BottomSheetModalProvider>
              <ToastsProvider>
                <AppNavigation />
              </ToastsProvider>
            </BottomSheetModalProvider>
          </SafeAreaProvider>
        </GestureHandlerRootView>
      </Provider>
    </QueryClientProvider>
  );
};

export default App;
