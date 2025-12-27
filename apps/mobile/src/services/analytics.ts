/**
 * Analytics Service
 * Track user events and behavior
 */

interface AnalyticsEvent {
    name: string;
    properties?: Record<string, any>;
    userId?: string;
}

class AnalyticsService {
    private enabled: boolean = true;
    private events: AnalyticsEvent[] = [];

    // Track an event
    track(name: string, properties?: Record<string, any>) {
        if (!this.enabled) return;

        const event: AnalyticsEvent = {
            name,
            properties: {
                ...properties,
                timestamp: new Date().toISOString(),
                platform: 'mobile',
            },
        };

        this.events.push(event);

        // Local event queue
    }

    // Track screen view
    screen(screenName: string, properties?: Record<string, any>) {
        this.track('screen_view', {
            screen_name: screenName,
            ...properties,
        });
    }

    // Identify user
    identify(_userId: string, _traits?: Record<string, any>) {
        if (!this.enabled) return;


        // User identity mapping
    }

    // Track user properties
    setUserProperties(_properties: Record<string, any>) {
        if (!this.enabled) return;


        // Sync user properties
    }

    // Enable/disable analytics
    setEnabled(enabled: boolean) {
        this.enabled = enabled;
    }

    // Get all tracked events (for debugging)
    getEvents() {
        return this.events;
    }

    // Clear events
    clearEvents() {
        this.events = [];
    }
}

// Export singleton instance
export const analytics = new AnalyticsService();

// Convenience functions
export const trackEvent = (name: string, properties?: Record<string, any>) => {
    analytics.track(name, properties);
};

export const trackScreen = (screenName: string, properties?: Record<string, any>) => {
    analytics.screen(screenName, properties);
};

export const identifyUser = (userId: string, traits?: Record<string, any>) => {
    analytics.identify(userId, traits);
};

// Common events
export const AnalyticsEvents = {
    // Auth
    SIGN_UP: 'sign_up',
    SIGN_IN: 'sign_in',
    SIGN_OUT: 'sign_out',

    // Gigs
    GIG_CREATED: 'gig_created',
    GIG_VIEWED: 'gig_viewed',
    GIG_APPLIED: 'gig_applied',
    GIG_COMPLETED: 'gig_completed',

    // Gamification
    XP_EARNED: 'xp_earned',
    LEVEL_UP: 'level_up',
    QUEST_COMPLETED: 'quest_completed',
    ACHIEVEMENT_UNLOCKED: 'achievement_unlocked',
    LOOT_BOX_OPENED: 'loot_box_opened',

    // Finance
    DEPOSIT_INITIATED: 'deposit_initiated',
    DEPOSIT_COMPLETED: 'deposit_completed',
    WITHDRAWAL_INITIATED: 'withdrawal_initiated',
    REFERRAL_USED: 'referral_used',

    // Social
    GIG_SHARED: 'gig_shared',
    REVIEW_SUBMITTED: 'review_submitted',
    LEADERBOARD_VIEWED: 'leaderboard_viewed',

    // Student
    DEAL_REDEEMED: 'deal_redeemed',
    SCHEDULE_SAVED: 'schedule_saved',
    EXAM_MODE_TOGGLED: 'exam_mode_toggled',
};
