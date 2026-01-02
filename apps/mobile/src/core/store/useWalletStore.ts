import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { Wallet, Transaction } from '@types';
import { Repository } from '@api/repository';

interface WalletState {
    wallet: Wallet | null;
    transactions: Transaction[];
    loading: boolean;
    sync: (userId: string) => Promise<void>;
}

export const useWalletStore = create<WalletState>()(
    immer((set) => ({
        wallet: null,
        transactions: [],
        loading: false,

        sync: async (userId) => {
            if (!userId) return;
            set((state) => { state.loading = true; });
            try {
                const [walletRes, transRes] = await Promise.all([
                    Repository.getWalletBalance(userId),
                    Repository.getTransactions(userId),
                ]);

                set((state) => {
                    if (walletRes.data) state.wallet = walletRes.data;
                    if (transRes.data) state.transactions = transRes.data;
                    state.loading = false;
                });
            } catch (error) {
            if (__DEV__) console.error(error);
                console.error('Wallet fetch error:', error);
            } finally {  set((state) => { state.loading = false; });
            }
        },
    }))
);
