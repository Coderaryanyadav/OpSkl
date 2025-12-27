import { supabase } from '../api/supabase';
import * as Device from 'expo-device';

/**
 * 📊 INDUSTRIAL ANALYTICS SERVICE
 * Pluggable architecture for event tracking with DB persistence.
 */

interface AnalyticsEvent {
    name: string;
    properties?: Record<string, any>;
    userId?: string;
}

class AnalyticsService {
    private enabled: boolean = !__DEV__;
    private events: AnalyticsEvent[] = [];
    private currentUserId: string | null = null;

    /**
     * Track user actions with metadata.
     * Optionally persists to Supabase for backend tracking.
     */
    async track(name: string, properties?: Record<string, any>, persist: boolean = true, userId?: string) {
        if (!this.enabled) {
            if (__DEV__) console.info(`[Analytics] Event: ${name}`, properties);
            return;
        }

        const effectiveUserId = userId || this.currentUserId;

        const event: AnalyticsEvent = {
            name,
            properties: {
                ...properties,
                timestamp: new Date().toISOString(),
                platform: 'mobile',
            },
            userId: effectiveUserId || undefined
        };

        this.events.push(event);

        if (persist) {
            try {
                const eventData = {
                    event_name: name,
                    user_id: effectiveUserId || null,
                    properties: properties,
                    device_model: Device.modelName,
                    os_name: Device.osName,
                    os_version: Device.osVersion,
                    timestamp: new Date().toISOString()
                };

                await supabase.from('analytics_events').insert(eventData);
            } catch (e) {
                console.warn('[Analytics] Persist Error:', e);
            }
        }
    }

    screen(screenName: string, properties?: Record<string, any>) {
        this.track('screen_view', {
            screen_name: screenName,
            ...properties,
        });
    }

    async identify(userId: string, traits?: Record<string, any>) {
        if (__DEV__) console.info(`[Analytics] Identify: ${userId}`, traits);
        this.currentUserId = userId;
        
        if (!this.enabled) return;
        
        try {
            await supabase.from('profiles').update({ last_seen: new Date().toISOString() }).eq('id', userId);
        } catch (e) {
            console.warn('[Analytics] Identify Sync Error:', e);
        }
    }

    setUserId(id: string | null) {
        this.currentUserId = id;
    }

    setUserProperties(properties: Record<string, any>) {
        if (!this.enabled) return;
        this.track('user_properties_update', properties);
    }

    setEnabled(enabled: boolean) {
        this.enabled = enabled;
    }
}

export const analytics = new AnalyticsService();

// Convenience functions
export const trackEvent = (name: string, properties?: Record<string, any>, persist?: boolean, userId?: string) => analytics.track(name, properties, persist, userId);
export const trackScreen = (screenName: string, properties?: Record<string, any>) => analytics.screen(screenName, properties);
export const identifyUser = (userId: string, traits?: Record<string, any>) => analytics.identify(userId, traits);

export const AnalyticsEvents = {
    AUTH: {
        SIGN_UP: 'auth_sign_up',
        SIGN_IN: 'auth_sign_in',
        SIGN_OUT: 'auth_sign_out',
    },
    GIGS: {
        CREATED: 'gig_created',
        VIEWED: 'gig_viewed',
        APPLIED: 'gig_applied',
        COMPLETED: 'gig_completed',
    },
    FINANCE: {
        TRANSACTION_INITIATED: 'transaction_initiated',
        TRANSACTION_COMPLETED: 'transaction_completed',
    },
    SYSTEM: {
        APP_OPENED: 'app_opened',
        ERROR_ENCOUNTERED: 'error_encountered',
    }
};
