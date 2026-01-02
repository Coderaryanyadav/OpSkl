/**
 * ⏱️ API TIMEOUT HANDLER
 * Ensures no API call hangs forever
 */

/**
 * Wraps a promise with a timeout
 * @param promise - The promise to wrap
 * @param timeoutMs - Timeout in milliseconds (default: 30s)
 * @returns Promise that rejects if timeout is reached
 */
export const withTimeout = <T,>(
    promise: Promise<T>,
    timeoutMs: number = 30000
): Promise<T> => {
    return Promise.race([
        promise,
        new Promise<T>((_, reject) =>
            setTimeout(
                () => reject(new Error('Request timed out. Please check your connection.')),
                timeoutMs
            )
        ),
    ]);
};

/**
 * Wraps an async function with automatic timeout
 * @param fn - Async function to wrap
 * @param timeoutMs - Timeout in milliseconds (default: 30s)
 * @returns Wrapped function with timeout
 */
export const withTimeoutWrapper = <T extends (...args: any[]) => Promise<any>>(
    fn: T,
    timeoutMs: number = 30000
): T => {
    return ((...args: Parameters<T>) => {
        return withTimeout(fn(...args), timeoutMs);
    }) as T;
};

/**
 * Retry logic with exponential backoff
 * @param fn - Function to retry
 * @param maxRetries - Maximum number of retries (default: 3)
 * @param baseDelay - Base delay in ms (default: 1000)
 * @returns Promise that resolves with the result or rejects after max retries
 */
export const withRetry = async <T,>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
): Promise<T> => {
    let lastError: Error;
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            return await fn();
        } catch (error) {
            if (__DEV__) console.error(error);
            lastError = error instanceof Error ? error : new Error(String(error));
            
            if (attempt < maxRetries - 1) {
                // Exponential backoff: 1s, 2s, 4s
                const delay = baseDelay * Math.pow(2, attempt);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }
    
    throw lastError!;
};

/**
 * Combined timeout + retry wrapper
 * Perfect for API calls
 */
export const apiCall = async <T,>(
    fn: () => Promise<T>,
    options?: {
        timeout?: number;
        retries?: number;
        retryDelay?: number;
    }
): Promise<T> => {
    const { timeout = 30000, retries = 3, retryDelay = 1000 } = options || {};
    
    return withRetry(
        () => withTimeout(fn(), timeout),
        retries,
        retryDelay
    );
};
