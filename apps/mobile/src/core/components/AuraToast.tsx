import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { AuraColors, AuraShadows, AuraBorderRadius } from '../theme/aura';
import { AuraText } from './AuraText';
import { CheckCircle, XCircle, Info, AlertTriangle } from 'lucide-react-native';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, { FadeInUp, FadeOutUp, runOnJS, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface AuraToastProps {
    message: string;
    type?: ToastType;
    visible: boolean;
    onHide: () => void;
}

export const AuraToast: React.FC<AuraToastProps> = ({ message, type = 'info', visible, onHide }) => {
    const translateY = useSharedValue(0);

    useEffect(() => {
        if (visible) {
            translateY.value = withSpring(0);
            const timer = setTimeout(onHide, 3000);
            return () => clearTimeout(timer);
        }
    }, [visible, onHide, translateY]);

    const pan = Gesture.Pan()
        .onUpdate((event) => {
            if (event.translationY < 0) {
                translateY.value = event.translationY;
            }
        })
        .onEnd((event) => {
            if (event.translationY < -50) {
                translateY.value = withSpring(-100, {}, () => runOnJS(onHide)());
            } else {
                translateY.value = withSpring(0);
            }
        });

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: translateY.value }]
    }));

    if (!visible) return null;

    const getIcon = () => {
        switch (type) {
            case 'success': return <CheckCircle color={AuraColors.success} size={24} />;
            case 'error': return <XCircle color={AuraColors.error} size={24} />;
            case 'warning': return <AlertTriangle color={AuraColors.warning} size={24} />;
            default: return <Info color={AuraColors.info} size={24} />;
        }
    };

    const getBorderColor = () => {
        switch (type) {
            case 'success': return AuraColors.success;
            case 'error': return AuraColors.error;
            case 'warning': return AuraColors.warning;
            default: return AuraColors.primary;
        }
    };

    return (
        <GestureDetector gesture={pan}>
            <Animated.View
                entering={FadeInUp.springify()}
                exiting={FadeOutUp}
                style={[styles.container, { borderColor: getBorderColor() }, animatedStyle] as any}
            >
                <View style={styles.icon}>{getIcon()}</View>
                <AuraText variant="body" style={{ flex: 1 }}>{message}</AuraText>
            </Animated.View>
        </GestureDetector>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 60,
        left: 20,
        right: 20,
        backgroundColor: AuraColors.surface,
        padding: 16,
        borderRadius: AuraBorderRadius.l,
        flexDirection: 'row',
        alignItems: 'center',
        borderLeftWidth: 4,
        ...AuraShadows.floating,
        zIndex: 9999,
        elevation: 10,
    },
    icon: {
        marginRight: 12,
    }
});
