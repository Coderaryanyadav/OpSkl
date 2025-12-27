import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { supabase } from '../../../core/api/supabase';
import { AuraHeader } from '../../../core/components/AuraHeader';
import { AuraText } from '../../../core/components/AuraText';
import { AuraAvatar } from '../../../core/components/AuraAvatar';
import { AuraLoader } from '../../../core/components/AuraLoader';
import { AuraMotion } from '../../../core/components/AuraMotion';
import { AuraColors, AuraSpacing, AuraShadows } from '../../../core/theme/aura';
import { Crown, Medal, Zap, TrendingUp } from 'lucide-react-native';

export default function LeaderboardScreen() {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchLeaderboard = useCallback(async () => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('id, full_name, avatar_url, xp_points, level, trust_score')
                .order('xp_points', { ascending: false })
                .limit(50);

            if (error) throw error;
            if (data) setUsers(data);
        } catch (e) {
            console.error("Leaderboard error:", e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchLeaderboard();
    }, [fetchLeaderboard]);

    const getRankIcon = (index: number) => {
        if (index === 0) return <Crown color="#FFD700" fill="#FFD700" size={24} />;
        if (index === 1) return <Medal color="#E5E4E2" fill="#E5E4E2" size={24} />;
        if (index === 2) return <Medal color="#CD7F32" fill="#CD7F32" size={24} />;
        return <AuraText variant="h3" color={AuraColors.gray600} style={{ width: 32, textAlign: 'center' }}>{index + 1}</AuraText>;
    };

    const renderItem = ({ item, index }: { item: any; index: number }) => {
        const xp = item.xp_points || 0;
        const isTopThree = index < 3;

        return (
            <AuraMotion type="slide" delay={100 + index * 50} duration={600}>
                <View style={[styles.item, isTopThree && styles.topThreeItem]}>
                    <View style={styles.rankContainer}>
                        {getRankIcon(index)}
                    </View>

                    <AuraAvatar
                        source={item.avatar_url}
                        size={56}
                        hasBorder={isTopThree}
                        borderColor={index === 0 ? "#FFD700" : AuraColors.white}
                    />

                    <View style={styles.infoContainer}>
                        <AuraText variant="h3" numberOfLines={1}>{item.full_name || 'Elite Operative'}</AuraText>
                        <AuraText variant="label" color={AuraColors.gray600} style={{ marginTop: 2 }}>
                            LVL {item.level || 1} • TRUST {item.trust_score || 100}%
                        </AuraText>
                    </View>

                    <View style={styles.scoreContainer}>
                        <Zap size={16} color={isTopThree ? AuraColors.white : AuraColors.gray600} fill={isTopThree ? AuraColors.white : 'transparent'} />
                        <AuraText variant="h3" color={isTopThree ? AuraColors.white : AuraColors.gray600} style={{ fontWeight: '900' }}>
                            {xp.toLocaleString()}
                        </AuraText>
                    </View>
                </View>
            </AuraMotion>
        );
    };

    if (loading) return (
        <View style={styles.center}>
            <AuraLoader size={48} />
            <AuraText variant="label" color={AuraColors.gray600} style={{ marginTop: 24, letterSpacing: 2 }}>ANALYZING METRICS...</AuraText>
        </View>
    );

    return (
        <View style={styles.container}>
            <AuraHeader title="High Performance" showBack />

            <AuraMotion type="slide" style={styles.statSummary}>
                <View style={styles.summaryBox}>
                    <TrendingUp size={20} color={AuraColors.success} />
                    <AuraText variant="label" style={{ marginLeft: 12, letterSpacing: 1 }}>GLOBAL SYNC: ACTIVE</AuraText>
                </View>
            </AuraMotion>

            <FlatList
                data={users}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.list}
                showsVerticalScrollIndicator={false}
                ListHeaderComponent={
                    <AuraMotion type="slide" delay={200} style={{ marginBottom: 32 }}>
                        <AuraText variant="h2" style={{ fontWeight: '900' }}>Elite Talent</AuraText>
                        <AuraText variant="body" color={AuraColors.gray600} style={{ marginTop: 4 }}>
                            Top-ranked operatives in the AURA network.
                        </AuraText>
                    </AuraMotion>
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
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: AuraColors.background,
    },
    statSummary: {
        paddingHorizontal: AuraSpacing.xl,
        paddingBottom: 24,
    },
    summaryBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: AuraColors.surface,
        padding: 16,
        borderRadius: 20,
        borderWidth: 1.5,
        borderColor: AuraColors.gray200,
        alignSelf: 'flex-start',
    },
    list: {
        paddingHorizontal: AuraSpacing.xl,
        paddingBottom: 80,
    },
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        backgroundColor: AuraColors.surface,
        borderRadius: 28,
        marginBottom: 16,
        borderWidth: 1.5,
        borderColor: AuraColors.gray200,
        ...AuraShadows.soft,
    },
    topThreeItem: {
        backgroundColor: AuraColors.surfaceLight,
        borderColor: AuraColors.gray100,
        ...AuraShadows.floating,
    },
    rankContainer: {
        width: 48,
        alignItems: 'center',
        marginRight: 16,
    },
    infoContainer: {
        flex: 1,
        marginLeft: 20,
    },
    scoreContainer: {
        alignItems: 'center',
        gap: 6,
        minWidth: 80,
    }
});
