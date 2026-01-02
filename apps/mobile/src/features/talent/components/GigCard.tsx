import React, { memo } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { AuraColors } from '@theme/aura';
import { AuraText } from '@core/components/AuraText';
import { MapPin, Clock, Zap, Info } from 'lucide-react-native';
import { Gig } from '@types';



interface GigCardProps {
    gig: Gig;
    onPress?: () => void;
}

const GigCard: React.FC<GigCardProps> = ({ gig, onPress }) => {
    const navigation = useNavigation<any>();
    const payAmount = ((gig.pay_amount_cents || gig.budget * 100) / 100).toLocaleString();

    const getUrgencyProfile = () => {
        switch (gig.urgency_level) {
            case 'high': return { color: AuraColors.error, label: 'CRITICAL', bg: 'rgba(255, 59, 48, 0.1)' };
            case 'medium': return { color: AuraColors.warning, label: 'PRIORITY', bg: 'rgba(255, 159, 10, 0.1)' };
            default: return { color: AuraColors.success, label: 'STABLE', bg: 'rgba(52, 199, 89, 0.1)' };
        }
    };

    const status = getUrgencyProfile();

    const handlePress = () => {
        if (onPress) {
            onPress();
        } else if (gig.status === 'active' && gig.assigned_talent_id) {
            navigation.navigate('GigDetails', { gigId: gig.id });
        }
    };

    return (
        <TouchableOpacity
            style={styles.outerContainer}
            onPress={handlePress}
            activeOpacity={0.9}
            disabled={!onPress && gig.status !== 'active'}
        >
            <LinearGradient
                colors={['#1C1C1E', '#000000']}
                style={styles.container}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                {/* Visual Accent */}
                <View style={[styles.accentLine, { backgroundColor: status.color }]} />

                {/* Header: Identity & Priority */}
                <View style={styles.header}>
                    <View style={styles.categoryBadge}>
                        <Zap size={14} color={AuraColors.primary} fill={AuraColors.primary} />
                        <AuraText variant="label" style={styles.categoryText}>{gig.category.toUpperCase()}</AuraText>
                    </View>
                    <View style={[styles.priorityBadge, { backgroundColor: status.bg }]}>
                        <AuraText variant="caption" color={status.color} style={{ fontWeight: '900', fontSize: 10 }}>{status.label}</AuraText>
                    </View>
                </View>

                {/* Mission Core */}
                <View style={styles.content}>
                    <AuraText variant="h1" numberOfLines={2} style={styles.title}>{gig.title}</AuraText>
                    <AuraText variant="body" color={AuraColors.gray500} numberOfLines={3} style={styles.description}>
                        {gig.description}
                    </AuraText>
                </View>

                {/* Telemetry Metrics */}
                <View style={styles.metrics}>
                    <View style={styles.metricItem}>
                        <Clock size={16} color={AuraColors.gray400} />
                        <AuraText variant="bodyBold" style={styles.metricValue}>{gig.duration_minutes}m</AuraText>
                    </View>
                    <View style={styles.metricDivider} />
                    <View style={styles.metricItem}>
                        <MapPin size={16} color={AuraColors.gray400} />
                        <AuraText variant="bodyBold" style={styles.metricValue}>LOCAL</AuraText>
                    </View>
                </View>

                {/* Bounty Section */}
                <View style={styles.footer}>
                    <View style={styles.bountyBox}>
                        <AuraText variant="caption" color={AuraColors.gray600} style={{ letterSpacing: 1.5 }}>MISSION BOUNTY</AuraText>
                        <View style={styles.amountRow}>
                            <AuraText variant="h2" style={styles.currency}>₹</AuraText>
                            <AuraText variant="h1" style={styles.amount}>{payAmount}</AuraText>
                        </View>
                    </View>
                    <View style={styles.actionPrompt}>
                        <Info size={16} color={AuraColors.gray700} />
                    </View>
                </View>
            </LinearGradient>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    outerContainer: {
        width: '100%',
        height: '100%',
        paddingVertical: 10,
    },
    container: {
        flex: 1,
        borderRadius: 32,
        padding: 28,
        borderWidth: 1.5,
        borderColor: AuraColors.gray800,
        justifyContent: 'space-between',
        position: 'relative',
        overflow: 'hidden',
    },
    accentLine: {
        position: 'absolute',
        top: 0,
        right: 0,
        left: 0,
        height: 4,
        opacity: 0.8,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    categoryBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: 'rgba(255,255,255,0.03)',
        paddingHorizontal: AuraSpacing.m,
        paddingVertical: 6,
        borderRadius: AuraBorderRadius.m,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    categoryText: {
        fontWeight: '900',
        color: AuraColors.primary,
        letterSpacing: 1,
    },
    priorityBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: AuraBorderRadius.s,
    },
    content: {
        marginTop: 20,
    },
    title: {
        fontWeight: '900',
        letterSpacing: -1,
        lineHeight: 34,
        marginBottom: 12,
    },
    description: {
        lineHeight: 22,
    },
    metrics: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 32,
        gap: 16,
    },
    metricItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    metricDivider: {
        width: 1,
        height: 12,
        backgroundColor: AuraColors.gray800,
    },
    metricValue: {
        letterSpacing: 1,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        marginTop: 'auto',
        paddingTop: 32,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.05)',
    },
    bountyBox: {
        gap: 4,
    },
    amountRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
    },
    currency: {
        color: AuraColors.gray600,
        marginRight: 4,
    },
    amount: {
        fontWeight: '900',
    },
    actionPrompt: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.03)',
        alignItems: 'center',
        justifyContent: 'center',
    }
});

export default memo(GigCard);
