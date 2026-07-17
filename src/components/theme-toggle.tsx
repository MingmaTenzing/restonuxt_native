import { Ionicons } from '@expo/vector-icons';
import { Pressable, Switch, Text, View } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

interface ThemeToggleProps {
  variant?: 'compact' | 'row';
}

export function ThemeToggle({ variant = 'row' }: ThemeToggleProps) {
  const { isDark, setColorScheme, toggleColorScheme } = useTheme();

  if (variant === 'compact') {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        className="h-10 w-10 items-center justify-center rounded-full border border-border bg-card active:opacity-80"
        style={{ borderCurve: 'continuous' }}
        onPress={toggleColorScheme}>
        <Ionicons
          name={isDark ? 'sunny-outline' : 'moon-outline'}
          size={20}
          color={isDark ? '#E4E4E7' : '#18181B'}
        />
      </Pressable>
    );
  }

  return (
    <View className="flex-row items-center justify-between gap-4 border-b border-border px-4 py-3">
      <View className="flex-1 gap-1">
        <Text className="text-base font-medium text-foreground">
          Dark mode
        </Text>
        <Text className="text-sm text-muted-foreground">
          Use a dark appearance across the app
        </Text>
      </View>
      <Switch
        accessibilityLabel="Dark mode"
        value={isDark}
        onValueChange={(value) => setColorScheme(value ? 'dark' : 'light')}
        thumbColor="#ffffff"
        trackColor={{
          false: isDark ? '#52525B' : '#D4D4D8',
          true: isDark ? '#E4E4E7' : '#18181B',
        }}
      />
    </View>
  );
}
