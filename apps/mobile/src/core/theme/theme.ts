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
  primary: "#818CF8", // Lighter Indigo for Dark Mode
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

export const theme = {
  light: lightTheme,
  dark: darkTheme,
  fonts: {
    regular: "System",
    bold: "System",
    semiBold: "System",
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  roundness: {
    sm: 4,
    md: 8,
    lg: 16,
    xl: 24,
    full: 9999,
  },
};
