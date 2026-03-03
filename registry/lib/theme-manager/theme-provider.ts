import { createThemeManager } from '@/registry/lib/theme-manager';

export const {
  ThemeProvider,
  getThemeFromCookies,
  getResolvedTheme,
  useTheme,
  useSetTheme,
  KeyboardThemeToggler,
  ToggleThemeButton,
  ToggleThemeMenuItem,
} = createThemeManager();
