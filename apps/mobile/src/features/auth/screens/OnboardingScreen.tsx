import React, { useRef, useState } from 'react';
import { useAuraHaptics } from '@core/hooks/useAuraHaptics';
import { View, StyleSheet, Dimensions, FlatList, TouchableOpacity, ImageBackground } from 'react-native';
import { useAuraHaptics } from '@core/hooks/useAuraHaptics';
import { useNavigation } from '@react-navigation/native';
import { useAuraHaptics } from '@core/hooks/useAuraHaptics';
import { AuraText } from '@core/components/AuraText';
import { useAuraHaptics } from '@core/hooks/useAuraHaptics';
import { AuraButton } from '@core/components/AuraButton';
import { useAuraHaptics } from '@core/hooks/useAuraHaptics';
import { AuraColors, AuraSpacing } from '@theme/aura';
import { useAuraHaptics } from '@core/hooks/useAuraHaptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useAuraHaptics } from '@core/hooks/useAuraHaptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuraHaptics } from '@core/hooks/useAuraHaptics';

const { width, height } = Dimensions.get('window');

const SLIDES = [
    {
        id: '1',
        title: 'Find Flexible Work',
        subtitle: 'Connect with clients looking for your skills. Work when you want, where you want.',
        image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=1000'
    },
    {
        id: '2',
        title: 'Instant Payments',
        subtitle: 'Get paid immediately after completing a gig. No more waiting for weeks.',
        image: 'https://images.unsplash.com/photo-1556742049-0cfed4f7a07d?q=80&w=1000'
    },
    {
        id: '3',
        title: 'Build Your Career',
        subtitle: 'Earn badges, level up, and showcase your portfolio to top employers.',
        image: 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?q=80&w=1000'
    }
];

export default function OnboardingScreen({ onFinish }: { onFinish?: () => void }) {
    const haptics = useAuraHaptics();
    const navigation = useNavigation<any>();
    const [currentIndex, setCurrentIndex] = useState(0);
    const flatListRef = useRef<FlatList>(null);

    const handleNext = () => {
        haptics.medium();
        if (currentIndex < SLIDES.length - 1) {
            flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
            setCurrentIndex(prev => prev + 1);
        } else {
            if (onFinish) {
                onFinish();
            } else {
                navigation.replace('Login');
            }
        }
    };

    const renderItem = ({ item }: { item: typeof SLIDES[0] }) => (
        <View style={styles.slide}>
            <ImageBackground source={{ uri: item.image }} style={styles.image} resizeMode="cover">
                <LinearGradient
                    colors={['transparent', AuraColors.background]}
                    style={styles.gradient}
                />
            </ImageBackground>
            <View style={styles.content}>
                <Animated.View entering={FadeInDown.springify()}>
                    <AuraText variant="h1" align="center" style={styles.title}>{item.title}</AuraText>
                    <AuraText variant="body" color={AuraColors.gray400} align="center" style={styles.subtitle}>
                        {item.subtitle}
                    </AuraText>
                </Animated.View>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <FlatList
                ref={flatListRef}
                data={SLIDES}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={(e) => {
                    const index = Math.round(e.nativeEvent.contentOffset.x / width);
                    setCurrentIndex(index);
                }}
            />

            <View style={styles.footer}>
                <View style={styles.dots}>
                    {SLIDES.map((_, index) => (
                        <View
                            key={index}
                            style={[
                                styles.dot,
                                index === currentIndex && styles.activeDot
                            ]}
                        />
                    ))}
                </View>

                <AuraButton
                    title={currentIndex === SLIDES.length - 1 ? "Get Started" : "Next"}
                    onPress={handleNext}
                />

                <TouchableOpacity
                    style={styles.skipBtn}
                    onPress={() => navigation.replace('Login')}
                >
                    <AuraText variant="label" color={AuraColors.gray500}>Skip Introduction</AuraText>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: AuraColors.background,
    },
    slide: {
        width,
        height,
    },
    image: {
        width,
        height: height * 0.55,
    },
    gradient: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    content: {
        flex: 1,
        padding: AuraSpacing.xl,
        justifyContent: 'flex-start',
        paddingTop: 40,
    },
    title: {
        marginBottom: 16,
    },
    subtitle: {
        lineHeight: 26,
    },
    footer: {
        position: 'absolute',
        bottom: 50,
        left: AuraSpacing.xl,
        right: AuraSpacing.xl,
        gap: 24,
    },
    dots: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 12,
        marginBottom: 8,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: AuraColors.gray200,
    },
    activeDot: {
        backgroundColor: AuraColors.white,
        width: 24,
    },
    skipBtn: {
        alignItems: 'center',
    }
});
