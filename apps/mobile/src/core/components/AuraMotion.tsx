import React, { useEffect } from 'react';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withTiming,
    FadeIn,
    FadeOut,
    SlideInDown,
    Layout
} from 'react-native-reanimated';
import { ViewStyle } from 'react-native';

interface AuraMotionProps {
    children: React.ReactNode;
    style?: ViewStyle | ViewStyle[];
    type?: 'fade' | 'slide' | 'zoom' | 'spring';
    delay?: number;
    duration?: number;
}

/**
 * 🎬 AURA MOTION (Apple-Polished Animation Wrapper)
 * Unified motion system to ensure consistent micro-interactions
 * and fluid screen transitions throughout the OpSkl ecosystem.
 */
export const AuraMotion: React.FC<AuraMotionProps> = ({
    children,
    style,
    type = 'fade',
    delay = 0,
    duration = 400
}) => {
    const scale = useSharedValue(0.95);
    const opacity = useSharedValue(0);

    useEffect(() => {
        scale.value = withSpring(1, { damping: 15, stiffness: 100 });
        opacity.value = withTiming(1, { duration });
    }, [duration, opacity, scale]);

    const animatedStyle = useAnimatedStyle(() => {
        if (type === 'zoom' || type === 'spring') {
            return {
                opacity: opacity.value,
                transform: [{ scale: scale.value }]
            };
        }
        return { opacity: opacity.value };
    });

    return (
        <Animated.View
            layout={Layout.springify()}
            entering={type === 'slide' ? SlideInDown.delay(delay).duration(duration) : FadeIn.delay(delay).duration(duration)}
            exiting={FadeOut}
            style={[style, animatedStyle]}
        >
            {children}
        </Animated.View>
    );
};
