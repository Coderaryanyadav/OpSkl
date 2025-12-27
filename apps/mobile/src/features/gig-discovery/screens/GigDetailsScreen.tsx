import React, { useState, useCallback, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert, Linking } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { supabase } from '@api/supabase';
import { AuraColors, AuraSpacing, AuraShadows, AuraBorderRadius } from '@theme/aura';
import { AuraHeader } from '@core/components/AuraHeader';
import { AuraText } from '@core/components/AuraText';
import { AuraButton } from '@core/components/AuraButton';
import { AuraInput } from '@core/components/AuraInput';
import { AuraLoader } from '@core/components/AuraLoader';
import { AuraMotion } from '@core/components/AuraMotion';
import { useAuraHaptics } from '@core/hooks/useAuraHaptics';
import { useAuth } from '@context/AuthProvider';
import { useAura } from '@core/context/AuraProvider';
import { AuraBadge } from '@core/components/AuraBadge';
import { Repository } from '@api/repository';
import { Gig, Deliverable, EscrowTransaction, Milestone } from '@features/gig-discovery/types';
import { Upload, CheckCircle, Clock, ShieldCheck, FileText, DollarSign, MessageSquare, AlertTriangle, Layers, Flag } from 'lucide-react-native';
import { ApplicationModal } from '../components/ApplicationModal';
import { Analytics } from '@core/utils/analytics';

