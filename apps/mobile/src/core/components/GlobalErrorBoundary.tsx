/**
 * 🛡️ GLOBAL ERROR BOUNDARY
 * Catches unhandled React errors and shows friendly UI
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { AuraText } from '@core/components/AuraText';
import { AuraButton } from '@core/components/AuraButton';
import { AuraColors, AuraSpacing } from '@theme/aura';
import { AlertTriangle } from 'lucide-react-native';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

/**
 * Global error boundary - wrap your app with this
 * Usage: <GlobalErrorBoundary><App /></GlobalErrorBoundary>
 */
export class GlobalErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        // Log to error monitoring service
        console.error('Global Error Boundary caught:', error, errorInfo);

        // TODO: Send to Sentry/Bugsnag
        // ErrorMonitor.captureError(error, { errorInfo });
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null });
    };

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <View style={styles.container}>
                    <View style={styles.iconContainer}>
                        <AlertTriangle size={64} color={AuraColors.error} />
                    </View>

                    <AuraText variant="h2" align="center" style={styles.title}>
                        Something Went Wrong
                    </AuraText>

                    <AuraText
                        variant="body"
                        color={AuraColors.gray400}
                        align="center"
                        style={styles.message}
                    >
                        We've encountered an unexpected error. Don't worry, your data is safe.
                    </AuraText>

                    {__DEV__ && this.state.error && (
                        <View style={styles.errorBox}>
                            <AuraText variant="caption" color={AuraColors.error}>
                                {this.state.error.message}
                            </AuraText>
                        </View>
                    )}

                    <AuraButton
                        title="Restart App"
                        onPress={this.handleReset}
                        variant="primary"
                        style={styles.button}
                    />

                    <TouchableOpacity onPress={() => {
                        // TODO: Navigate to support/feedback
                    }}>
                        <AuraText variant="label" color={AuraColors.primary} align="center">
                            Report This Issue
                        </AuraText>
                    </TouchableOpacity>
                </View>
            );
        }

        return this.props.children;
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: AuraSpacing.xl,
        backgroundColor: AuraColors.background,
    },
    iconContainer: {
        marginBottom: 24,
    },
    title: {
        marginBottom: 16,
    },
    message: {
        marginBottom: 32,
        paddingHorizontal: 20,
    },
    errorBox: {
        backgroundColor: AuraColors.surface,
        padding: 16,
        borderRadius: 8,
        marginBottom: 24,
        maxWidth: '100%',
    },
    button: {
        width: '100%',
        marginBottom: 16,
    },
});
