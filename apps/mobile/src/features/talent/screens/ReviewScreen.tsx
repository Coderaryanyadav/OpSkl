import React, { useState, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { AuraHeader } from '@core/components/AuraHeader';
import { AuraText } from '@core/components/AuraText';
import { AuraButton } from '@core/components/AuraButton';
import { AuraInput } from '@core/components/AuraInput';
import { AuraMotion } from '@core/components/AuraMotion';
import { AuraColors, AuraSpacing, AuraShadows } from '@theme/aura';
import { Star, Target, ShieldCheck } from 'lucide-react-native';
import { useAuth } from '@context/AuthProvider';
import { useAura } from '@core/context/AuraProvider';
import { useAuraHaptics } from '@core/hooks/useAuraHaptics';
import { Repository } from '@api/repository';

export default function ReviewScreen() {
    const haptics = useAuraHaptics();
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const { user } = useAuth();
    const { showDialog, showToast, addReputation } = useAura();
    const { gigId, targetUserId, targetUserName = 'Personnel' } = route.params || {};

    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleRatingSelect = useCallback((val: number) => {
        haptics.medium();
        setRating(val);
    }, [haptics]);

    const handleSubmit = async () => {
        if (rating === 0) {
            haptics.error();
            showToast({ message: "Rating Required: Select performance tier.", type: 'error' });
            return;
        }

        setSubmitting(true);
        haptics.heavy();

        try {
            if (!user) throw new Error("No primary session found.");

            const { error: reviewError } = await Repository.createReview({
                gig_id: gigId,
                reviewer_id: user.id,
                target_id: targetUserId,
                rating,
                comment
            });

            if (reviewError) throw new Error(reviewError.message);

            const { error: updateError } = await Repository.updateGig(gigId, { status: 'completed' });

            if (updateError) throw updateError;

            addReputation(300); // REPUTATION reward for completing evaluation
            showToast({ message: "Evaluation submitted successfully!", type: 'success' });
            haptics.success();
            showDialog({
                title: 'Evaluation Recorded',
                message: "Final performance metrics have been securely logged and synchronized with the global trust index.",
                primaryLabel: 'CLOSE CONSOLE',
                onConfirm: () => navigation.goBack()
            });

        } catch (error: any) {
            haptics.error();
            showToast({ message: error.message, type: 'error' });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <View style={styles.container}>
            <AuraHeader title="Performance Evaluation" showBack />

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
                <AuraMotion type="zoom" duration={800} style={styles.heroSection}>
                    <View style={styles.targetIconBox}>
                        <Target size={40} color={AuraColors.white} />
                    </View>
                    <AuraText variant="h2" align="center" style={{ marginTop: 24, fontWeight: '900' }}>Evaluate {targetUserName}</AuraText>
                    <AuraText variant="body" color={AuraColors.gray600} align="center" style={{ marginTop: 8, paddingHorizontal: 32 }}>
                        Assign a performance tier based on the deployment outcome.
                    </AuraText>
                </AuraMotion>

                <AuraMotion type="slide" delay={200} style={styles.card}>
                    <AuraText variant="label" color={AuraColors.gray600} align="center" style={{ marginBottom: 32, letterSpacing: 2 }}>
                        PERFORMANCE TIER
                    </AuraText>
                    <View style={styles.starsRow}>
                        {[1, 2, 3, 4, 5].map((star) => (
                            <TouchableOpacity
                                key={star}
                                onPress={() => handleRatingSelect(star)}
                                activeOpacity={0.7}
                                style={styles.starBtn}
                            >
                                <Star
                                    size={40}
                                    color={star <= rating ? AuraColors.warning : AuraColors.gray200}
                                    fill={star <= rating ? AuraColors.warning : 'transparent'}
                                    strokeWidth={star <= rating ? 2 : 1.5}
                                />
                            </TouchableOpacity>
                        ))}
                    </View>
                    <AuraText variant="h3" align="center" color={rating === 0 ? AuraColors.gray600 : AuraColors.white} style={{ marginTop: 24 }}>
                        {rating === 0 ? "Select Star Rating" : `Tier ${rating}/5`}
                    </AuraText>
                </AuraMotion>

                <AuraMotion type="slide" delay={400} style={styles.commentSection}>
                    <AuraInput
                        label="Evaluation Briefing"
                        value={comment}
                        onChangeText={setComment}
                        placeholder="Detail the outcome of this engagement..."
                        multiline
                        style={{ height: 160 }}
                    />
                </AuraMotion>

                <AuraMotion type="slide" delay={600} style={styles.footer}>
                    <View style={styles.securityNote}>
                        <ShieldCheck size={18} color={AuraColors.success} />
                        <AuraText variant="caption" color={AuraColors.gray600} style={{ marginLeft: 12, flex: 1 }}>
                            All evaluations are final and influence global trust indices.
                        </AuraText>
                    </View>
                    <AuraButton
                        title={submitting ? "RECORDING..." : "COMMIT EVALUATION"}
                        onPress={handleSubmit}
                        disabled={submitting}
                        style={styles.submitBtn}
                        icon={<Target size={18} color={AuraColors.black} />}
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
    content: {
        paddingTop: 32,
    },
    heroSection: {
        alignItems: 'center',
        paddingHorizontal: 40,
        marginBottom: 56,
    },
    targetIconBox: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: AuraColors.surface,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: AuraColors.gray200,
        ...AuraShadows.floating,
    },
    card: {
        backgroundColor: AuraColors.surface,
        marginHorizontal: AuraSpacing.xl,
        borderRadius: 40,
        padding: 40,
        borderWidth: 1.5,
        borderColor: AuraColors.gray200,
        ...AuraShadows.soft,
    },
    starsRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 16,
    },
    starBtn: {
        padding: AuraSpacing.s,
    },
    commentSection: {
        marginTop: 48,
        paddingHorizontal: AuraSpacing.xl,
    },
    footer: {
        marginTop: 56,
        paddingHorizontal: AuraSpacing.xl,
    },
    securityNote: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        backgroundColor: 'rgba(52, 199, 89, 0.05)',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(52, 199, 89, 0.1)',
    },
    submitBtn: {
        marginTop: 24,
        height: 64,
        borderRadius: 32,
    }
});
