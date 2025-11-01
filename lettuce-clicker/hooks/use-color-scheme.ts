import { useAppTheme } from '@/context/ThemeContext';

export function useColorScheme() {
  const { colorScheme } = useAppTheme();

  // App-wide surfaces stay light so the footer navigator does not swap themes
  // when the lounge toggles its palette. We still expose the stored scheme for
  // lounge-specific styling via the theme context.
  return 'light';
}
