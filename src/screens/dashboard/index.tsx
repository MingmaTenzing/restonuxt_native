import { useAuth } from '@clerk/expo';
import { AuthView } from '@clerk/expo/native';
import { Text, View } from 'react-native';

import { ScreenScroll } from '@/components/screen-scroll';
import { DashboardSkeleton } from '@/components/skeleton';

import { DashboardContent } from './content';

export default function DashboardScreen() {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) {
    return (
      <View className="flex-1 bg-background">
        <ScreenScroll>
          <DashboardSkeleton />
        </ScreenScroll>
      </View>
    );
  }

  if (!isSignedIn) {
    return (
      <View className="flex-1 bg-background">
        <AuthView isDismissible={false} mode="signInOrUp" />
      </View>
    );
  }

  return <DashboardContent />;
}
