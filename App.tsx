import {StatusBar} from 'react-native';
import {BottomSheetModalProvider} from '@gorhom/bottom-sheet';
import {NavigationContainer} from '@react-navigation/native';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {Provider} from 'react-redux';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {SafeAreaProvider} from 'react-native-safe-area-context';

import './src/features/api/client';

import {AppStack} from './src/app/AppStack';
import {useAuth} from './src/app/useAuth';
import {AuthStack} from './src/features/navigation/auth/AuthStack';
import {store} from './src/features/redux/store';
import {SplashScreen} from './src/screens/auth/SplashScreen';
import {WelcomeScreen} from './src/screens/auth/WelcomeScreen.tsx';
import {ToastsProvider} from './src/widgets/toasts/ToastsProvider';
import './src/features/localisation/i18n';

const queryClient = new QueryClient();

export const App = () => {
    const {isAuthReady, isAuthorized, shouldShowWelcome} = useAuth();

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
                                <NavigationContainer>
                                    {!isAuthReady ? (
                                        <SplashScreen/>
                                    ) : isAuthorized ? (
                                        shouldShowWelcome ? <WelcomeScreen/> : <AppStack/>
                                    ) : (
                                        <AuthStack/>
                                    )}
                                </NavigationContainer>
                            </ToastsProvider>
                        </BottomSheetModalProvider>
                    </SafeAreaProvider>
                </GestureHandlerRootView>
            </Provider>
        </QueryClientProvider>
    );
};

export default App;
