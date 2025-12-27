import React, { createContext, useContext, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuraToast } from '../components/AuraToast';
import { AuraDialog } from '../components/AuraDialog';
import { AuraTutorial } from '../components/AuraTutorial';

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
    showToast: (options: ToastOptions) => void;
    showDialog: (options: DialogOptions) => void;
    startTutorial: (steps: any[]) => void;
}

const AuraContext = createContext<AuraContextType | undefined>(undefined);

export const AuraProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // Toast State
    const [toastVisible, setToastVisible] = useState(false);
    const [toastConfig, setToastConfig] = useState<ToastOptions>({ message: '', type: 'info' });

    // Dialog State
    const [dialogVisible, setDialogVisible] = useState(false);
    const [dialogConfig, setDialogConfig] = useState<DialogOptions>({
        title: '', message: '', type: 'info', onConfirm: () => { }
    });

    // Tutorial State
    const [tutorialVisible, setTutorialVisible] = useState(false);
    const [tutorialSteps, setTutorialSteps] = useState<any[]>([]);

    const showToast = useCallback((options: ToastOptions) => {
        setToastConfig(options);
        setToastVisible(true);
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

    return (
        <AuraContext.Provider value={{ showToast, showDialog, startTutorial }}>
            {children}

            {/* Global UI Layers */}
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
