import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, Modal } from 'react-native';
import { AuraText } from '@core/components/AuraText';
import { AuraButton } from '@core/components/AuraButton';
import { AuraColors, AuraSpacing, AuraBorderRadius, AuraShadows } from '@theme/aura';
import { X, DollarSign, Clock, AlertTriangle } from 'lucide-react-native';
import { useAuraHaptics } from '@core/hooks/useAuraHaptics';

interface FilterModalProps {
    visible: boolean;
    onClose: () => void;
    onApply: (filters: { minBudget?: number; maxBudget?: number; urgency?: 'low' | 'medium' | 'high' }) => void;
}

export default function FilterModal({ visible, onClose, onApply }: FilterModalProps) {
    const haptics = useAuraHaptics();

    const [minBudget, setMinBudget] = useState<number | undefined>(undefined);
    const [maxBudget, setMaxBudget] = useState<number | undefined>(undefined);
    const [urgency, setUrgency] = useState<'low' | 'medium' | 'high' | undefined>(undefined);

    const handleApply = () => {
        haptics.success();
        onApply({ minBudget, maxBudget, urgency });
        onClose();
    };

    const handleReset = () => {
        haptics.light();
        setMinBudget(undefined);
        setMaxBudget(undefined);
        setUrgency(undefined);
    };

    return (
        <Modal visible={visible} transparent animationType="slide">
            <View style={styles.backdrop}>
                <View style={styles.container}>
                    <View style={styles.header}>
                        <AuraText variant="h3">Signal Filters</AuraText>
                        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                            <X size={24} color={AuraColors.gray400} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView>
                        {/* Budget Section */}
                        <View style={styles.section}>
                            <View style={styles.sectionTitle}>
                                <DollarSign size={16} color={AuraColors.primary} />
                                <AuraText variant="label" style={{ marginLeft: 8 }}>BOUNTY RANGE</AuraText>
                            </View>
                            <View style={styles.budgetRow}>
                                {[100, 500, 1000, 5000].map((amount) => (
                                    <TouchableOpacity
                                        key={amount}
                                        style={[
                                            styles.chip,
                                            minBudget === amount && styles.chipActive
                                        ]}
                                        onPress={() => {
                                            if (minBudget === amount) setMinBudget(undefined);
                                            else { setMinBudget(amount); haptics.selection(); }
                                        }}
                                    >
                                        <AuraText variant="caption" color={minBudget === amount ? AuraColors.white : AuraColors.gray400}>
                                            {amount}+
                                        </AuraText>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        {/* Urgency Section */}
                        <View style={styles.section}>
                            <View style={styles.sectionTitle}>
                                <AlertTriangle size={16} color={AuraColors.warning} />
                                <AuraText variant="label" style={{ marginLeft: 8 }}>PRIORITY LEVEL</AuraText>
                            </View>
                            <View style={styles.column}>
                                <TouchableOpacity
                                    style={[styles.radioItem, urgency === 'high' && styles.radioActive]}
                                    onPress={() => { setUrgency(urgency === 'high' ? undefined : 'high'); haptics.selection(); }}
                                >
                                    <View style={[styles.dot, urgency === 'high' && { backgroundColor: AuraColors.error }]} />
                                    <AuraText variant="bodyBold" color={AuraColors.error}>CRITICAL (HIGH)</AuraText>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.radioItem, urgency === 'medium' && styles.radioActive]}
                                    onPress={() => { setUrgency(urgency === 'medium' ? undefined : 'medium'); haptics.selection(); }}
                                >
                                    <View style={[styles.dot, urgency === 'medium' && { backgroundColor: AuraColors.warning }]} />
                                    <AuraText variant="bodyBold" color={AuraColors.warning}>STANDARD (MED)</AuraText>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.radioItem, urgency === 'low' && styles.radioActive]}
                                    onPress={() => { setUrgency(urgency === 'low' ? undefined : 'low'); haptics.selection(); }}
                                >
                                    <View style={[styles.dot, urgency === 'low' && { backgroundColor: AuraColors.success }]} />
                                    <AuraText variant="bodyBold" color={AuraColors.success}>LOW PRIORITY</AuraText>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </ScrollView>

                    <View style={styles.footer}>
                        <TouchableOpacity onPress={handleReset} style={{ padding: 16 }}>
                            <AuraText variant="label" color={AuraColors.gray500}>RESET</AuraText>
                        </TouchableOpacity>
                        <AuraButton
                            title="APPLY FILTERS"
                            variant="primary"
                            style={{ flex: 1 }}
                            onPress={handleApply}
                        />
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.8)',
        justifyContent: 'flex-end',
    },
    container: {
        backgroundColor: AuraColors.surfaceElevated,
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        padding: 24,
        maxHeight: '80%',
        borderTopWidth: 1,
        borderRightWidth: 1,
        borderLeftWidth: 1,
        borderColor: AuraColors.gray800,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 32,
    },
    closeBtn: {
        padding: 8,
        backgroundColor: AuraColors.surface,
        borderRadius: 20,
    },
    section: {
        marginBottom: 32,
    },
    sectionTitle: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    budgetRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    chip: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        backgroundColor: AuraColors.surface,
        borderWidth: 1,
        borderColor: AuraColors.gray800,
    },
    chipActive: {
        backgroundColor: AuraColors.primary,
        borderColor: AuraColors.primary,
    },
    column: {
        gap: 12,
    },
    radioItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: AuraColors.surface,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: AuraColors.gray800,
        gap: 12,
    },
    radioActive: {
        borderColor: AuraColors.gray600,
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    dot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: AuraColors.gray700,
    },
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        marginTop: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: AuraColors.gray800,
    }
});
