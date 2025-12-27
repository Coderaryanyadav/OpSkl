import React, { useEffect } from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    interpolateColor
} from 'react-native-reanimated';
import { AuraColors, AuraBorderRadius } from '../theme/aura';

interface AuraProgressBarProps {
    progress: number; // 0 to 1
    totalSteps?: number;
    height?: number;
}

export const AuraProgressBar: React.FC<AuraProgressBarProps> = ({
    progress,
    totalSteps: _totalSteps = 1,
    height = 6
}) => {
    const { width: _width } = useWindowDimensions();
    const animatedProgress = useSharedValue(0);

    useEffect(() => {
        animatedProgress.value = withSpring(Math.min(Math.max(progress, 0), 1), {
            damping: 15,
            stiffness: 100
        });
    }, [progress, animatedProgress]);

    const barStyle = useAnimatedStyle(() => ({
        width: `${animatedProgress.value * 100}%`,
        backgroundColor: interpolateColor(
            animatedProgress.value,
            [0, 0.5, 1],
            [AuraColors.primary, AuraColors.primary, AuraColors.success]
        )
    }));

    return (
        <View style={[styles.container, { height }]}>
            <Animated.View style={[styles.bar, { height }, barStyle]} />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
        backgroundColor: AuraColors.surfaceLight,
        borderRadius: AuraBorderRadius.full,
        overflow: 'hidden',
    },
    bar: {
        borderRadius: AuraBorderRadius.full,
    }
});
