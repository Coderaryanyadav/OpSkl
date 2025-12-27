/**
 * Rate Limiting Middleware for Supabase
 * Prevents API abuse
 */

interface RateLimitConfig {
    maxRequests: number;
    windowMs: number;
}

class RateLimiter {
    private requests: Map<string, number[]> = new Map();
    private config: RateLimitConfig;

    constructor(config: RateLimitConfig) {
        this.config = config;
    }

    checkLimit(userId: string): boolean {
        const now = Date.now();
        const userRequests = this.requests.get(userId) || [];

        // Remove old requests outside the window
        const validRequests = userRequests.filter(
            timestamp => now - timestamp < this.config.windowMs
        );

        if (validRequests.length >= this.config.maxRequests) {
            return false; // Rate limit exceeded
        }

        // Add current request
        validRequests.push(now);
        this.requests.set(userId, validRequests);

        return true; // Request allowed
    }

    reset(userId: string) {
        this.requests.delete(userId);
    }
}

// Export rate limiters for different operations
export const gigCreationLimiter = new RateLimiter({
    maxRequests: 10, // 10 gigs
    windowMs: 60 * 60 * 1000, // per hour
});

export const applicationLimiter = new RateLimiter({
    maxRequests: 50, // 50 applications
    windowMs: 60 * 60 * 1000, // per hour
});

export const messageLimiter = new RateLimiter({
    maxRequests: 100, // 100 messages
    windowMs: 60 * 60 * 1000, // per hour
});

export const authLimiter = new RateLimiter({
    maxRequests: 5, // 5 attempts
    windowMs: 15 * 60 * 1000, // per 15 minutes
});
