import type { PropsWithChildren } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTriplineTheme } from '../theme';

export function Page({ children, tabbed = false }: PropsWithChildren<{ tabbed?: boolean }>) {
  const insets = useSafeAreaInsets();
  const { theme } = useTriplineTheme();
  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <ScrollView
        contentContainerStyle={{ paddingTop: tabbed ? 16 : insets.top + 16, paddingBottom: tabbed ? 128 : insets.bottom + 30, paddingHorizontal: 22, gap: 18 }}
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    </View>
  );
}
