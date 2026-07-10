import { useAuth } from '@clerk/expo';
import { AuthView } from '@clerk/expo/native';
import { Text, View } from 'react-native';

import { DashboardContent } from './content';

export default function DashboardScreen() {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) {
    return (
      <View className="flex-1 items-center justify-center bg-background px-5 dark:bg-background-dark">
        <Text className="text-base font-medium text-muted-foreground dark:text-muted-foreground-dark">
          Loading...
        </Text>
      </View>
    );
  }

  if (!isSignedIn) {
    return (
      <View className="flex-1 bg-background dark:bg-background-dark">
        <AuthView isDismissible={false} mode="signInOrUp" />
      </View>
    );
  }

  return <DashboardContent />;
}
