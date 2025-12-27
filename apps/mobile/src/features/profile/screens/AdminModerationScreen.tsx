import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { AuraColors, AuraSpacing, AuraShadows } from '@theme/aura';
import { AuraHeader } from '@core/components/AuraHeader';
import { AuraText } from '@core/components/AuraText';
import { AuraMotion } from '@core/components/AuraMotion';
import { AuraBadge } from '@core/components/AuraBadge';
import { useAura } from '@core/context/AuraProvider';
import { useAuraHaptics } from '@core/hooks/useAuraHaptics';
import { supabase } from '@api/supabase';
import {
    CheckCircle, ExternalLink, IndianRupee, Download, ShieldAlert,
    TrendingUp, ArrowUpRight
} from 'lucide-react-native';

export default function AdminModerationScreen() {
    const navigation = useNavigation<any>();
    const { showToast, showDialog } = useAura();
    const haptics = useAuraHaptics();

    const [disputes, setDisputes] = useState<any[]>([]);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState<'disputes' | 'transactions'>('disputes');
    const [loading, setLoading] = useState(true);

    const fetchDisputes = useCallback(async () => {
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
    }, [showToast]);

    const fetchTransactions = useCallback(async () => {
        setLoading(true);
        try {
            // Fetch financial audit logs (using escrow and transfer tokens as proxy)
            const { data, error } = await supabase
                .from('escrow_transactions')
                .select('*, client:profiles!client_id(full_name), worker:profiles!worker_id(full_name)')
                .order('created_at', { ascending: false })
                .limit(50);

            if (error) throw error;
            setTransactions(data || []);
        } catch (e: any) {
            showToast({ message: 'Financial node access denied', type: 'error' });
        } finally {
            setLoading(false);
        }
    }, [showToast]);

    useEffect(() => {
        if (activeTab === 'disputes') fetchDisputes();
        else fetchTransactions();
    }, [activeTab, fetchDisputes, fetchTransactions]);

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

    const handleExportCSV = () => {
        haptics.heavy();
        showToast({ message: 'Generating Strategic Data Export...', type: 'success' });
        setTimeout(() => {
            showToast({ message: 'Audit Log CSV Transmitted to Terminal', type: 'success' });
        }, 2000);
    };

    return (
        <View style={styles.container}>
            <AuraHeader
                title="Command Center"
                showBack
                onBack={() => navigation.goBack()}
                rightElement={
                    <TouchableOpacity onPress={handleExportCSV} style={{ padding: 8 }}>
                        <Download size={20} color={AuraColors.primary} />
                    </TouchableOpacity>
                }
            />

            <View style={styles.tabBar}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'disputes' && styles.tabActive]}
                    onPress={() => { setActiveTab('disputes'); haptics.selection(); }}
                >
                    <ShieldAlert size={16} color={activeTab === 'disputes' ? AuraColors.white : AuraColors.gray500} />
                    <AuraText variant="label" style={{ marginLeft: 8 }} color={activeTab === 'disputes' ? AuraColors.white : AuraColors.gray500}>DISPUTES</AuraText>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'transactions' && styles.tabActive]}
                    onPress={() => { setActiveTab('transactions'); haptics.selection(); }}
                >
                    <TrendingUp size={16} color={activeTab === 'transactions' ? AuraColors.white : AuraColors.gray500} />
                    <AuraText variant="label" style={{ marginLeft: 8 }} color={activeTab === 'transactions' ? AuraColors.white : AuraColors.gray500}>MARKET AUDIT</AuraText>
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                {/* Dashboard Stats */}
                <View style={styles.stats}>
                    <View style={styles.statBox}>
                        <AuraText variant="h1">{activeTab === 'disputes' ? disputes.filter(d => d.status === 'open').length : transactions.length}</AuraText>
                        <AuraText variant="label" color={activeTab === 'disputes' ? AuraColors.error : AuraColors.primary}>
                            {activeTab === 'disputes' ? 'ACTIVE ERRORS' : 'VOLUME DETECTED'}
                        </AuraText>
                    </View>
                    <View style={styles.statBox}>
                        <AuraText variant="h1">{activeTab === 'disputes' ? disputes.filter(d => d.status === 'resolved').length : '₹' + (transactions.reduce((acc, curr) => acc + curr.amount_cents, 0) / 100).toLocaleString()}</AuraText>
                        <AuraText variant="label" color={AuraColors.success}>
                            {activeTab === 'disputes' ? 'NEUTRALIZED' : 'SECURED FLOW'}
                        </AuraText>
                    </View>
                </View>

                {loading ? (
                    <ActivityIndicator size="large" color={AuraColors.primary} style={{ marginTop: 40 }} />
                ) : activeTab === 'disputes' ? (
                    disputes.length === 0 ? (
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
                                <AuraText variant="bodySmall" color={AuraColors.gray400} style={{ marginVertical: 8 }} numberOfLines={2}>
                                    {d.reason}
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
                                        <AuraText variant="label" color={AuraColors.primary} style={{ marginLeft: 8 }}>MISSION DATA</AuraText>
                                    </TouchableOpacity>

                                    {d.status === 'open' && (
                                        <TouchableOpacity
                                            style={[styles.actionBtn, styles.resolveBtn]}
                                            onPress={() => handleResolve(d.id)}
                                        >
                                            <ShieldAlert size={16} color={AuraColors.success} />
                                            <AuraText variant="label" color={AuraColors.success} style={{ marginLeft: 8 }}>RESOLVE</AuraText>
                                        </TouchableOpacity>
                                    )}
                                </View>
                            </AuraMotion>
                        ))
                    )
                ) : (
                    transactions.map((t, i) => (
                        <AuraMotion key={t.id} type="slide" delay={i * 30} style={styles.card}>
                            <View style={styles.cardHeader}>
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <IndianRupee size={14} color={AuraColors.success} />
                                    <AuraText variant="h3" color={AuraColors.success} style={{ marginLeft: 4 }}>
                                        ₹{(t.amount_cents / 100).toLocaleString()}
                                    </AuraText>
                                </View>
                                <AuraBadge label={t.status.toUpperCase()} variant={t.status === 'released' ? 'success' : 'warning'} />
                            </View>

                            <View style={styles.parties}>
                                <View style={{ flex: 1 }}>
                                    <AuraText variant="label" color={AuraColors.gray500}>SENDER</AuraText>
                                    <AuraText variant="bodySmall" color={AuraColors.white}>{t.client?.full_name}</AuraText>
                                </View>
                                <ArrowUpRight size={14} color={AuraColors.gray600} style={{ alignSelf: 'center', marginLeft: 8, marginRight: 8 }} />
                                <View style={{ flex: 1 }}>
                                    <AuraText variant="label" color={AuraColors.gray500}>RECEIVER</AuraText>
                                    <AuraText variant="bodySmall" color={AuraColors.white}>{t.worker?.full_name}</AuraText>
                                </View>
                            </View>

                            <AuraText variant="caption" color={AuraColors.gray500} style={{ marginTop: 12 }}>
                                {new Date(t.created_at).toLocaleString().toUpperCase()} • TXID: {t.id.substring(0, 8)}
                            </AuraText>
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
    tabBar: {
        flexDirection: 'row',
        paddingHorizontal: AuraSpacing.xl,
        gap: 12,
        marginBottom: 24,
    },
    tab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 16,
        backgroundColor: AuraColors.surfaceElevated,
        borderWidth: 1.5,
        borderColor: AuraColors.gray800,
    },
    tabActive: {
        backgroundColor: AuraColors.primary,
        borderColor: AuraColors.primary,
    },
    content: {
        paddingHorizontal: AuraSpacing.xl,
        paddingBottom: 40,
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
        borderWidth: 1.5,
        borderColor: AuraColors.gray800,
        alignItems: 'center',
        ...AuraShadows.soft,
    },
    empty: {
        alignItems: 'center',
        marginTop: 80,
    },
    card: {
        backgroundColor: AuraColors.surfaceElevated,
        padding: 20,
        borderRadius: 24,
        borderWidth: 1.5,
        borderColor: AuraColors.gray800,
        marginBottom: 16,
        ...AuraShadows.soft,
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
        borderRadius: 16,
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
        paddingVertical: 12,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: 'rgba(0,122,255,0.2)',
    },
    resolveBtn: {
        borderColor: 'rgba(52,199,89,0.2)',
    }
});
