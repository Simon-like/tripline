import { useEffect, useState } from 'react';
import { Tabs, useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon, type IconName } from '@tripline/ui';
import { chineseFont, useTriplineTheme } from '../../../src/theme';
import { getJourney } from '../../../src/data/database';

const tabItems = [
  ['checklist', '清单', 'luggage'],
  ['itinerary', '行程', 'map'],
  ['ledger', '账本', 'wallet'],
  ['journal', '手账', 'notebook'],
  ['return', '返程', 'plane'],
] as const satisfies readonly [string, string, IconName][];

export default function JourneyLayout() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [journeyName, setJourneyName] = useState('我的旅程');
  const { theme } = useTriplineTheme();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (id) void getJourney(id).then((journey) => setJourneyName(journey?.name ?? '我的旅程'));
  }, [id]);

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerTitle: journeyName,
        headerStyle: { backgroundColor: theme.bg },
        headerShadowVisible: false,
        headerTitleStyle: { color: theme.text, fontFamily: chineseFont, fontWeight: '700', fontSize: 16 },
        headerLeft: () => <Pressable onPress={() => router.back()} style={{ paddingHorizontal: 20 }} hitSlop={12}><Icon name="chevron-left" size={22} color={theme.text} /></Pressable>,
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
      {tabItems.map(([name, title, icon]) => (
        <Tabs.Screen key={name} name={name} options={{ title, tabBarIcon: ({ focused, color }) => <Icon name={icon} size={focused ? 24 : 21} color={color} /> }} />
      ))}
    </Tabs>
  );
}
