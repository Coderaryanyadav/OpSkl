import * as LocalAuthentication from 'expo-local-authentication';
import { Alert } from 'react-native';


export const BiometricService = {
    async isEnrolled() {
        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        const isEnrolled = await LocalAuthentication.isEnrolledAsync();
        return hasHardware && isEnrolled;
    },

    async authenticate(reason: string = 'Access sensitive data'): Promise<boolean> {
        const hasBiometrics = await this.isEnrolled();
        if (!hasBiometrics) return true; // Fallback to PIN/Passcode if not available

        const result = await LocalAuthentication.authenticateAsync({
            promptMessage: reason,
            fallbackLabel: 'Use Passcode',
            cancelLabel: 'Cancel',
            disableDeviceFallback: false,
        });

        if (!result.success && result.error !== 'user_cancel') {
            Alert.alert('Authentication Failed', 'Please try again.');
        }

        return result.success;
    }
};
