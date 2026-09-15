import { darkTheme, lightTheme, type TriplineTheme } from '@tripline/ui';
import { Platform, useColorScheme } from 'react-native';
import { createContext, useCallback, useContext, useMemo, useState, type PropsWithChildren } from 'react';
import { settings, type ThemeMode } from './settings/storage';

type ThemeContextValue = { theme: TriplineTheme; dark: boolean; mode: ThemeMode; setMode: (mode: ThemeMode) => void };
const ThemeContext = createContext<ThemeContextValue | null>(null);

export function TriplineThemeProvider({ children }: PropsWithChildren) {
  const systemMode = useColorScheme();
  const [mode, setStoredMode] = useState<ThemeMode>(() => settings.getThemeMode());
  const setMode = useCallback((next: ThemeMode) => {
    settings.setThemeMode(next);
    setStoredMode(next);
  }, []);
  const dark = mode === 'dark' || (mode === 'system' && systemMode === 'dark');
  const value = useMemo(() => ({ theme: dark ? darkTheme : lightTheme, dark, mode, setMode }), [dark, mode, setMode]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTriplineTheme(): ThemeContextValue {
  const value = useContext(ThemeContext);
  if (!value) throw new Error('TriplineThemeProvider 未挂载');
  return value;
}

export const chineseFont = Platform.select({
  ios: 'PingFang SC',
  android: 'HarmonyOS Sans SC',
  default: 'MiSans, "HarmonyOS Sans SC", "PingFang SC", sans-serif',
});

export const numberFont = 'PlusJakartaSans_700Bold';
