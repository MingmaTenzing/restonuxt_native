import { ScrollView, Text, View } from 'react-native';

import { Table, TableCell, TableRow } from '@/components/table';
import { useAppState } from '@/hooks/use-app-state';
import { useTheme } from '@/hooks/use-theme';

export default function SettingsScreen() {
  const appState = useAppState();
  const theme = useTheme();

  return (
    <ScrollView
      className="flex-1 bg-background dark:bg-background-dark"
      contentContainerClassName="gap-6 px-5 py-7"
      contentInsetAdjustmentBehavior="automatic">
      <View className="gap-2">
        <Text className="text-4xl font-bold tracking-tight text-foreground dark:text-foreground-dark">
          Settings
        </Text>
        <Text className="text-base leading-6 text-muted-foreground dark:text-muted-foreground-dark">
          App-level hooks and reusable rows are separated from route files.
        </Text>
      </View>

      <Table>
        <TableRow>
          <TableCell label="App state">{appState}</TableCell>
          <TableCell label="Theme">{theme.colorScheme}</TableCell>
        </TableRow>
        <TableRow>
          <TableCell label="Accent">{theme.colors.accent}</TableCell>
          <TableCell label="Surface">{theme.colors.surface}</TableCell>
        </TableRow>
      </Table>
    </ScrollView>
  );
}
