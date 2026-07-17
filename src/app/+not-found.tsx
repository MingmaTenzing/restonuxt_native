import { Link } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';

export default function NotFoundScreen() {
  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName="gap-6 px-5 py-7"
      contentInsetAdjustmentBehavior="automatic">
      <View
        className="gap-3 rounded-3xl border border-border bg-card p-5"
        style={{ borderCurve: 'continuous', boxShadow: '0 10px 30px rgba(0, 0, 0, 0.06)' }}>
        <Text className="text-2xl font-bold text-foreground">
          Page not found
        </Text>
        <Text className="text-base leading-6 text-muted-foreground">
          The route you opened does not exist yet.
        </Text>
      </View>

      <Link href="/">
        <Text className="text-center text-base font-semibold text-primary">
          Go home
        </Text>
      </Link>
    </ScrollView>
  );
}
