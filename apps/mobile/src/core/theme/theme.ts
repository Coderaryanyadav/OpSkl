export interface ThemeColors {
  primary: string;
  secondary: string;
  background: string;
  card: string;
  text: string;
  textMuted: string;
  border: string;
  success: string;
  warning: string;
  danger: string;
  accent: string;
  walletGold: string;
}

export const lightTheme: ThemeColors = {
  primary: "#6366F1", // Indigo
  secondary: "#4F46E5",
  background: "#F9FAFB",
  card: "#FFFFFF",
  text: "#111827",
  textMuted: "#6B7280",
  border: "#E5E7EB",
  success: "#10B981",
  warning: "#F59E0B",
  danger: "#EF4444",
  accent: "#8B5CF6",
  walletGold: "#D97706",
};

export const darkTheme: ThemeColors = {
  primary: "#818CF8", // Indigo (lightened for dark theme readability)
  secondary: "#6366F1",
  background: "#0B0F19",
  card: "#151D30",
  text: "#F9FAFB",
  textMuted: "#9CA3AF",
  border: "#1F2937",
  success: "#34D399",
  warning: "#FBBF24",
  danger: "#F87171",
  accent: "#A78BFA",
  walletGold: "#F59E0B",
};

// Design system tokens matching enterprise UI standards
export const theme = {
  light: lightTheme,
  dark: darkTheme,
  
  // Strict typography scale to prevent layout shifting
  typography: {
    h1: { fontSize: 32, lineHeight: 40, fontWeight: "700" as const },
    h2: { fontSize: 24, lineHeight: 32, fontWeight: "700" as const },
    h3: { fontSize: 20, lineHeight: 28, fontWeight: "600" as const },
    bodyLarge: { fontSize: 16, lineHeight: 24, fontWeight: "400" as const },
    bodyMedium: { fontSize: 14, lineHeight: 20, fontWeight: "400" as const },
    caption: { fontSize: 12, lineHeight: 16, fontWeight: "500" as const },
    buttonLabel: { fontSize: 15, lineHeight: 20, fontWeight: "600" as const },
  },

  // 4px-grid system spacing scale
  spacing: {
    base: 4,
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },

  // Standardized border radii
  roundness: {
    none: 0,
    sm: 4,
    md: 8,
    lg: 16,
    xl: 24,
    full: 9999,
  },

  // Premium glassmorphism shadow tokens
  shadows: {
    sm: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 2,
    },
    md: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 6,
      elevation: 4,
    },
    lg: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.15,
      shadowRadius: 16,
      elevation: 8,
    },
  },
};
