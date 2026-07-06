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
      accent: colorScheme === 'dark' ? '#3fdd85' : '#06C167',
      background: colorScheme === 'dark' ? '#000000' : '#fafafa',
      surface: colorScheme === 'dark' ? '#171717' : '#ffffff',
      border: colorScheme === 'dark' ? '#262626' : '#e5e5e5',
      text: colorScheme === 'dark' ? '#fafafa' : '#171717',
      mutedText: colorScheme === 'dark' ? '#a3a3a3' : '#737373',
    },
  };
}
