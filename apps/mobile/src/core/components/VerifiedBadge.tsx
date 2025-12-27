import React from 'react';
import { StyleSheet } from 'react-native';
import { AuraColors } from '../theme/aura';
import { Check } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

type VerifiedBadgeProps = {
    size?: number;
    color?: string;
    variant?: 'blue' | 'gold' | 'black';
};

export function VerifiedBadge({ size = 16, color = AuraColors.white, variant = 'blue' }: VerifiedBadgeProps) {
    const getColors = () => {
        switch (variant) {
            case 'gold': return ['#FFD700', '#FFA500'];
            case 'black': return [AuraColors.black, '#333'];
            default: return ['#1DA1F2', '#0077B5']; // Blue tick style
        }
    };

    return (
        <LinearGradient
            colors={getColors() as any}
            style={[styles.badge, { width: size, height: size, borderRadius: size / 2 }]}
        >
            <Check width={size * 0.6} height={size * 0.6} color={color} strokeWidth={4} />
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    badge: {
        alignItems: 'center',
        justifyContent: 'center',
    }
});
