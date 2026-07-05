import { Link } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';

export default function NotFoundScreen() {
  return (
    <ScrollView
      className="flex-1 bg-zinc-50"
      contentContainerClassName="gap-6 px-5 py-6"
      contentInsetAdjustmentBehavior="automatic">
      <View className="gap-3 rounded-3xl border border-zinc-200 bg-white p-5">
        <Text className="text-2xl font-bold text-zinc-950">Page not found</Text>
        <Text className="text-base leading-6 text-zinc-600">
          The route you opened does not exist yet.
        </Text>
      </View>

      <Link href="/">
        <Text className="text-center text-base font-semibold text-zinc-950">Go home</Text>
      </Link>
    </ScrollView>
  );
}
