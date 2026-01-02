import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, Animated, Platform } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { AuraColors } from '@theme/aura';
import { AuraText } from './AuraText';
import { WifiOff, Zap } from 'lucide-react-native';

export const SyncPulseBar = () => {
    const [isConnected, setIsConnected] = useState(true);
    const [visible, setVisible] = useState(false);
    const translateY = useRef(new Animated.Value(-100)).current;

    useEffect(() => {
        const unsubscribe = NetInfo.addEventListener(state => {
            const connected = !!state.isConnected;
            if (connected !== isConnected) {
                setIsConnected(connected);
                if (!connected) {
                    setVisible(true);
                    Animated.spring(translateY, { toValue: 0, useNativeDriver: true }).start();
                } else {
                    // Back online
                    setTimeout(() => {
                        Animated.timing(translateY, { toValue: -100, duration: 500, useNativeDriver: true }).start(() => setVisible(false));
                    }, 3000); // Show "Back Online" for 3s
                }
            }
        });

        return () => unsubscribe();
    }, [isConnected, translateY]);

    if (!visible && isConnected) return null;

    return (
        <Animated.View style={[
            styles.container,
            { transform: [{ translateY }] },
            !isConnected ? styles.offline : styles.online
        ]}>
            {!isConnected ? (
                <View style={styles.content}>
                    <WifiOff size={14} color={AuraColors.white} />
                    <AuraText variant="caption" color={AuraColors.white} style={styles.text}>
                        STREET-GRADE SYNC: OFFLINE MODE ACTIVE
                    </AuraText>
                </View>
            ) : (
                <View style={styles.content}>
                    <Zap size={14} color={AuraColors.white} />
                    <AuraText variant="caption" color={AuraColors.white} style={styles.text}>
                        SIGNAL RESTORED: PULSE SYNCING...
                    </AuraText>
                </View>
            )}
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 40,
        zIndex: 1000,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: Platform.OS === 'ios' ? 10 : 0, // Handle status bar
    },
    offline: {
        backgroundColor: AuraColors.error,
    },
    online: {
        backgroundColor: AuraColors.success,
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    text: {
        fontWeight: '900',
        letterSpacing: 1,
    }
});
