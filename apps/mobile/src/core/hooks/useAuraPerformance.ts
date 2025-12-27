import { InteractionManager } from 'react-native';

/**
 * ⚡ AURA PERFORMANCE HOOK
 * Utilities for optimizing interaction fidelity and task scheduling.
 */
export const useAuraPerformance = () => {
    /**
     * Defer execution until all animations/interactions are complete.
     */
    const runAfterInteractions = (task: () => void) => {
        InteractionManager.runAfterInteractions(() => {
            task();
        });
    };

    /**
     * Standard debounce implementation for high-frequency events.
     */
    const debounce = (func: Function, delay: number) => {
        let timeoutId: NodeJS.Timeout;
        return (...args: any[]) => {
            if (timeoutId) clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                func(...args);
            }, delay);
        };
    };

    /**
     * Trigger manual garbage collection (Environment dependent).
     */
    const checkMemory = () => {
        if (global.gc) global.gc();
    };

    return {
        runAfterInteractions,
        debounce,
        checkMemory
    };
};
