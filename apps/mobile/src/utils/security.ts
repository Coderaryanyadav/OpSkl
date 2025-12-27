
// --- Rate Limiting ---
const rateLimits: { [key: string]: { count: number, lastTime: number } } = {};

/**
 * Checks if an action is rate limited.
 * @param key Unique key for the action (e.g., 'login_attempt', 'send_message')
 * @param limit Max number of attempts allowed
 * @param windowMs Time window in milliseconds
 * @returns true if allowed, false if rate limited
 */
export const checkRateLimit = (key: string, limit: number, windowMs: number): boolean => {
    const now = Date.now();
    const record = rateLimits[key];

    if (!record) {
        rateLimits[key] = { count: 1, lastTime: now };
        return true;
    }

    if (now - record.lastTime > windowMs) {
        // Reset window
        rateLimits[key] = { count: 1, lastTime: now };
        return true;
    }

    if (record.count >= limit) {
        return false;
    }

    record.count++;
    return true;
};

// --- Input Sanitization ---
/**
 * Sanitizes a string to prevent XSS and injection attacks.
 * Removes HTML tags and potentially dangerous characters.
 */
export const sanitizeInput = (input: string): string => {
    if (!input) return '';
    return input
        .replace(/<[^>]*>/g, '') // Remove HTML tags
        .replace(/javascript:/gi, '') // Remove javascript: protocol
        .replace(/on\w+=/gi, '') // Remove event handlers like onclick=
        .trim();
};

/**
 * Validates a phone number.
 * Must be 10 digits.
 */
export const isValidPhone = (phone: string): boolean => {
    const phoneRegex = /^[0-9]{10}$/;
    return phoneRegex.test(phone);
};

/**
 * Validates an email address.
 */
export const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

/**
 * Mask sensitive data like phone numbers or emails for display.
 */
export const maskData = (data: string, type: 'phone' | 'email'): string => {
    if (!data) return '';
    if (type === 'phone' && data.length >= 4) {
        return '*'.repeat(data.length - 4) + data.slice(-4);
    }
    if (type === 'email') {
        const [name, domain] = data.split('@');
        if (!name || !domain) return data;
        return name.slice(0, 2) + '***@' + domain;
    }
    return data;
};

// --- Profanity Filter ---
const PROFANITY_LIST = ['badword', 'offensive', 'spam', 'abuse']; // Expand in production

/**
 * Checks text for profanity.
 * @returns true if text contains profanity.
 */
export const containsProfanity = (text: string): boolean => {
    const lower = text.toLowerCase();
    return PROFANITY_LIST.some(word => lower.includes(word));
};

export const secureLog = (_message: string, _error?: any) => {
    if (__DEV__) {
    }
};
