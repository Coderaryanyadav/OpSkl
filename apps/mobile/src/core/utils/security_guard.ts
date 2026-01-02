/**
 * 🛡️ OPSKL SECURITY UTILITIES
 * Hardened protocols for preventing platform leakage and ensuring street-grade reliability.
 */

import { Repository } from "../api/repository";

export const SECURITY_CONFIG = {
    LEAKAGE_KEYWORDS: ['whatsapp', 'call me', 'number is', 'pay direct', 'google pay', 'phonepe', 'contact me at'],
    PHONE_REGEX: /(\+?\d{1,4}[\s-]?)?\(?\d{3,5}\)?[\s-]?\d{3,5}[\s-]?\d{3,5}/,
    URL_REGEX: /((https?:\/\/)?(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*))/
};

export class SecurityGuard {
    /**
     * 🔍 LEAKAGE SCANNER
     * Scans outgoing signals for platform bypass attempts.
     */
    static async scanForLeakage(text: string, userId: string, gigId?: string): Promise<{ isSafe: boolean; warning?: string }> {
        // Normalization Layer: Remove obfuscation (dots, spaces, special chars)
        const normalizedText = text.toLowerCase().replace(/[^a-z0-9]/g, '');
        const lowerText = text.toLowerCase();
        
        let leakageDetected = false;
        let reason = "";
        const matchedTriggers: string[] = [];

        // 1. Normalized Keyword Check (Catches "W.h.a.t.s.a.p.p", etc.)
        for (const word of SECURITY_CONFIG.LEAKAGE_KEYWORDS) {
            const normalizedWord = word.replace(/\s/g, '');
            if (normalizedText.includes(normalizedWord)) {
                leakageDetected = true;
                reason = "Obfuscated Bypass Attempt Detected";
                matchedTriggers.push(word);
                break;
            }
        }

        // 2. Original Keyword Check
        if (!leakageDetected) {
            for (const word of SECURITY_CONFIG.LEAKAGE_KEYWORDS) {
                if (lowerText.includes(word)) {
                    leakageDetected = true;
                    reason = "Direct Bypass Attempt Detected";
                    matchedTriggers.push(word);
                    break;
                }
            }
        }

        // 3. Pattern Recognition (Phone/UPI/Links)
        // Aggressive digit-only scan for phone numbers hidden with text
        const digitsOnly = text.replace(/\D/g, '');
        if (!leakageDetected && digitsOnly.length >= 10) {
            leakageDetected = true;
            reason = "Numeric Payload Detected (Potential Phone/UPI)";
        }

        if (!leakageDetected && (SECURITY_CONFIG.PHONE_REGEX.test(text) || SECURITY_CONFIG.URL_REGEX.test(text))) {
            leakageDetected = true;
            reason = "Pattern Signature Detected";
        }

        if (leakageDetected) {
            // Log security telemetry
            await Repository.logSecurityEvent('LEAKAGE_ATTEMPT', {
                reason,
                text_snippet: text.substring(0, 20) + '...',
                gig_id: gigId
            }, { platform: 'OpSkl-Shield' });

            return {
                isSafe: false,
                warning: "⚠️ SECURITY PROTOCOL: Moving transactions offline voids your Escrow protection and Reputation gains. Operational status may be suspended."
            };
        }

        return { isSafe: true };
    }
}
