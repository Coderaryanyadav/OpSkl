import React, { useState } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { AuraText } from '@core/components/AuraText';
import { AuraColors, AuraShadows } from '@theme/aura';
import { AuraButton } from '@core/components/AuraButton';
import { AuraMotion } from '@core/components/AuraMotion';
import { Zap, Check, X, Bell } from 'lucide-react-native';

const { width } = Dimensions.get('window');

interface OnboardingOverlayProps {
    onComplete: () => void;
}

const SLIDES = [
    {
        title: "Mission Control",
        desc: "Welcome to OpSkl. Your specialized gig feed awaits. Swipe through opportunities to find your next mission.",
        icon: <Zap size={60} color={AuraColors.primary} />,
    },
    {
        title: "Swipe Logistics",
        desc: "Swipe RIGHT to apply immediately.\nSwipe LEFT to pass and hide.\nIntelligence is tailored to your skills.",
        icon: (
            <View style={{ flexDirection: 'row', gap: 40 }}>
                <X size={48} color={AuraColors.error} />
                <Check size={48} color={AuraColors.success} />
            </View>
        ),
    },
    {
        title: "Stay Alert",
        desc: "Enable notifications to receive high-priority deployment signals instantly. Speed is currency.",
        icon: <Bell size={60} color={AuraColors.warning} />,
    }
];

export default function OnboardingOverlay({ onComplete }: OnboardingOverlayProps) {
    const [step, setStep] = useState(0);

    const handleNext = () => {
        if (step < SLIDES.length - 1) {
            setStep(step + 1);
        } else {
            onComplete();
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.backdrop} />

            <AuraMotion key={step} type="slide" style={styles.card}>
                <View style={[styles.iconBox, {
                    backgroundColor: step === 1 ? 'rgba(255,255,255,0.05)' :
                        step === 2 ? 'rgba(255, 159, 10, 0.1)' :
                            'rgba(0, 122, 255, 0.1)'
                }]}>
                    {SLIDES[step].icon}
                </View>

                <AuraText variant="h1" align="center" style={{ marginTop: 24, marginBottom: 12 }}>
                    {SLIDES[step].title}
                </AuraText>

                <AuraText variant="bodyLarge" align="center" color={AuraColors.gray300} style={styles.desc}>
                    {SLIDES[step].desc}
                </AuraText>

                <View style={styles.dots}>
                    {SLIDES.map((_, i) => (
                        <View
                            key={i}
                            style={[
                                styles.dot,
                                i === step && styles.activeDot,
                                i === step && { backgroundColor: step === 2 ? AuraColors.warning : AuraColors.primary }
                            ]}
                        />
                    ))}
                </View>

                <AuraButton
                    title={step === SLIDES.length - 1 ? "INITIALIZE SYSTEM" : "CONTINUE"}
                    variant="primary"
                    onPress={handleNext}
                    style={{ width: '100%', marginTop: 32 }}
                />
            </AuraMotion>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 1000,
        justifyContent: 'center',
        alignItems: 'center',
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.95)',
    },
    card: {
        width: width * 0.85,
        backgroundColor: AuraColors.surfaceElevated,
        borderRadius: 32,
        padding: AuraSpacing.xxl,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: AuraColors.gray800,
        ...AuraShadows.floating,
    },
    iconBox: {
        width: 120,
        height: 120,
        borderRadius: 60,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
    },
    desc: {
        lineHeight: 24,
        paddingHorizontal: AuraSpacing.s,
    },
    dots: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 32,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: AuraColors.gray700,
    },
    activeDot: {
        width: 24,
        backgroundColor: AuraColors.primary,
    }
});
