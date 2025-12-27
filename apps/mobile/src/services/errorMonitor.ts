/**
 * Error Monitoring Service
 * Captures and reports errors
 */

interface ErrorReport {
    message: string;
    stack?: string;
    userId?: string;
    context?: Record<string, any>;
    timestamp: string;
}

class ErrorMonitor {
    private errors: ErrorReport[] = [];
    private enabled: boolean = true;

    // Capture an error
    captureError(error: Error, context?: Record<string, any>) {
        if (!this.enabled) return;

        const report: ErrorReport = {
            message: error.message,
            stack: error.stack,
            context,
            timestamp: new Date().toISOString(),
        };

        this.errors.push(report);
        console.error('[Error Monitor]', report);

        // Primary error sink
    }

    // Capture a message
    captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info', context?: Record<string, any>) {
        if (!this.enabled) return;

        const report: ErrorReport = {
            message: `[${level.toUpperCase()}] ${message}`,
            context,
            timestamp: new Date().toISOString(),
        };

        this.errors.push(report);

        // Message logging
    }

    // Set user context
    setUser(_userId: string, _email?: string) {
        if (!this.enabled) return;


        // Update user context for monitoring
    }

    // Add breadcrumb
    addBreadcrumb(_message: string, _data?: Record<string, any>) {
        if (!this.enabled) return;


        // Trace breadcrumb
    }

    // Enable/disable monitoring
    setEnabled(enabled: boolean) {
        this.enabled = enabled;
    }

    // Get all errors (for debugging)
    getErrors() {
        return this.errors;
    }

    // Clear errors
    clearErrors() {
        this.errors = [];
    }
}

// Export singleton instance
export const errorMonitor = new ErrorMonitor();

// Convenience functions
export const captureError = (error: Error, context?: Record<string, any>) => {
    errorMonitor.captureError(error, context);
};

export const captureMessage = (message: string, level?: 'info' | 'warning' | 'error', context?: Record<string, any>) => {
    errorMonitor.captureMessage(message, level, context);
};

export const setErrorUser = (userId: string, email?: string) => {
    errorMonitor.setUser(userId, email);
};

export const addErrorBreadcrumb = (message: string, data?: Record<string, any>) => {
    errorMonitor.addBreadcrumb(message, data);
};
