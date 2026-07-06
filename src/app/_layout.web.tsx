import { ClerkProvider } from '@clerk/expo';
import '../../global.css';

import { Stack } from 'expo-router/stack';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;
if (!publishableKey) {
  throw new Error('Add your Clerk Publishable Key to the .env file');
}

export default function RootLayout() {
  return (
    <ClerkProvider publishableKey={publishableKey}>
      <SafeAreaProvider>
        <Stack screenOptions={{ headerShown: false, headerShadowVisible: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="+not-found" options={{ title: 'Not Found' }} />
        </Stack>
        <StatusBar style="auto" />
      </SafeAreaProvider>
    </ClerkProvider>
  );
}
