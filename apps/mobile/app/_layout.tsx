import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import * as SystemUI from 'expo-system-ui';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useTriplineTheme } from '../src/theme';
import { initializeDatabase } from '../src/data/database';

void SplashScreen.preventAutoHideAsync();

function RootNavigation() {
  const { theme, dark } = useTriplineTheme();
  const [fontsLoaded, fontError] = useFonts({
    PlusJakartaSans_700Bold: require('@expo-google-fonts/plus-jakarta-sans/700Bold/PlusJakartaSans_700Bold.ttf'),
  });

  useEffect(() => {
    if (fontsLoaded || fontError) void SplashScreen.hideAsync();
  }, [fontsLoaded, fontError]);

  useEffect(() => {
    void SystemUI.setBackgroundColorAsync(theme.bg);
    void initializeDatabase();
  }, [theme.bg]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <>
      <StatusBar style={dark ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.bg } }} />
    </>
  );
}

export default function RootLayout() {
  return <SafeAreaProvider><RootNavigation /></SafeAreaProvider>;
}
