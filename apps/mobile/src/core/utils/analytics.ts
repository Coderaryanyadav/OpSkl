import { supabase } from '@api/supabase';

type EventName = 
    | 'APP_OPENED'
    | 'GIG_VIEWED'
    | 'GIG_APPLIED'
    | 'GIG_SHARED'
    | 'GIG_COMPLETED'
    | 'DISPUTE_INITIATED'
    | 'PROFILE_VIEWED'
    | 'SEARCH_PERFORMED'
    | 'FILTER_USED'
    | 'FUNDS_WITHDRAWN';

export const Analytics = {
    track: async (event: EventName, properties: Record<string, any> = {}) => {
        try {
            const { error } = await supabase.from('analytics_events').insert({
                event_name: event,
                properties,
                device_info: {
                    platform: 'mobile', 
                    // Add more if needed (e.g. Platform.OS using react-native)
                }
            });

            if (error) {
                // Fail silently in prod, log in dev
            }
        } catch (error) {
            if (__DEV__) console.error(error);
            console.error('Analytics track error:', error);
        }
    }
};
