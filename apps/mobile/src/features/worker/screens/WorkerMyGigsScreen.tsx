import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, RefreshControl, ScrollView } from 'react-native';
import { supabase } from '../../../core/api/supabase';
import { AuraColors, AuraSpacing, AuraShadows, AuraBorderRadius } from '../../../core/theme/aura';
import { AuraHeader } from '../../../core/components/AuraHeader';
import GigCard from '../components/GigCard';
import { AuraText } from '../../../core/components/AuraText';
import { AuraLoader } from '../../../core/components/AuraLoader';
import { AuraMotion } from '../../../core/components/AuraMotion';
import { Zap, CheckCircle, Activity, ShieldCheck } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

export default function WorkerMyGigsScreen() {
    const [activeGigs, setActiveGigs] = useState<any[]>([]);
    const [pendingGigs, setPendingGigs] = useState<any[]>([]);
    const [pastGigs, setPastGigs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchMyGigs = useCallback(async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: applications, error } = await supabase
                .from('applications')
                .select('*, gigs(*)')
                .eq('worker_id', user.id)
                .in('status', ['pending', 'accepted', 'completed'])
                .order('created_at', { ascending: false });

            if (error) throw error;

            const active: any[] = [];
            const pending: any[] = [];
            const past: any[] = [];

            applications?.forEach(app => {
                const gigWithStatus = { ...app.gigs, application_status: app.status };
                if (app.status === 'accepted') {
                    active.push(gigWithStatus);
                } else if (app.status === 'pending') {
                    pending.push(gigWithStatus);
                } else if (app.status === 'completed') {
                    past.push(gigWithStatus);
                }
            });

            setActiveGigs(active);
            setPendingGigs(pending);
            setPastGigs(past);

        } catch (error) {
            console.error('[WorkerMyGigs] Fetch Error:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchMyGigs();

        const channel = supabase.channel('my-gigs-realtime')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'applications'
            }, () => fetchMyGigs())
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [fetchMyGigs]);

    const onRefresh = () => {
        setRefreshing(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        fetchMyGigs();
    };

    const renderEmpty = (title: string, icon: any) => (
        <AuraMotion type="zoom">
            <View style={styles.emptyContainer}>
                <View style={styles.emptyIconBox}>
                    {icon}
                </View>
                <AuraText variant="h3" style={{ marginTop: 24 }}>{title}</AuraText>
                <AuraText variant="body" color={AuraColors.gray400} align="center" style={{ marginTop: 12, paddingHorizontal: 32 }}>
                    Active assignments from your discovery feed will appear here.
                </AuraText>
            </View>
        </AuraMotion>
    );

    if (loading && activeGigs.length === 0 && pendingGigs.length === 0 && pastGigs.length === 0) {
        return (
            <View style={styles.center}>
                <AuraLoader size={48} />
                <AuraText variant="label" style={{ marginTop: 24, letterSpacing: 3 }}>Encrypting Feed...</AuraText>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <AuraHeader title="My Operations" showBack={false} />

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={AuraColors.primary} />
                }
            >
                {/* Active Section */}
                {activeGigs.length > 0 && (
                    <AuraMotion type="slide" style={styles.sectionHeader}>
                        <View style={styles.headerRow}>
                            <Activity size={18} color={AuraColors.success} />
                            <AuraText variant="label" color={AuraColors.success} style={styles.headerText}>
                                In Progress ({activeGigs.length})
                            </AuraText>
                        </View>
                    </AuraMotion>
                )}
                {activeGigs.map((gig, index) => (
                    <AuraMotion key={`active-${gig.id}`} type="slide" delay={index * 100} style={styles.cardWrapper}>
                        <GigCard gig={gig} />
                    </AuraMotion>
                ))}

                {/* Pending Section */}
                {pendingGigs.length > 0 && (
                    <AuraMotion type="slide" style={[styles.sectionHeader, { marginTop: 40 }]}>
                        <View style={styles.headerRow}>
                            <ShieldCheck size={18} color={AuraColors.primary} />
                            <AuraText variant="label" color={AuraColors.primary} style={styles.headerText}>
                                Pending Approval ({pendingGigs.length})
                            </AuraText>
                        </View>
                    </AuraMotion>
                )}
                {pendingGigs.map((gig, index) => (
                    <AuraMotion key={`pending-${gig.id}`} type="slide" delay={index * 100} style={styles.cardWrapper}>
                        <GigCard gig={gig} />
                    </AuraMotion>
                ))}

                {/* Empty State if nothing active or pending */}
                {activeGigs.length === 0 && pendingGigs.length === 0 && (
                    <View style={{ marginTop: 40 }}>
                        {renderEmpty("Base Standby", <Zap size={32} color={AuraColors.gray700} />)}
                    </View>
                )}

                {/* Past Section */}
                {pastGigs.length > 0 && (
                    <>
                        <AuraMotion type="slide" style={[styles.sectionHeader, { marginTop: 56 }]}>
                            <View style={styles.headerRow}>
                                <CheckCircle size={18} color={AuraColors.gray400} />
                                <AuraText variant="label" color={AuraColors.gray400} style={styles.headerText}>
                                    Operation History ({pastGigs.length})
                                </AuraText>
                            </View>
                        </AuraMotion>
                        {pastGigs.map((gig, index) => (
                            <AuraMotion key={`past-${gig.id}`} type="slide" delay={index * 100} style={[styles.cardWrapper, { opacity: 0.7 }]}>
                                <GigCard gig={gig} />
                            </AuraMotion>
                        ))}
                    </>
                )}

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
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: AuraColors.background,
    },
    listContent: {
        paddingVertical: AuraSpacing.xl,
    },
    sectionHeader: {
        paddingHorizontal: AuraSpacing.xl,
        marginBottom: 16,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    headerText: {
        fontWeight: '900',
        letterSpacing: 2,
    },
    cardWrapper: {
        paddingHorizontal: AuraSpacing.xl,
        marginBottom: 20,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: AuraSpacing.xl,
        padding: 48,
        backgroundColor: AuraColors.surfaceElevated,
        borderRadius: AuraBorderRadius.xxl,
        borderWidth: 1,
        borderColor: AuraColors.gray800,
        ...AuraShadows.soft,
    },
    emptyIconBox: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: AuraColors.background,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1.5,
        borderColor: AuraColors.gray700,
    }
});
