import React, { useEffect, useRef } from 'react';
import { Animated, Text, StyleSheet } from 'react-native';
import { AuraColors, AuraTypography } from '../theme/aura';

interface AnimatedCounterProps {
    value: number;
    duration?: number;
    style?: any;
    prefix?: string;
    suffix?: string;
}

export const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
    value,
    duration = 1000,
    style,
    prefix = '',
    suffix = '',
}) => {
    const animatedValue = useRef(new Animated.Value(0)).current;
    const [displayValue, setDisplayValue] = React.useState(0);

    useEffect(() => {
        Animated.timing(animatedValue, {
            toValue: value,
            duration,
            useNativeDriver: false,
        }).start();

        const listener = animatedValue.addListener(({ value: animValue }) => {
            setDisplayValue(Math.floor(animValue));
        });

        return () => {
            animatedValue.removeListener(listener);
        };
    }, [value, duration, animatedValue]);

    return (
        <Text style={[styles.text, style]}>
            {prefix}{displayValue.toLocaleString()}{suffix}
        </Text>
    );
};

const styles = StyleSheet.create({
    text: {
        ...AuraTypography.headingLarge,
        color: AuraColors.primary,
        fontWeight: '900',
    },
});
