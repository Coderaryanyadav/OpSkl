import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { AuraColors, AuraBorderRadius } from '../theme/aura';
import { AuraText } from './AuraText';
import { LucideIcon } from 'lucide-react-native';

interface AuraBadgeProps {
    label: string;
    icon?: LucideIcon;
    variant?: 'default' | 'outline' | 'success' | 'warning' | 'error' | 'premium';
    size?: 'small' | 'medium';
    style?: ViewStyle;
    fontSize?: number;
}

export const AuraBadge: React.FC<AuraBadgeProps> = ({
    label,
    icon: Icon,
    variant = 'default',
    size = 'medium',
    style,
    fontSize
}) => {

    const getColors = () => {
        switch (variant) {
            case 'premium': return { bg: 'rgba(255, 255, 255, 0.1)', text: AuraColors.white, border: AuraColors.white };
            case 'success': return { bg: 'rgba(52, 199, 89, 0.1)', text: AuraColors.success, border: AuraColors.success };
            case 'warning': return { bg: 'rgba(255, 159, 10, 0.1)', text: AuraColors.warning, border: AuraColors.warning };
            case 'error': return { bg: 'rgba(255, 59, 48, 0.1)', text: AuraColors.error, border: AuraColors.error };
            case 'outline': return { bg: 'transparent', text: AuraColors.gray600, border: AuraColors.gray200 };
            default: return { bg: AuraColors.surfaceLight, text: AuraColors.gray700, border: 'transparent' };
        }
    };

    const colors = getColors();
    const padding = size === 'small' ? { px: 8, py: 3 } : { px: 12, py: 6 };

    return (
        <View style={[
            styles.container,
            {
                backgroundColor: colors.bg,
                borderColor: colors.border,
                borderWidth: variant === 'default' ? 0 : 1,
                paddingHorizontal: padding.px,
                paddingVertical: padding.py
            },
            style
        ]}>
            {Icon && <Icon size={12} color={colors.text} style={{ marginRight: 4 }} />}
            <AuraText
                variant="label"
                color={colors.text}
                style={{ fontSize: fontSize || (size === 'small' ? 9 : 11), letterSpacing: 0.8 }}
            >
                {label}
            </AuraText>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: AuraBorderRadius.full,
        alignSelf: 'flex-start',
    }
});
