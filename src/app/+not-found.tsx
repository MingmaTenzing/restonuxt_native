import { Link } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';

export default function NotFoundScreen() {
  return (
    <ScrollView
      className="flex-1 bg-neutral-50 dark:bg-black"
      contentContainerClassName="gap-6 px-5 py-6"
      contentInsetAdjustmentBehavior="automatic">
      <View
        className="gap-3 rounded-3xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900"
        style={{ borderCurve: 'continuous' }}>
        <Text className="text-2xl font-bold text-neutral-900 dark:text-neutral-50">
          Page not found
        </Text>
        <Text className="text-base leading-6 text-neutral-500 dark:text-neutral-400">
          The route you opened does not exist yet.
        </Text>
      </View>

      <Link href="/">
        <Text className="text-center text-base font-semibold text-neutral-900 dark:text-neutral-50">
          Go home
        </Text>
      </Link>
    </ScrollView>
  );
}
