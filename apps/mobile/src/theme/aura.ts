import { ViewStyle, TextStyle } from 'react-native';

/**
 * 🎨 AURA DESIGN SYSTEM v2.0
 * Concept: High-Contrast Minimalist (Pure Black/White)
 * Focus: Accessibility, Performance (OLED Black), and Consistency.
 */

export const AuraColors = {
    // Brand
    primary: '#FFFFFF',
    secondary: '#FFFFFF',
    accent: '#FFFFFF',

    // Backgrounds (OLED Optimized)
    background: '#000000',
    surface: '#111111',
    surfaceLight: '#1C1C1E',
    surfaceDark: '#080808',
    overlay: 'rgba(0,0,0,0.85)',

    // Functional
    success: '#34C759', // iOS Green
    warning: '#FF9F0A', // iOS Orange
    error: '#FF3B30',   // iOS Red
    info: '#0A84FF',    // iOS Blue

    // Grayscale
    white: '#FFFFFF',
    black: '#000000',
    gray100: '#1C1C1E', // Elevated
    gray200: '#2C2C2E', // Border
    gray300: '#3A3A3C', // Detail
    gray400: '#48484A', // Muted
    gray500: '#636366', // Icon
    gray600: '#8E8E93', // Secondary text
    gray700: '#AEAEB2', // Tertiary text
    gray800: '#C7C7CC', // Separator
    gray900: '#D1D1D6', // Near white

    // Glass
    glassBg: 'rgba(255, 255, 255, 0.06)',
    glassBorder: 'rgba(255, 255, 255, 0.12)',
};

export const AuraTypography: { [key: string]: TextStyle } = {
    h1: {
        fontSize: 34,
        fontWeight: '800',
        color: AuraColors.white,
        letterSpacing: 0.37,
    },
    h2: {
        fontSize: 28,
        fontWeight: '700',
        color: AuraColors.white,
        letterSpacing: 0.36,
    },
    h3: {
        fontSize: 22,
        fontWeight: '700',
        color: AuraColors.white,
        letterSpacing: 0.35,
    },
    body: {
        fontSize: 17,
        fontWeight: '400',
        color: AuraColors.white,
        letterSpacing: -0.41,
        lineHeight: 22,
    },
    bodyBold: {
        fontSize: 17,
        fontWeight: '600',
        color: AuraColors.white,
        letterSpacing: -0.41,
        lineHeight: 22,
    },
    caption: {
        fontSize: 13,
        fontWeight: '400',
        color: AuraColors.gray600,
        letterSpacing: -0.08,
    },
    label: {
        fontSize: 12,
        fontWeight: '600',
        color: AuraColors.gray500,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    button: {
        fontSize: 17,
        fontWeight: '600',
        color: AuraColors.white,
    },
};

export const AuraSpacing = {
    none: 0,
    xs: 4,
    s: 8,
    m: 12,
    l: 16,
    xl: 24,
    xxl: 32,
    xxxl: 48,
    mega: 64,
};

export const AuraGradients = {
    primary: ['#FFFFFF', '#E0E0E0'] as readonly [string, string, ...string[]],
    dark: ['#1C1C1E', '#000000'] as readonly [string, string, ...string[]],
    surface: ['#2C2C2E', '#1C1C1E'] as readonly [string, string, ...string[]],
    glass: ['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)'] as readonly [string, string, ...string[]],
};

export const AuraShadows = {
    soft: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 10,
        elevation: 5,
    } as ViewStyle,
    floating: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.6,
        shadowRadius: 20,
        elevation: 15,
    } as ViewStyle,
};

export const AuraBorderRadius = {
    none: 0,
    s: 6,
    m: 10,
    l: 14,
    xl: 20,
    xxl: 30,
    full: 9999,
};

export const AuraAnimations = {
    spring: {
        damping: 20,
        stiffness: 150,
        mass: 1,
    }
};
