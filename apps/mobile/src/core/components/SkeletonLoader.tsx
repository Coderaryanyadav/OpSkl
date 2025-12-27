import React, { useEffect } from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, withSequence } from 'react-native-reanimated';
import { AuraColors } from '../theme/aura';

type SkeletonProps = {
    width: number | string;
    height: number;
    borderRadius?: number;
    style?: ViewStyle;
};

export function SkeletonLoader({ width, height, borderRadius = 8, style }: SkeletonProps) {
    const opacity = useSharedValue(0.3);

    useEffect(() => {
        opacity.value = withRepeat(
            withSequence(
                withTiming(0.7, { duration: 1000 }),
                withTiming(0.3, { duration: 1000 })
            ),
            -1,
            true
        );
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const animatedStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
    }));

    // Cast width to any to accept percentage strings if needed for View style
    return (
        <Animated.View
            style={[
                styles.skeleton,
                { width: width as any, height, borderRadius },
                animatedStyle,
                style
            ]}
        />
    );
}

const styles = StyleSheet.create({
    skeleton: {
        backgroundColor: AuraColors.gray700,
    }
});
