import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

/**
 * 👤 USER GAMIFICATION STORE
 * Tracking operative experience and progression metrics.
 */

interface UserState {
    xp: number;
    level: number;
    addXp: (amount: number) => void;
    setLevel: (level: number) => void;
    syncGamification: (profileId: string) => Promise<void>;
}

export const useUserStore = create<UserState>()(
    immer((set) => ({
        xp: 0,
        level: 1,

        addXp: (amount: number) => {
            set((state: UserState) => {
                state.xp += amount;
                const newLevel = Math.floor(state.xp / 1000) + 1;
                if (newLevel > state.level) {
                    state.level = newLevel;
                }
            });
        },

        setLevel: (level: number) => {
            set((state: UserState) => {
                state.level = level;
            });
        },

        syncGamification: async (profileId: string) => {
            console.log(`Syncing gamification for ${profileId}`);
        }
    }))
);
