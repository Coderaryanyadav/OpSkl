import React from 'react';
import { Pressable, Text, StyleSheet, ViewStyle, ActivityIndicator, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { AuraColors, AuraTypography, AuraBorderRadius, AuraShadows, AuraGradients } from '../theme/aura';
// Keeping for type if needed, but we'll use hook

interface AuraButtonProps {
    title: string;
    onPress: () => void;
    variant?: 'primary' | 'secondary' | 'outline';
    size?: 'small' | 'medium' | 'large';
    style?: ViewStyle;
    disabled?: boolean;
    loading?: boolean;
    icon?: React.ReactNode;
}

export const AuraButton: React.FC<AuraButtonProps> = ({
    title,
    onPress,
    variant = 'primary',
    size = 'medium',
    style,
    disabled = false,
    loading = false,
    icon,
}) => {
    const scale = useSharedValue(1);


    const handlePressIn = () => {
        if (disabled || loading) return;
        scale.value = withSpring(0.96, { damping: 15, stiffness: 250 });
    };

    const handlePressOut = () => {
        if (disabled || loading) return;
        scale.value = withSpring(1);
    };

    const handlePress = () => {
        if (loading || disabled) return;
        onPress();
    };

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }]
    }));

    const getColors = (): readonly [string, string, ...string[]] => {
        if (variant === 'secondary') return AuraGradients.surface;
        if (variant === 'outline') return ['transparent', 'transparent'];
        return AuraGradients.primary;
    };

    const getTextColor = () => {
        if (variant === 'outline') return AuraColors.primary;
        if (variant === 'primary') return AuraColors.white;
        return AuraColors.gray100;
    };

    const getSize = () => {
        switch (size) {
            case 'small': return { paddingVertical: 10, paddingHorizontal: 20 };
            case 'large': return { paddingVertical: 18, paddingHorizontal: 36 };
            default: return { paddingVertical: 14, paddingHorizontal: 28 };
        }
    };

    return (
        <Animated.View style={[animatedStyle, style] as any}>
            <Pressable
                onPress={handlePress}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                disabled={disabled || loading}
                style={[
                    styles.container,
                    variant === 'primary' ? AuraShadows.floating : AuraShadows.soft,
                    variant === 'outline' && styles.outlineContainer
                ]}
            >
                <LinearGradient
                    colors={getColors()}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[styles.gradient, getSize(), (disabled && !loading) && styles.disabled]}
                >
                    {loading ? (
                        <ActivityIndicator color={getTextColor()} />
                    ) : (
                        <View style={styles.content}>
                            {icon && <View style={styles.iconBefore}>{icon}</View>}
                            <Text style={[
                                AuraTypography.button,
                                { color: getTextColor() }
                            ]}>
                                {title}
                            </Text>
                        </View>
                    )}
                </LinearGradient>
            </Pressable>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        borderRadius: AuraBorderRadius.full,
    },
    outlineContainer: {
        borderWidth: 1.5,
        borderColor: AuraColors.primary,
    },
    gradient: {
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: AuraBorderRadius.full,
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconBefore: {
        marginRight: 10,
    },
    disabled: {
        opacity: 0.5,
    },
});
