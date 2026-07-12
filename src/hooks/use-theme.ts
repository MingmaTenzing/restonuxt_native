import { useColorScheme } from 'nativewind';

type AppColorScheme = 'light' | 'dark';

export function useTheme() {
  const { colorScheme, setColorScheme, toggleColorScheme } = useColorScheme();
  const resolvedScheme: AppColorScheme = colorScheme === 'dark' ? 'dark' : 'light';

  return {
    colorScheme: resolvedScheme,
    isDark: resolvedScheme === 'dark',
    setColorScheme,
    toggleColorScheme,
    colors: {
      accent: resolvedScheme === 'dark' ? '#3F3F46' : '#F4F4F5',
      background: resolvedScheme === 'dark' ? '#09090B' : '#FFFFFF',
      surface: resolvedScheme === 'dark' ? '#18181B' : '#FFFFFF',
      border: resolvedScheme === 'dark' ? '#3F3F46' : '#E4E4E7',
      text: resolvedScheme === 'dark' ? '#FAFAFA' : '#09090B',
      mutedText: resolvedScheme === 'dark' ? '#A1A1AA' : '#71717A',
      primary: resolvedScheme === 'dark' ? '#E4E4E7' : '#18181B',
      primaryForeground: resolvedScheme === 'dark' ? '#18181B' : '#FAFAFA',
    },
  };
}
