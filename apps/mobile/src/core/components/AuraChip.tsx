import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, { FadeInRight, Layout, ZoomIn } from 'react-native-reanimated';
import { AuraColors, AuraShadows, AuraBorderRadius, AuraSpacing } from '../theme/aura';
import { AuraText } from './AuraText';
import { Check, User, Heart, Briefcase, Star, Zap } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

interface AuraChipProps {
    label: string;
    selected?: boolean;
    onPress?: () => void;
    icon?: React.ReactNode;
}

export const AuraChip: React.FC<AuraChipProps> = ({ label, selected, onPress, icon }) => (
    <TouchableOpacity onPress={() => { Haptics.selectionAsync(); onPress?.(); }}>
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

export default function OnboardingInterestsScreen({ navigation: _navigation }: any) {
    const [selectedInterests, setSelectedInterests] = useState<string[]>([]);

    const interests = [
        { id: 'coding', label: 'Coding', icon: <Briefcase size={14} color={AuraColors.textSecondary} /> },
        { id: 'design', label: 'Design', icon: <Heart size={14} color={AuraColors.textSecondary} /> },
        { id: 'writing', label: 'Writing', icon: <User size={14} color={AuraColors.textSecondary} /> },
        { id: 'marketing', label: 'Marketing', icon: <Star size={14} color={AuraColors.textSecondary} /> },
        { id: 'video', label: 'Video Edit', icon: <Zap size={14} color={AuraColors.textSecondary} /> },
        { id: 'photo', label: 'Photography', icon: <User size={14} color={AuraColors.textSecondary} /> },
        { id: 'finance', label: 'Finance', icon: <Briefcase size={14} color={AuraColors.textSecondary} /> },
        { id: 'music', label: 'Music', icon: <Heart size={14} color={AuraColors.textSecondary} /> },
    ];

    const toggleInterest = (id: string) => {
        if (selectedInterests.includes(id)) {
            setSelectedInterests(prev => prev.filter(item => item !== id));
        } else {
            setSelectedInterests(prev => [...prev, id]);
        }
    };

    return (
        <View style={styles.container}>
            <AuraText variant="h3" style={{ marginBottom: 8 }}>Your Interests</AuraText>
            <AuraText variant="body" color={AuraColors.textSecondary} style={{ marginBottom: 24 }}>
                Pick 3 or more to get better matches.
            </AuraText>

            <View style={styles.chipContainer}>
                {interests.map((item, index) => (
                    <Animated.View
                        key={item.id}
                        entering={FadeInRight.delay(index * 50)}
                    >
                        <AuraChip
                            label={item.label}
                            icon={item.icon}
                            selected={selectedInterests.includes(item.id)}
                            onPress={() => toggleInterest(item.id)}
                        />
                    </Animated.View>
                ))}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: AuraSpacing.l,
    },
    chipContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
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
