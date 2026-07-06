import { Appearance, useColorScheme } from 'react-native';

type AppColorScheme = 'light' | 'dark';

export function useTheme() {
  const colorScheme = useColorScheme() ?? 'light';

  function setColorScheme(nextColorScheme: AppColorScheme) {
    Appearance.setColorScheme(nextColorScheme);
  }

  function toggleColorScheme() {
    setColorScheme(colorScheme === 'dark' ? 'light' : 'dark');
  }

  return {
    colorScheme,
    isDark: colorScheme === 'dark',
    setColorScheme,
    toggleColorScheme,
    colors: {
      primary: colorScheme === 'dark' ? '#7dd3fc' : '#0369a1',
      surface: colorScheme === 'dark' ? '#18181b' : '#ffffff',
      text: colorScheme === 'dark' ? '#fafafa' : '#18181b',
    },
  };
}
