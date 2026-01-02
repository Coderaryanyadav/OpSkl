import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Switch } from 'react-native';
import { AuraHeader } from '@core/components/AuraHeader';
import { AuraText } from '@core/components/AuraText';
import { AuraMotion } from '@core/components/AuraMotion';
import { AuraColors, AuraSpacing, AuraBorderRadius, AuraShadows } from '@theme/aura';
import { useAuraHaptics } from '@core/hooks/useAuraHaptics';
import { useAuth } from '@context/AuthProvider';
import { useAura } from '@core/context/AuraProvider';
import { supabase } from '@api/supabase';
import { Bell, MessageSquare, IndianRupee, Star, Zap, Shield } from 'lucide-react-native';

interface NotificationPreferences {
    new_gigs: boolean;
    applications: boolean;
    messages: boolean;
    payments: boolean;
    reviews: boolean;
    system: boolean;
}

const NOTIFICATION_SETTINGS = [
    {
        key: 'new_gigs' as keyof NotificationPreferences,
        label: 'New Gig Matches',
        description: 'AI-matched gigs in your area',
        icon: Zap,
        color: AuraColors.primary
    },
    {
        key: 'applications' as keyof NotificationPreferences,
        label: 'Application Updates',
        description: 'Accepted, rejected, or pending status',
        icon: Bell,
        color: AuraColors.success
    },
    {
        key: 'messages' as keyof NotificationPreferences,
        label: 'Chat Messages',
        description: 'New messages from clients/talents',
        icon: MessageSquare,
        color: AuraColors.warning
    },
    {
        key: 'payments' as keyof NotificationPreferences,
        label: 'Payment Alerts',
        description: 'Escrow, withdrawals, deposits',
        icon: IndianRupee,
        color: AuraColors.success
    },
    {
        key: 'reviews' as keyof NotificationPreferences,
        label: 'Reviews & Ratings',
        description: 'New reviews on your profile',
        icon: Star,
        color: AuraColors.warning
    },
    {
        key: 'system' as keyof NotificationPreferences,
        label: 'System & Security',
        description: 'Account security, updates',
        icon: Shield,
        color: AuraColors.error
    }
];

export default function NotificationPreferencesScreen() {
    const { user } = useAuth();
    const { showToast } = useAura();
    const haptics = useAuraHaptics();
    const [preferences, setPreferences] = useState<NotificationPreferences>({
        new_gigs: true,
        applications: true,
        messages: true,
        payments: true,
        reviews: true,
        system: true
    });

    const loadPreferences = useCallback(async () => {
        if (!user) return;

        try {
            const { data, error } = await supabase
                .from('notification_preferences')
                .select('*')
                .eq('user_id', user.id)
                .single();

            if (data && !error) {
                setPreferences({
                    new_gigs: data.new_gigs ?? true,
                    applications: data.applications ?? true,
                    messages: data.messages ?? true,
                    payments: data.payments ?? true,
                    reviews: data.reviews ?? true,
                    system: data.system ?? true
                });
            }
        } catch (error) {
            if (__DEV__) console.error(error);
            showToast({
                message: 'Failed to update preference. Please try again.',
                type: 'error'
            });
        }
    }, [user, showToast]);

    useEffect(() => {
        loadPreferences();
    }, [loadPreferences]);

    const togglePreference = async (key: keyof NotificationPreferences) => {
        if (!user) return;

        const newValue = !preferences[key];
        setPreferences(prev => ({ ...prev, [key]: newValue }));
        haptics.selection();

        try {
            await supabase
                .from('notification_preferences')
                .upsert({
                    user_id: user.id,
                    [key]: newValue,
                    updated_at: new Date().toISOString()
                }, {
                    onConflict: 'user_id'
                });
        } catch (error) {
            if (__DEV__) console.error(error);
            showToast({
                message: 'Failed to update preference. Please try again.',
                type: 'error'
            });
        } finally {  // Revert on error
            setPreferences(prev => ({ ...prev, [key]: !newValue }));
        }
    };

    return (
        <View style={styles.container}>
            <AuraHeader title="Notification Control" showBack />

            <ScrollView
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
            >
                <AuraMotion type="slide">
                    <View style={styles.header}>
                        <Bell size={32} color={AuraColors.primary} />
                        <AuraText variant="h2" style={{ marginTop: 16 }}>
                            Stay Informed
                        </AuraText>
                        <AuraText variant="body" color={AuraColors.gray400} align="center" style={{ marginTop: 8 }}>
                            Customize which alerts you receive. You can always change these later.
                        </AuraText>
                    </View>
                </AuraMotion>

                {NOTIFICATION_SETTINGS.map((setting, index) => {
                    const Icon = setting.icon;
                    return (
                        <AuraMotion key={setting.key} type="slide" delay={index * 60}>
                            <View style={styles.settingCard}>
                                <View style={styles.settingLeft}>
                                    <View style={[styles.iconBox, { backgroundColor: `${setting.color}15` }]}>
                                        <Icon size={20} color={setting.color} />
                                    </View>
                                    <View style={styles.settingText}>
                                        <AuraText variant="bodyBold">{setting.label}</AuraText>
                                        <AuraText variant="caption" color={AuraColors.gray500}>
                                            {setting.description}
                                        </AuraText>
                                    </View>
                                </View>
                                <Switch
                                    value={preferences[setting.key]}
                                    onValueChange={() => togglePreference(setting.key)}
                                    trackColor={{
                                        false: AuraColors.gray800,
                                        true: AuraColors.primary
                                    }}
                                    thumbColor={AuraColors.white}
                                    ios_backgroundColor={AuraColors.gray800}
                                />
                            </View>
                        </AuraMotion>
                    );
                })}

                <View style={styles.footer}>
                    <AuraText variant="caption" color={AuraColors.gray600} align="center">
                        System & Security notifications cannot be fully disabled for account safety.
                    </AuraText>
                </View>

                <View style={{ height: 60 }} />
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
        padding: AuraSpacing.xl,
    },
    header: {
        alignItems: 'center',
        marginBottom: 32,
        paddingVertical: 24,
    },
    settingCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: AuraColors.surfaceElevated,
        padding: AuraSpacing.l,
        borderRadius: AuraBorderRadius.xl,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: AuraColors.gray800,
        ...AuraShadows.soft,
    },
    settingLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        gap: 16,
    },
    iconBox: {
        width: 44,
        height: 44,
        borderRadius: AuraBorderRadius.m,
        alignItems: 'center',
        justifyContent: 'center',
    },
    settingText: {
        flex: 1,
    },
    footer: {
        marginTop: 32,
        padding: 20,
        backgroundColor: AuraColors.surfaceElevated,
        borderRadius: AuraBorderRadius.xl,
        borderWidth: 1,
        borderColor: AuraColors.gray800,
    }
});
