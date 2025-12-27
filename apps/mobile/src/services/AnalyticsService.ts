import { supabase } from '../core/api/supabase';
import * as Device from 'expo-device';


export const AnalyticsService = {
    /**
     * Log a custom event to Supabase
     */
    async logEvent(eventName: string, properties: Record<string, any> = {}) {
        try {
            const { data: { user } } = await supabase.auth.getUser();

            const eventData = {
                event_name: eventName,
                user_id: user?.id || null, // Allow anonymous events if needed
                properties: properties,
                device_model: Device.modelName,
                os_name: Device.osName,
                os_version: Device.osVersion,
                timestamp: new Date().toISOString()
            };

            // Persist to DB
            const { error } = await supabase
                .from('analytics_events')
                .insert(eventData);

            if (error) {
                console.warn('Failed to log analytics:', error.message);
            }
        } catch (e) {
            console.warn('Analytics Error:', e);
        }
    },

    /**
     * Log Screen View
     */
    async logScreenView(screenName: string) {
        await this.logEvent('screen_view', { screen_name: screenName });
    }
};
