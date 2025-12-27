import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator, Platform } from 'react-native';
import { useAuraHaptics } from '@core/hooks/useAuraHaptics';
import { AuraHeader } from '@core/components/AuraHeader';
import { AuraText } from '@core/components/AuraText';
import { AuraColors, AuraSpacing, AuraBorderRadius, AuraShadows } from '@theme/aura';
import { ArrowUpRight, ArrowDownLeft, TrendingUp, ShieldCheck, History, CreditCard, Download, ExternalLink } from 'lucide-react-native';
import RazorpayCheckout from 'react-native-razorpay';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { AuraButton } from '@core/components/AuraButton';
import { AuraBadge } from '@core/components/AuraBadge';
import { AuraMotion } from '@core/components/AuraMotion';
import { useAura } from '@core/context/AuraProvider';
import { useAuth } from '@context/AuthProvider';
import { useWalletStore } from '@store/useWalletStore';
import { BiometricService } from '@core/services/biometrics';

dayjs.extend(relativeTime);

const RAZORPAY_KEY = process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID || '';

export default function WalletScreen() {
    const haptics = useAuraHaptics();
    const { showDialog, showToast } = useAura();
    const { user } = useAuth();
    const { wallet, transactions, loading, sync } = useWalletStore();
    const [refreshing, setRefreshing] = useState(false);

    const handleSync = useCallback(async () => {
        if (user) {
            await sync(user.id);
        }
    }, [user, sync]);

    useEffect(() => {
        handleSync();
    }, [handleSync]);

    const handleRefresh = async () => {
        setRefreshing(true);
        haptics.medium();
        await handleSync();
        setRefreshing(false);
    };

    const handleWithdraw = async () => {
        haptics.warning();
        const balance = wallet?.balance || 0;

        if (balance < 100) {
            showDialog({
                title: 'Threshold Not Met',
                message: 'Minimum withdrawal cycle requires ₹100.00 liquidity.',
                type: 'error',
                onConfirm: () => { }
            });
            return;
        }

        // 🔐 2FA / Biometric Security Check
        const isSecure = await BiometricService.isEnrolled();
        if (isSecure) {
            const { success } = await BiometricService.authenticate('Authorize Fund Transfer');
            if (!success) {
                haptics.error();
                showToast({ message: 'Authentication Failed. Transfer Aborted.', type: 'error' });
                return;
            }
        }

        showDialog({
            title: 'Initiate Payout',
            message: `Withdraw ₹${balance.toLocaleString()} to your primary bank node?`,
            type: 'warning',
            onConfirm: () => {
                haptics.success();
                showToast({ message: "Payout cycle initiated", type: 'success' });
            }
        });
    };

    const handleAddFunds = () => {
        if (!RAZORPAY_KEY) {
            showToast({ message: "Payment gateway offline", type: 'error' });
            return;
        }

        haptics.selection();
        const amount = 500; // Fixed denom for demo
        const options = {
            description: 'AURA CORE CREDITS DEPOSIT',
            image: 'https://i.imgur.com/3g7nmJC.png',
            currency: 'INR',
            key: RAZORPAY_KEY,
            amount: amount * 100,
            name: 'AURA CORE',
            theme: { color: AuraColors.primary }
        };

        RazorpayCheckout.open(options).then(async () => {
            haptics.success();
            showToast({ message: "Liquidity injected successfully", type: 'success' });
            await handleRefresh();
        }).catch((error: any) => {
            showToast({ message: `Transaction Aborted: ${error.description}`, type: 'error' });
        });
    };

    const balanceFormatted = useMemo(() => {
        return (wallet?.balance || 0).toLocaleString('en-IN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    }, [wallet?.balance]);

    return (
        <View style={styles.container}>
            <AuraHeader title="Treasury Console" showBack />

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={AuraColors.primary} />
                }
            >
                {/* Balance Module */}
                <AuraMotion type="zoom">
                    <View style={styles.balanceCard}>
                        <View style={styles.secureBadge}>
                            <ShieldCheck size={14} color={AuraColors.success} />
                            <AuraText variant="label" color={AuraColors.success} style={{ marginLeft: 6, fontWeight: '800' }}>
                                ENCRYPTED LEDGER
                            </AuraText>
                        </View>

                        <AuraText variant="label" color={AuraColors.gray500} style={{ marginTop: 24, letterSpacing: 2 }}>TOTAL LIQUIDITY</AuraText>
                        <View style={styles.balanceRow}>
                            <AuraText variant="h1" style={styles.currencySymbol}>₹</AuraText>
                            <AuraText variant="h1" style={styles.balanceText}>{balanceFormatted}</AuraText>
                        </View>

                        <View style={styles.actionGrid}>
                            <TouchableOpacity style={styles.actionBtn} onPress={handleAddFunds}>
                                <View style={[styles.actionIcon, { backgroundColor: AuraColors.primary }]}>
                                    <ArrowDownLeft color={AuraColors.white} size={24} />
                                </View>
                                <AuraText variant="label" style={{ marginTop: 12 }}>DEPOSIT</AuraText>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.actionBtn} onPress={handleWithdraw}>
                                <View style={[styles.actionIcon, { backgroundColor: AuraColors.surfaceElevated, borderWidth: 1, borderColor: AuraColors.gray800 }]}>
                                    <ArrowUpRight color={AuraColors.white} size={24} />
                                </View>
                                <AuraText variant="label" style={{ marginTop: 12 }}>PAYOUT</AuraText>
                            </TouchableOpacity>
                        </View>
                    </View>
                </AuraMotion>

                {/* Insight Strip */}
                <View style={styles.insightStrip}>
                    <TrendingUp size={18} color={AuraColors.success} />
                    <AuraText variant="bodyBold" style={{ marginLeft: 12, flex: 1 }}>Market performance up 12.4%</AuraText>
                    <ExternalLink size={14} color={AuraColors.gray600} />
                </View>

                {/* Transaction Ledger */}
                <View style={styles.ledgerHeader}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <History size={18} color={AuraColors.primary} />
                        <AuraText variant="h3" style={{ marginLeft: 12 }}>Mission History</AuraText>
                    </View>
                    <TouchableOpacity>
                        <AuraText variant="label" color={AuraColors.gray500}>REPORTS</AuraText>
                    </TouchableOpacity>
                </View>

                <View style={styles.ledgerList}>
                    {loading ? (
                        <View style={styles.loaderBox}>
                            <ActivityIndicator color={AuraColors.primary} />
                        </View>
                    ) : transactions.length === 0 ? (
                        <View style={styles.emptyLedger}>
                            <CreditCard size={48} color={AuraColors.gray800} />
                            <AuraText variant="body" color={AuraColors.gray500} style={{ marginTop: 16 }}>No operational signals recorded.</AuraText>
                        </View>
                    ) : (
                        transactions.map((tx: any, index: number) => (
                            <AuraMotion key={tx.id} type="slide" delay={100 + index * 40}>
                                <View style={styles.txItem}>
                                    <View style={[styles.txIndicator, { backgroundColor: tx.type === 'credit' ? 'rgba(52, 199, 89, 0.1)' : 'rgba(255, 255, 255, 0.05)' }]}>
                                        {tx.type === 'credit' ? <ArrowDownLeft color={AuraColors.success} size={18} /> : <ArrowUpRight color={AuraColors.white} size={18} />}
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <AuraText variant="bodyBold" numberOfLines={1}>{tx.description}</AuraText>
                                        <AuraText variant="caption" color={AuraColors.textSecondary}>{dayjs(tx.created_at).fromNow().toUpperCase()}</AuraText>
                                    </View>
                                    <View style={{ alignItems: 'flex-end' }}>
                                        <AuraText variant="bodyBold" color={tx.type === 'credit' ? AuraColors.success : AuraColors.white}>
                                            {tx.type === 'credit' ? '+' : '-'}₹{tx.amount.toLocaleString()}
                                        </AuraText>
                                        <AuraBadge label="SYNCED" variant="default" style={{ height: 16, paddingHorizontal: 4 }} />
                                    </View>
                                </View>
                            </AuraMotion>
                        ))
                    )}
                </View>

                {/* Payout Method */}
                <AuraButton
                    title="EXPORT TAX COMPLIANCE"
                    onPress={() => showToast({ message: "Exporting operational ledger...", type: 'info' })}
                    variant="outline"
                    icon={<Download size={18} color={AuraColors.white} />}
                    style={styles.exportBtn}
                />

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
    scrollContent: {
        paddingHorizontal: AuraSpacing.xl,
        paddingTop: 20,
    },
    balanceCard: {
        padding: 32,
        backgroundColor: AuraColors.surfaceElevated,
        borderRadius: AuraBorderRadius.xxl,
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: AuraColors.gray800,
        ...AuraShadows.floating,
    },
    secureBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(52, 199, 89, 0.05)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(52, 199, 89, 0.15)',
    },
    balanceRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
        marginTop: 8,
    },
    currencySymbol: {
        fontSize: 32,
        color: AuraColors.gray400,
        marginRight: 8,
    },
    balanceText: {
        fontSize: 56,
        fontWeight: '900',
        letterSpacing: -2,
    },
    actionGrid: {
        flexDirection: 'row',
        marginTop: 40,
        gap: 48,
    },
    actionBtn: {
        alignItems: 'center',
    },
    actionIcon: {
        width: 64,
        height: 64,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
        ...AuraShadows.soft,
    },
    insightStrip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: AuraColors.surfaceElevated,
        padding: 16,
        borderRadius: 20,
        marginTop: 24,
        borderWidth: 1,
        borderColor: AuraColors.gray800,
    },
    ledgerHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 40,
        marginBottom: 20,
    },
    ledgerList: {
        gap: 12,
    },
    loaderBox: {
        paddingVertical: 40,
    },
    txItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: AuraColors.surfaceElevated,
        borderRadius: 24,
        gap: 16,
        borderWidth: 1,
        borderColor: AuraColors.gray800,
    },
    txIndicator: {
        width: 44,
        height: 44,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyLedger: {
        alignItems: 'center',
        paddingVertical: 60,
        borderWidth: 1,
        borderStyle: 'dashed',
        borderColor: AuraColors.gray800,
        borderRadius: 32,
    },
    exportBtn: {
        marginTop: 40,
        height: 60,
    }
});
