import { useColorScheme } from 'react-native';

export function useTheme() {
  const colorScheme = useColorScheme() ?? 'light';

  return {
    colorScheme,
    colors: {
      primary: colorScheme === 'dark' ? '#7dd3fc' : '#0369a1',
      surface: colorScheme === 'dark' ? '#18181b' : '#ffffff',
      text: colorScheme === 'dark' ? '#fafafa' : '#18181b',
    },
  };
}
