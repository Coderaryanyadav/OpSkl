import React, { useState, useMemo, useEffect } from 'react';
import { View, StyleSheet, Dimensions, TouchableOpacity, Platform, ActivityIndicator } from 'react-native';
import { GestureDetector, Gesture, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    interpolate,
    Extrapolate,
    runOnJS,
} from 'react-native-reanimated';
import { AuraColors, AuraSpacing, AuraShadows, AuraBorderRadius } from '@theme/aura';
import { AuraHeader } from '@core/components/AuraHeader';
import { AuraText } from '@core/components/AuraText';
import { AuraInput } from '@core/components/AuraInput';
import { AuraMotion } from '@core/components/AuraMotion';
import { useAura } from '@core/context/AuraProvider';
import { useAuth } from '@context/AuthProvider';
import { useGigStore } from '@store/useGigStore';
import { Repository } from '@api/repository';
import GigCard from '../components/GigCard';
import { Search, Sparkles, Filter, X, Check } from 'lucide-react-native';
import { useAuraHaptics } from '@core/hooks/useAuraHaptics';
import { Gig } from '@types';

const { width } = Dimensions.get('window');
const SWIPE_THRESHOLD = width * 0.35;

const FeedLoader = () => {
    const { feedLoading, searchLoading } = useGigStore();
    const isLoading = feedLoading || searchLoading;

    if (!isLoading) return null;

    return (
        <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center', zIndex: 50, pointerEvents: 'none' }]}>
            <View style={{ padding: 20, backgroundColor: AuraColors.surfaceElevated, borderRadius: 16, opacity: 0.9 }}>
                <ActivityIndicator size="large" color={AuraColors.primary} />
            </View>
        </View>
    );
};

import AsyncStorage from '@react-native-async-storage/async-storage';
import OnboardingOverlay from '../components/OnboardingOverlay';
import FilterModal from '../components/FilterModal';

// ... (imports)

