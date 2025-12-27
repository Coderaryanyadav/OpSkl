import React, { useEffect } from 'react';
import { View, StyleSheet, Modal } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withSequence, withTiming, ZoomIn, FadeOut } from 'react-native-reanimated';
import { useAuraHaptics } from '@core/hooks/useAuraHaptics';
import { AuraColors, AuraBorderRadius, AuraShadows } from '../theme/aura';
import { AuraButton } from './AuraButton';
import { AuraText } from './AuraText';

interface AuraDialogProps {
    visible: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel?: () => void;
    type?: 'success' | 'error' | 'warning' | 'info';
}

export const AuraDialog: React.FC<AuraDialogProps> = ({
    visible,
    title,
    message,
    onConfirm,
    onCancel,
    type = 'info'
}) => {
    const haptics = useAuraHaptics();
    const scale = useSharedValue(0.8);
    const rotation = useSharedValue(0);

    useEffect(() => {
        if (visible) {
            scale.value = withSpring(1);
            if (type === 'error') {
                rotation.value = withSequence(
                    withTiming(-5, { duration: 50 }),
                    withTiming(5, { duration: 50 }),
                    withTiming(0, { duration: 50 })
                );
                haptics.error();
            } else {
                haptics.selection();
            }
        } else {
            scale.value = 0.8;
        }
    }, [visible, type, scale, rotation]);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value as any }, { rotate: `${rotation.value}deg` as any }] as any
    }));

    if (!visible) return null;

    return (
        <Modal transparent visible={visible} animationType="none">
            <Animated.View exiting={FadeOut} style={styles.overlay}>
                <Animated.View entering={ZoomIn} style={[styles.dialog, animatedStyle] as any}>
                    <AuraText variant="h3" align="center" style={{ marginBottom: 12 }}>
                        {title}
                    </AuraText>
                    <AuraText variant="body" align="center" color={AuraColors.gray400} style={{ marginBottom: 32 }}>
                        {message}
                    </AuraText>

                    <View style={styles.actions}>
                        {onCancel && (
                            <AuraButton
                                title="CANCEL"
                                variant="outline"
                                onPress={onCancel}
                                style={{ flex: 1 }}
                            />
                        )}
                        <AuraButton
                            title="CONFIRM"
                            onPress={onConfirm}
                            variant="primary"
                            style={{ flex: 1 }}
                        />
                    </View>
                </Animated.View>
            </Animated.View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.85)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    dialog: {
        backgroundColor: AuraColors.surface,
        borderRadius: AuraBorderRadius.l,
        padding: 32,
        width: '100%',
        maxWidth: 360,
        ...AuraShadows.floating,
        borderWidth: 1,
        borderColor: AuraColors.gray100,
    },
    actions: {
        flexDirection: 'row',
        gap: 16,
    }
});
