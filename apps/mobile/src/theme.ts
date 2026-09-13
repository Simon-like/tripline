import { darkTheme, lightTheme, type TriplineTheme } from '@tripline/ui';
import { Platform, useColorScheme } from 'react-native';

export function useTriplineTheme(): { theme: TriplineTheme; dark: boolean } {
  const dark = useColorScheme() === 'dark';
  return { theme: dark ? darkTheme : lightTheme, dark };
}

export const chineseFont = Platform.select({
  ios: 'PingFang SC',
  android: 'HarmonyOS Sans SC',
  default: 'MiSans, "HarmonyOS Sans SC", "PingFang SC", sans-serif',
});

export const numberFont = 'PlusJakartaSans_700Bold';
