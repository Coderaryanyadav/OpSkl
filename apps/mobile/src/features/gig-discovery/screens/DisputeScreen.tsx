import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { AuraHeader } from '@core/components/AuraHeader';
import { AuraText } from '@core/components/AuraText';
import { AuraButton } from '@core/components/AuraButton';
import { AuraColors, AuraSpacing, AuraBorderRadius, AuraShadows } from '@theme/aura';
import { useAura } from '@core/context/AuraProvider';
import { useAuth } from '@context/AuthProvider';
import { useAuraHaptics } from '@core/hooks/useAuraHaptics';
import { Repository } from '@api/repository';
import { AlertTriangle, Info } from 'lucide-react-native';
import { Analytics } from '@core/utils/analytics';

const DISPUTE_REASONS = [
    'Non-delivery of work',
    'Poor quality of work',
    'Unresponsive user',
    'Payment issue',
    'Harassment or abuse',
    'Other'
];

export default function DisputeScreen() {
    const navigation = useNavigation<any>();
    const route = useRoute();
    const { gigId, defendantId } = route.params as { gigId: string, defendantId: string };
    const { user } = useAuth();
    const { showToast, showDialog } = useAura();
    const haptics = useAuraHaptics();

    const [reason, setReason] = useState(DISPUTE_REASONS[0]);
    const [description, setDescription] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (!user) return;
        if (!description.trim()) {
            showToast({ message: 'Please calculate a situation report (description required)', type: 'error' });
            return;
        }

        haptics.warning();
        showDialog({
            title: 'Initiate Conflict Protocol?',
            message: 'This will freeze funds and summon platform arbitration. This action is irreversible.',
            type: 'warning',
            onConfirm: async () => {
                setSubmitting(true);
                try {
                    const { error } = await Repository.createDispute({
                        gig_id: gigId,
                        initiator_id: user.id,
                        defendant_id: defendantId,
                        reason,
                        description,
                        status: 'open'
                    });

                    if (error) throw error;

                    Analytics.track('DISPUTE_INITIATED', { gig_id: gigId, reason });

                    haptics.success();
                    showToast({ message: 'Conflict Protocol Active. Arbitration pending.', type: 'success' });
                    navigation.goBack();
                } catch (e: any) {
                    showToast({ message: e.message || 'Transmission Failed', type: 'error' });
                    haptics.error();
                } finally {
                    setSubmitting(false);
                }
            }
        });
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <AuraHeader title="CONFLICT RESOLUTION" showBack />

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.warningCard}>
                    <AlertTriangle size={32} color={AuraColors.error} />
                    <AuraText variant="h3" color={AuraColors.error} style={{ marginVertical: 8 }}>
                        Protocol Warning
                    </AuraText>
                    <AuraText variant="body" color={AuraColors.gray300} align="center">
                        Initiating a dispute will freeze all assets associated with this mission.
                        Platform command will review all evidence and issue a final verdict.
                    </AuraText>
                </View>

                <AuraText variant="label" style={styles.label}>CLASSIFICATION</AuraText>
                <View style={styles.reasonsContainer}>
                    {DISPUTE_REASONS.map((r) => (
                        <AuraButton
                            key={r}
                            title={r}
                            variant={reason === r ? 'primary' : 'outline'}
                            onPress={() => { setReason(r); haptics.selection(); }}
                            style={styles.reasonBtn}
                        />
                    ))}
                </View>

                <AuraText variant="label" style={styles.label}>SITREP (DESCRIPTION)</AuraText>
                <TextInput
                    style={styles.input}
                    placeholder="Describe the breach of contract..."
                    placeholderTextColor={AuraColors.gray600}
                    multiline
                    numberOfLines={6}
                    value={description}
                    onChangeText={setDescription}
                    textAlignVertical="top"
                />

                <View style={styles.infoBox}>
                    <Info size={16} color={AuraColors.primary} />
                    <AuraText variant="caption" color={AuraColors.primary} style={{ marginLeft: 8, flex: 1 }}>
                        Evidence logs (chat, files) are automatically attached to this report.
                    </AuraText>
                </View>
            </ScrollView>

            <View style={styles.footer}>
                <AuraButton
                    title="INITIATE PROTOCOL"
                    variant="primary"
                    loading={submitting}
                    onPress={handleSubmit}
                    style={{ backgroundColor: AuraColors.error, borderColor: AuraColors.error }}
                />
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: AuraColors.background,
    },
    content: {
        padding: AuraSpacing.xl,
    },
    warningCard: {
        backgroundColor: 'rgba(255, 59, 48, 0.1)',
        padding: 24,
        borderRadius: AuraBorderRadius.lg,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 59, 48, 0.3)',
        marginBottom: 32,
    },
    label: {
        color: AuraColors.gray500,
        marginBottom: 12,
        letterSpacing: 2,
    },
    reasonsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 32,
    },
    reasonBtn: {
        minWidth: '45%',
        marginVertical: 4,
    },
    input: {
        backgroundColor: AuraColors.surfaceElevated,
        color: AuraColors.white,
        borderRadius: AuraBorderRadius.md,
        padding: 16,
        height: 150,
        fontSize: 16,
        borderWidth: 1,
        borderColor: AuraColors.gray800,
        marginBottom: 24,
    },
    infoBox: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: 'rgba(0, 122, 255, 0.1)',
        borderRadius: AuraBorderRadius.md,
    },
    footer: {
        padding: AuraSpacing.xl,
        borderTopWidth: 1,
        borderTopColor: AuraColors.gray800,
        paddingBottom: 40,
    }
});
