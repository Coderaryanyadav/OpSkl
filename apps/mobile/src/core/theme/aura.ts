import { ViewStyle, TextStyle } from 'react-native';

/**
 * 🎨 AURA DESIGN SYSTEM v2.0
 * Concept: High-Contrast Minimalist (Pure Black/White)
 * Focus: Accessibility, Performance (OLED Black), and Consistency.
 */

export const AuraColors = {
    // Brand (Cyber-Premium)
    primary: '#007AFF',    // iOS Blue
    secondary: '#5856D6',  // iOS Purple
    accent: '#32ADE6',     // Light Blue
    brand: '#FFFFFF',

    // Backgrounds (OLED Optimized)
    background: '#000000',
    surface: '#0A0A0A',
    surfaceElevated: '#121212',
    surfaceLight: '#1C1C1E',
    surfaceLighter: '#2C2C2E',
    
    // Functional
    success: '#34C759', // iOS Green
    warning: '#FF9F0A', // iOS Orange
    error: '#FF3B30',   // iOS Red
    info: '#0A84FF',    // iOS Blue
    
    // Grayscale
    white: '#FFFFFF',
    black: '#000000',
    gray100: '#D1D1D6',
    gray200: '#C7C7CC',
    gray300: '#AEAEB2',
    gray400: '#8E8E93',
    gray500: '#636366',
    gray600: '#48484A',
    gray700: '#3A3A3C',
    gray800: '#2C2C2E',
    gray900: '#1C1C1E',

    // Glass & Transparency
    glass: 'rgba(255, 255, 255, 0.08)',
    glassBorder: 'rgba(255, 255, 255, 0.15)',
    overlay: 'rgba(0,0,0,0.92)',
};

export const AuraTypography: { [key: string]: TextStyle } = {
    h1: {
        fontSize: 34,
        fontWeight: '800',
        color: AuraColors.white,
        letterSpacing: -0.5,
        lineHeight: 41,
    },
    h2: {
        fontSize: 28,
        fontWeight: '700',
        color: AuraColors.white,
        letterSpacing: -0.4,
        lineHeight: 34,
    },
    h3: {
        fontSize: 22,
        fontWeight: '700',
        color: AuraColors.white,
        letterSpacing: -0.3,
        lineHeight: 28,
    },
    bodyLarge: {
        fontSize: 19,
        fontWeight: '400',
        color: AuraColors.white,
        letterSpacing: -0.2,
        lineHeight: 24,
    },
    body: {
        fontSize: 17,
        fontWeight: '400',
        color: AuraColors.white,
        letterSpacing: -0.4,
        lineHeight: 22,
    },
    bodyBold: {
        fontSize: 17,
        fontWeight: '600',
        color: AuraColors.white,
        letterSpacing: -0.4,
        lineHeight: 22,
    },
    caption: {
        fontSize: 13,
        fontWeight: '400',
        color: AuraColors.gray400,
        letterSpacing: 0,
        lineHeight: 18,
    },
    label: {
        fontSize: 11,
        fontWeight: '800',
        color: AuraColors.gray500,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    button: {
        fontSize: 16,
        fontWeight: '700',
        letterSpacing: -0.2,
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
    primary: [AuraColors.primary, AuraColors.secondary] as readonly [string, string, ...string[]],
    surface: [AuraColors.surfaceElevated, AuraColors.surface] as readonly [string, string, ...string[]],
    glass: ['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.02)'] as readonly [string, string, ...string[]],
    gold: ['#FFE1A8', '#E2A233'] as readonly [string, string, ...string[]],
    error: ['#FF5E5E', '#FF3B30'] as readonly [string, string, ...string[]],
};

export const AuraShadows = {
    soft: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 6,
    } as ViewStyle,
    floating: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 16 },
        shadowOpacity: 0.5,
        shadowRadius: 24,
        elevation: 20,
    } as ViewStyle,
};

export const AuraBorderRadius = {
    none: 0,
    s: 8,
    m: 12,
    l: 18,
    xl: 24,
    xxl: 32,
    full: 9999,
};

export const AuraAnimations = {
    spring: {
        damping: 20,
        stiffness: 150,
        mass: 1,
    }
};
