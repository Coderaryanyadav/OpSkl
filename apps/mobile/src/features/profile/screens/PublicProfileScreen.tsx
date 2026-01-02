import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useAuraHaptics } from '@core/hooks/useAuraHaptics';
import { supabase } from '@api/supabase';
import { AuraHeader } from '@core/components/AuraHeader';
import { AuraText } from '@core/components/AuraText';
import { AuraAvatar } from '@core/components/AuraAvatar';
import { AuraButton } from '@core/components/AuraButton';
import { AuraBadge } from '@core/components/AuraBadge';
import { AuraLoader } from '@core/components/AuraLoader';
import { AuraMotion } from '@core/components/AuraMotion';
import { AuraColors, AuraSpacing, AuraShadows } from '@theme/aura';
import { MessageSquare, Target, ShieldCheck, Heart, Calendar } from 'lucide-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAuth } from '@context/AuthProvider';
import { useAura } from '@core/context/AuraProvider';
import { Repository } from '@api/repository';

export default function PublicProfileScreen() {
    const haptics = useAuraHaptics();
    const route = useRoute();
    const navigation = useNavigation<any>();
    const { userId } = (route.params as { userId: string }) || {};
    const { user } = useAuth(); // Logged in user
    const { showToast } = useAura();

    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isFavorite, setIsFavorite] = useState(false);

    const fetchProfile = useCallback(async () => {
        try {
            const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
            if (error) throw error;
            setProfile(data);

            // Check favorite status
            if (user) {
                const favStatus = await Repository.isFavorite(user.id, userId);
                setIsFavorite(favStatus);
            }
        } catch (error) {
            if (__DEV__) console.error(error);
            showToast({
                message: 'Failed to load profile. User may not exist.',
                type: 'error'
            });
        } finally {
            setLoading(false);
        }
    }, [userId, user, showToast]);

    const handleToggleFavorite = async () => {
        if (!user) return;

        // Optimistic update
        const newVal = !isFavorite;
        setIsFavorite(newVal);
        haptics.selection();

        await Repository.toggleFavorite(user.id, userId);
    };

    useEffect(() => {
        if (userId) fetchProfile();
    }, [userId, fetchProfile]);

    if (loading) return (
        <View style={styles.center}>
            <AuraLoader size={48} />
            <AuraText variant="label" color={AuraColors.gray600} style={{ marginTop: 24, letterSpacing: 2 }}>DECRYPTING DOSSIER...</AuraText>
        </View>
    );

    return (
        <View style={styles.container}>
            <AuraHeader
                title="OPERATIVE DOSSIER"
                showBack
                rightElement={
                    <TouchableOpacity onPress={handleToggleFavorite} style={{ padding: AuraSpacing.s }}>
                        <Heart
                            size={24}
                            color={isFavorite ? AuraColors.error : AuraColors.gray500}
                            fill={isFavorite ? AuraColors.error : 'transparent'}
                        />
                    </TouchableOpacity>
                }
            />

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
                <AuraMotion type="zoom" duration={800} style={styles.heroSection}>
                    <AuraAvatar
                        source={profile?.avatar_url}
                        size={128}
                        hasBorder
                        borderColor={AuraColors.white}
                        hasStatus={profile?.is_online}
                        isOnline={profile?.is_online}
                    />
                    <View style={styles.badgeRow}>
                        <AuraBadge label="TOP OPERATIVE" variant="premium" />
                        {profile?.is_talent_verified && (
                            <View style={styles.verifiedTag}>
                                <ShieldCheck size={12} color={AuraColors.success} />
                                <AuraText variant="label" color={AuraColors.success} style={{ marginLeft: 4, fontWeight: '900' }}>VERIFIED</AuraText>
                            </View>
                        )}
                    </View>

                    <AuraText variant="h1" align="center" style={{ marginTop: 24, fontWeight: '900' }}>{profile?.full_name}</AuraText>
                    <AuraText variant="label" align="center" color={AuraColors.gray600} style={{ marginTop: 6, letterSpacing: 1.5 }}>
                        {profile?.headline?.toUpperCase() || "SPECIALIZED FIELD OPERATIVE"}
                    </AuraText>
                </AuraMotion>

                <AuraMotion type="slide" delay={200} style={styles.statsBar}>
                    <View style={styles.statBox}>
                        <AuraText variant="h2" style={{ fontWeight: '900' }}>{profile?.trust_score || 0}</AuraText>
                        <AuraText variant="label" color={AuraColors.gray600}>TRUST IDX</AuraText>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statBox}>
                        <AuraText variant="h2" style={{ fontWeight: '900' }}>4.9</AuraText>
                        <AuraText variant="label" color={AuraColors.gray600}>RATING</AuraText>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statBox}>
                        <AuraText variant="h2" style={{ fontWeight: '900' }}>{Math.floor((profile?.trust_score || 0) / 10) + 1}</AuraText>
                        <AuraText variant="label" color={AuraColors.gray600}>RANK</AuraText>
                    </View>
                </AuraMotion>

                <AuraMotion type="slide" delay={300} style={styles.sectionHeader}>
                    <AuraText variant="label" color={AuraColors.gray600} style={{ fontWeight: '900', letterSpacing: 2 }}>OPERATIONAL BRIEFING</AuraText>
                </AuraMotion>

                <AuraMotion type="slide" delay={400} style={styles.bioSection}>
                    <View style={styles.bioCard}>
                        <AuraText variant="body" color={AuraColors.gray500} style={{ lineHeight: 24 }}>
                            {profile?.bio || "This talent maintains a minimalist profile. No public manifesto available at this time."}
                        </AuraText>
                    </View>
                </AuraMotion>

                <AuraMotion type="slide" delay={500} style={styles.actionSection}>
                    <AuraButton
                        title="ENGAGE SECURE CHAT"
                        onPress={() => {
                            haptics.medium();
                            navigation.navigate('Chat', { roomId: `direct_${profile?.id}`, recipientName: profile?.full_name });
                        }}
                        icon={<MessageSquare size={18} color={AuraColors.black} />}
                    />
                    <AuraButton
                        title="DEPLOY DIRECT ASSIGNMENT"
                        variant="outline"
                        onPress={() => {
                            haptics.medium();
                            navigation.navigate('CreateGig', { targetUserId: userId });
                        }}
                        icon={<Target size={18} color={AuraColors.white} />}
                        style={{ marginTop: 16 }}
                    />
                    <AuraButton
                        title="SCHEDULE INTEL BRIEFING"
                        variant="secondary"
                        onPress={() => {
                            haptics.heavy();
                            showToast({ message: 'Briefing request transmitted to talent', type: 'success' });
                        }}
                        icon={<Calendar size={18} color={AuraColors.primary} />}
                        style={{ marginTop: 16 }}
                    />
                </AuraMotion>

                <View style={{ height: 80 }} />
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
    content: {
        paddingTop: 32,
    },
    heroSection: {
        alignItems: 'center',
        paddingHorizontal: AuraSpacing.xl,
    },
    badgeRow: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 20,
        alignItems: 'center',
    },
    verifiedTag: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(52, 199, 89, 0.05)',
        paddingHorizontal: AuraSpacing.m,
        paddingVertical: 6,
        borderRadius: AuraBorderRadius.m,
        borderWidth: 1,
        borderColor: 'rgba(52, 199, 89, 0.2)',
    },
    statsBar: {
        flexDirection: 'row',
        backgroundColor: AuraColors.surface,
        marginHorizontal: AuraSpacing.xl,
        marginTop: 48,
        borderRadius: 32,
        paddingVertical: 28,
        borderWidth: 1.5,
        borderColor: AuraColors.gray200,
        ...AuraShadows.floating,
    },
    statBox: {
        flex: 1,
        alignItems: 'center',
    },
    statDivider: {
        width: 1.5,
        height: 28,
        backgroundColor: AuraColors.gray200,
        alignSelf: 'center',
    },
    sectionHeader: {
        marginTop: 48,
        paddingHorizontal: 32,
    },
    bioSection: {
        paddingHorizontal: AuraSpacing.xl,
        marginTop: 16,
    },
    bioCard: {
        backgroundColor: AuraColors.surface,
        borderRadius: 32,
        padding: 28,
        borderWidth: 1.5,
        borderColor: AuraColors.gray200,
        ...AuraShadows.soft,
    },
    actionSection: {
        marginTop: 56,
        paddingHorizontal: AuraSpacing.xl,
    }
});
