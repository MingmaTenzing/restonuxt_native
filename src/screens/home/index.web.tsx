import { useAuth } from '@clerk/expo';
import { SignIn } from '@clerk/expo/web';
import { Text, View } from 'react-native';

import { HomeContent } from './content';

export default function HomeScreen() {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) {
    return (
      <View className="flex-1 items-center justify-center bg-neutral-50 px-5 dark:bg-black">
        <Text className="text-base font-medium text-neutral-500 dark:text-neutral-400">
          Loading...
        </Text>
      </View>
    );
  }

  if (!isSignedIn) {
    return (
      <View className="flex-1 items-center justify-center bg-neutral-50 px-5 py-8 dark:bg-black">
        <SignIn />
      </View>
    );
  }

  return <HomeContent />;
}
