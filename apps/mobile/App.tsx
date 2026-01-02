import 'react-native-gesture-handler';
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GlobalErrorBoundary } from '@core/components/GlobalErrorBoundary';
import RootNavigator from '@navigation/RootNavigator';
import { AuraColors } from '@theme/aura';

import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuraProvider } from '@core/context/AuraProvider';
import { AuthProvider } from '@context/AuthProvider';
import { useEffect } from 'react';
import { Analytics } from '@core/utils/analytics';

export default function App() {
    useEffect(() => {
        Analytics.track('APP_OPENED');
    }, []);

    return (
        <GlobalErrorBoundary>
            <GestureHandlerRootView style={{ flex: 1 }}>
                <SafeAreaProvider>
                    <AuthProvider>
                        <AuraProvider>
                            <StatusBar style="light" backgroundColor={AuraColors.background} />
                            <RootNavigator />
                        </AuraProvider>
                    </AuthProvider>
                </SafeAreaProvider>
            </GestureHandlerRootView>
        </GlobalErrorBoundary>
    );
}
