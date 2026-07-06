import { useColorScheme } from 'react-native';
import { theme } from '../theme/theme';

export function useTheme() {
  const scheme = useColorScheme();
  const colors = scheme === 'dark' ? theme.dark : theme.light;

  return {
    colors,
    isDark: scheme === 'dark',
    fonts: theme.fonts,
    spacing: theme.spacing,
    roundness: theme.roundness,
  };
}
