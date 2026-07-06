import { UserButton } from '@clerk/expo/native';
import { useAuth } from '@clerk/expo';
import { Pressable, Text } from 'react-native';

export function HomeUserIcon() {
  const { signOut } = useAuth();

  return (
    <Pressable
      accessibilityRole="button"
      className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 active:opacity-80 dark:border-zinc-800 dark:bg-zinc-900"
      onPress={() => signOut()}>
      <Text className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">Sign out</Text>
    </Pressable>
  );
}
