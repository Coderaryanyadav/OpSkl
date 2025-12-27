import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { AuraColors, AuraSpacing, AuraBorderRadius } from '@theme/aura';
import { AuraHeader } from '@core/components/AuraHeader';
import { AuraText } from '@core/components/AuraText';
import { AuraButton } from '@core/components/AuraButton';
import { AuraMotion } from '@core/components/AuraMotion';
import { AuraBadge } from '@core/components/AuraBadge';
import { useAura } from '@core/context/AuraProvider';
import { useAuraHaptics } from '@core/hooks/useAuraHaptics';
import { supabase } from '@api/supabase';
import { AlertTriangle, CheckCircle, ExternalLink } from 'lucide-react-native';

export default function AdminModerationScreen() {
    const navigation = useNavigation<any>();
    const { showToast, showDialog } = useAura();
    const haptics = useAuraHaptics();

    const [disputes, setDisputes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDisputes();
    }, []);

    const fetchDisputes = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('disputes')
                .select('*, gig:gigs(title), initiator:profiles!initiator_id(full_name), defendant:profiles!defendant_id(full_name)')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setDisputes(data || []);
        } catch (e: any) {
            showToast({ message: 'Failed to access moderation nodes', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleResolve = async (id: string) => {
        haptics.warning();
        showDialog({
            title: 'Close Dispute?',
            message: 'Marking this as resolved will archive the ticket. Ensure adjudication is complete.',
            type: 'warning',
            onConfirm: async () => {
                const { error } = await supabase
                    .from('disputes')
                    .update({ status: 'resolved' })
                    .eq('id', id);

                if (error) {
                    showToast({ message: 'Sync failed', type: 'error' });
                } else {
                    haptics.success();
                    showToast({ message: 'Ticket Archived', type: 'success' });
                    fetchDisputes();
                }
            }
        });
    };

    return (
        <View style={styles.container}>
            <AuraHeader title="Moderation Queue" showBack onBack={() => navigation.goBack()} />

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <View style={styles.stats}>
                    <View style={styles.statBox}>
                        <AuraText variant="h1">{disputes.filter(d => d.status === 'open').length}</AuraText>
                        <AuraText variant="label" color={AuraColors.error}>ACTIVE THREATS</AuraText>
                    </View>
                    <View style={styles.statBox}>
                        <AuraText variant="h1">{disputes.filter(d => d.status === 'resolved').length}</AuraText>
                        <AuraText variant="label" color={AuraColors.success}>NEUTRALIZED</AuraText>
                    </View>
                </View>

                {loading ? (
                    <ActivityIndicator size="large" color={AuraColors.primary} style={{ marginTop: 40 }} />
                ) : disputes.length === 0 ? (
                    <View style={styles.empty}>
                        <CheckCircle size={48} color={AuraColors.gray700} />
                        <AuraText variant="body" color={AuraColors.gray500} style={{ marginTop: 16 }}>Operational clean state.</AuraText>
                    </View>
                ) : (
                    disputes.map((d, i) => (
                        <AuraMotion key={d.id} type="slide" delay={i * 50} style={styles.card}>
                            <View style={styles.cardHeader}>
                                <AuraBadge label={d.status.toUpperCase()} variant={d.status === 'open' ? 'error' : 'success'} />
                                <AuraText variant="caption" color={AuraColors.gray500}>{new Date(d.created_at).toLocaleDateString()}</AuraText>
                            </View>

                            <AuraText variant="h3" style={{ marginTop: 12 }}>{d.gig?.title || 'Unknown Gig'}</AuraText>
                            <AuraText variant="body" color={AuraColors.gray300} style={{ marginVertical: 8 }}>
                                <AuraText variant="bodyBold">Reason:</AuraText> {d.reason}
                            </AuraText>

                            <View style={styles.parties}>
                                <View style={{ flex: 1 }}>
                                    <AuraText variant="label" color={AuraColors.gray500}>INITIATOR</AuraText>
                                    <AuraText variant="bodySmall" color={AuraColors.white}>{d.initiator?.full_name}</AuraText>
                                </View>
                                <View style={{ flex: 1 }}>
                                    <AuraText variant="label" color={AuraColors.gray500}>DEFENDANT</AuraText>
                                    <AuraText variant="bodySmall" color={AuraColors.white}>{d.defendant?.full_name}</AuraText>
                                </View>
                            </View>

                            <View style={styles.actions}>
                                <TouchableOpacity
                                    style={styles.actionBtn}
                                    onPress={() => navigation.navigate('GigDetails', { gigId: d.gig_id })}
                                >
                                    <ExternalLink size={16} color={AuraColors.primary} />
                                    <AuraText variant="label" color={AuraColors.primary} style={{ marginLeft: 8 }}>VIEW MISSION</AuraText>
                                </TouchableOpacity>

                                {d.status === 'open' && (
                                    <TouchableOpacity
                                        style={[styles.actionBtn, styles.resolveBtn]}
                                        onPress={() => handleResolve(d.id)}
                                    >
                                        <CheckCircle size={16} color={AuraColors.success} />
                                        <AuraText variant="label" color={AuraColors.success} style={{ marginLeft: 8 }}>RESOLVE</AuraText>
                                    </TouchableOpacity>
                                )}
                            </View>
                        </AuraMotion>
                    ))
                )}
            </ScrollView>
        </View>
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
    stats: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 32,
    },
    statBox: {
        flex: 1,
        backgroundColor: AuraColors.surfaceElevated,
        padding: 20,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: AuraColors.gray800,
        alignItems: 'center',
    },
    empty: {
        alignItems: 'center',
        marginTop: 80,
    },
    card: {
        backgroundColor: AuraColors.surfaceElevated,
        padding: 20,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: AuraColors.gray800,
        marginBottom: 16,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    parties: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255,255,255,0.03)',
        padding: 12,
        borderRadius: 12,
        marginTop: 12,
    },
    actions: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 20,
        borderTopWidth: 1,
        borderTopColor: AuraColors.gray800,
        paddingTop: 16,
    },
    actionBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(0,122,255,0.2)',
    },
    resolveBtn: {
        borderColor: 'rgba(52,199,89,0.2)',
    }
});
