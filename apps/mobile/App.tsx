import 'react-native-gesture-handler';
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import RootNavigator from './src/navigation/RootNavigator';
import { AuraColors } from './src/core/theme/aura';

import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuraProvider } from './src/core/context/AuraProvider';

export default function App() {
    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <SafeAreaProvider>
                <AuraProvider>
                    <StatusBar style="light" backgroundColor={AuraColors.background} />
                    <RootNavigator />
                </AuraProvider>
            </SafeAreaProvider>
        </GestureHandlerRootView>
    );
}
