import React from 'react';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

export const AuraDraggable = ({ children }: { children: React.ReactNode }) => {
    const translateX = useSharedValue(0);
    const translateY = useSharedValue(0);
    const context = useSharedValue({ x: 0, y: 0 });

    const gesture = Gesture.Pan()
        .onStart(() => {
            context.value = { x: translateX.value, y: translateY.value };
        })
        .onUpdate((event) => {
            translateX.value = event.translationX + context.value.x;
            translateY.value = event.translationY + context.value.y;
        })
        .onEnd(() => {
            translateX.value = withSpring(0);
            translateY.value = withSpring(0);
        });

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [
            { translateX: translateX.value },
            { translateY: translateY.value },
        ],
    }));

    return (
        <GestureDetector gesture={gesture}>
            <Animated.View style={animatedStyle}>
                {children}
            </Animated.View>
        </GestureDetector>
    );
};
