import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, { Layout, ZoomIn } from 'react-native-reanimated';
import { AuraColors, AuraShadows, AuraBorderRadius } from '../theme/aura';
import { AuraText } from './AuraText';
import { Check } from 'lucide-react-native';
import { useAuraHaptics } from '../hooks/useAuraHaptics';

interface AuraChipProps {
    label: string;
    selected?: boolean;
    onPress?: () => void;
    icon?: React.ReactNode;
}

export const AuraChip: React.FC<AuraChipProps> = ({ label, selected, onPress, icon }) => {
    const haptics = useAuraHaptics();

    return (
        <TouchableOpacity onPress={() => { haptics.selection(); onPress?.(); }}>
            <Animated.View
                layout={Layout.springify()}
                style={[styles.chip, selected && styles.chipSelected]}
            >
                {selected && (
                    <Animated.View entering={ZoomIn} style={{ marginRight: 4 }}>
                        <Check size={14} color={AuraColors.white} />
                    </Animated.View>
                )}
                {!selected && icon && <View style={{ marginRight: 4 }}>{icon}</View>}
                <AuraText variant="caption" color={selected ? AuraColors.white : AuraColors.textSecondary}>
                    {label}
                </AuraText>
            </Animated.View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    chip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: AuraBorderRadius.full,
        backgroundColor: AuraColors.surfaceLight,
        borderWidth: 1,
        borderColor: AuraColors.gray800,
    },
    chipSelected: {
        backgroundColor: AuraColors.primary,
        borderColor: AuraColors.primary,
        ...AuraShadows.soft,
    }
});
