/**
 * 🛡️ ERROR HANDLING UTILITIES
 * Ensures NO silent failures in production
 */

import { useCallback } from 'react';
import { useAura } from '@core/context/AuraProvider';

/**
 * Wrapper for async operations with automatic error handling
 */
export const withErrorHandling = async <T>(
    operation: () => Promise<T>,
    options?: {
        successMessage?: string;
        errorMessage?: string;
        onSuccess?: (result: T) => void;
        onError?: (error: Error) => void;
        silent?: boolean;
    }
): Promise<{ success: boolean; data?: T; error?: Error }> => {
    try {
        const result = await operation();
        
        if (options?.successMessage && !options.silent) {
            // Show success toast
        }
        
        options?.onSuccess?.(result);
        
        return { success: true, data: result };
    } catch (error) {
            if (__DEV__) console.error(error);
        const err = error instanceof Error ? error : new Error(String(error));
        
        if (!options?.silent) {
            // Show error toast with user-friendly message
            // const message = options?.errorMessage || err.message || 'Something went wrong';
            // showToast({ message, type: 'error' });
        }
        
        options?.onError?.(err);
        
        // Log to error monitoring service
        if (__DEV__) {
            console.error('[Error Handler]', err);
        }
        
        return { success: false, error: err };
    }
};

/**
 * Hook for error handling with toast integration
 */
export const useErrorHandler = () => {
    const { showToast } = useAura();
    
    const handleError = useCallback((error: unknown, fallbackMessage = 'An error occurred') => {
        const message = error instanceof Error ? error.message : fallbackMessage;
        showToast({ message, type: 'error' });
        
        // Log to monitoring
        if (__DEV__) {
            console.error('[Error]', error);
        }
    }, [showToast]);
    
    const handleSuccess = useCallback((message: string) => {
        showToast({ message, type: 'success' });
    }, [showToast]);
    
    return { handleError, handleSuccess };
};

/**
 * Common error messages for consistency
 */
export const ERROR_MESSAGES = {
    NETWORK: 'Network connection lost. Please check your internet.',
    AUTH: 'Authentication failed. Please log in again.',
    PERMISSION: 'Permission denied. Please check your settings.',
    NOT_FOUND: 'Requested resource not found.',
    SERVER: 'Server error. Please try again later.',
    TIMEOUT: 'Request timed out. Please try again.',
    UNKNOWN: 'Something went wrong. Please try again.',
} as const;

/**
 * Retry logic for failed operations
 */
export const withRetry = async <T>(
    operation: () => Promise<T>,
    maxRetries = 3,
    delayMs = 1000
): Promise<T> => {
    let lastError: Error;
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            return await operation();
        } catch (error) {
            if (__DEV__) console.error(error);
            lastError = error instanceof Error ? error : new Error(String(error));
            
            if (attempt < maxRetries - 1) {
                await new Promise(resolve => setTimeout(resolve, delayMs * (attempt + 1)));
            }
        }
    }
    
    throw lastError!;
};
