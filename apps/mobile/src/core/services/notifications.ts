import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { supabase } from '../api/supabase';
import * as Device from 'expo-device';

/**
 * 🔔 INDUSTRIAL NOTIFICATION SERVICE
 * Manages push tokens, permission flows, and scheduling.
 */

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

export const NotificationService = {
    /**
     * Register for Push Notifications
     */
    async registerForPushNotificationsAsync() {
        if (!Device.isDevice) {
            console.warn('[NotificationService] Physical device required for push');
            return null;
        }

        let token;

        if (Platform.OS === 'android') {
            await Notifications.setNotificationChannelAsync('default', {
                name: 'default',
                importance: Notifications.AndroidImportance.MAX,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#FF231F7C',
            });
        }

        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }

        if (finalStatus !== 'granted') {
            console.warn('[NotificationService] Permission not granted');
            return null;
        }

        // Get Expo Push Token
        try {
            const projectId = process.env.EXPO_PUBLIC_PROJECT_ID;
            token = (await Notifications.getExpoPushTokenAsync(
                projectId ? { projectId } : undefined
            )).data;

            // 🔒 SECURE: Fetch current auth session internally
            const { data: { user } } = await supabase.auth.getUser();

            if (user && token) {
                await supabase
                    .from('profiles')
                    .update({ push_token: token })
                    .eq('id', user.id);
            }
        } catch (e) {
            console.error('[NotificationService] Token retrieval failed:', e);
        }

        return token;
    },

    /**
     * Schedule Local Notification
     */
    async scheduleNotification(title: string, body: string, seconds: number = 1) {
        await Notifications.scheduleNotificationAsync({
            content: {
                title,
                body,
                sound: true,
            },
            trigger: { 
                seconds,
                type: 'timeInterval'
            } as any,
        });
    }
};
