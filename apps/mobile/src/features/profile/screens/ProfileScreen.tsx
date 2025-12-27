import React, { useEffect, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Switch, ScrollView, Dimensions, RefreshControl, ActivityIndicator } from 'react-native';
import { useAuraHaptics } from '@core/hooks/useAuraHaptics';
import { supabase } from '@api/supabase';
import { AuraColors, AuraSpacing, AuraBorderRadius, AuraShadows } from '@theme/aura';
import { AuraText } from '@core/components/AuraText';
import { AuraAvatar } from '@core/components/AuraAvatar';
import { AuraBadge } from '@core/components/AuraBadge';
import { AuraMotion } from '@core/components/AuraMotion';
import { AuraLoader } from '@core/components/AuraLoader';
import { AuraHeader } from '@core/components/AuraHeader';
import { useAura } from '@core/context/AuraProvider';
import { useAuth } from '@context/AuthProvider';
import { useUserStore } from '@store/useUserStore';
import { useNavigation } from '@react-navigation/native';
import { Settings, Zap, Shield, Wallet, Crown, LogOut, ChevronRight, Verified, Repeat, Star, Briefcase, Plus } from 'lucide-react-native';

const { width } = Dimensions.get('window');

export default function ProfileScreen() {
    const haptics = useAuraHaptics();
    const navigation = useNavigation<any>();
    const { showDialog, showToast } = useAura();
    const { xp, level } = useUserStore();
    const { user, profile, loading: authLoading } = useAuth();
    const [refreshing, setRefreshing] = useState(false);
    const [isGhostMode, setIsGhostMode] = useState(false);
    const [switchingRole, setSwitchingRole] = useState(false);

    const nextLevelXp = level * 1000;
    const progress = (xp % 1000) / 1000;

    useEffect(() => {
        if (profile) {
            setIsGhostMode(profile.is_ghost_mode || false);
        }
    }, [profile]);

    const onRefresh = async () => {
        setRefreshing(true);
        haptics.medium();
        // AuthProvider handles sync automatically on session check or we could expose a refresh method
        setRefreshing(false);
    };

    const handleRoleSwitch = async () => {
        if (!user || !profile) return;
        const newRole = profile.active_role === 'client' ? 'talent' : 'client';
        setSwitchingRole(true);
        haptics.heavy();

        try {
            const { error } = await supabase
                .from('profiles')
                .update({ active_role: newRole })
                .eq('id', user.id);

            if (error) throw error;
            showToast({ message: `Switched to ${newRole.toUpperCase()} Mode`, type: 'success' });
        } catch (e: any) {
            showToast({ message: "Role Switch Failed", type: 'error' });
        } finally {
            setSwitchingRole(false);
        }
    };

    const handleLogout = () => {
        haptics.warning();
        showDialog({
            title: 'Terminate Session',
            message: 'Are you sure you want to end your secure deployment and logout?',
            type: 'warning',
            onConfirm: async () => {
                haptics.heavy();
                await supabase.auth.signOut();
            }
        });
    };

    if (authLoading && !profile) {
        return (
            <View style={styles.center}>
                <AuraLoader size={60} />
                <AuraText variant="label" style={{ marginTop: 24, letterSpacing: 4 }}>AUTHENTICATING IDENTITY...</AuraText>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <AuraHeader
                title="Identity Hub"
                showBack={false}
                rightElement={
                    <TouchableOpacity onPress={() => navigation.navigate('Settings')}>
                        <Settings size={22} color={AuraColors.gray400} />
                    </TouchableOpacity>
                }
            />

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.content}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={AuraColors.primary} />
                }
            >
                {/* Identity Card */}
                <AuraMotion type="zoom" style={styles.identityCard}>
                    <View style={styles.avatarWrapper}>
                        <AuraAvatar
                            source={profile?.avatar_url}
                            size={110}
                            isOnline={true}
                        />
                        <View style={styles.verifiedBadge}>
                            <Verified size={18} color={AuraColors.primary} fill={AuraColors.white} />
                        </View>
                    </View>

                    <AuraText variant="h1" align="center" style={styles.name}>
                        {profile?.full_name}
                    </AuraText>
                    <AuraText variant="bodyLarge" color={AuraColors.gray400} align="center">
                        @{profile?.full_name?.split(' ')[0].toLowerCase() || 'operative'}
                    </AuraText>

                    <View style={styles.rankContainer}>
                        <Crown size={14} color={AuraColors.primary} fill={AuraColors.primary} />
                        <AuraText variant="label" color={AuraColors.primary} style={styles.rankText}>
                            LEVEL {level} • ELITE OPERATIVE
                        </AuraText>
                    </View>
                </AuraMotion>

                {/* Performance HUD */}
                <View style={styles.hudContainer}>
                    <View style={styles.hudStat}>
                        <AuraText variant="h2">{profile?.total_count || 0}</AuraText>
                        <AuraText variant="label" color={AuraColors.gray500}>MISSIONS</AuraText>
                    </View>
                    <View style={styles.hudDivider} />
                    <View style={styles.hudStat}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                            <AuraText variant="h2" color={AuraColors.warning}>
                                {profile?.avg_rating ? profile.avg_rating.toFixed(1) : '—'}
                            </AuraText>
                            <Star size={16} color={AuraColors.warning} fill={AuraColors.warning} />
                        </View>
                        <AuraText variant="label" color={AuraColors.gray500}>
                            {profile?.review_count || 0} REVIEWS
                        </AuraText>
                    </View>
                    <View style={styles.hudDivider} />
                    <View style={styles.hudStat}>
                        <AuraText variant="h2" color={AuraColors.success}>{profile?.current_streak || 0}</AuraText>
                        <AuraText variant="label" color={AuraColors.gray500}>STREAK</AuraText>
                    </View>
                </View>

                {/* Level Progress */}
                <View style={styles.xpSection}>
                    <View style={styles.xpHeader}>
                        <AuraText variant="label" color={AuraColors.gray500}>EXPERIENCE GAIN</AuraText>
                        <AuraText variant="label" color={AuraColors.white}>{xp} / {nextLevelXp} XP</AuraText>
                    </View>
                    <View style={styles.xpBarContainer}>
                        <View style={[styles.xpBarFill, { width: `${progress * 100}%` }]} />
                    </View>
                </View>

                {/* System Modules */}
                <View style={styles.modules}>
                    <AuraText variant="label" color={AuraColors.gray600} style={styles.sectionTitle}>CORE MODULES</AuraText>

                    <TouchableOpacity style={styles.moduleItem} onPress={() => navigation.navigate('Wallet')}>
                        <View style={styles.moduleLeft}>
                            <View style={[styles.moduleIcon, { backgroundColor: 'rgba(52, 199, 89, 0.1)' }]}>
                                <Wallet size={20} color={AuraColors.success} />
                            </View>
                            <AuraText variant="bodyBold">Treasury & Payments</AuraText>
                        </View>
                        <ChevronRight size={18} color={AuraColors.gray700} />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.moduleItem}
                        onPress={handleRoleSwitch}
                        disabled={switchingRole}
                    >
                        <View style={styles.moduleLeft}>
                            <View style={[styles.moduleIcon, { backgroundColor: 'rgba(255, 255, 255, 0.05)' }]}>
                                {switchingRole ? (
                                    <ActivityIndicator size="small" color={AuraColors.primary} />
                                ) : (
                                    <Repeat size={20} color={AuraColors.white} />
                                )}
                            </View>
                            <View>
                                <AuraText variant="bodyBold">Switch Interface</AuraText>
                                <AuraText variant="caption" color={AuraColors.gray500}>Currently in {profile?.active_role} mode</AuraText>
                            </View>
                        </View>
                        <ChevronRight size={18} color={AuraColors.gray700} />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.moduleItem} onPress={() => navigation.navigate('Verification')}>
                        <View style={styles.moduleLeft}>
                            <View style={[styles.moduleIcon, { backgroundColor: 'rgba(0, 122, 255, 0.1)' }]}>
                                <Shield size={20} color={AuraColors.primary} />
                            </View>
                            <AuraText variant="bodyBold">Security & Identity</AuraText>
                        </View>
                        <AuraBadge label="ACTIVE" variant="success" />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.moduleItem} onPress={() => navigation.navigate('PortfolioUpload')}>
                        <View style={styles.moduleLeft}>
                            <View style={[styles.moduleIcon, { backgroundColor: 'rgba(255, 45, 85, 0.1)' }]}>
                                <Briefcase size={20} color={AuraColors.error} />
                            </View>
                            <AuraText variant="bodyBold">Portfolio Manager</AuraText>
                        </View>
                        <Plus size={18} color={AuraColors.gray700} />
                    </TouchableOpacity>

                    <View style={styles.moduleItem}>
                        <View style={styles.moduleLeft}>
                            <View style={[styles.moduleIcon, { backgroundColor: 'rgba(255, 159, 10, 0.1)' }]}>
                                <Zap size={20} color={AuraColors.warning} />
                            </View>
                            <View>
                                <AuraText variant="bodyBold">Ghost Protocol</AuraText>
                                <AuraText variant="caption" color={AuraColors.gray500}>Obfuscate live tracking</AuraText>
                            </View>
                        </View>
                        <Switch
                            value={isGhostMode}
                            onValueChange={(val) => {
                                setIsGhostMode(val);
                                haptics.light();
                                showToast({ message: val ? 'Ghost Protocol Engaged' : 'Ghost Protocol Disengaged', type: 'info' });
                            }}
                            trackColor={{ false: AuraColors.gray800, true: AuraColors.primary }}
                            thumbColor={AuraColors.white}
                        />
                    </View>
                </View>

                {/* Final Actions */}
                <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                    <LogOut size={20} color={AuraColors.error} />
                    <AuraText variant="bodyBold" color={AuraColors.error}>TERMINATE SESSION</AuraText>
                </TouchableOpacity>

                <AuraText variant="caption" align="center" color={AuraColors.gray700} style={styles.versionText}>
                    AURA CORE v4.0.2 • SHADOW-BORN • ENCRYPTED
                </AuraText>

                <View style={{ height: 100 }} />
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
        paddingTop: 20,
    },
    identityCard: {
        alignItems: 'center',
        paddingVertical: 32,
    },
    avatarWrapper: {
        marginBottom: 24,
        position: 'relative',
    },
    verifiedBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: AuraColors.background,
        borderRadius: 12,
        padding: 2,
    },
    name: {
        fontWeight: '900',
        letterSpacing: -1,
        marginBottom: 4,
    },
    rankContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: AuraColors.surfaceElevated,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        marginTop: 20,
        borderWidth: 1,
        borderColor: AuraColors.gray800,
    },
    rankText: {
        fontWeight: '800',
        marginLeft: 8,
        letterSpacing: 1,
    },
    hudContainer: {
        flexDirection: 'row',
        backgroundColor: AuraColors.surfaceElevated,
        marginHorizontal: AuraSpacing.xl,
        borderRadius: AuraBorderRadius.xxl,
        paddingVertical: 24,
        borderWidth: 1,
        borderColor: AuraColors.gray800,
        ...AuraShadows.soft,
    },
    hudStat: {
        flex: 1,
        alignItems: 'center',
    },
    hudDivider: {
        width: 1,
        backgroundColor: AuraColors.gray800,
        height: '60%',
        alignSelf: 'center',
    },
    xpSection: {
        marginHorizontal: AuraSpacing.xl,
        marginVertical: 40,
    },
    xpHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    xpBarContainer: {
        height: 8,
        backgroundColor: AuraColors.surfaceElevated,
        borderRadius: 4,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: AuraColors.gray800,
    },
    xpBarFill: {
        height: '100%',
        backgroundColor: AuraColors.primary,
        borderRadius: 4,
    },
    modules: {
        paddingHorizontal: AuraSpacing.xl,
        marginBottom: 40,
    },
    sectionTitle: {
        marginBottom: 16,
        letterSpacing: 2,
        fontWeight: '800',
    },
    moduleItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        backgroundColor: AuraColors.surfaceElevated,
        borderRadius: AuraBorderRadius.xl,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: AuraColors.gray800,
    },
    moduleLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    moduleIcon: {
        width: 44,
        height: 44,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        marginHorizontal: AuraSpacing.xl,
        paddingVertical: 18,
        borderRadius: AuraBorderRadius.xl,
        backgroundColor: 'rgba(255, 59, 48, 0.05)',
        borderWidth: 1,
        borderColor: 'rgba(255, 59, 48, 0.2)',
    },
    versionText: {
        marginTop: 48,
        letterSpacing: 2,
        opacity: 0.5,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: AuraColors.background,
    },
});
