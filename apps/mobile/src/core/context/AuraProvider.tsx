import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { useAuraHaptics } from '@core/hooks/useAuraHaptics';
import { AuraToast } from '../components/AuraToast';
import { AuraDialog } from '../components/AuraDialog';
import { AuraTutorial } from '../components/AuraTutorial';
import { SyncPulseBar } from '../components/SyncPulseBar';
import { supabase } from '@api/supabase';
import { Repository } from '@api/repository';
import { PersistenceNode } from '../services/PersistenceNode';
import { Profile, Wallet } from '@types';
import { RealtimeChannel } from '@supabase/supabase-js';
import { useGigStore } from '../store/useGigStore';
import * as Location from 'expo-location';
import { Analytics } from '../utils/analytics';

interface ToastOptions {
    message: string;
    type?: 'success' | 'error' | 'info' | 'warning';
}

interface DialogOptions {
    title: string;
    message: string;
    type?: 'success' | 'error' | 'warning' | 'info';
    primaryLabel?: string;
    secondaryLabel?: string;
    onConfirm: () => void;
    onCancel?: () => void;
}

interface AuraContextType {
    // UI Commands
    showToast: (options: ToastOptions) => void;
    showDialog: (options: DialogOptions) => void;
    startTutorial: (steps: any[]) => void;

    // Data State
    profile: Profile | null;
    wallet: Wallet | null;
    reputationPoints: number;
    clearanceLevel: number;
    loading: boolean;
    currentLocation: { lat: number, lng: number } | null;
    lastRefresh: number;

    // Data Actions
    refreshData: () => Promise<void>;
    addReputation: (amount: number) => Promise<void>;
    sendSOS: () => Promise<void>;
    indexEscrowPayment: (gigId: string, transactionId: string, amountCents: number, metadata?: any) => Promise<void>;
}

const AuraContext = createContext<AuraContextType | undefined>(undefined);

