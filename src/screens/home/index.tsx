import { Link } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';

import { Button } from '@/components/button';

import { HomeCard } from './card';

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

export default function HomeScreen() {
  return (
    <ScrollView
      className="flex-1 bg-zinc-50"
      contentContainerClassName="gap-6 px-5 py-6"
      contentInsetAdjustmentBehavior="automatic">
      <View className="gap-3">
        <Text className="text-3xl font-bold text-zinc-950">Expo src structure</Text>
        <Text className="text-base leading-6 text-zinc-600">
          Routes live in src/app, screens live in src/screens, and reusable code stays grouped by
          responsibility.
        </Text>
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
