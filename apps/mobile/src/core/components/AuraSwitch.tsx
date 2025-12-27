import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, interpolateColor } from 'react-native-reanimated';
import { AuraColors, AuraShadows } from '../theme/aura';
import { useAuraHaptics } from '@core/hooks/useAuraHaptics';

interface AuraSwitchProps {
    value: boolean;
    onValueChange: (value: boolean) => void;
    size?: 'small' | 'medium';
    disabled?: boolean;
}

export const AuraSwitch: React.FC<AuraSwitchProps> = ({
    value,
    onValueChange,
    size = 'medium',
    disabled = false
}) => {
    const haptics = useAuraHaptics();
    const offset = useSharedValue(value ? 1 : 0);
    const dimensions = size === 'small' ? { w: 40, h: 24, p: 2 } : { w: 50, h: 30, p: 3 };
    const thumbSize = dimensions.h - (dimensions.p * 2);

    const handlePress = () => {
        if (disabled) return;
        haptics.selection();
        const newValue = !value;
        offset.value = withSpring(newValue ? 1 : 0);
        onValueChange(newValue);
    };

    const trackStyle = useAnimatedStyle(() => ({
        backgroundColor: interpolateColor(
            offset.value,
            [0, 1],
            [AuraColors.gray700, AuraColors.success]
        )
    }));

    const thumbStyle = useAnimatedStyle(() => ({
        transform: [{
            translateX: offset.value * (dimensions.w - thumbSize - (dimensions.p * 2))
        }]
    }));

    return (
        <TouchableOpacity activeOpacity={0.9} onPress={handlePress} disabled={disabled} >
            <Animated.View style={[styles.track as any, { width: dimensions.w, height: dimensions.h, padding: dimensions.p }, trackStyle as any]}>
                <Animated.View style={[styles.thumb as any, { width: thumbSize, height: thumbSize, borderRadius: thumbSize / 2 }, thumbStyle as any]} />
            </Animated.View>
        </TouchableOpacity >
    );
};

const styles = StyleSheet.create({
    track: {
        borderRadius: 999,
        justifyContent: 'center',
    },
    thumb: {
        backgroundColor: AuraColors.white,
        ...AuraShadows.soft,
    }
});
