/**
 * 🔄 LOADING STATE MANAGER
 * Standardized loading patterns across the entire app
 */

import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { AuraColors } from '@theme/aura';
import { AuraText } from '@core/components/AuraText';

interface LoadingStateProps {
    message?: string;
    size?: 'small' | 'large';
    fullScreen?: boolean;
}

/**
 * Standard loading component - use this everywhere
 */
export const LoadingState: React.FC<LoadingStateProps> = ({
    message = 'Loading...',
    size = 'large',
    fullScreen = false
}) => {
    const containerStyle = fullScreen ? styles.fullScreen : styles.inline;

    return (
        <View style={containerStyle}>
            <ActivityIndicator size={size} color={AuraColors.primary} />
            {message && (
                <AuraText
                    variant="body"
                    color={AuraColors.gray400}
                    style={styles.message}
                >
                    {message}
                </AuraText>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    fullScreen: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: AuraColors.background,
    },
    inline: {
        padding: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    message: {
        marginTop: 16,
        textAlign: 'center',
    },
});
