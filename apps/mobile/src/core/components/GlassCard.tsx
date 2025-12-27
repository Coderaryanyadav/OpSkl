import React from 'react';
import { View, StyleSheet } from 'react-native';
import { AuraColors, AuraGlass, AuraShadows, AuraBorderRadius } from '../theme/aura';

interface GlassCardProps {
    children: React.ReactNode;
    style?: any;
    variant?: 'default' | 'light' | 'neon';
}

export const GlassCard: React.FC<GlassCardProps> = ({
    children,
    style,
    variant = 'default',
}) => {
    const getVariantStyle = () => {
        switch (variant) {
            case 'light':
                return styles.cardLight;
            case 'neon':
                return styles.cardNeon;
            default:
                return styles.card;
        }
    };

    return (
        <View style={[getVariantStyle(), style]}>
            {children}
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        ...AuraGlass.card,
        ...AuraShadows.soft,
        borderRadius: AuraBorderRadius.lg,
        padding: 16,
    },
    cardLight: {
        ...AuraGlass.cardLight,
        ...AuraShadows.floating,
        borderRadius: AuraBorderRadius.lg,
        padding: 16,
    },
    cardNeon: {
        backgroundColor: 'rgba(0, 245, 255, 0.05)',
        borderWidth: 1,
        borderColor: AuraColors.primary,
        ...AuraShadows.soft,
        borderRadius: AuraBorderRadius.lg,
        padding: 16,
    },
});
