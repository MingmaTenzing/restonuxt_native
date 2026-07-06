import { ScrollView, Text, View } from 'react-native';

import { Table, TableCell, TableRow } from '@/components/table';
import { useAppState } from '@/hooks/use-app-state';
import { useTheme } from '@/hooks/use-theme';

export default function SettingsScreen() {
  const appState = useAppState();
  const theme = useTheme();

  return (
    <ScrollView
      className="flex-1 bg-neutral-50 dark:bg-black"
      contentContainerClassName="gap-6 px-5 py-6"
      contentInsetAdjustmentBehavior="automatic">
      <View className="gap-2">
        <Text className="text-3xl font-bold text-neutral-900 dark:text-neutral-50">Settings</Text>
        <Text className="text-base leading-6 text-neutral-500 dark:text-neutral-400">
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
