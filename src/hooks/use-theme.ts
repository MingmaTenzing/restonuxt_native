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
      accent: colorScheme === 'dark' ? '#3F3F46' : '#F4F4F5',
      background: colorScheme === 'dark' ? '#09090B' : '#FFFFFF',
      surface: colorScheme === 'dark' ? '#18181B' : '#FFFFFF',
      border: colorScheme === 'dark' ? '#3F3F46' : '#E4E4E7',
      text: colorScheme === 'dark' ? '#FAFAFA' : '#09090B',
      mutedText: colorScheme === 'dark' ? '#A1A1AA' : '#71717A',
      primary: colorScheme === 'dark' ? '#E4E4E7' : '#18181B',
      primaryForeground: colorScheme === 'dark' ? '#18181B' : '#FAFAFA',
    },
  };
}
