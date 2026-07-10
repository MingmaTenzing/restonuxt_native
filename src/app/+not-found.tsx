import { Link } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';

export default function NotFoundScreen() {
  return (
    <ScrollView
      className="flex-1 bg-background dark:bg-background-dark"
      contentContainerClassName="gap-6 px-5 py-7"
      contentInsetAdjustmentBehavior="automatic">
      <View
        className="gap-3 rounded-3xl border border-border bg-card p-5 dark:border-border-dark dark:bg-card-dark"
        style={{ borderCurve: 'continuous', boxShadow: '0 10px 30px rgba(0, 0, 0, 0.06)' }}>
        <Text className="text-2xl font-bold text-foreground dark:text-foreground-dark">
          Page not found
        </Text>
        <Text className="text-base leading-6 text-muted-foreground dark:text-muted-foreground-dark">
          The route you opened does not exist yet.
        </Text>
      </View>

      <Link href="/">
        <Text className="text-center text-base font-semibold text-primary dark:text-primary-dark">
          Go home
        </Text>
      </Link>
    </ScrollView>
  );
}
