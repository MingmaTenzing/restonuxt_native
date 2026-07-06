import { Link } from 'expo-router';
import { ScrollView, Switch, Text, View } from 'react-native';

import { Button } from '@/components/button';
import { useTheme } from '@/hooks/use-theme';

import { HomeCard } from './card';
import { HomeUserIcon } from './user-icon';

const sections = [
  {
    title: 'src/app',
    description: 'Route files, layouts, and API routes stay thin and focused on navigation.',
  },
  {
    title: 'src/screens',
    description: 'Screen implementations live outside routing so page code can grow cleanly.',
  },
  {
    title: 'src/components',
    description: 'Reusable table, chart, and button primitives can be shared across screens.',
  },
];

export function HomeContent() {
  const theme = useTheme();

  return (
    <ScrollView
      className="flex-1 bg-zinc-50 dark:bg-zinc-950"
      contentContainerClassName="gap-6 px-5 py-6"
      contentInsetAdjustmentBehavior="automatic">
      <View className="gap-3">
        <View className="flex-row items-start justify-between gap-4">
          <Text className="flex-1 text-3xl font-bold text-zinc-950 dark:text-zinc-50">
            Expo src structure
          </Text>
          <HomeUserIcon />
        </View>
        <Text className="text-base leading-6 text-zinc-600 dark:text-zinc-300">
          Routes live in src/app, screens live in src/screens, and reusable code stays grouped by
          responsibility.
        </Text>
      </View>

      <View className="flex-row items-center justify-between gap-4 rounded-3xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <View className="flex-1 gap-1">
          <Text className="text-lg font-semibold text-zinc-950 dark:text-zinc-50">Dark mode</Text>
          <Text className="text-base leading-6 text-zinc-600 dark:text-zinc-300">
            Switch the app theme between light and dark.
          </Text>
        </View>
        <Switch
          accessibilityLabel="Toggle dark mode"
          onValueChange={theme.toggleColorScheme}
          thumbColor={theme.isDark ? '#f8fafc' : '#ffffff'}
          trackColor={{ false: '#d4d4d8', true: '#0ea5e9' }}
          value={theme.isDark}
        />
      </View>

      <View className="gap-3">
        {sections.map((section) => (
          <HomeCard key={section.title} description={section.description} title={section.title} />
        ))}
      </View>

      <View className="gap-3">
        <Link href="/events" asChild>
          <Button>View events</Button>
        </Link>
        <Link href="/settings" asChild>
          <Button>Open settings</Button>
        </Link>
      </View>
    </ScrollView>
  );
}
