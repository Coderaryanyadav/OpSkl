import NetInfo from '@react-native-community/netinfo';


export const NetworkService = {
    /**
     * Initialize Global Network Monitoring
     */
    init() {
        NetInfo.addEventListener(state => {
            // Sync offline data if connection restored
            if (state.isConnected && state.isInternetReachable) {
                this.processOfflineQueue();
            }
        });
    },

    /**
     * Check current connectivity
     */
    async isConnected(): Promise<boolean> {
        const state = await NetInfo.fetch();
        return !!(state.isConnected && state.isInternetReachable);
    },

    /**
     * Process queued actions
     */
    async processOfflineQueue() {
        // TODO: Sync AsyncStorage queue to Supabase
    }
};
