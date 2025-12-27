import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, { Layout, SlideInRight, SlideOutRight } from 'react-native-reanimated';
import { Swipeable } from 'react-native-gesture-handler';
import { AuraColors, AuraSpacing } from '../theme/aura';
import { AuraText } from './AuraText';
import { useAuraHaptics } from '@core/hooks/useAuraHaptics';
import { ChevronRight, Trash2, Archive } from 'lucide-react-native';

interface AuraListItemProps {
    title: string;
    subtitle?: string;
    leftIcon?: React.ReactNode;
    rightElement?: React.ReactNode;
    onPress?: () => void;
    onDelete?: () => void;
    onArchive?: () => void;
    showChevron?: boolean;
    delay?: number;
}

export const AuraListItem: React.FC<AuraListItemProps> = ({
    title,
    subtitle,
    leftIcon,
    rightElement,
    onPress,
    onDelete,
    onArchive,
    showChevron = true,
    delay = 0
}) => {
    const haptics = useAuraHaptics();

    const renderRightActions = (_progress: any, _dragX: any) => {
        return (
            <View style={styles.rightActions}>
                {onArchive && (
                    <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: AuraColors.warning }]}
                        onPress={() => {
                            haptics.medium();
                            onArchive();
                        }}
                    >
                        <Archive color={AuraColors.white} size={20} />
                    </TouchableOpacity>
                )}
                {onDelete && (
                    <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: AuraColors.error }]}
                        onPress={() => {
                            haptics.warning();
                            onDelete();
                        }}
                    >
                        <Trash2 color={AuraColors.white} size={20} />
                    </TouchableOpacity>
                )}
            </View>
        );
    };

    return (
        <Animated.View
            entering={SlideInRight.delay(delay)}
            exiting={SlideOutRight}
            layout={Layout.springify()}
        >
            <Swipeable renderRightActions={(onDelete || onArchive) ? renderRightActions : undefined}>
                <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => {
                        haptics.selection();
                        onPress?.();
                    }}
                    style={styles.container}
                >
                    <View style={styles.content}>
                        {leftIcon && <View style={styles.iconContainer}>{leftIcon}</View>}

                        <View style={styles.textContainer}>
                            <AuraText variant="body" numberOfLines={1}>{title}</AuraText>
                            {subtitle && (
                                <AuraText variant="caption" color={AuraColors.gray600} numberOfLines={1}>
                                    {subtitle}
                                </AuraText>
                            )}
                        </View>

                        <View style={styles.rightContainer}>
                            {rightElement}
                            {showChevron && !rightElement && (
                                <ChevronRight size={20} color={AuraColors.gray600} />
                            )}
                        </View>
                    </View>
                    <View style={styles.separator} />
                </TouchableOpacity>
            </Swipeable>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: AuraColors.surface,
        minHeight: 64,
        justifyContent: 'center',
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: AuraSpacing.l,
        paddingVertical: 12,
    },
    iconContainer: {
        marginRight: 16,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: AuraColors.surfaceLight,
        alignItems: 'center',
        justifyContent: 'center',
    },
    textContainer: {
        flex: 1,
        justifyContent: 'center',
    },
    rightContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 8,
    },
    separator: {
        height: 1,
        backgroundColor: AuraColors.gray800,
        marginLeft: 72, // Indent past icon
    },
    rightActions: {
        width: 140,
        flexDirection: 'row',
    },
    actionBtn: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    }
});
