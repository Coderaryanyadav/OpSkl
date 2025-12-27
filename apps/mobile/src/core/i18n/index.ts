import { I18n } from 'i18n-js';

/**
 * 🌍 BHARAT LOCALIZATION ENGINE
 * Optimized for Indian operations (Hindi + English).
 */

const i18n = new I18n({
    en: {
        welcome: 'Namaste',
        login: 'Login',
        signup: 'Sign Up',
        home: 'Home',
        profile: 'My Profile',
        messages: 'Chat',
        settings: 'Settings',
        mission_control: 'Active Kaam',
        treasury: 'Wallet',
        discovery: 'Find Kaam',
        kaam: 'Kaam',
        professional: 'Professional',
        customer: 'Customer',
        dashboard: 'Dashboard',
    },
    hi: {
        welcome: 'नमस्ते',
        login: 'लॉगिन',
        signup: 'साइन अप',
        home: 'होम',
        profile: 'मेरी प्रोफाइल',
        messages: 'चैट',
        settings: 'सेटिंग्स',
        mission_control: 'सक्रिय काम',
        treasury: 'वॉलेट',
        discovery: 'काम खोजें',
        kaam: 'काम',
        professional: 'प्रोफेशनल',
        customer: 'ग्राहक',
        dashboard: 'डैशबोर्ड',
    }
});

// Hardcoded for India operations
i18n.locale = 'en'; // Default to English, but ready for toggle
i18n.enableFallback = true;

export default i18n;

export const translate = (key: string, options?: any) => i18n.t(key, options);
