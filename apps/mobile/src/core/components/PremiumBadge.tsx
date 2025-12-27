import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AuraColors, AuraBorderRadius, AuraShadows } from '../theme/aura';

interface PremiumBadgeProps {
    text: string;
    variant?: 'gold' | 'silver' | 'bronze' | 'neon' | 'verified';
    size?: 'small' | 'medium' | 'large';
}

export const PremiumBadge: React.FC<PremiumBadgeProps> = ({
    text,
    variant = 'gold',
    size = 'medium',
}) => {
    const getColors = () => {
        switch (variant) {
            case 'gold':
                return ['#FFD700', '#FFA500'];
            case 'silver':
                return ['#C0C0C0', '#A8A8A8'];
            case 'bronze':
                return ['#CD7F32', '#B87333'];
            case 'neon':
                return [AuraColors.primary, AuraColors.primary];
            case 'verified':
                return [AuraColors.success, '#00CC66'];
            default:
                return ['#FFD700', '#FFA500'];
        }
    };

    const getSize = () => {
        switch (size) {
            case 'small':
                return { paddingVertical: 4, paddingHorizontal: 8, fontSize: 10 };
            case 'large':
                return { paddingVertical: 8, paddingHorizontal: 16, fontSize: 14 };
            default:
                return { paddingVertical: 6, paddingHorizontal: 12, fontSize: 12 };
        }
    };

    const sizeStyle = getSize();

    return (
        <LinearGradient
            colors={getColors() as [string, string, ...string[]]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.badge, { paddingVertical: sizeStyle.paddingVertical, paddingHorizontal: sizeStyle.paddingHorizontal }]}
        >
            <Text style={[styles.text, { fontSize: sizeStyle.fontSize }]}>{text}</Text>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    badge: {
        borderRadius: AuraBorderRadius.full,
        ...AuraShadows.soft,
    },
    text: {
        color: AuraColors.black,
        fontWeight: '900',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
});
