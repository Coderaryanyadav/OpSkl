import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { supabase } from '../../../core/api/supabase';
import { AuraHeader } from '../../../core/components/AuraHeader';
import { AuraText } from '../../../core/components/AuraText';
import { AuraLoader } from '../../../core/components/AuraLoader';
import { AuraMotion } from '../../../core/components/AuraMotion';
import { AuraColors, AuraSpacing, AuraShadows } from '../../../core/theme/aura';
import { Target, CheckCircle, Zap, Trophy, Flame } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

export default function DailyQuestsScreen() {
    const [quests, setQuests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchQuests = useCallback(async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: allQuests } = await supabase.from('quests').select('*').eq('is_active', true);
            const { data: userProgress } = await supabase.from('user_quests').select('*').eq('user_id', user.id);

            const merged = allQuests?.map(q => {
                const prog = userProgress?.find(up => up.quest_id === q.id);
                return {
                    ...q,
                    progress: prog?.progress || 0,
                    completed: prog?.completed || false,
                    claimed: prog?.claimed || false
                };
            }) || [];

            setQuests(merged);
        } catch (e) {
            console.error('Fetch Quests Error:', e);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchQuests();
    }, [fetchQuests]);

    const handleClaim = async (questId: string, xpReward: number) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            await supabase.from('user_quests').update({ claimed: true }).eq('quest_id', questId).eq('user_id', user.id);
            await supabase.rpc('increment_xp', { user_id: user.id, amount: xpReward });

            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Alert.alert("Reward Claimed", `+${xpReward} XP added to your profile.`);
            fetchQuests();
        } catch (e: any) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            Alert.alert("Claim Failed", e.message);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        fetchQuests();
    };

    const renderQuest = ({ item, index }: { item: any, index: number }) => {
        const progressPercent = Math.min((item.progress / item.target) * 100, 100);
        const isCompleted = item.completed;
        const isClaimed = item.claimed;

        return (
            <AuraMotion type="slide" delay={100 + index * 100}>
                <View style={[styles.questCard, isCompleted && styles.completedCard]}>
                    <View style={styles.questHeader}>
                        <View style={[styles.iconBox, isCompleted && styles.completedIconBox]}>
                            {isCompleted ? (
                                <CheckCircle size={24} color={AuraColors.success} fill={AuraColors.success} />
                            ) : (
                                <Target size={24} color={AuraColors.white} />
                            )}
                        </View>
                        <View style={styles.questInfo}>
                            <AuraText variant="h3">{item.title}</AuraText>
                            <AuraText variant="caption" color={AuraColors.gray600} style={{ marginTop: 2 }}>
                                {item.description}
                            </AuraText>
                        </View>
                    </View>

                    <View style={styles.progressSection}>
                        <View style={styles.progressBar}>
                            <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
                        </View>
                        <AuraText variant="label" color={AuraColors.gray600} style={{ marginTop: 8 }}>
                            {item.progress} / {item.target}
                        </AuraText>
                    </View>

                    <View style={styles.rewardRow}>
                        <View style={styles.xpBadge}>
                            <Zap size={14} color={AuraColors.black} fill={AuraColors.black} />
                            <AuraText variant="label" color={AuraColors.black} style={{ marginLeft: 6, fontWeight: '900' }}>
                                +{item.xp_reward} XP
                            </AuraText>
                        </View>
                        {isCompleted && !isClaimed && (
                            <TouchableOpacity
                                style={styles.claimBtn}
                                onPress={() => handleClaim(item.id, item.xp_reward)}
                                activeOpacity={0.8}
                            >
                                <Trophy size={16} color={AuraColors.black} />
                                <AuraText variant="h3" color={AuraColors.black} style={{ marginLeft: 8 }}>CLAIM</AuraText>
                            </TouchableOpacity>
                        )}
                        {isClaimed && (
                            <View style={styles.claimedBadge}>
                                <CheckCircle size={14} color={AuraColors.success} />
                                <AuraText variant="label" color={AuraColors.success} style={{ marginLeft: 6 }}>CLAIMED</AuraText>
                            </View>
                        )}
                    </View>
                </View>
            </AuraMotion>
        );
    };

    if (loading && quests.length === 0) return (
        <View style={styles.center}>
            <AuraLoader size={48} />
            <AuraText variant="label" color={AuraColors.gray600} style={{ marginTop: 24, letterSpacing: 2 }}>LOADING OBJECTIVES...</AuraText>
        </View>
    );

    return (
        <View style={styles.container}>
            <AuraHeader title="Daily Objectives" showBack />

            <AuraMotion type="slide" style={styles.heroSection}>
                <View style={styles.heroCard}>
                    <View style={styles.flameIcon}>
                        <Flame size={28} color={AuraColors.white} fill={AuraColors.white} />
                    </View>
                    <View style={{ flex: 1, marginLeft: 20 }}>
                        <AuraText variant="h3">Mission Objectives</AuraText>
                        <AuraText variant="caption" color={AuraColors.gray600} style={{ marginTop: 4 }}>
                            Complete daily challenges to earn XP and level up your operative status.
                        </AuraText>
                    </View>
                </View>
            </AuraMotion>

            <FlatList
                data={quests}
                renderItem={renderQuest}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.list}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={AuraColors.white} />
                }
                ListEmptyComponent={
                    <AuraMotion type="zoom" style={styles.empty}>
                        <View style={styles.emptyIconBox}>
                            <Target size={40} color={AuraColors.gray700} />
                        </View>
                        <AuraText variant="h3" style={{ marginTop: 32 }}>No Active Objectives</AuraText>
                        <AuraText variant="body" color={AuraColors.gray600} align="center" style={{ marginTop: 12, paddingHorizontal: 48 }}>
                            New daily objectives will be deployed at 00:00 UTC.
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
    heroSection: {
        paddingHorizontal: AuraSpacing.xl,
        paddingBottom: 32,
    },
    heroCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 24,
        backgroundColor: AuraColors.surface,
        borderRadius: 32,
        borderWidth: 1.5,
        borderColor: AuraColors.gray200,
        ...AuraShadows.soft,
    },
    flameIcon: {
        width: 56,
        height: 56,
        borderRadius: 20,
        backgroundColor: AuraColors.black,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: AuraColors.gray700,
    },
    list: {
        paddingHorizontal: AuraSpacing.xl,
        paddingBottom: 80,
    },
    questCard: {
        backgroundColor: AuraColors.surface,
        borderRadius: 32,
        padding: 28,
        marginBottom: 20,
        borderWidth: 1.5,
        borderColor: AuraColors.gray200,
        ...AuraShadows.soft,
    },
    completedCard: {
        borderColor: AuraColors.gray100,
        backgroundColor: AuraColors.surfaceLight,
    },
    questHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
    },
    iconBox: {
        width: 56,
        height: 56,
        borderRadius: 20,
        backgroundColor: AuraColors.background,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1.5,
        borderColor: AuraColors.gray200,
    },
    completedIconBox: {
        backgroundColor: 'rgba(52, 199, 89, 0.1)',
        borderColor: 'rgba(52, 199, 89, 0.3)',
    },
    questInfo: {
        flex: 1,
        marginLeft: 20,
    },
    progressSection: {
        marginBottom: 20,
    },
    progressBar: {
        height: 8,
        backgroundColor: AuraColors.gray100,
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: AuraColors.white,
        borderRadius: 4,
    },
    rewardRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    xpBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: AuraColors.white,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 12,
    },
    claimBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: AuraColors.white,
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 20,
    },
    claimedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(52, 199, 89, 0.1)',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(52, 199, 89, 0.2)',
    },
    empty: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 100,
    },
    emptyIconBox: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: AuraColors.surface,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: AuraColors.gray200,
    }
});
