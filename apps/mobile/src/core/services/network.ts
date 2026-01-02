import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../api/supabase';

/**
 * 📡 INDUSTRIAL NETWORK SERVICE
 * Handles offline detection and synchronization queueing.
 */

const SYNC_QUEUE_KEY = '@aura_sync_queue';

export const NetworkService = {
    /**
     * Listen for connectivity changes
     */
    onConnectivityChange(callback: (isConnected: boolean) => void) {
        return NetInfo.addEventListener(state => {
            callback(state.isConnected ?? false);
            if (state.isConnected) {
                this.processOfflineQueue();
            }
        });
    },

    /**
     * Check current state
     */
    async isOnline() {
        const state = await NetInfo.fetch();
        return state.isConnected ?? false;
    },

    /**
     * Queue high-priority operations while offline
     */
    async addToQueue(operation: any) {
        try {
            const queue = await this.getQueue();
            queue.push({
                ...operation,
                id: Math.random().toString(36).substring(7),
                timestamp: new Date().toISOString()
            });
            await AsyncStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
        } catch (error) {
            if (__DEV__) console.error(error);
            console.error('Sync signal enqueue error:', error);
        }
    },

    async getQueue() {
        const data = await AsyncStorage.getItem(SYNC_QUEUE_KEY);
        return data ? JSON.parse(data) : [];
    },

    /**
     * Synchronize pending operations with Supabase
     */
    async processOfflineQueue() {
        const queue = await this.getQueue();
        if (queue.length === 0) return;

        console.info(`[NetworkService] Processing ${queue.length} offline operations...`);

        for (const op of queue) {
            try {
                // Example: { type: 'GIG_APPLY', payload: { gigId, userId } }
                if (op.type === 'GIG_APPLY') {
                    await supabase.from('applications').insert({
                        gig_id: op.payload.gigId,
                        user_id: op.payload.userId
                    });
                }
                // (Extend for other types)
            } catch (error) {
            if (__DEV__) console.error(error);
                console.error('Sync queue process error:', error);
                continue;
            }
        }

        // Wipe queue if handled
        await AsyncStorage.removeItem(SYNC_QUEUE_KEY);
    }
};