export default function WorkerFeedScreen() {
    const { showToast } = useAura();
    const { user } = useAuth();
    const {
        gigs: feedGigs,
        searchResult,
        fetchGigs,
        searchGigsAI,
        clearSearch
    } = useGigStore();
    const haptics = useAuraHaptics();

    const [currentIndex, setCurrentIndex] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');
    const [isAiSearch, setIsAiSearch] = useState(false);
    const [showTutorial, setShowTutorial] = useState(false);

    useEffect(() => {
        checkTutorial();
        fetchGigs();
    }, [fetchGigs]);

    const checkTutorial = async () => {
        const hasSeen = await AsyncStorage.getItem('hasSeenSwipeTutorial');
        if (!hasSeen) setShowTutorial(true);
    };

    const finishTutorial = async () => {
        setShowTutorial(false);
        await AsyncStorage.setItem('hasSeenSwipeTutorial', 'true');
        haptics.success();
    };

    // Choose data source based on search state
    const localGigs = useMemo(() => {
        const sourceData = searchResult ?? feedGigs;
        return sourceData.filter((g: Gig) => g.status === 'open');
    }, [feedGigs, searchResult]);

    // Reset index when data source changes
    useEffect(() => {
        setCurrentIndex(0);
    }, [searchResult]);

    // ... (Swipe logic omitted, same as before)
    // Re-create swipe handlers here if replacing full function or just inject loader above return
    // Since I must replace the whole function to insert the loader cleanly at root:

    const translateX = useSharedValue(0);
    const translateY = useSharedValue(0);

    const handleSwipeComplete = async (direction: 'left' | 'right') => {
        const currentGig = localGigs[currentIndex];
        if (!currentGig) return;

        if (direction === 'right') {
            haptics.success();

            if (user) {
                const { error } = await Repository.applyToGig(currentGig.id, user.id);
                if (error) {
                    showToast({ message: `Application Failed: ${error.message}`, type: 'error' });
                } else {
                    showToast({ message: 'Applied Successfully!', type: 'success' });
                }
            }
        } else {
            haptics.medium();
        }

        translateX.value = 0;
        translateY.value = 0;
        setCurrentIndex(prev => prev + 1);
    };

    const gesture = Gesture.Pan()
        .onUpdate((event) => {
            translateX.value = event.translationX;
            translateY.value = event.translationY;
        })
        .onEnd((event) => {
            if (Math.abs(event.translationX) > SWIPE_THRESHOLD) {
                const direction = event.translationX > 0 ? 'right' : 'left';
                translateX.value = withSpring(direction === 'right' ? width * 1.5 : -width * 1.5);
                runOnJS(handleSwipeComplete)(direction);
            } else {
                translateX.value = withSpring(0);
                translateY.value = withSpring(0);
            }
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

    const handleSearch = () => {
        if (!searchQuery.trim()) {
            clearSearch();
            return;
        }

        if (isAiSearch) {
            searchGigsAI(searchQuery);
        } else {
            searchGigsAI(searchQuery);
        }
    };

    const [showFilters, setShowFilters] = useState(false);
    const [activeFilters, setActiveFilters] = useState({});

    // Apply Filter Logic
    const handleApplyFilters = (filters: any) => {
        setActiveFilters(filters);
        // If filters are active, we refetch with them
        fetchGigs(filters);
    };

    // Simplified Return Structure with Loader
    return (
        <GestureHandlerRootView style={styles.container}>
            {showTutorial && <OnboardingOverlay onComplete={finishTutorial} />}
            <FilterModal
                visible={showFilters}
                onClose={() => setShowFilters(false)}
                onApply={handleApplyFilters}
                onSave={async (filters: any) => {
                    if (!user) return;
                    haptics.success();
                    const { error } = await Repository.saveSearch(
                        user.id,
                        `Signal ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
                        filters,
                        searchQuery
                    );

                    if (error) {
                        showToast({ message: 'Failed to capture signal', type: 'error' });
                    } else {
                        showToast({ message: 'Signal frequency locked in databank', type: 'success' });
                        setShowFilters(false);
                    }
                }}
            />
            <FeedLoader />
            <AuraHeader title="Discovery" showBack={false} />

            <View style={styles.searchContainer}>
                <View style={styles.searchInputWrapper}>
                    {/* Search Input Logic (Same as before) */}
                    <AuraInput
                        placeholder={isAiSearch ? "Describe what you want..." : "Search missions..."}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        onSubmitEditing={handleSearch}
                        returnKeyType="search"
                        leftIcon={<Search size={18} color={AuraColors.gray500} />}
                        containerStyle={styles.searchBar}
                    />
                    {/* AI Toggle */}
                    <TouchableOpacity
                        style={[styles.aiToggle, isAiSearch && styles.aiToggleActive]}
                        onPress={() => {
                            setIsAiSearch(!isAiSearch);
                            haptics.medium();
                        }}
                    >
                        <Sparkles size={18} color={isAiSearch ? AuraColors.white : AuraColors.gray500} />
                    </TouchableOpacity>
                </View>

                {/* Filter Button */}
                <TouchableOpacity
                    style={[styles.filterBtn, Object.keys(activeFilters).length > 0 && styles.filterBtnActive]}
                    onPress={() => { setShowFilters(true); haptics.selection(); }}
                >
                    <Filter size={20} color={Object.keys(activeFilters).length > 0 ? AuraColors.white : AuraColors.gray400} />
                </TouchableOpacity>
            </View>

            {currentIndex >= localGigs.length ? (
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
                            haptics.light();
                            setCurrentIndex(0);
                            fetchGigs();
                        }}
                    >
                        <AuraText variant="label" color={AuraColors.primary}>Force Sync</AuraText>
                    </TouchableOpacity>
                </View>
            ) : (
                <View style={styles.cardStack}>
                    {localGigs[currentIndex + 1] && (
                        <Animated.View style={[styles.cardWrapper, nextCardStyle]}>
                            <GigCard gig={localGigs[currentIndex + 1]} />
                        </Animated.View>
                    )}

                    <GestureDetector gesture={gesture}>
                        <Animated.View style={[styles.cardWrapper, cardStyle]}>
                            <GigCard gig={localGigs[currentIndex]} />

                            <Animated.View style={[styles.overlayShadow, styles.likeOverlay, likeOpacity]}>
                                <AuraText variant="h1" color={AuraColors.success} style={styles.overlayText}>APPLY</AuraText>
                            </Animated.View>

                            <Animated.View style={[styles.overlayShadow, styles.nopeOverlay, nopeOpacity]}>
                                <AuraText variant="h1" color={AuraColors.error} style={styles.overlayText}>PASS</AuraText>
                            </Animated.View>
                        </Animated.View>
                    </GestureDetector>
                </View>
            )}

            {/* Controls only show if cards exist */}
            {currentIndex < localGigs.length && (
                <View style={styles.controls}>
                    <TouchableOpacity
                        style={styles.controlBtn}
                        onPress={() => {
                            translateX.value = withSpring(-width * 1.5);
                            runOnJS(handleSwipeComplete)('left');
                        }}
                    >
                        <X size={28} color={AuraColors.error} />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.controlBtn, styles.primaryBtn]}
                        onPress={() => {
                            translateX.value = withSpring(width * 1.5);
                            runOnJS(handleSwipeComplete)('right');
                        }}
                    >
                        <Check size={32} color={AuraColors.white} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.controlBtn}>
                        <Filter size={24} color={AuraColors.gray300} />
                    </TouchableOpacity>
                </View>
            )}
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
        flexDirection: 'row', // Added for horizontal layout
        alignItems: 'center', // Added for vertical alignment
        gap: 12, // Added for spacing between search input and filter button
    },
    searchInputWrapper: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    // Missing style additions
    filterBtn: {
        width: 48,
        height: 48,
        backgroundColor: AuraColors.surfaceElevated,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: AuraColors.gray800,
        ...AuraShadows.soft,
    },
    filterBtnActive: {
        backgroundColor: AuraColors.primary,
        borderColor: AuraColors.primary,
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
