import { Text, View } from 'react-native';

import { ScreenScroll } from '@/components/screen-scroll';
import { Table, TableCell, TableRow } from '@/components/table';
import { ThemeToggle } from '@/components/theme-toggle';
import { useResponsiveLayout } from '@/hooks/use-responsive-layout';
import { useAppState } from '@/hooks/use-app-state';
import { useTheme } from '@/hooks/use-theme';

export default function SettingsScreen() {
  const appState = useAppState();
  const theme = useTheme();
  const { isTablet } = useResponsiveLayout();

  return (
    <ScreenScroll>
      <View className="gap-2">
        <Text
          className={`font-bold tracking-tight text-foreground dark:text-foreground-dark ${
            isTablet ? 'text-3xl' : 'text-4xl'
          }`}>
          Settings
        </Text>
        <Text className="text-base leading-6 text-muted-foreground dark:text-muted-foreground-dark">
          App preferences and appearance.
        </Text>
      </View>

      <Table>
        <ThemeToggle />
        <TableRow>
          <TableCell label="App state">{appState}</TableCell>
          <TableCell label="Theme">{theme.colorScheme}</TableCell>
        </TableRow>
        <TableRow>
          <TableCell label="Accent">{theme.colors.accent}</TableCell>
          <TableCell label="Surface">{theme.colors.surface}</TableCell>
        </TableRow>
      </Table>
    </ScreenScroll>
  );
}
