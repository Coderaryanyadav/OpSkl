import React, { useEffect, useState } from 'react';
import { View, FlatList, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native';
import { useAuraHaptics } from '@core/hooks/useAuraHaptics';
import { supabase } from '@api/supabase';
import { AuraColors, AuraSpacing, AuraBorderRadius, AuraShadows } from '@theme/aura';
import { AuraText } from '@core/components/AuraText';
import { AuraHeader } from '@core/components/AuraHeader';
import { AuraLoader } from '@core/components/AuraLoader';
import { AuraBadge } from '@core/components/AuraBadge';
import { AuraMotion } from '@core/components/AuraMotion';
import { AuraButton } from '@core/components/AuraButton';
import { useAuth } from '@context/AuthProvider';
import { useGigStore } from '@store/useGigStore';
import { useNavigation } from '@react-navigation/native';
import { Users, ChevronRight, Briefcase, Activity, Plus, Target } from 'lucide-react-native';

export default function ClientManageGigsScreen() {
    const haptics = useAuraHaptics();
    const navigation = useNavigation<any>();

    const { user } = useAuth();
    const { myGigs, loading, fetchMyGigs } = useGigStore();
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        if (user) {
            fetchMyGigs(user.id);

            const channel = supabase.channel(`client-gigs-${user.id}`)
                .on('postgres_changes', { event: '*', schema: 'public', table: 'gigs', filter: `client_id=eq.${user.id}` }, () => fetchMyGigs(user.id))
                .on('postgres_changes', { event: '*', schema: 'public', table: 'applications' }, () => {
                    fetchMyGigs(user.id);
                    haptics.success();
                })
                .subscribe();

            return () => { supabase.removeChannel(channel); };
        }
    }, [user, fetchMyGigs, haptics]);

    const onRefresh = async () => {
        if (!user) return;
        setRefreshing(true);
        haptics.medium();
        await fetchMyGigs(user.id);
        setRefreshing(false);
    };

    const renderGigItem = ({ item, index }: { item: any; index: number }) => {
        const isLive = item.status === 'open';
        const applicationCount = item.applications?.[0]?.count || 0;

        return (
            <AuraMotion type="slide" delay={index * 50}>
                <TouchableOpacity
                    style={styles.gigCard}
                    onPress={() => {
                        haptics.selection();
                        navigation.navigate('GigManager', { gigId: item.id });
                    }}
                    activeOpacity={0.7}
                >
                    <View style={styles.cardHeader}>
                        <View style={styles.titleArea}>
                            <AuraText variant="h3" numberOfLines={1}>{item.title}</AuraText>
                            <AuraText variant="caption" color={AuraColors.gray500} style={styles.timestamp}>
                                {new Date(item.created_at).toLocaleDateString().toUpperCase()} • ID: {item.id.slice(0, 8)}
                            </AuraText>
                        </View>
                        <AuraBadge
                            label={item.status.toUpperCase()}
                            variant={isLive ? 'success' : 'default'}
                        />
                    </View>

                    <View style={styles.cardBody}>
                        <View style={styles.metric}>
                            <Users size={16} color={applicationCount > 0 ? AuraColors.primary : AuraColors.gray600} />
                            <AuraText variant="bodyBold" style={{ marginLeft: 8 }}>{applicationCount}</AuraText>
                            <AuraText variant="label" color={AuraColors.gray500} style={{ marginLeft: 6 }}>SIGNALS</AuraText>
                        </View>
                        <View style={styles.metric}>
                            <Activity size={16} color={AuraColors.gray600} />
                            <AuraText variant="label" color={AuraColors.gray500} style={{ marginLeft: 8 }}>
                                {item.urgency_level.toUpperCase()} PRIORITY
                            </AuraText>
                        </View>
                    </View>

                    <View style={styles.cardFooter}>
                        <AuraText variant="label" color={AuraColors.primary}>COMMAND CENTER</AuraText>
                        <ChevronRight size={16} color={AuraColors.gray700} />
                    </View>
                </TouchableOpacity>
            </AuraMotion>
        );
    };

    return (
        <View style={styles.container}>
            <AuraHeader
                title="Mission Control"
                showBack={false}
                rightElement={
                    <TouchableOpacity
                        style={styles.addBtn}
                        onPress={() => navigation.navigate('Create')}
                    >
                        <Plus size={24} color={AuraColors.primary} />
                    </TouchableOpacity>
                }
            />

            <FlatList
                data={myGigs}
                renderItem={renderGigItem}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={AuraColors.primary} />
                }
                ListEmptyComponent={
                    loading ? (
                        <View style={styles.center}>
                            <AuraLoader size={40} />
                            <AuraText variant="label" style={{ marginTop: 16 }}>Scanning Network...</AuraText>
                        </View>
                    ) : (
                        <View style={styles.emptyState}>
                            <View style={styles.emptyIcon}>
                                <Briefcase size={40} color={AuraColors.gray700} />
                            </View>
                            <AuraText variant="h2" align="center">System Silent</AuraText>
                            <AuraText variant="body" color={AuraColors.gray500} align="center" style={{ marginTop: 8, marginBottom: 32 }}>
                                No deployment signals active. Pushing assignments will activate this dashboard.
                            </AuraText>
                            <AuraButton
                                title="DEPLOY NEW MISSION"
                                variant="primary"
                                onPress={() => navigation.navigate('Create')}
                                icon={<Target size={18} color={AuraColors.white} />}
                                style={{ width: '100%' }}
                            />
                        </View>
                    )
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
    listContent: {
        padding: AuraSpacing.xl,
        paddingBottom: 120,
    },
    center: {
        marginTop: 100,
        alignItems: 'center',
    },
    addBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: AuraColors.surfaceElevated,
        borderWidth: 1,
        borderColor: AuraColors.gray800,
    },
    gigCard: {
        backgroundColor: AuraColors.surfaceElevated,
        borderRadius: AuraBorderRadius.xl,
        padding: 20,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: AuraColors.gray800,
        ...AuraShadows.soft,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 20,
    },
    titleArea: {
        flex: 1,
        marginRight: 12,
    },
    timestamp: {
        marginTop: 4,
        letterSpacing: 1,
    },
    cardBody: {
        flexDirection: 'row',
        gap: 32,
        marginBottom: 20,
    },
    metric: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    cardFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: AuraColors.gray800,
    },
    emptyState: {
        marginTop: 100,
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    emptyIcon: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: AuraColors.surfaceElevated,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
        borderWidth: 1.5,
        borderColor: AuraColors.gray800,
    }
});