export const AuraProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const haptics = useAuraHaptics();
    const refreshPending = useRef(false);

    // UI State
    const [toastVisible, setToastVisible] = useState(false);
    const [toastConfig, setToastConfig] = useState<ToastOptions>({ message: '', type: 'info' });
    const [dialogVisible, setDialogVisible] = useState(false);
    const [dialogConfig, setDialogConfig] = useState<DialogOptions>({
        title: '', message: '', type: 'info', onConfirm: () => { }
    });
    const [tutorialVisible, setTutorialVisible] = useState(false);
    const [tutorialSteps, setTutorialSteps] = useState<any[]>([]);

    // Data State
    const [profile, setProfile] = useState<Profile | null>(null);
    const [wallet, setWallet] = useState<Wallet | null>(null);
    const [reputationPoints, setReputationPoints] = useState(0);
    const [clearanceLevel, setClearanceLevel] = useState(1);
    const [loading, setLoading] = useState(true);
    const [lastRefresh, setLastRefresh] = useState(Date.now());
    const [currentLocation, setCurrentLocation] = useState<{ lat: number, lng: number } | null>(null);

    const { fetchGigs } = useGigStore();

    const showToast = useCallback((options: ToastOptions) => {
        setToastConfig(options);
        setToastVisible(true);
        if (options.type === 'error') haptics.error();
        else if (options.type === 'success') haptics.success();
        else haptics.selection();
    }, [haptics]);

    const showDialog = useCallback((options: DialogOptions) => {
        setDialogConfig(options);
        setDialogVisible(true);
        haptics.warning();
    }, [haptics]);

    const calculateClearanceLevel = (currentReputation: number) => {
        return Math.floor(Math.sqrt(currentReputation / 100)) + 1;
    };



    const fetchLocation = useCallback(async () => {
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                showToast({ message: "Location Permissions Required for Mission Discovery", type: 'warning' });
                return;
            }

            const location = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Balanced,
            });

            setCurrentLocation({
                lat: location.coords.latitude,
                lng: location.coords.longitude
            });

            // Log telemetry for SpaceX Tier Audit
            Analytics.track('PROFILE_VIEWED', { location_synced: true });
        } catch (error) {
            if (__DEV__) console.error(error);
            showToast({ message: "GPS Node Unresponsive. Using Default Node.", type: 'info' });
        }
    }, [showToast]);

    const refreshData = useCallback(async () => {
        if (refreshPending.current) return;
        refreshPending.current = true;
        setLoading(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                setLoading(false);
                refreshPending.current = false;
                return;
            }

            const [profileRes, walletRes] = await Promise.all([
                Repository.getProfile(user.id),
                Repository.getWalletBalance(user.id),
                fetchGigs()
            ]);

            if (profileRes.data) {
                setProfile(profileRes.data);
                setReputationPoints(profileRes.data.xp || 0);
                setClearanceLevel(calculateClearanceLevel(profileRes.data.xp || 0));
            }
            if (walletRes.data) setWallet(walletRes.data);

            setLastRefresh(Date.now());

        } catch (error) {
            if (__DEV__) console.error(error);
            showToast({ message: "Sync Pulse Interrupted. Retrying...", type: 'info' });
        } finally {
            setLoading(false);
            refreshPending.current = false;
        }
    }, [fetchGigs, showToast]);

    const sendSOS = useCallback(async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || !currentLocation) {
            showToast({ message: "SOS Signal Failed: Lock Coordinates First", type: 'error' });
            return;
        }

        haptics.heavy();
        haptics.heavy();

        const { error } = await Repository.triggerEmergencySOS(user.id, currentLocation.lat, currentLocation.lng);

        if (error) {
            showToast({ message: "Signal Transmission Failure", type: 'error' });
        } else {
            showToast({ message: "SOS SIGNAL BROADCASTED", type: 'success' });
            haptics.success();
        }
    }, [currentLocation, haptics, showToast]);

    const addReputation = useCallback(async (amount: number) => {
        if (!profile) return;

        // Optimistic UI Update
        const newRep = reputationPoints + amount;
        const newLevel = calculateClearanceLevel(newRep);


        const oldLevel = clearanceLevel;

        setReputationPoints(newRep);

        if (newLevel > oldLevel) {
            setClearanceLevel(newLevel);
            haptics.heavy();
            showDialog({
                title: "Clearance Level Upgraded",
                message: `You have reached Level ${newLevel}. New high-stakes missions have been decrypted.`,
                primaryLabel: "Proceed",
                onConfirm: () => { }
            });
        }

        const { error } = await Repository.updateProfile(profile.id, { xp: newRep });
        if (error) {
            await PersistenceNode.enqueue('updateProfile', [profile.id, { xp: newRep }]);
            showToast({ message: "STREET-GRADE SYNC: Signal stored locally. Retrying...", type: 'info' });
        } else {
            haptics.success();
        }
    }, [profile, reputationPoints, clearanceLevel, haptics, showToast, showDialog]);

    const indexEscrowPayment = useCallback(async (gigId: string, transactionId: string, amountCents: number, metadata: any = {}) => {
        setLoading(true);
        const { error } = await Repository.indexEscrowPayment(gigId, transactionId, amountCents, metadata);
        if (error) {
            showToast({ message: "Ledger Indexing Failed. Contact Ops.", type: 'error' });
        } else {
            await refreshData();
            showToast({ message: "Financial Signal Hard-Linked to Vault", type: 'success' });
        }
        setLoading(false);
    }, [refreshData, showToast]);

    const startTutorial = useCallback(async (steps: any[]) => {
        const hasSeen = await AsyncStorage.getItem('hasSeenGlobalTutorial');
        if (!hasSeen) {
            setTutorialSteps(steps);
            setTutorialVisible(true);
        }
    }, []);

    const handleTutorialComplete = async () => {
        setTutorialVisible(false);
        await AsyncStorage.setItem('hasSeenGlobalTutorial', 'true');
        haptics.success();
    };

    useEffect(() => {
        refreshData();
        fetchLocation();

        let channel: RealtimeChannel | null = null;

        const setupSync = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                channel = supabase
                    .channel(`profile-sync-${user.id}`)
                    .on('postgres_changes', {
                        event: 'UPDATE',
                        schema: 'public',
                        table: 'profiles',
                        filter: `id=eq.${user.id}`
                    }, (payload: any) => {
                        setProfile(payload.new as Profile);
                        setReputationPoints(payload.new.xp);
                        const newLvl = calculateClearanceLevel(payload.new.xp);
                        if (newLvl > clearanceLevel) setClearanceLevel(newLvl);
                    })
                    .subscribe();
            }
        };

        setupSync();

        // 🛰️ SIGNAL PERSISTENCE TRACKER
        const unsubscribeNet = NetInfo.addEventListener(state => {
            if (state.isConnected) {
                PersistenceNode.attemptSync();
                refreshData();
            }
        });

        return () => {
            if (channel) {
                supabase.removeChannel(channel);
            }
            unsubscribeNet();
        };
    }, [refreshData, fetchLocation, clearanceLevel]);

    return (
        <AuraContext.Provider value={{
            showToast,
            showDialog,
            startTutorial,
            profile,
            wallet,
            reputationPoints,
            clearanceLevel,
            loading,
            currentLocation,
            lastRefresh,
            refreshData,
            addReputation,
            sendSOS,
            indexEscrowPayment
        }}>
            <SyncPulseBar />
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
                onConfirm={() => { dialogConfig.onConfirm(); setDialogVisible(false); }}
                onCancel={() => { dialogConfig.onCancel?.(); setDialogVisible(false); }}
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
