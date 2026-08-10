import { ClerkProvider, useAuth } from '@clerk/expo';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router/stack';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import '../../global.css';

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY ?? '';
if (!publishableKey) {
  throw new Error('Add your Clerk Publishable Key to the .env file');
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 2,
    },
  },
});

function RootNavigator() {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) {
    return null;
  }

  return (
    <>
      <Stack screenOptions={{ headerShown: false, headerShadowVisible: false }}>
        <Stack.Protected guard={isSignedIn === true}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="cashier/checkout/table/[sessionId]" />
          <Stack.Screen name="cashier/checkout/takeaway/[orderId]" />
          <Stack.Screen name="order/[id]" />
          <Stack.Screen name="stock/qr-labels" />
          <Stack.Screen name="stock/scan" />
          <Stack.Screen name="stock/update/[id]" />
        </Stack.Protected>

        <Stack.Protected guard={isSignedIn === false}>
          <Stack.Screen name="sign-in" />
        </Stack.Protected>

        <Stack.Screen name="+not-found" options={{ title: 'Not Found' }} />
      </Stack>
      <StatusBar style="auto" />
    </>
  );
}

export default function RootLayout() {
  return (
    <ClerkProvider publishableKey={publishableKey}>
      <QueryClientProvider client={queryClient}>
        <SafeAreaProvider>
          <RootNavigator />
        </SafeAreaProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}
