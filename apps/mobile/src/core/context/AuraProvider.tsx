import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuraToast } from '../components/AuraToast';
import { AuraDialog } from '../components/AuraDialog';
import { AuraTutorial } from '../components/AuraTutorial';
import { Repository } from '../api/repository';
import { supabase } from '../api/supabase';
import * as Haptics from 'expo-haptics';

interface ToastOptions {
    message: string;
    type?: 'success' | 'error' | 'info';
}

interface DialogOptions {
    title: string;
    message: string;
    type?: 'success' | 'error' | 'warning' | 'info';
    onConfirm: () => void;
    onCancel?: () => void;
}

interface AuraContextType {
    // UI Commands
    showToast: (options: ToastOptions) => void;
    showDialog: (options: DialogOptions) => void;
    startTutorial: (steps: any[]) => void;

    // Global State
    profile: any | null;
    wallet: any | null;
    gigs: any[];
    loading: boolean;
    refreshData: () => Promise<void>;

    // Gamification
    xp: number;
    level: number;
    addXp: (amount: number) => void;
}

const AuraContext = createContext<AuraContextType | undefined>(undefined);

export const AuraProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // UI State
    const [toastVisible, setToastVisible] = useState(false);
    const [toastConfig, setToastConfig] = useState<ToastOptions>({ message: '', type: 'info' });
    const [dialogVisible, setDialogVisible] = useState(false);
    const [dialogConfig, setDialogConfig] = useState<DialogOptions>({
        title: '', message: '', type: 'info', onConfirm: () => { }
    });
    const [tutorialVisible, setTutorialVisible] = useState(false);
    const [tutorialSteps, setTutorialSteps] = useState<any[]>([]);

    // Global Data State
    const [profile, setProfile] = useState<any | null>(null);
    const [wallet, setWallet] = useState<any | null>(null);
    const [gigs, setGigs] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    // Gamification State
    const [xp, setXp] = useState(0);
    const [level, setLevel] = useState(1);

    const refreshData = useCallback(async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        setLoading(true);
        try {
            const [profileRes, walletRes, gigsRes] = await Promise.all([
                Repository.getProfile(session.user.id),
                Repository.getWalletBalance(session.user.id),
                Repository.getGigs()
            ]);

            if (profileRes.data) setProfile(profileRes.data);
            if (walletRes.data) setWallet(walletRes.data);
            if (gigsRes.data) setGigs(gigsRes.data);
        } catch (error) {
            console.error('[AuraProvider] Sync failed:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        refreshData();

        // Listen for profile changes to keep state in sync
        const profileSub = supabase.channel('profile-sync')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'profiles'
            }, () => refreshData())
            .subscribe();

        return () => { supabase.removeChannel(profileSub); };
    }, [refreshData]);

    const showToast = useCallback((options: ToastOptions) => {
        setToastConfig(options);
        setToastVisible(true);
        if (options.type === 'error') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        else Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }, []);

    const showDialog = useCallback((options: DialogOptions) => {
        setDialogConfig(options);
        setDialogVisible(true);
    }, []);

    const startTutorial = useCallback(async (steps: any[]) => {
        const hasSeen = await AsyncStorage.getItem('hasSeenTutorial');
        if (!hasSeen) {
            setTutorialSteps(steps);
            setTutorialVisible(true);
        }
    }, []);

    const handleTutorialComplete = async () => {
        setTutorialVisible(false);
        await AsyncStorage.setItem('hasSeenTutorial', 'true');
    };

    const addXp = useCallback((amount: number) => {
        setXp(prev => {
            const newXp = prev + amount;
            const newLevel = Math.floor(newXp / 1000) + 1;
            if (newLevel > level) {
                setLevel(newLevel);
                showToast({
                    message: `LEVEL UP! You are now Level ${newLevel}`,
                    type: 'success'
                });
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
            return newXp;
        });
    }, [level, showToast]);

    return (
        <AuraContext.Provider value={{
            showToast,
            showDialog,
            startTutorial,
            profile,
            wallet,
            gigs,
            loading,
            refreshData,
            xp,
            level,
            addXp
        }}>
            {children}

            <AuraToast
                visible={toastVisible}
                message={toastConfig.message}
                type={toastConfig.type}
                onHide={() => setToastVisible(false)}
            />

            <AuraDialog
                visible={dialogVisible}
                title={dialogConfig.title}
                message={dialogConfig.message}
                type={dialogConfig.type}
                onConfirm={() => {
                    dialogConfig.onConfirm();
                    setDialogVisible(false);
                }}
                onCancel={() => {
                    dialogConfig.onCancel?.();
                    setDialogVisible(false);
                }}
            />

            <AuraTutorial
                visible={tutorialVisible}
                steps={tutorialSteps}
                onComplete={handleTutorialComplete}
            />
        </AuraContext.Provider>
    );
};

export const useAura = () => {
    const context = useContext(AuraContext);
    if (!context) throw new Error('useAura must be used within an AuraProvider');
    return context;
};
