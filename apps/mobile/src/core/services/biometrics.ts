import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * 🔐 INDUSTRIAL BIOMETRIC SERVICE
 * Secure enclave integration for sensitive operations (Auth/Payments).
 */

export const BiometricService = {
    /**
     * Check compatibility
     */
    async isHardwareAvailable() {
        return await LocalAuthentication.hasHardwareAsync();
    },

    /**
     * Check if user has enrolled biometrics
     */
    async isEnrolled() {
        return await LocalAuthentication.isEnrolledAsync();
    },

    /**
     * Authenticate
     */
    async authenticate(reason: string = 'Secure access required') {
        const hasHardware = await this.isHardwareAvailable();
        const enrolled = await this.isEnrolled();

        if (!hasHardware || !enrolled) return { success: false, error: 'hardware_unavailable' };

        const result = await LocalAuthentication.authenticateAsync({
            promptMessage: reason,
            fallbackLabel: 'Enter Passcode',
            disableDeviceFallback: false,
        });

        return result;
    },

    /**
     * Settings management
     */
    async setEnabled(enabled: boolean) {
        await AsyncStorage.setItem('biometrics_enabled', JSON.stringify(enabled));
    },

    async isEnabled() {
        const stored = await AsyncStorage.getItem('biometrics_enabled');
        return stored === 'true';
    }
};
