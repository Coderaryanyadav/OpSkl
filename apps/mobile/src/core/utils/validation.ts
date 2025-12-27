/**
 * 🛠️ CORE VALIDATION ENGINE
 * Typed validation logic for complex domain logic.
 */

// Email validation
export const validateEmail = (email: string): boolean => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
};

// Password validation (Min 8 chars, 1 number)
export const validatePassword = (password: string): boolean => {
    return password.length >= 8 && /\d/.test(password);
};

// Phone validation (Min 10 digits)
export const validatePhone = (phone: string): boolean => {
    const cleaned = phone.replace(/\D/g, '');
    return cleaned.length >= 10;
};

// URL Validation
export const validateUrl = (url: string): boolean => {
    try {
        const _url = new URL(url);
        return true;
    } catch {
        return /^(http|https):\/\/[^ "]+$/.test(url);
    }
};

// Date Validation
export const validateDate = (date: string | Date): boolean => {
    const d = new Date(date);
    return d instanceof Date && !isNaN(d.getTime());
};

// Amount Validation (Positive, max 2 decimals)
export const validateAmount = (amount: string | number): boolean => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return !isNaN(num) && num > 0 && /^\d+(\.\d{1,2})?$/.test(num.toString());
};

// JSON Validation
export const validateJson = (jsonString: string): boolean => {
    try {
        const o = JSON.parse(jsonString);
        return (o && typeof o === 'object');
    } catch {
        return false;
    }
};

// Username (Alphanumeric, 3-20 chars)
export const validateUsername = (username: string): boolean => {
    return /^[a-zA-Z0-9_]{3,20}$/.test(username);
};

// Bio (Max 500 chars)
export const validateBio = (bio: string): boolean => {
    return bio.length <= 500;
};
