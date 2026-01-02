import React, { useEffect, useState, useCallback } from 'react';
import { View, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { supabase } from '@api/supabase';
import { AuraColors, AuraSpacing, AuraShadows, AuraBorderRadius } from '@theme/aura';
import { CheckCircle, XCircle, MessageSquare, Target, Star } from 'lucide-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAuraHaptics } from '@core/hooks/useAuraHaptics';
import { AuraText } from '@core/components/AuraText';
import { AuraAvatar } from '@core/components/AuraAvatar';
import { AuraButton } from '@core/components/AuraButton';
import { AuraHeader } from '@core/components/AuraHeader';
import { AuraMotion } from '@core/components/AuraMotion';
import { useAura } from '@core/context/AuraProvider';
import { useAuth } from '@context/AuthProvider';
import { Repository } from '@api/repository';

export default function GigManagerScreen() {
    const route = useRoute();
    const navigation = useNavigation<any>();
    const { showDialog, showToast, addReputation } = useAura();
    const { user } = useAuth();
    const haptics = useAuraHaptics();
    const { gigId } = route.params as { gigId: string };

    const [applicants, setApplicants] = useState<any[]>([]);

    const [gigDetails, setGigDetails] = useState<any>(null);

    const fetchGigDetails = useCallback(async () => {
        const { data } = await Repository.getGigDetails(gigId);
        setGigDetails(data);
    }, [gigId]);

    const fetchApplicants = useCallback(async () => {
        const { data } = await Repository.getApplicants(gigId);
        if (data) setApplicants(data.filter(a => ['pending', 'accepted'].includes(a.status)));

    }, [gigId]);

    useEffect(() => {
        fetchGigDetails();
        fetchApplicants();

        const channel = supabase.channel(`gig-mgr-${gigId}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'applications', filter: `gig_id=eq.${gigId}` }, () => fetchApplicants())
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [gigId, fetchGigDetails, fetchApplicants]);

    const handleDecision = async (applicationId: string, decision: 'accepted' | 'rejected') => {
        decision === 'accepted' ? haptics.heavy() : haptics.medium();

        if (decision === 'accepted') {
            showDialog({
                title: 'Confirm Deployment',
                message: 'Authorizing this talent will assign the mission and notify all other applicants. Proceed?',
                type: 'warning',
                onConfirm: () => processDecision(applicationId, decision)
            });
        } else {
            processDecision(applicationId, decision);
        }
    };

    const processDecision = async (applicationId: string, decision: 'accepted' | 'rejected') => {

        const { error } = await Repository.updateApplicationStatus(applicationId, decision);

        if (!error) {
            if (decision === 'accepted') {
                const talentId = applicants.find(a => a.id === applicationId)?.talent_id;

                // Update gig status and assign talent
                await Repository.updateGig(gigId, {
                    assigned_talent_id: talentId,
                    status: 'active'
                });

                // Create escrow transaction
                if (gigDetails && talentId && user) {
                    await Repository.createEscrow({
                        gig_id: gigId,
                        client_id: user.id,
                        talent_id: talentId,
                        amount_cents: gigDetails.pay_amount_cents || (gigDetails.budget * 100),
                        status: 'held'
                    });
                }

                // Create/Access Chat Room
                await Repository.createChatRoom(gigId);

                showToast({ message: "Personnel Deployed Successfully", type: 'success' });
                haptics.success();
                addReputation(200);
            } else {
                showToast({ message: "Application Declined", type: 'info' });
            }
            fetchApplicants();
        } else {

            showToast({ message: error.message, type: 'error' });
        }
    };

    const renderApplicant = ({ item, index }: { item: any, index: number }) => {
        const talent = item.profiles;
        const isPending = item.status === 'pending';

        return (
            <AuraMotion type="slide" delay={index * 60}>
                <View style={[styles.applicantCard, !isPending && styles.acceptedCard]}>
                    <View style={styles.cardHeader}>
                        <AuraAvatar source={talent?.avatar_url} size={64} />
                        <View style={styles.headerInfo}>
                            <View style={styles.nameRow}>
                                <AuraText variant="h3">{talent?.full_name}</AuraText>
                                <View style={styles.scoreBadge}>
                                    <Star size={12} color={AuraColors.primary} fill={AuraColors.primary} />
                                    <AuraText variant="label" style={{ marginLeft: 4, color: AuraColors.primary }}>4.9</AuraText>
                                </View>
                            </View>
                            <AuraText variant="caption" color={AuraColors.gray500}>TRUST IDX: {talent?.trust_score || '98'}% • ELITE</AuraText>
                        </View>
                    </View>

                    <View style={styles.pitchContainer}>
                        <AuraText variant="body" color={AuraColors.gray300}>
                            {item.message || "Talent is ready for deployment. Briefing details requested upon arrival."}
                        </AuraText>
                    </View>

                    {isPending ? (
                        <View style={styles.actionRow}>
                            <TouchableOpacity
                                style={styles.chatBtn}
                                onPress={() => navigation.navigate('Chat', { roomId: `direct_${talent.id}`, recipientName: talent.full_name })}
                            >
                                <MessageSquare color={AuraColors.primary} size={20} />
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.decisionBtn, styles.declineBtn]}
                                onPress={() => handleDecision(item.id, 'rejected')}
                            >
                                <XCircle color={AuraColors.error} size={20} />
                                <AuraText variant="label" color={AuraColors.error} style={{ marginLeft: 8 }}>REJECT</AuraText>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.decisionBtn, styles.deployBtn]}
                                onPress={() => handleDecision(item.id, 'accepted')}
                            >
                                <CheckCircle color={AuraColors.white} size={20} />
                                <AuraText variant="label" color={AuraColors.white} style={{ marginLeft: 8 }}>DEPLOY</AuraText>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <AuraButton
                            title="FINALIZE MISSION"
                            variant="primary"
                            onPress={() => navigation.navigate('Review', { gigId, targetUserId: talent.id, targetUserName: talent.full_name })}
                            icon={<Target size={18} color={AuraColors.white} />}
                        />
                    )}
                </View>
            </AuraMotion>
        );
    };

    return (
        <View style={styles.container}>
            <AuraHeader title="Employer Hub" showBack />

            <AuraMotion type="slide" style={styles.statsPanel}>
                <View style={styles.statItem}>
                    <AuraText variant="h2">{applicants.length}</AuraText>
                    <AuraText variant="label" color={AuraColors.gray500}>REPORTS</AuraText>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                    <AuraText variant="h2" color={AuraColors.primary}>₹{gigDetails?.pay_amount_cents / 100 || '0'}</AuraText>
                    <AuraText variant="label" color={AuraColors.gray500}>BOUNTY</AuraText>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                    <AuraText variant="h2">{gigDetails?.duration_minutes || '0'}m</AuraText>
                    <AuraText variant="label" color={AuraColors.gray500}>WINDOW</AuraText>
                </View>
            </AuraMotion>

            <FlatList
                data={applicants}
                renderItem={renderApplicant}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <ActivityIndicator color={AuraColors.primary} />
                        <AuraText variant="body" color={AuraColors.gray500} style={{ marginTop: 16 }}>
                            Listening for incoming talent signals...
                        </AuraText>
                    </View>
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: AuraColors.background,
    },
    statsPanel: {
        flexDirection: 'row',
        backgroundColor: AuraColors.surfaceElevated,
        marginHorizontal: AuraSpacing.xl,
        marginTop: 12,
        marginBottom: 24,
        paddingVertical: 24,
        borderRadius: AuraBorderRadius.xxl,
        borderWidth: 1,
        borderColor: AuraColors.gray800,
        ...AuraShadows.soft,
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
    },
    statDivider: {
        width: 1,
        backgroundColor: AuraColors.gray800,
        height: '60%',
        alignSelf: 'center',
    },
    listContent: {
        paddingHorizontal: AuraSpacing.xl,
        paddingBottom: 40,
    },
    applicantCard: {
        backgroundColor: AuraColors.surfaceElevated,
        borderRadius: AuraBorderRadius.xl,
        padding: 20,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: AuraColors.gray800,
    },
    acceptedCard: {
        borderColor: AuraColors.primary,
        backgroundColor: 'rgba(0,122,255,0.05)',
    },
    cardHeader: {
        flexDirection: 'row',
        gap: 16,
        alignItems: 'center',
    },
    headerInfo: {
        flex: 1,
    },
    nameRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    scoreBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 122, 255, 0.1)',
        paddingHorizontal: AuraSpacing.s,
        paddingVertical: 4,
        borderRadius: AuraBorderRadius.s,
    },
    pitchContainer: {
        backgroundColor: 'rgba(255,255,255,0.02)',
        padding: AuraSpacing.l,
        borderRadius: 16,
        marginVertical: 20,
        borderWidth: 1,
        borderColor: AuraColors.gray800,
    },
    actionRow: {
        flexDirection: 'row',
        gap: 12,
    },
    chatBtn: {
        width: 56,
        height: 56,
        borderRadius: 16,
        backgroundColor: AuraColors.surfaceElevated,
        borderWidth: 1,
        borderColor: AuraColors.gray800,
        alignItems: 'center',
        justifyContent: 'center',
    },
    decisionBtn: {
        flex: 1,
        height: 56,
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
    },
    declineBtn: {
        borderColor: 'rgba(255, 59, 48, 0.2)',
        backgroundColor: 'rgba(255, 59, 48, 0.05)',
    },
    deployBtn: {
        backgroundColor: AuraColors.primary,
        borderColor: AuraColors.primary,
    },
    emptyState: {
        marginTop: 80,
        alignItems: 'center',
    }
});
