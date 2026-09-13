import { Tabs, useRouter } from 'expo-router';
import { Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TripText } from '../../../src/components/TripText';
import { chineseFont, useTriplineTheme } from '../../../src/theme';

const tabItems = [
  ['checklist', '清单', '🧳'],
  ['itinerary', '行程', '🗺️'],
  ['ledger', '账本', '💰'],
  ['journal', '手账', '📔'],
  ['return', '返程', '✈️'],
] as const;

export default function JourneyLayout() {
  const router = useRouter();
  const { theme } = useTriplineTheme();
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerTitle: '香格里拉 · 5天4晚',
        headerStyle: { backgroundColor: theme.bg },
        headerShadowVisible: false,
        headerTitleStyle: { color: theme.text, fontFamily: chineseFont, fontWeight: '700', fontSize: 16 },
        headerLeft: () => <Pressable onPress={() => router.back()} style={{ paddingHorizontal: 20 }}><TripText size={24}>‹</TripText></Pressable>,
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.textSecondary,
        tabBarLabelStyle: { fontFamily: chineseFont, fontSize: 11, fontWeight: '600', lineHeight: 15 },
        tabBarItemStyle: { paddingTop: 6 },
        tabBarStyle: {
          position: 'absolute',
          left: 14,
          right: 14,
          bottom: Math.max(insets.bottom, 8),
          height: 66,
          borderRadius: 28,
          backgroundColor: theme.surface,
          borderTopWidth: 0,
          shadowColor: theme.shadow,
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.18,
          shadowRadius: 16,
          elevation: 12,
        },
      }}
    >
      {tabItems.map(([name, title, emoji]) => (
        <Tabs.Screen key={name} name={name} options={{ title, tabBarIcon: ({ focused }) => <TripText size={focused ? 24 : 21}>{emoji}</TripText> }} />
      ))}
    </Tabs>
  );
}
