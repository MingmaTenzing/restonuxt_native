import { UserButton } from '@clerk/expo/native';
import { useAuth } from '@clerk/expo';
import { Pressable, Text } from 'react-native';

export function HomeUserIcon() {
  const { signOut } = useAuth();

  return (
    <Pressable
      accessibilityRole="button"
      className="rounded-2xl border border-neutral-200 bg-white px-4 py-3 active:opacity-80 dark:border-neutral-800 dark:bg-neutral-900"
      style={{ borderCurve: 'continuous' }}
      onPress={() => signOut()}>
      <Text className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">Sign out</Text>
    </Pressable>
  );
}
