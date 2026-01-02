import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Linking } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { AuraColors, AuraSpacing, AuraShadows } from '@theme/aura';
import { AuraText } from '@core/components/AuraText';
import { AuraListItem } from '@core/components/AuraListItem';
import { AuraHeader } from '@core/components/AuraHeader';
import { AuraButton } from '@core/components/AuraButton';
import { AuraMotion } from '@core/components/AuraMotion';
import { Bell, Shield, Lock, FileText, HelpCircle, ChevronRight, LogOut, Smartphone, Zap, Terminal } from 'lucide-react-native';
import { supabase } from '@api/supabase';
import { useAura } from '@core/context/AuraProvider';
import { useAuraHaptics } from '@core/hooks/useAuraHaptics';
import { Switch } from 'react-native'; // Standard switch for better control in this list
import { useAuth } from '@context/AuthProvider';
import { BiometricService } from '@core/services/biometrics';

export default function SettingsScreen() {
    const navigation = useNavigation<any>();
    const { showDialog, showToast } = useAura();
    const { user } = useAuth();
    const haptics = useAuraHaptics();

    const [pushEnabled, setPushEnabled] = useState(true);
    const [biometrics, setBiometrics] = useState(false);
    const [ghostMode, setGhostMode] = useState(false);

    useEffect(() => {
        // Load persisted settings
        BiometricService.isEnabled().then(setBiometrics);
    }, []);
    const [publicSearch, setPublicSearch] = useState(true);

    const handleLogout = () => {
        haptics.warning();
        showDialog({
            title: 'Sign Out',
            message: 'Are you sure you want to sign out?',
            type: 'warning',
            onConfirm: async () => {
                haptics.heavy();
                const { error } = await supabase.auth.signOut();
                if (error) {
                    showToast({ message: error.message, type: 'error' });
                }
            }
        });
    };

    return (
        <View style={styles.container}>
            <AuraHeader title="System Config" showBack onBack={() => navigation.goBack()} />

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                {/* Security Section */}
                <AuraMotion type="slide" delay={100}>
                    <AuraText variant="label" color={AuraColors.gray600} style={styles.sectionHeader}>SECURITY PROTOCOLS</AuraText>
                    <View style={styles.section}>
                        <AuraListItem
                            title="Biometric Authentication"
                            subtitle="FaceID / TouchID verification"
                            leftIcon={<Shield size={20} color={AuraColors.white} />}
                            rightElement={
                                <Switch
                                    value={biometrics}
                                    onValueChange={(val) => {
                                        setBiometrics(val);
                                        BiometricService.setEnabled(val);
                                        haptics.selection();
                                    }}
                                    trackColor={{ false: AuraColors.gray200, true: AuraColors.white }}
                                    thumbColor={biometrics ? AuraColors.black : AuraColors.gray600}
                                />
                            }
                        />
                        <View style={styles.divider} />
                        <AuraListItem
                            title="Ghost Protocol"
                            subtitle="Secure precise talent location"
                            leftIcon={<Lock size={20} color={AuraColors.white} />}
                            rightElement={
                                <Switch
                                    value={ghostMode}
                                    onValueChange={(val) => { setGhostMode(val); haptics.selection(); }}
                                    trackColor={{ false: AuraColors.gray200, true: AuraColors.white }}
                                    thumbColor={ghostMode ? AuraColors.black : AuraColors.gray600}
                                />
                            }
                        />
                    </View>
                </AuraMotion>

                {/* Notifications */}
                <AuraMotion type="slide" delay={200}>
                    <AuraText variant="label" color={AuraColors.gray600} style={styles.sectionHeader}>SIGNALING</AuraText>
                    <View style={styles.section}>
                        <AuraListItem
                            title="Push Alerts"
                            subtitle="Instant mission notifications"
                            leftIcon={<Bell size={20} color={AuraColors.white} />}
                            rightElement={
                                <Switch
                                    value={pushEnabled}
                                    onValueChange={(val) => { setPushEnabled(val); haptics.selection(); }}
                                    trackColor={{ false: AuraColors.gray200, true: AuraColors.white }}
                                    thumbColor={pushEnabled ? AuraColors.black : AuraColors.gray600}
                                />
                            }
                        />
                        <View style={styles.divider} />
                        <AuraListItem
                            title="Notification Preferences"
                            subtitle="Customize alerts matrix"
                            leftIcon={<Bell size={20} color={AuraColors.white} />}
                            onPress={() => navigation.navigate('NotificationPreferences')}
                        />
                        <View style={styles.divider} />
                        <AuraListItem
                            title="Public Visibility"
                            subtitle="Appear in global search nodes"
                            leftIcon={<Smartphone size={20} color={AuraColors.white} />}
                            rightElement={
                                <Switch
                                    value={publicSearch}
                                    onValueChange={(val) => { setPublicSearch(val); haptics.selection(); }}
                                    trackColor={{ false: AuraColors.gray200, true: AuraColors.white }}
                                    thumbColor={publicSearch ? AuraColors.black : AuraColors.gray600}
                                />
                            }
                        />
                    </View>
                </AuraMotion>

                {/* Logistics */}
                <AuraMotion type="slide" delay={300}>
                    <AuraText variant="label" color={AuraColors.gray600} style={styles.sectionHeader}>LOGISTICS & LEGAL</AuraText>
                    <View style={styles.section}>
                        <AuraListItem
                            title="Mission Support"
                            leftIcon={<HelpCircle size={20} color={AuraColors.white} />}
                            onPress={() => { haptics.selection(); Linking.openURL('https://support.opskl.com'); }}
                            rightElement={<ChevronRight size={18} color={AuraColors.gray700} />}
                        />
                        <View style={styles.divider} />
                        <AuraListItem
                            title="Operational Terms"
                            leftIcon={<FileText size={20} color={AuraColors.white} />}
                            onPress={() => { haptics.selection(); navigation.navigate('PrivacyPolicy'); }}
                            rightElement={<ChevronRight size={18} color={AuraColors.gray700} />}
                        />
                    </View>
                </AuraMotion>

                {/* Government Schemes (Growth Item #40) */}
                <AuraMotion type="slide" delay={320}>
                    <AuraText variant="label" color={AuraColors.gray600} style={styles.sectionHeader}>BHARAT INITIATIVES</AuraText>
                    <View style={styles.section}>
                        <AuraListItem
                            title="Digital India Benefits"
                            subtitle="PMKVY & Skill India Portal"
                            leftIcon={<Shield size={20} color={AuraColors.success} />}
                            onPress={() => { haptics.selection(); Linking.openURL('https://www.pmkvyofficial.org'); }}
                            rightElement={<ChevronRight size={18} color={AuraColors.gray700} />}
                        />
                    </View>
                </AuraMotion>

                {/* Founder Pulse (Bharat Retention Layer) */}
                <AuraMotion type="slide" delay={350}>
                    <AuraText variant="label" color={AuraColors.primary} style={styles.sectionHeader}>FOUNDER PULSE</AuraText>
                    <View style={[styles.section, { borderColor: AuraColors.primary }]}>
                        <AuraListItem
                            title="Direct to Founder"
                            subtitle="Strategic feedback loop"
                            leftIcon={<Zap size={20} color={AuraColors.primary} />}
                            onPress={() => {
                                haptics.heavy();
                                showDialog({
                                    title: 'Founder Pulse Active',
                                    message: 'Your signal will be transmitted directly to the core engineering team. Proceed with strategic intel?',
                                    primaryLabel: 'Transmit',
                                    onConfirm: () => showToast({ message: 'Intel Received. Pulse Synced.', type: 'success' })
                                });
                            }}
                            rightElement={<ChevronRight size={18} color={AuraColors.primary} />}
                        />
                    </View>
                </AuraMotion>

                {/* Admin Operations - ONLY FOR ADMINS */}
                {user?.email?.includes('admin') && (
                    <AuraMotion type="slide" delay={350}>
                        <AuraText variant="label" color={AuraColors.warning} style={styles.sectionHeader}>ADMIN PROTOCOLS</AuraText>
                        <View style={[styles.section, { borderColor: AuraColors.warning }]}>
                            <AuraListItem
                                title="Moderation Queue"
                                subtitle="Adjudicate disputes & threats"
                                leftIcon={<Terminal size={20} color={AuraColors.warning} />}
                                onPress={() => { haptics.heavy(); navigation.navigate('AdminModeration'); }}
                                rightElement={<ChevronRight size={18} color={AuraColors.warning} />}
                            />
                        </View>
                    </AuraMotion>
                )}

                <AuraMotion type="slide" delay={400} style={styles.footer}>
                    <AuraButton
                        title="SIGN OUT"
                        variant="primary"
                        onPress={handleLogout}
                        style={styles.logoutBtn}
                        icon={<LogOut size={18} color={AuraColors.black} />}
                    />
                    <AuraText variant="caption" align="center" color={AuraColors.gray700} style={{ letterSpacing: 2, marginTop: 12 }}>
                        OpSkl CORE v1.0.0-BHARAT • SECURE • SYNCED
                    </AuraText>
                </AuraMotion>

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
        paddingHorizontal: AuraSpacing.xl,
        paddingBottom: 80,
    },
    sectionHeader: {
        marginTop: 40,
        marginBottom: 16,
        marginLeft: 8,
        letterSpacing: 2,
        fontWeight: '900',
    },
    section: {
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
    footer: {
        marginTop: 64,
        alignItems: 'center',
        gap: 24,
    },
    logoutBtn: {
        width: '100%',
        height: 64,
        borderRadius: 32,
    }
});
