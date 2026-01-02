import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, Modal } from 'react-native';
import { AuraText } from '@core/components/AuraText';
import { AuraButton } from '@core/components/AuraButton';
import { AuraColors } from '@theme/aura';
import { X, IndianRupee, AlertTriangle, Heart, Bookmark, Trash2, MapPin } from 'lucide-react-native';
import { AuraInput } from '@core/components/AuraInput';
import { useAuraHaptics } from '@core/hooks/useAuraHaptics';
import { Repository } from '@api/repository';
import { useAuth } from '@context/AuthProvider';
import { SavedSearch } from '@features/gig-discovery/types';

interface FilterModalProps {
    visible: boolean;
    onClose: () => void;
    onApply: (filters: { minBudget?: number; maxBudget?: number; urgency?: 'low' | 'medium' | 'high'; pincode?: string }) => void;
    onSave?: (filters: { minBudget?: number; maxBudget?: number; urgency?: 'low' | 'medium' | 'high'; pincode?: string }) => void;
}

export default function FilterModal({ visible, onClose, onApply, onSave }: FilterModalProps) {
    const haptics = useAuraHaptics();
    const { user } = useAuth();

    const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
    const [minBudget, setMinBudget] = useState<number | undefined>(undefined);
    const [maxBudget, setMaxBudget] = useState<number | undefined>(undefined);
    const [urgency, setUrgency] = useState<'low' | 'medium' | 'high' | undefined>(undefined);
    const [pincode, setPincode] = useState<string | undefined>(undefined);

    useEffect(() => {
        if (visible && user) {
            Repository.getSavedSearches(user.id).then(res => {
                if (res.data) setSavedSearches(res.data);
            });
        }
    }, [visible, user]);

    const handleApply = () => {
        haptics.success();
        onApply({ minBudget, maxBudget, urgency, pincode });
        onClose();
    };

    const handleReset = () => {
        haptics.light();
        setMinBudget(undefined);
        setMaxBudget(undefined);
        setUrgency(undefined);
        setPincode(undefined);
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
                        {/* Saved Searches Section */}
                        {savedSearches.length > 0 && (
                            <View style={styles.section}>
                                <View style={styles.sectionTitle}>
                                    <Bookmark size={16} color={AuraColors.secondary} />
                                    <AuraText variant="label" style={{ marginLeft: 8 }}>SIGNAL MEMORY</AuraText>
                                </View>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.budgetRow}>
                                    {savedSearches.map((search) => (
                                        <TouchableOpacity
                                            key={search.id}
                                            style={[styles.chip, { flexDirection: 'row', alignItems: 'center', gap: 8 }]}
                                            onPress={() => {
                                                haptics.selection();
                                                setMinBudget(search.filters.minBudget);
                                                setMaxBudget(search.filters.maxBudget);
                                                setUrgency(search.filters.urgency);
                                            }}
                                        >
                                            <AuraText variant="caption">{search.title}</AuraText>
                                            <TouchableOpacity onPress={() => { Repository.deleteSavedSearch(search.id); setSavedSearches(prev => prev.filter(s => s.id !== search.id)); haptics.warning(); }}>
                                                <Trash2 size={12} color={AuraColors.error} />
                                            </TouchableOpacity>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </View>
                        )}

                        {/* Pincode Section (Bharat Specific) */}
                        <View style={styles.section}>
                            <View style={styles.sectionTitle}>
                                <MapPin size={16} color={AuraColors.primary} />
                                <AuraText variant="label" style={{ marginLeft: 8 }}>TARGET PIN NODE</AuraText>
                            </View>
                            <AuraInput
                                placeholder="Enter 6-digit PIN..."
                                value={pincode}
                                onChangeText={setPincode}
                                keyboardType="number-pad"
                                maxLength={6}
                            />
                        </View>

                        {/* Budget Section */}
                        <View style={styles.section}>
                            <View style={styles.sectionTitle}>
                                <IndianRupee size={16} color={AuraColors.primary} />
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
                        {onSave && (minBudget || urgency) && (
                            <TouchableOpacity onPress={() => onSave({ minBudget, maxBudget, urgency })} style={{ padding: AuraSpacing.l }}>
                                <Heart size={20} color={AuraColors.error} />
                            </TouchableOpacity>
                        )}
                        <TouchableOpacity onPress={handleReset} style={{ padding: AuraSpacing.l }}>
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
        padding: AuraSpacing.xl,
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
        padding: AuraSpacing.s,
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
        paddingHorizontal: AuraSpacing.l,
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
        padding: AuraSpacing.l,
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
