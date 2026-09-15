import type { PropsWithChildren } from 'react';
import { ScrollView, type StyleProp, type ViewStyle } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTriplineTheme } from '../theme';

export function Page({ children, tabbed = false, style }: PropsWithChildren<{ tabbed?: boolean; style?: StyleProp<ViewStyle> }>) {
  const insets = useSafeAreaInsets();
  const { theme } = useTriplineTheme();
  return (
    <Animated.View style={[{ flex: 1, backgroundColor: theme.bg }, style]}>
      <ScrollView
        contentContainerStyle={{ paddingTop: tabbed ? 16 : insets.top + 16, paddingBottom: tabbed ? 128 : insets.bottom + 30, paddingHorizontal: 22, gap: 18 }}
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    </Animated.View>
  );
}
