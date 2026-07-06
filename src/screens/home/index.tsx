import { useAuth } from '@clerk/expo';
import { AuthView } from '@clerk/expo/native';
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
      <View className="flex-1 bg-neutral-50 dark:bg-black">
        <AuthView isDismissible={false} mode="signInOrUp" />
      </View>
    );
  }

  return <HomeContent />;
}
