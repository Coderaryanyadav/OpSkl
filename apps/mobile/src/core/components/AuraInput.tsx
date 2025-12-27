import React, { useState } from 'react';
import { TextInput, View, StyleSheet, TouchableOpacity, ViewStyle, TextInputProps } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withSpring,
    interpolateColor,
    FadeIn
} from 'react-native-reanimated';
import { AuraColors, AuraTypography, AuraBorderRadius } from '../theme/aura';
import { Eye, EyeOff, CheckCircle, AlertCircle, Mail, Lock, Phone, User, Search } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

interface AuraInputProps extends TextInputProps {
    label?: string;
    error?: string;
    success?: boolean;
    leftIcon?: React.ReactNode;
    icon?: string;
    containerStyle?: ViewStyle;
}

export const AuraInput: React.FC<AuraInputProps> = ({
    label,
    error,
    success,
    leftIcon,
    icon,
    secureTextEntry,
    containerStyle,
    onFocus,
    onBlur,
    style,
    ...props
}) => {
    const [isFocused, setIsFocused] = useState(false);
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);

    const focusProgress = useSharedValue(0);

    const handleFocus = (e: any) => {
        setIsFocused(true);
        focusProgress.value = withSpring(1);
        Haptics.selectionAsync();
        onFocus?.(e);
    };

    const handleBlur = (e: any) => {
        setIsFocused(false);
        focusProgress.value = withSpring(0);
        onBlur?.(e);
    };

    const animatedLabelStyle = useAnimatedStyle(() => {
        const hasValue = props.value && String(props.value).length > 0;
        const isActive = isFocused || hasValue;
        return {
            transform: [
                { translateY: withTiming(isActive ? -20 : 0, { duration: 200 }) },
                { scale: withTiming(isActive ? 0.8 : 1, { duration: 200 }) },
            ] as any,
            color: interpolateColor(
                focusProgress.value,
                [0, 1],
                [AuraColors.gray500, AuraColors.primary]
            ),
        };
    }, [isFocused, props.value]);

    const animatedBorderStyle = useAnimatedStyle(() => {
        const borderColor = error
            ? AuraColors.error
            : success
                ? AuraColors.success
                : interpolateColor(focusProgress.value, [0, 1], [AuraColors.gray800, AuraColors.primary]);

        return {
            borderColor,
            backgroundColor: interpolateColor(
                focusProgress.value,
                [0, 1],
                [AuraColors.surfaceElevated, AuraColors.surfaceLight]
            ),
        };
    });

    const getIcon = () => {
        if (leftIcon) return leftIcon;
        const color = isFocused ? AuraColors.primary : AuraColors.gray500;
        const size = 18;

        switch (icon) {
            case 'mail': return <Mail color={color} size={size} />;
            case 'lock': return <Lock color={color} size={size} />;
            case 'phone': return <Phone color={color} size={size} />;
            case 'user': return <User color={color} size={size} />;
            case 'search': return <Search color={color} size={size} />;
            default: return null;
        }
    };

    return (
        <View style={[styles.container, containerStyle]}>
            <Animated.View style={[styles.inputContainer, animatedBorderStyle]}>
                {label && (
                    <Animated.Text
                        pointerEvents="none"
                        style={[styles.floatingLabel, AuraTypography.body, animatedLabelStyle]}
                    >
                        {label}
                    </Animated.Text>
                )}

                {(leftIcon || icon) && <View style={styles.leftIcon}>{getIcon()}</View>}

                <TextInput
                    {...props}
                    style={[styles.input, AuraTypography.body, style]}
                    placeholderTextColor={isFocused ? "transparent" : AuraColors.gray600}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    secureTextEntry={secureTextEntry && !isPasswordVisible}
                />

                <View style={styles.rightIcons}>
                    {success && (
                        <Animated.View entering={FadeIn}>
                            <CheckCircle color={AuraColors.success} size={18} />
                        </Animated.View>
                    )}
                    {error && (
                        <Animated.View entering={FadeIn}>
                            <AlertCircle color={AuraColors.error} size={18} />
                        </Animated.View>
                    )}

                    {secureTextEntry && (
                        <TouchableOpacity
                            onPress={() => {
                                Haptics.selectionAsync();
                                setIsPasswordVisible(!isPasswordVisible);
                            }}
                            style={styles.eyeBtn}
                        >
                            {isPasswordVisible ? (
                                <EyeOff color={AuraColors.gray400} size={18} />
                            ) : (
                                <Eye color={AuraColors.gray400} size={18} />
                            )}
                        </TouchableOpacity>
                    )}
                </View>
            </Animated.View>

            {error && (
                <Animated.Text entering={FadeIn} style={styles.errorText}>
                    {error}
                </Animated.Text>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 20,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: AuraBorderRadius.l,
        borderWidth: 1.5,
        minHeight: 60,
        paddingHorizontal: 16,
    },
    floatingLabel: {
        position: 'absolute',
        left: 48, // Adjusted for icons
        zIndex: 1,
        fontWeight: '600',
    },
    input: {
        flex: 1,
        color: AuraColors.white,
        height: '100%',
        paddingVertical: 12,
        zIndex: 2,
    },
    leftIcon: {
        marginRight: 12,
        zIndex: 3,
    },
    rightIcons: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    eyeBtn: {
        padding: 4,
    },
    errorText: {
        ...AuraTypography.caption,
        color: AuraColors.error,
        marginTop: 6,
        marginLeft: 4,
        fontWeight: '600',
    }
});
