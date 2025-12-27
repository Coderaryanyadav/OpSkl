import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import Animated, { BounceIn } from 'react-native-reanimated';
import { AuraColors, AuraShadows, AuraBorderRadius } from '../theme/aura';
import { AuraText } from './AuraText';
import { X } from 'lucide-react-native';

interface TutorialStep {
    target: { x: number, y: number, width: number, height: number };
    title: string;
    description: string;
    position?: 'top' | 'bottom';
}

interface AuraTutorialProps {
    visible: boolean;
    steps: TutorialStep[];
    onComplete: () => void;
}

export const AuraTutorial: React.FC<AuraTutorialProps> = ({ visible, steps, onComplete }) => {
    const [currentStep, setCurrentStep] = useState(0);

    if (!visible || steps.length === 0) return null;

    const step = steps[currentStep];
    const isLast = currentStep === steps.length - 1;

    const handleNext = () => {
        if (isLast) {
            onComplete();
        } else {
            setCurrentStep(prev => prev + 1);
        }
    };

    return (
        <Modal transparent visible={visible} animationType="fade">
            <View style={styles.overlay}>
                {/* Highlight Cutout Placeholder - In real implementation, would use Svg Mask */}
                <View
                    style={[
                        styles.highlight,
                        {
                            top: step.target.y - 10,
                            left: step.target.x - 10,
                            width: step.target.width + 20,
                            height: step.target.height + 20
                        }
                    ]}
                />

                {/* Tooltip */}
                <Animated.View
                    key={currentStep} // Trigger animation on step change
                    entering={BounceIn}
                    style={[
                        styles.tooltip,
                        step.position === 'top'
                            ? { top: step.target.y - 140, left: 20, right: 20 }
                            : { top: step.target.y + step.target.height + 20, left: 20, right: 20 }
                    ]}
                >
                    <View style={styles.header}>
                        <AuraText variant="h3" color={AuraColors.primary}>{step.title}</AuraText>
                        <TouchableOpacity onPress={onComplete}>
                            <X color={AuraColors.gray400} size={20} />
                        </TouchableOpacity>
                    </View>
                    <AuraText variant="body" style={{ marginTop: 8 }}>{step.description}</AuraText>

                    <View style={styles.footer}>
                        <AuraText variant="caption" color={AuraColors.gray500}>
                            Step {currentStep + 1} of {steps.length}
                        </AuraText>
                        <TouchableOpacity onPress={handleNext}>
                            <AuraText variant="button" color={AuraColors.white}>
                                {isLast ? 'Finish' : 'Next'}
                            </AuraText>
                        </TouchableOpacity>
                    </View>
                </Animated.View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
    },
    highlight: {
        position: 'absolute',
        borderWidth: 2,
        borderColor: AuraColors.primary,
        borderRadius: AuraBorderRadius.m,
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    tooltip: {
        position: 'absolute',
        backgroundColor: AuraColors.surface,
        borderRadius: AuraBorderRadius.l,
        padding: 20,
        ...AuraShadows.floating,
        borderWidth: 1,
        borderColor: AuraColors.gray800,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 20,
    }
});
