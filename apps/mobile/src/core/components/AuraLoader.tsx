import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { AuraColors, AuraShadows } from '../theme/aura';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withSequence,
    withTiming,
    Easing
} from 'react-native-reanimated';

interface AuraLoaderProps {
    size?: number;
    color?: string;
}

export const AuraLoader: React.FC<AuraLoaderProps> = ({
    size = 40,
    color = AuraColors.primary
}) => {
    const scale = useSharedValue(0.8);
    const opacity = useSharedValue(0.5);

    useEffect(() => {
        scale.value = withRepeat(
            withSequence(
                withTiming(1.2, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
                withTiming(0.8, { duration: 1000, easing: Easing.inOut(Easing.ease) })
            ),
            -1,
            true
        );
        opacity.value = withRepeat(
            withSequence(
                withTiming(1, { duration: 1000 }),
                withTiming(0.5, { duration: 1000 })
            ),
            -1,
            true
        );
    }, [scale, opacity]);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
        opacity: opacity.value,
    }));

    return (
        <View style={[styles.container, { width: size, height: size }]}>
            <Animated.View
                style={[
                    styles.dot,
                    {
                        width: size,
                        height: size,
                        borderRadius: size / 2,
                        backgroundColor: color,
                        shadowColor: color,
                        shadowOffset: { width: 0, height: 0 },
                        shadowOpacity: 0.8,
                        shadowRadius: 10,
                        elevation: 5
                    },
                    animatedStyle
                ]}
            />
            {/* Inner solid dot for focus */}
            <View
                style={[
                    styles.centerDot,
                    {
                        width: size * 0.4,
                        height: size * 0.4,
                        borderRadius: size * 0.2,
                        backgroundColor: AuraColors.white
                    }
                ]}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    dot: {
        position: 'absolute',
    },
    centerDot: {
        zIndex: 2,
        ...AuraShadows.soft,
    }
});
