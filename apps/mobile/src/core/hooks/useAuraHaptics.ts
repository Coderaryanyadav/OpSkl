import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

/**
 * 📳 AURA HAPTICS ENGINE
 * Centralized tactile feedback controller for consistent industrial UX.
 */

export const useAuraHaptics = () => {
    const light = () => {
        if (Platform.OS === 'web') return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    };

    const medium = () => {
        if (Platform.OS === 'web') return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    };

    const heavy = () => {
        if (Platform.OS === 'web') return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    };

    const selection = () => {
        if (Platform.OS === 'web') return;
        Haptics.selectionAsync();
    };

    const success = () => {
        if (Platform.OS === 'web') return;
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    };

    const warning = () => {
        if (Platform.OS === 'web') return;
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    };

    const error = () => {
        if (Platform.OS === 'web') return;
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    };

    return {
        light,
        medium,
        heavy,
        selection,
        success,
        warning,
        error,
    };
};
