import React, { useEffect, useState, useCallback } from 'react';
import { useAura } from '@core/context/AuraProvider';
import { View, StyleSheet, FlatList, Image, TouchableOpacity, RefreshControl } from 'react-native';
import { useAuraHaptics } from '@core/hooks/useAuraHaptics';
import { supabase } from '@api/supabase';
import { AuraHeader } from '@core/components/AuraHeader';
import { AuraText } from '@core/components/AuraText';
import { AuraLoader } from '@core/components/AuraLoader';
import { AuraBadge } from '@core/components/AuraBadge';
import { AuraMotion } from '@core/components/AuraMotion';
import { AuraColors, AuraSpacing, AuraShadows } from '@theme/aura';
import { Tag, ExternalLink, Gift, ShieldCheck } from 'lucide-react-native';


export default function TalentPerksScreen() {
    const haptics = useAuraHaptics();
    const { showDialog, showToast } = useAura();
    const [deals, setDeals] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchDeals = useCallback(async () => {
        try {
            const { data, error } = await supabase
                .from('deals')
                .select('*')
                .eq('is_active', true)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setDeals(data || []);
        } catch (error) {
            if (__DEV__) console.error(error);
            showToast({ message: 'Failed to load perks. Please try again.', type: 'error' });
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [showToast]);

    useEffect(() => {
        fetchDeals();
    }, [fetchDeals]);

    const handlePress = (item: any) => {
        haptics.light();
        showDialog({
            title: 'Privilege Access',
            message: `Exclusive protocol code for ${item.brand || 'Partner'}: ${item.code || 'NO CODE REQUIRED'}. Use this during checkout to authorize benefits.`,
            primaryLabel: 'COPY CODE',
            onConfirm: () => {
                showToast({ message: "Code synchronized to clipboard", type: 'success' });
            }
        });
    };

    const onRefresh = () => {
        setRefreshing(true);
        haptics.light();
        fetchDeals();
    };

    const renderItem = ({ item, index }: { item: any, index: number }) => (
        <AuraMotion type="slide" delay={100 + index * 100}>
            <TouchableOpacity
                activeOpacity={0.8}
                style={styles.card}
                onPress={() => handlePress(item)}
            >
                <View style={styles.imageContainer}>
                    {item.image_url ? (
                        <Image source={{ uri: item.image_url }} style={styles.image} resizeMode="contain" />
                    ) : (
                        <Gift size={32} color={AuraColors.gray600} />
                    )}
                </View>

                <View style={styles.content}>
                    <View style={styles.headerRow}>
                        <AuraText variant="label" color={AuraColors.gray600} style={{ letterSpacing: 1.5 }}>{item.brand?.toUpperCase() || 'PARTNER'}</AuraText>
                        <AuraBadge label="EXCLUSIVE" variant="premium" />
                    </View>

                    <AuraText variant="h3" style={{ marginTop: 8 }}>{item.title}</AuraText>

                    <View style={styles.footerRow}>
                        <View style={styles.codeTag}>
                            <Tag size={12} color={AuraColors.black} />
                            <AuraText variant="label" color={AuraColors.black} style={{ marginLeft: 8, fontWeight: '900' }}>
                                {item.code || "NO CODE REQ"}
                            </AuraText>
                        </View>
                        <ExternalLink size={16} color={AuraColors.gray600} />
                    </View>
                </View>
            </TouchableOpacity>
        </AuraMotion>
    );

    if (loading && deals.length === 0) return (
        <View style={styles.center}>
            <AuraLoader size={48} />
            <AuraText variant="label" color={AuraColors.gray600} style={{ marginTop: 24, letterSpacing: 2 }}>AUTHENTICATING PRIVILEGES...</AuraText>
        </View>
    );

    return (
        <View style={styles.container}>
            <AuraHeader title="Talent Privileges" showBack />

            <AuraMotion type="slide" style={styles.heroSection}>
                <View style={styles.heroCard}>
                    <View style={styles.iconBox}>
                        <ShieldCheck size={28} color={AuraColors.white} />
                    </View>
                    <View style={{ flex: 1, marginLeft: 20 }}>
                        <AuraText variant="h3">Verified Network Benefits</AuraText>
                        <AuraText variant="caption" color={AuraColors.gray600} style={{ marginTop: 4 }}>
                            Exclusive deals for top-tier talent only.
                        </AuraText>
                    </View>
                </View>
            </AuraMotion>

            <FlatList
                data={deals}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.list}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={AuraColors.white} />
                }
                ListEmptyComponent={
                    <AuraMotion type="zoom" style={styles.empty}>
                        <View style={styles.emptyIconBox}>
                            <Gift size={40} color={AuraColors.gray700} />
                        </View>
                        <AuraText variant="h3" style={{ marginTop: 32 }}>No Active Privileges</AuraText>
                        <AuraText variant="body" color={AuraColors.gray600} align="center" style={{ marginTop: 12, paddingHorizontal: 48 }}>
                            Partner benefits will appear here as they become available to verified talent.
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
        padding: AuraSpacing.xl,
        backgroundColor: AuraColors.surface,
        borderRadius: 32,
        borderWidth: 1.5,
        borderColor: AuraColors.gray200,
        ...AuraShadows.soft,
    },
    iconBox: {
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
    card: {
        flexDirection: 'row',
        backgroundColor: AuraColors.surface,
        borderRadius: 32,
        padding: AuraSpacing.xl,
        marginBottom: 20,
        borderWidth: 1.5,
        borderColor: AuraColors.gray200,
        ...AuraShadows.soft,
    },
    imageContainer: {
        width: 80,
        height: 80,
        borderRadius: 20,
        backgroundColor: AuraColors.background,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 20,
        borderWidth: 1,
        borderColor: AuraColors.gray200,
    },
    image: {
        width: '80%',
        height: '80%',
    },
    content: {
        flex: 1,
        justifyContent: 'space-between',
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    footerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 16,
    },
    codeTag: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: AuraColors.white,
        paddingHorizontal: AuraSpacing.m,
        paddingVertical: AuraSpacing.s,
        borderRadius: AuraBorderRadius.m,
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
