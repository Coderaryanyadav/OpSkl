import React, { useEffect, useState } from 'react';
import { useAuraHaptics } from '@core/hooks/useAuraHaptics';
import { View, ScrollView, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { useAuraHaptics } from '@core/hooks/useAuraHaptics';
import { supabase } from '@api/supabase';
import { useAuraHaptics } from '@core/hooks/useAuraHaptics';
import { AuraColors, AuraShadows } from '@theme/aura';
import { useAuraHaptics } from '@core/hooks/useAuraHaptics';
import { AuraText } from '@core/components/AuraText';
import { useAuraHaptics } from '@core/hooks/useAuraHaptics';
import { AuraHeader } from '@core/components/AuraHeader';
import { useAuraHaptics } from '@core/hooks/useAuraHaptics';
import { AuraListItem } from '@core/components/AuraListItem';
import { useAuraHaptics } from '@core/hooks/useAuraHaptics';
import { AuraMotion } from '@core/components/AuraMotion';
import { useAuraHaptics } from '@core/hooks/useAuraHaptics';
import {
    Briefcase, Wallet, Settings,
    LogOut, User, ChevronRight, Zap, Shield,
    Bell, ExternalLink
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuraHaptics } from '@core/hooks/useAuraHaptics';
import { useAura } from '@core/context/AuraProvider';
import { useAuraHaptics } from '@core/hooks/useAuraHaptics';
import { useAuth } from '@context/AuthProvider';
import { useAuraHaptics } from '@core/hooks/useAuraHaptics';

const { width } = Dimensions.get('window');

export default function ClientProfileScreen() {
    const haptics = useAuraHaptics();
    const navigation = useNavigation<any>();
    const { user, profile } = useAuth();
    const { showDialog } = useAura();
    const [stats, setStats] = useState({ posted: 0, active: 0, completed: 0 });

    useEffect(() => {
        if (user) {
            fetchStats();
        }
    }, [user]);

    const fetchStats = async () => {
        if (!user) return;
        const { data: gigs } = await supabase.from('gigs').select('status').eq('client_id', user.id);
        if (gigs) {
            setStats({
                posted: gigs.length,
                active: gigs.filter(g => g.status === 'active' || g.status === 'open').length,
                completed: gigs.filter(g => g.status === 'completed').length
            });
        }
    };

    const handleLogout = () => {
        haptics.warning();
        showDialog({
            title: 'De-authorize Console',
            message: 'Synchronized session will be terminated and all encrypted tunnels closed. Continue?',
            type: 'warning',
            onConfirm: async () => {
                haptics.heavy();
                await supabase.auth.signOut();
            }
        });
    };

    return (
        <View style={styles.container}>
            <AuraHeader title="Command Center" showBack={false} />

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {/* Profile Hero */}
                <AuraMotion type="zoom" duration={800} style={styles.heroSection}>
                    <View style={styles.avatarContainer}>
                        <View style={styles.avatarRing}>
                            <User size={56} color={AuraColors.white} />
                        </View>
                        <View style={styles.roleBadge}>
                            <Shield size={14} color={AuraColors.black} fill={AuraColors.black} />
                            <AuraText variant="label" color={AuraColors.black} style={{ marginLeft: 6, fontWeight: '900' }}>VERIFIED ENTITY</AuraText>
                        </View>
                    </View>

                    <AuraText variant="h2" align="center" style={{ marginTop: 32 }}>{profile?.full_name || 'Talent Lead'}</AuraText>
                    <AuraText variant="label" align="center" color={AuraColors.gray600} style={{ marginTop: 6, letterSpacing: 1 }}>
                        ID: {profile?.email?.split('@')[0].toUpperCase() || 'ANONYMOUS-NODE'}
                    </AuraText>

                    <View style={styles.statsRow}>
                        <View style={styles.statBox}>
                            <AuraText variant="h3" style={{ fontSize: 24 }}>{stats.posted}</AuraText>
                            <AuraText variant="label" color={AuraColors.gray600} style={{ marginTop: 4 }}>POSTED</AuraText>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statBox}>
                            <AuraText variant="h3" style={{ fontSize: 24 }}>{stats.active}</AuraText>
                            <AuraText variant="label" color={AuraColors.gray600} style={{ marginTop: 4 }}>SIGNALING</AuraText>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statBox}>
                            <AuraText variant="h3" style={{ fontSize: 24 }}>{stats.completed}</AuraText>
                            <AuraText variant="label" color={AuraColors.gray600} style={{ marginTop: 4 }}>RESOLVED</AuraText>
                        </View>
                    </View>
                </AuraMotion>

                {/* Operations Menu */}
                <AuraMotion type="slide" delay={200} style={styles.sectionHeader}>
                    <AuraText variant="label" color={AuraColors.gray600} style={{ fontWeight: '900', letterSpacing: 2 }}>CORE OPERATIONS</AuraText>
                </AuraMotion>

                <AuraMotion type="slide" delay={300} style={styles.menuContainer}>
                    <AuraListItem
                        title="Treasury & Logistics"
                        subtitle="Sync credits and settlements"
                        leftIcon={<Wallet size={20} color={AuraColors.white} />}
                        rightElement={<ChevronRight size={18} color={AuraColors.gray700} />}
                        onPress={() => { haptics.selection(); navigation.navigate('Wallet'); }}
                    />
                    <View style={styles.divider} />
                    <AuraListItem
                        title="Deployment Archive"
                        subtitle="History of all pushed missions"
                        leftIcon={<Briefcase size={20} color={AuraColors.white} />}
                        rightElement={<ChevronRight size={18} color={AuraColors.gray700} />}
                        onPress={() => { haptics.selection(); navigation.navigate('Manage'); }}
                    />
                    <View style={styles.divider} />
                    <AuraListItem
                        title="Talent Directory"
                        subtitle="Verified field specialists"
                        leftIcon={<Zap size={20} color={AuraColors.white} />}
                        rightElement={<ExternalLink size={16} color={AuraColors.gray700} />}
                        onPress={() => { haptics.selection(); navigation.navigate('Feed'); }}
                    />
                </AuraMotion>

                <AuraMotion type="slide" delay={400} style={styles.sectionHeader}>
                    <AuraText variant="label" color={AuraColors.gray600} style={{ fontWeight: '900', letterSpacing: 2 }}>CONFIG NODES</AuraText>
                </AuraMotion>

                <AuraMotion type="slide" delay={500} style={styles.menuContainer}>
                    <AuraListItem
                        title="Console Adjustments"
                        leftIcon={<Settings size={20} color={AuraColors.white} />}
                        rightElement={<ChevronRight size={18} color={AuraColors.gray700} />}
                        onPress={() => { haptics.selection(); navigation.navigate('Settings'); }}
                    />
                    <View style={styles.divider} />
                    <AuraListItem
                        title="Operational Alerts"
                        leftIcon={<Bell size={20} color={AuraColors.white} />}
                        rightElement={<View style={styles.notifyDot} />}
                        onPress={() => { haptics.selection(); navigation.navigate('Notifications'); }}
                    />
                </AuraMotion>

                <AuraMotion type="slide" delay={600}>
                    <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.7}>
                        <LogOut size={20} color={AuraColors.error} />
                        <AuraText variant="bodyBold" color={AuraColors.error} style={{ marginLeft: 16, letterSpacing: 1 }}>TERMINATE SESSION</AuraText>
                    </TouchableOpacity>
                </AuraMotion>

                <AuraText variant="caption" align="center" color={AuraColors.gray700} style={{ marginTop: 56, marginBottom: 120, letterSpacing: 2 }}>
                    AURA TALENT NETWORK v3.1.0 • AES-256
                </AuraText>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: AuraColors.background,
    },
    scrollContent: {
        paddingTop: 32,
    },
    heroSection: {
        alignItems: 'center',
        paddingBottom: 48,
    },
    avatarContainer: {
        alignItems: 'center',
        position: 'relative',
    },
    avatarRing: {
        width: 132,
        height: 132,
        borderRadius: 66,
        borderWidth: 1.5,
        borderColor: AuraColors.gray200,
        backgroundColor: AuraColors.surface,
        alignItems: 'center',
        justifyContent: 'center',
        ...AuraShadows.floating,
    },
    roleBadge: {
        position: 'absolute',
        bottom: -12,
        backgroundColor: AuraColors.white,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 14,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: AuraColors.background,
        ...AuraShadows.soft,
    },
    statsRow: {
        flexDirection: 'row',
        marginTop: 48,
        paddingHorizontal: 32,
        alignItems: 'center',
    },
    statBox: {
        flex: 1,
        alignItems: 'center',
    },
    statDivider: {
        width: 1,
        height: 28,
        backgroundColor: AuraColors.gray200,
        marginHorizontal: 12,
    },
    sectionHeader: {
        paddingHorizontal: 32,
        marginTop: 40,
        marginBottom: 16,
    },
    menuContainer: {
        marginHorizontal: 24,
        backgroundColor: AuraColors.surface,
        borderRadius: 32,
        overflow: 'hidden',
        borderWidth: 1.5,
        borderColor: AuraColors.gray200,
        ...AuraShadows.soft,
    },
    divider: {
        height: 1,
        backgroundColor: AuraColors.gray200,
        marginLeft: 64,
    },
    logoutBtn: {
        marginHorizontal: 24,
        marginTop: 56,
        height: 72,
        backgroundColor: 'rgba(255, 69, 58, 0.04)',
        borderRadius: 24,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 24,
        borderWidth: 1.5,
        borderColor: 'rgba(255, 69, 58, 0.1)',
    },
    notifyDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: AuraColors.success,
        ...AuraShadows.soft,
    }
});
