import React, { useEffect, useState, useCallback } from 'react';
import { useAuraHaptics } from '@core/hooks/useAuraHaptics';
import { View, StyleSheet, RefreshControl, ScrollView } from 'react-native';
import { Repository } from '@api/repository';
import { AuraColors, AuraSpacing, AuraShadows, AuraBorderRadius } from '@theme/aura';
import { AuraHeader } from '@core/components/AuraHeader';
import GigCard from '../components/GigCard';
import { AuraText } from '@core/components/AuraText';
import { AuraLoader } from '@core/components/AuraLoader';
import { AuraMotion } from '@core/components/AuraMotion';
import { useAuth } from '@context/AuthProvider';
import { useAura } from '@core/context/AuraProvider';
import { useNavigation } from '@react-navigation/native';
import { AuraButton } from '@core/components/AuraButton';
import { Zap, CheckCircle, Activity, ShieldCheck, Search } from 'lucide-react-native';
import { Gig, ApplicationStatus } from '@features/gig-discovery/types';

export default function TalentMyGigsScreen() {
    const haptics = useAuraHaptics();
    const navigation = useNavigation<any>();
    const { user } = useAuth();
    const { showToast } = useAura();
    const [activeGigs, setActiveGigs] = useState<(Gig & { application_status: ApplicationStatus })[]>([]);
    const [pendingGigs, setPendingGigs] = useState<(Gig & { application_status: ApplicationStatus })[]>([]);
    const [pastGigs, setPastGigs] = useState<(Gig & { application_status: ApplicationStatus })[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchMyGigs = useCallback(async () => {
        if (!user) return;
        try {
            const { data: applications, error } = await Repository.getTalentApplications(user.id);

            if (error) throw error;

            const active: (Gig & { application_status: ApplicationStatus })[] = [];
            const pending: (Gig & { application_status: ApplicationStatus })[] = [];
            const past: (Gig & { application_status: ApplicationStatus })[] = [];

            applications?.forEach(app => {
                if (!app.gigs) return;
                const gigWithStatus = { ...app.gigs, application_status: app.status } as Gig & { application_status: ApplicationStatus };
                // 'approved' or 'accepted' -> active
                if (app.status === 'accepted' || app.status === 'approved') {
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
            if (__DEV__) console.error(error);
            showToast({
                message: 'Failed to load your gigs. Please check your connection.',
                type: 'error'
            });
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [user, showToast]);

    useEffect(() => {
        fetchMyGigs();

        if (user) {
            const channel = Repository.subscribeToTalentApplications(user.id, fetchMyGigs);
            return () => { channel.unsubscribe(); };
        }
    }, [fetchMyGigs, user]);

    const onRefresh = () => {
        setRefreshing(true);
        haptics.medium();
        fetchMyGigs();
    };

    const renderEmpty = (title: string, icon: any) => (
        <AuraMotion type="zoom">
            <View style={styles.emptyContainer}>
                <View style={styles.emptyIconBox}>
                    {icon}
                </View>
                <AuraText variant="h3" style={{ marginTop: 24 }}>{title}</AuraText>
                <AuraText variant="body" color={AuraColors.gray400} align="center" style={{ marginTop: 12, paddingHorizontal: 32, marginBottom: 24 }}>
                    Active assignments from your discovery feed will appear here.
                </AuraText>
                <AuraButton
                    title="SCAN FOR MISSIONS"
                    variant="primary"
                    onPress={() => navigation.navigate('Discovery')}
                    icon={<Search size={18} color={AuraColors.white} />}
                    style={{ width: '100%' }}
                />
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