export default function GigDetailsScreen() {
    const route = useRoute();
    const navigation = useNavigation<any>();
    const { gigId } = route.params as { gigId: string };
    const { user } = useAuth();
    const { showToast, showDialog } = useAura();
    const haptics = useAuraHaptics();

    const [gig, setGig] = useState<Gig | null>(null);
    const [deliverables, setDeliverables] = useState<Deliverable[]>([]);
    const [escrow, setEscrow] = useState<EscrowTransaction | null>(null);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [milestones, setMilestones] = useState<Milestone[]>([]);

    // Header for deliverable upload
    const [fileLink, setFileLink] = useState('');
    const [fileDesc, setFileDesc] = useState('');
    const [showUploadForm, setShowUploadForm] = useState(false);
    const [isApplyModalVisible, setIsApplyModalVisible] = useState(false);

    const isWorker = user?.id === gig?.assigned_worker_id;
    const isClient = user?.id === gig?.client_id;

    const fetchDetails = useCallback(async () => {
        try {
            // Get Gig Details
            const { data: gigData, error: gigError } = await supabase
                .from('gigs')
                .select('*, client:profiles!client_id(*)')
                .eq('id', gigId)
                .single();

            if (gigError) throw gigError;
            setGig(gigData);

            // Track View
            Analytics.track('GIG_VIEWED', { gig_id: gigId, title: gigData.title, budget: gigData.budget });

            // Get Deliverables
            const { data: delData } = await supabase
                .from('deliverables')
                .select('*')
                .eq('gig_id', gigId)
                .order('created_at', { ascending: false });

            if (delData) setDeliverables(delData);

            // Get Escrow Status
            const { data: escrowData } = await supabase
                .from('escrow_transactions')
                .select('*')
                .eq('gig_id', gigId)
                .single();

            if (escrowData) setEscrow(escrowData);

            // Get Milestones
            const { data: miloData } = await Repository.getMilestones(gigId);
            if (miloData) setMilestones(miloData);

        } catch (error: any) {
            console.error('Error fetching gig details:', error);
            showToast({ message: 'Failed to load operational data', type: 'error' });
        } finally {
            setLoading(false);
        }
    }, [gigId]);

    useEffect(() => {
        fetchDetails();

        // Realtime subscription for deliverables and gig status
        const sub = supabase.channel(`gig-detail-${gigId}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'deliverables', filter: `gig_id=eq.${gigId}` }, () => fetchDetails())
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'gigs', filter: `id=eq.${gigId}` }, () => fetchDetails())
            .on('postgres_changes', { event: '*', schema: 'public', table: 'escrow_transactions', filter: `gig_id=eq.${gigId}` }, () => fetchDetails())
            .subscribe();

        return () => { supabase.removeChannel(sub); };
    }, [gigId, fetchDetails]);

    const handleSubmitDeliverable = async () => {
        if (!fileLink.trim()) {
            showToast({ message: 'Secure link required', type: 'error' });
            return;
        }

        setUploading(true);
        haptics.heavy();

        try {
            if (!user) throw new Error("Authentication missing");

            const { error } = await Repository.submitDeliverable({
                gig_id: gigId,
                worker_id: user.id,
                file_url: fileLink,
                description: fileDesc || 'Operational Asset Submitted'
            });

            if (error) throw error;

            showToast({ message: 'Asset Transmitted Successfully', type: 'success' });
            setFileLink('');
            setFileDesc('');
            setShowUploadForm(false);
            haptics.success();

        } catch (e: any) {
            showToast({ message: e.message, type: 'error' });
            haptics.error();
        } finally {
            setUploading(false);
        }
    };

    const handleReleaseEscrow = async () => {
        haptics.warning();
        showDialog({
            title: 'Release Funds?',
            message: 'This will irreversibly transfer the bounty to the operative. Ensure all objectives are met.',
            type: 'warning',
            onConfirm: async () => {
                setUploading(true);
                try {
                    // 🔒 Use Secure RPC
                    const { error } = await supabase.rpc('release_escrow', { p_gig_id: gigId });

                    if (error) throw error;

                    haptics.success();
                    showToast({ message: 'Funds Released. Mission Complete.', type: 'success' });

                    // Navigate to Review
                    if (gig && gig.assigned_worker_id) {
                        navigation.replace('Review', { gigId, targetUserId: gig.assigned_worker_id, targetUserName: 'Operative' });
                    }

                } catch (e: any) {
                    console.error('Release failed:', e);
                    showToast({ message: e.message || 'Transaction Failed', type: 'error' });
                } finally {
                    setUploading(false);
                }
            }
        });
    };

    const handleReleaseMilestone = async (m: Milestone) => {
        haptics.warning();
        showDialog({
            title: 'Release Milestone Funds?',
            message: `Verify '${m.title}' is completed. This will transfer ₹${(m.amount_cents / 100).toLocaleString()} to the operative.`,
            type: 'warning',
            onConfirm: async () => {
                setUploading(true);
                try {
                    const { error } = await supabase.rpc('release_milestone', { p_milestone_id: m.id });
                    if (error) throw error;
                    haptics.success();
                    showToast({ message: 'Milestone Funds Released', type: 'success' });
                    fetchDetails();
                } catch (e: any) {
                    showToast({ message: e.message || 'Transaction Failed', type: 'error' });
                } finally {
                    setUploading(false);
                }
            }
        });
    };

    const handleMarkMilestoneComplete = async (mId: string) => {
        haptics.success();
        try {
            const { error } = await Repository.updateMilestoneStatus(mId, 'completed');
            if (error) throw error;
            showToast({ message: 'Milestone marked for review', type: 'success' });
            fetchDetails();
        } catch (e: any) {
            showToast({ message: 'Update failed', type: 'error' });
        }
    };

    const handleApplyGig = async (message: string) => {
        if (!user) return;
        setUploading(true);
        haptics.heavy();
        try {
            const { error } = await Repository.applyToGig(gigId, user.id, message);
            if (error) throw error;
            showToast({ message: 'Application Transmitted', type: 'success' });
            setIsApplyModalVisible(false);
            fetchDetails();
        } catch (e: any) {
            showToast({ message: e.message || 'Transmission Failed', type: 'error' });
        } finally {
            setUploading(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <AuraLoader size={48} />
                <AuraText variant="label" style={{ marginTop: 24, letterSpacing: 3 }}>DECRYPTING PICKET...</AuraText>
            </View>
        );
    }

    if (!gig) {
        return (
            <View style={styles.center}>
                <AuraText variant="h3" color={AuraColors.error}>Mission Signal Lost</AuraText>
                <AuraButton title="Return to Base" onPress={() => navigation.goBack()} style={{ marginTop: 24 }} />
            </View>
        );
    }

    const payAmount = ((gig.pay_amount_cents || 0) / 100).toLocaleString();

    return (
        <View style={styles.container}>
            <AuraHeader title="Mission Control" showBack />

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

                {/* Status Banner */}
                <AuraMotion type="slide" style={styles.statusBanner}>
                    <View style={styles.statusRow}>
                        <View style={[styles.statusIcon,
                        gig.status === 'completed' ? { backgroundColor: AuraColors.success } :
                            gig.status === 'active' ? { backgroundColor: AuraColors.primary } :
                                { backgroundColor: AuraColors.gray500 }
                        ]}>
                            {gig.status === 'completed' ? <CheckCircle size={20} color={AuraColors.white} /> :
                                gig.status === 'active' ? <Clock size={20} color={AuraColors.white} /> :
                                    <AlertTriangle size={20} color={AuraColors.white} />}
                        </View>
                        <View>
                            <AuraText variant="h3" style={{ textTransform: 'uppercase' }}>status: {gig.status}</AuraText>
                            <AuraText variant="caption" color={AuraColors.gray400}>ID: {gig.id.substring(0, 8)}</AuraText>
                        </View>
                    </View>

                    {escrow && (
                        <View style={styles.escrowBadge}>
                            <ShieldCheck size={14} color={AuraColors.success} />
                            <AuraText variant="label" color={AuraColors.success} style={{ marginLeft: 6 }}>ESCROW SECURED</AuraText>
                        </View>
                    )}
                </AuraMotion>

                {/* Mission Details */}
                <View style={styles.section}>
                    <AuraText variant="h1" style={styles.title}>{gig.title}</AuraText>
                    <AuraText variant="body" color={AuraColors.gray300} style={styles.desc}>{gig.description}</AuraText>

                    <View style={styles.metaRow}>
                        <View style={styles.metaItem}>
                            <DollarSign size={16} color={AuraColors.warning} />
                            <AuraText variant="bodyBold" color={AuraColors.warning}>₹{payAmount}</AuraText>
                        </View>
                        <View style={styles.metaItem}>
                            <Clock size={16} color={AuraColors.gray400} />
                            <AuraText variant="bodyBold" color={AuraColors.gray400}>{gig.duration_minutes}m Estimate</AuraText>
                        </View>
                    </View>
                </View>

                {/* Milestone Progress Section */}
                {milestones.length > 0 && (
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <AuraText variant="h3">System Milestones</AuraText>
                            <AuraBadge
                                label={`${milestones.filter(m => m.status === 'paid').length}/${milestones.length} COMPLETE`}
                                variant="success"
                            />
                        </View>

                        <View style={styles.milestoneList}>
                            {milestones.map((m, i) => (
                                <View key={m.id} style={styles.milestoneCard}>
                                    <View style={styles.milestoneHeader}>
                                        <View style={[styles.mIndex, m.status === 'paid' && { backgroundColor: AuraColors.success }]}>
                                            <AuraText variant="label" color={AuraColors.white}>{i + 1}</AuraText>
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <AuraText variant="bodyBold">{m.title}</AuraText>
                                            <AuraText variant="caption" color={AuraColors.gray500}>₹{(m.amount_cents / 100).toLocaleString()}</AuraText>
                                        </View>

                                        {m.status === 'paid' ? (
                                            <ShieldCheck size={18} color={AuraColors.success} />
                                        ) : m.status === 'completed' ? (
                                            <Clock size={18} color={AuraColors.warning} />
                                        ) : (
                                            <Flag size={18} color={AuraColors.gray700} />
                                        )}
                                    </View>

                                    {/* Actions */}
                                    {isClient && m.status === 'completed' && (
                                        <TouchableOpacity
                                            style={styles.mActionBtn}
                                            onPress={() => handleReleaseMilestone(m)}
                                        >
                                            <AuraText variant="label" color={AuraColors.primary}>VERIFY & RELEASE</AuraText>
                                        </TouchableOpacity>
                                    )}

                                    {isWorker && m.status === 'pending' && (
                                        <TouchableOpacity
                                            style={styles.mActionBtn}
                                            onPress={() => handleMarkMilestoneComplete(m.id)}
                                        >
                                            <AuraText variant="label" color={AuraColors.primary}>MARK AS COMPLETE</AuraText>
                                        </TouchableOpacity>
                                    )}
                                </View>
                            ))}
                        </View>
                    </View>
                )}

                {/* Deliverables Section */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <AuraText variant="h3">Deliverables</AuraText>
                        {isWorker && gig.status === 'active' && (
                            <TouchableOpacity onPress={() => setShowUploadForm(!showUploadForm)}>
                                <AuraText variant="label" color={AuraColors.primary}>{showUploadForm ? 'CANCEL' : '+ ADD ASSET'}</AuraText>
                            </TouchableOpacity>
                        )}
                    </View>

                    {showUploadForm && isWorker && (
                        <AuraMotion type="zoom" style={styles.uploadForm}>
                            <AuraInput
                                placeholder="Secure Asset Link (Dropbox/Drive)..."
                                value={fileLink}
                                onChangeText={setFileLink}
                                leftIcon={<Upload size={16} color={AuraColors.gray500} />}
                            />
                            <AuraInput
                                placeholder="Briefing Note (Optional)..."
                                value={fileDesc}
                                onChangeText={setFileDesc}
                                multiline
                                style={{ height: 80 }}
                            />
                            <AuraButton
                                title={uploading ? "TRANSMITTING..." : "SUBMIT ASSET"}
                                onPress={handleSubmitDeliverable}
                                disabled={uploading}
                                variant="primary"
                            />
                        </AuraMotion>
                    )}

                    {deliverables.length === 0 ? (
                        <View style={styles.emptyState}>
                            <FileText size={32} color={AuraColors.gray700} />
                            <AuraText variant="body" color={AuraColors.gray600} style={{ marginTop: 12 }}>No assets submitted yet.</AuraText>
                        </View>
                    ) : (
                        deliverables.map((del, i) => (
                            <AuraMotion key={del.id} type="slide" delay={i * 100} style={styles.deliverableItem}>
                                <View style={styles.delIcon}>
                                    <FileText size={20} color={AuraColors.primary} />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <AuraText variant="bodyBold" numberOfLines={1}>{del.description || 'Untitled Asset'}</AuraText>
                                    <TouchableOpacity onPress={() => Linking.openURL(del.file_url)}>
                                        <AuraText variant="label" color={AuraColors.primary} numberOfLines={1}>{del.file_url}</AuraText>
                                    </TouchableOpacity>
                                    <AuraText variant="caption" color={AuraColors.gray500} style={{ marginTop: 4 }}>
                                        {new Date(del.created_at).toLocaleString()}
                                    </AuraText>
                                </View>
                                <CheckCircle size={18} color={AuraColors.success} />
                            </AuraMotion>
                        ))
                    )}
                </View>

                {/* Client Actions */}
                {isClient && gig.status === 'active' && deliverables.length > 0 && (
                    <AuraMotion type="slide" style={styles.actionSection}>
                        <AuraButton
                            title="RELEASE FUNDS & COMPLETE"
                            variant="primary"
                            onPress={handleReleaseEscrow}
                            icon={<ShieldCheck size={20} color={AuraColors.white} />}
                        />
                        <AuraText variant="caption" color={AuraColors.gray500} align="center" style={{ marginTop: 16 }}>
                            Ensures trust-less value transfer via escrow protocol.
                        </AuraText>
                    </AuraMotion>
                )}

                {/* Dispute Action */}
                {gig.status === 'active' && (
                    <TouchableOpacity
                        style={{ marginTop: 24, alignItems: 'center' }}
                        onPress={() => {
                            const defendantId = isClient ? gig.assigned_worker_id : gig.client_id;
                            if (defendantId) {
                                navigation.navigate('Dispute', { gigId: gig.id, defendantId });
                            }
                        }}
                    >
                        <AuraText variant="label" color={AuraColors.error} style={{ letterSpacing: 1 }}>
                            REPORT ISSUE / DISPUTE
                        </AuraText>
                    </TouchableOpacity>
                )}

                {/* Chat Button */}
                <TouchableOpacity
                    style={styles.chatFab}
                    onPress={() => navigation.navigate('Chat', {
                        roomId: isClient ? `direct_${gig.assigned_worker_id}` : `direct_${gig.client_id}`,
                        recipientName: 'Mission Contact' // Ideally fetch real name
                    })}
                >
                    <MessageSquare size={24} color={AuraColors.white} />
                </TouchableOpacity>

                {/* Apply Button for Workers */}
                {!isWorker && !isClient && gig.status === 'open' && (
                    <AuraMotion type="slide" style={styles.bottomApply}>
                        <AuraButton
                            title="APPLY TO MISSION"
                            variant="primary"
                            onPress={() => setIsApplyModalVisible(true)}
                        />
                    </AuraMotion>
                )}

                <ApplicationModal
                    visible={isApplyModalVisible}
                    onClose={() => setIsApplyModalVisible(false)}
                    onSubmit={handleApplyGig}
                    loading={uploading}
                />

                <View style={{ height: 120 }} />
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
    center: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: AuraColors.background,
    },
    statusBanner: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: AuraColors.surfaceElevated,
        padding: 16,
        borderRadius: AuraBorderRadius.xl,
        borderWidth: 1,
        borderColor: AuraColors.gray800,
        marginBottom: 24,
    },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    statusIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    escrowBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(52, 199, 89, 0.1)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    section: {
        marginBottom: 32,
    },
    title: {
        fontSize: 28,
        lineHeight: 34,
        marginBottom: 12,
    },
    desc: {
        lineHeight: 24,
        marginBottom: 20,
    },
    metaRow: {
        flexDirection: 'row',
        gap: 20,
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: AuraColors.surfaceElevated,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 12,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    uploadForm: {
        gap: 16,
        backgroundColor: AuraColors.surface,
        padding: 16,
        borderRadius: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: AuraColors.gray800,
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 32,
        backgroundColor: 'rgba(255,255,255,0.02)',
        borderRadius: 16,
        borderStyle: 'dashed',
        borderWidth: 1,
        borderColor: AuraColors.gray700,
    },
    deliverableItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        backgroundColor: AuraColors.surfaceElevated,
        padding: 16,
        borderRadius: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: AuraColors.gray800,
    },
    delIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(0,122,255,0.1)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    actionSection: {
        backgroundColor: AuraColors.surfaceElevated,
        padding: 24,
        borderRadius: AuraBorderRadius.xl,
        borderWidth: 1,
        borderColor: AuraColors.gray800,
    },
    chatFab: {
        position: 'absolute',
        bottom: 32,
        right: 24,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: AuraColors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        ...AuraShadows.floating,
    },
    milestoneList: {
        gap: 12,
        marginTop: 12,
    },
    milestoneCard: {
        backgroundColor: AuraColors.surfaceElevated,
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: AuraColors.gray800,
    },
    milestoneHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 8,
    },
    mIndex: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: AuraColors.gray700,
        alignItems: 'center',
        justifyContent: 'center',
    },
    mActionBtn: {
        marginTop: 8,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: AuraColors.gray800,
        alignItems: 'center',
    },
    bottomApply: {
        marginTop: 40,
        backgroundColor: AuraColors.surfaceElevated,
        padding: 24,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: AuraColors.gray800,
    }
});
