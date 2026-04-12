import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';

SplashScreen.preventAutoHideAsync();

// TODO: Replace with MMKV check in future issue
const isOnboardingComplete = true;

export default function RootLayout() {
  const [fontsLoaded] = useFonts({});

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  // TODO: Wrap with <DatabaseProvider> (KSY-9)
  // TODO: Wrap with <ThemeProvider> (KSY-x)
  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="(onboarding)" options={{ headerShown: false }} />
      <Stack.Screen name="wallet/[id]" options={{ headerShown: true }} />
      <Stack.Screen name="budget/[id]" options={{ headerShown: true }} />
      <Stack.Screen name="transactions" options={{ headerShown: true }} />
      <Stack.Screen name="wallets" options={{ headerShown: true }} />
    </Stack>
  );
}
