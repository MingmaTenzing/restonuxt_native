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
      accent: colorScheme === 'dark' ? '#7A73FF' : '#635BFF',
      background: colorScheme === 'dark' ? '#000000' : '#F6F9FC',
      surface: colorScheme === 'dark' ? '#1A1F36' : '#ffffff',
      border: colorScheme === 'dark' ? '#2A2F45' : '#E3E8EE',
      text: colorScheme === 'dark' ? '#F6F9FC' : '#0A2540',
      mutedText: colorScheme === 'dark' ? '#8898AA' : '#697386',
    },
  };
}
