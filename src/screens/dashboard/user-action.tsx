import { useAuth } from '@clerk/expo';
import { Pressable, Text } from 'react-native';

export function DashboardUserAction() {
  const { signOut } = useAuth();

  return (
    <Pressable
      accessibilityRole="button"
      className="rounded-full border border-border bg-card px-4 py-2.5 active:opacity-80 dark:border-border-dark dark:bg-card-dark"
      style={{ borderCurve: 'continuous' }}
      onPress={() => signOut()}>
      <Text className="text-sm font-semibold text-foreground dark:text-foreground-dark">
        Sign out
      </Text>
    </Pressable>
  );
}
