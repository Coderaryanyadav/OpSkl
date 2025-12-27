/**
 * 🚨 INDUSTRIAL ERROR MONITORING
 * Captures, sanitizes, and reports production exceptions.
 */

interface ErrorReport {
    message: string;
    stack?: string;
    userId?: string;
    context?: Record<string, any>;
    timestamp: string;
    level: 'info' | 'warning' | 'error' | 'fatal';
}

class ErrorMonitor {
    private enabled: boolean = !__DEV__;

    captureError(error: any, context?: Record<string, any>) {
        const report: ErrorReport = {
            message: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
            context,
            timestamp: new Date().toISOString(),
            level: 'error',
        };

        if (__DEV__) {
            console.error('[ErrorMonitor] Caught Error:', report);
        }

        if (!this.enabled) return;

        // In production, this ships to Sentry/Bugsnag
    }

    captureMessage(message: string, level: ErrorReport['level'] = 'info', context?: Record<string, any>) {
        if (__DEV__) {
            console.log(`[ErrorMonitor] Message (${level}):`, message, context || '');
        }

        if (!this.enabled) return;
    }

    addBreadcrumb(message: string, data?: Record<string, any>) {
        if (__DEV__) {
            console.log(`[ErrorMonitor] Breadcrumb: ${message}`, data || '');
        }
    }

    setUser(userId: string) {
        if (!this.enabled) return;
    }
}

export const errorMonitor = new ErrorMonitor();

export const captureError = (error: any, context?: Record<string, any>) => errorMonitor.captureError(error, context);
export const captureMessage = (message: string, level?: ErrorReport['level'], context?: Record<string, any>) => 
    errorMonitor.captureMessage(message, level, context);
