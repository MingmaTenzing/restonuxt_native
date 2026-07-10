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
      className="flex-1 bg-background dark:bg-background-dark"
      contentContainerClassName="gap-6 px-5 py-7"
      contentInsetAdjustmentBehavior="automatic">
      <View className="gap-3">
        <View className="flex-row items-start justify-between gap-4">
          <Text className="flex-1 text-4xl font-bold tracking-tight text-foreground dark:text-foreground-dark">
            Service desk
          </Text>
          <HomeUserIcon />
        </View>
        <Text className="text-base leading-6 text-muted-foreground dark:text-muted-foreground-dark">
          A calmer place to watch bookings, orders, menu changes, and staff activity.
        </Text>
      </View>

      <View
        className="flex-row items-center justify-between gap-4 rounded-3xl border border-border bg-card p-5 dark:border-border-dark dark:bg-card-dark"
        style={{ borderCurve: 'continuous', boxShadow: '0 10px 30px rgba(0, 0, 0, 0.06)' }}>
        <View className="flex-1 gap-1">
          <Text className="text-lg font-semibold text-foreground dark:text-foreground-dark">
            Dark mode
          </Text>
          <Text className="text-base leading-6 text-muted-foreground dark:text-muted-foreground-dark">
            Switch the app theme between light and dark.
          </Text>
        </View>
        <Switch
          accessibilityLabel="Toggle dark mode"
          onValueChange={theme.toggleColorScheme}
          thumbColor={theme.isDark ? '#ffffff' : '#ffffff'}
          trackColor={{ false: '#D4D4D8', true: theme.colors.primary }}
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
