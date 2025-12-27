import React, { useState, useMemo } from 'react';
import { View, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import { PanGestureHandler, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    useAnimatedGestureHandler,
    withSpring,
    interpolate,
    Extrapolate,
    runOnJS,
} from 'react-native-reanimated';
import { AuraColors, AuraSpacing, AuraShadows, AuraBorderRadius } from '../../../core/theme/aura';
import { AuraHeader } from '../../../core/components/AuraHeader';
import { AuraText } from '../../../core/components/AuraText';
import { AuraInput } from '../../../core/components/AuraInput';
import { AuraMotion } from '../../../core/components/AuraMotion';
import { useAura } from '../../../core/context/AuraProvider';
import { Repository } from '../../../core/api/repository';
import { supabase } from '../../../core/api/supabase';
import GigCard from '../components/GigCard';
import { Search, Sparkles, Filter, X, Check } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');
const SWIPE_THRESHOLD = width * 0.35;

export default function WorkerFeedScreen() {
    const { gigs: globalGigs, loading: globalLoading, refreshData, showToast } = useAura();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');
    const [isAiSearch, setIsAiSearch] = useState(false);

    // Optimized local state for the deck
    const localGigs = useMemo(() => {
        return globalGigs.filter(g => g.status === 'open');
    }, [globalGigs]);

    const translateX = useSharedValue(0);
    const translateY = useSharedValue(0);

    const handleSwipeComplete = async (direction: 'left' | 'right') => {
        const currentGig = localGigs[currentIndex];
        if (!currentGig) return;

        if (direction === 'right') {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { error } = await Repository.applyToGig(currentGig.id, user.id);
                if (error) {
                    showToast({ message: `Application Failed: ${error.message}`, type: 'error' });
                } else {
                    showToast({ message: 'Applied Successfully!', type: 'success' });
                }
            }
        } else {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }

        translateX.value = 0;
        translateY.value = 0;
        setCurrentIndex(prev => prev + 1);
    };

    const gestureHandler = useAnimatedGestureHandler({
        onStart: (_, ctx: any) => {
            ctx.startX = translateX.value;
            ctx.startY = translateY.value;
        },
        onActive: (event, ctx) => {
            translateX.value = ctx.startX + event.translationX;
            translateY.value = ctx.startY + event.translationY;
        },
        onEnd: (event) => {
            if (Math.abs(event.translationX) > SWIPE_THRESHOLD) {
                const direction = event.translationX > 0 ? 'right' : 'left';
                translateX.value = withSpring(direction === 'right' ? width * 1.5 : -width * 1.5);
                runOnJS(handleSwipeComplete)(direction);
            } else {
                translateX.value = withSpring(0);
                translateY.value = withSpring(0);
            }
        },
    });

    const cardStyle = useAnimatedStyle(() => {
        const rotate = interpolate(
            translateX.value,
            [-width / 2, 0, width / 2],
            [-10, 0, 10],
            Extrapolate.CLAMP
        );

        return {
            transform: [
                { translateX: translateX.value },
                { translateY: translateY.value },
                { rotate: `${rotate}deg` },
            ],
        };
    });

    const likeOpacity = useAnimatedStyle(() => ({
        opacity: interpolate(translateX.value, [0, SWIPE_THRESHOLD / 2], [0, 1], Extrapolate.CLAMP),
    }));

    const nopeOpacity = useAnimatedStyle(() => ({
        opacity: interpolate(translateX.value, [-SWIPE_THRESHOLD / 2, 0], [1, 0], Extrapolate.CLAMP),
    }));

    const nextCardStyle = useAnimatedStyle(() => {
        const scale = interpolate(
            translateX.value,
            [-width / 2, 0, width / 2],
            [1, 0.94, 1],
            Extrapolate.CLAMP
        );
        return {
            transform: [{ scale }],
            opacity: interpolate(
                Math.abs(translateX.value),
                [0, width / 2],
                [0.5, 1],
                Extrapolate.CLAMP
            ),
        };
    });

    if (currentIndex >= localGigs.length) {
        return (
            <View style={styles.container}>
                <AuraHeader title="Discovery" showBack={false} />
                <View style={[styles.center, { padding: 40 }]}>
                    <AuraMotion type="zoom" style={styles.emptyIconBox}>
                        <Check size={48} color={AuraColors.primary} />
                    </AuraMotion>
                    <AuraText variant="h2" align="center" style={{ marginTop: 32 }}>All Caught Up</AuraText>
                    <AuraText variant="body" color={AuraColors.gray400} align="center" style={{ marginTop: 12 }}>
                        You've reviewed all available assignments in your perimeter.
                    </AuraText>
                    <TouchableOpacity
                        style={styles.refreshBtn}
                        onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            setCurrentIndex(0);
                            refreshData();
                        }}
                    >
                        <AuraText variant="label" color={AuraColors.primary}>Force Sync</AuraText>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    return (
        <GestureHandlerRootView style={styles.container}>
            <AuraHeader title="Discovery" showBack={false} />

            <View style={styles.searchContainer}>
                <View style={styles.searchInputWrapper}>
                    <AuraInput
                        placeholder={isAiSearch ? "Describe what you want..." : "Search missions..."}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        leftIcon={<Search size={18} color={AuraColors.gray500} />}
                        containerStyle={styles.searchBar}
                    />
                    <TouchableOpacity
                        style={[styles.aiToggle, isAiSearch && styles.aiToggleActive]}
                        onPress={() => {
                            setIsAiSearch(!isAiSearch);
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                        }}
                    >
                        <Sparkles size={18} color={isAiSearch ? AuraColors.white : AuraColors.gray500} />
                    </TouchableOpacity>
                </View>
            </View>

            <View style={styles.cardStack}>
                {localGigs[currentIndex + 1] && (
                    <Animated.View style={[styles.cardWrapper, nextCardStyle]}>
                        <GigCard gig={localGigs[currentIndex + 1]} />
                    </Animated.View>
                )}

                <PanGestureHandler onGestureEvent={gestureHandler}>
                    <Animated.View style={[styles.cardWrapper, cardStyle]}>
                        <GigCard gig={localGigs[currentIndex]} />

                        <Animated.View style={[styles.overlayShadow, styles.likeOverlay, likeOpacity]}>
                            <AuraText variant="h1" color={AuraColors.success} style={styles.overlayText}>APPLY</AuraText>
                        </Animated.View>

                        <Animated.View style={[styles.overlayShadow, styles.nopeOverlay, nopeOpacity]}>
                            <AuraText variant="h1" color={AuraColors.error} style={styles.overlayText}>PASS</AuraText>
                        </Animated.View>
                    </Animated.View>
                </PanGestureHandler>
            </View>

            <View style={styles.controls}>
                <TouchableOpacity
                    style={styles.controlBtn}
                    onPress={() => translateX.value = withSpring(-width * 1.5, {}, () => runOnJS(handleSwipeComplete)('left'))}
                >
                    <X size={28} color={AuraColors.error} />
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.controlBtn, styles.primaryBtn]}
                    onPress={() => translateX.value = withSpring(width * 1.5, {}, () => runOnJS(handleSwipeComplete)('right'))}
                >
                    <Check size={32} color={AuraColors.white} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.controlBtn}>
                    <Filter size={24} color={AuraColors.gray300} />
                </TouchableOpacity>
            </View>
        </GestureHandlerRootView>
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
    },
    searchContainer: {
        paddingHorizontal: AuraSpacing.xl,
        paddingTop: 12,
        zIndex: 10,
    },
    searchInputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    searchBar: {
        flex: 1,
        marginBottom: 0,
    },
    aiToggle: {
        width: 52,
        height: 52,
        borderRadius: 26,
        backgroundColor: AuraColors.surfaceLight,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1.5,
        borderColor: AuraColors.gray800,
    },
    aiToggleActive: {
        backgroundColor: AuraColors.primary,
        borderColor: AuraColors.primary,
        ...AuraShadows.soft,
    },
    cardStack: {
        flex: 1,
        marginTop: 24,
        paddingHorizontal: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cardWrapper: {
        position: 'absolute',
        width: width - 32,
        height: '80%',
    },
    overlayShadow: {
        ...StyleSheet.absoluteFillObject,
        borderRadius: AuraBorderRadius.xl,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 2,
    },
    likeOverlay: {
        backgroundColor: 'rgba(52, 199, 89, 0.2)',
        borderColor: AuraColors.success,
        borderWidth: 4,
    },
    nopeOverlay: {
        backgroundColor: 'rgba(255, 59, 48, 0.2)',
        borderColor: AuraColors.error,
        borderWidth: 4,
    },
    overlayText: {
        fontWeight: '900',
        letterSpacing: 4,
        transform: [{ rotate: '-15deg' }],
    },
    controls: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 24,
        paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    },
    controlBtn: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: AuraColors.surfaceElevated,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1.5,
        borderColor: AuraColors.gray800,
        ...AuraShadows.soft,
    },
    primaryBtn: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: AuraColors.primary,
        borderColor: AuraColors.primary,
    },
    emptyIconBox: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: AuraColors.surfaceElevated,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: AuraColors.primary,
        ...AuraShadows.floating,
    },
    refreshBtn: {
        marginTop: 40,
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 20,
        backgroundColor: 'rgba(0, 122, 255, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(0, 122, 255, 0.2)',
    }
});
