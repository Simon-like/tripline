import { useEffect, useState } from 'react';
import { Tabs, useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable } from 'react-native';
import { Icon, type IconName } from '@tripline/ui';
import { chineseFont, useTriplineTheme } from '../../../src/theme';
import { getJourney } from '../../../src/data/database';
import { JourneyTabBar } from '../../../src/components/JourneyTabBar';

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

  useEffect(() => {
    if (id) void getJourney(id).then((journey) => setJourneyName(journey?.name ?? '我的旅程'));
  }, [id]);

  return (
    <Tabs
      tabBar={(props) => <JourneyTabBar {...props} journeyId={id} />}
      screenOptions={{
        headerShown: true,
        headerTitle: journeyName,
        headerStyle: { backgroundColor: theme.bg },
        headerShadowVisible: false,
        headerTitleStyle: { color: theme.text, fontFamily: chineseFont, fontWeight: '700', fontSize: 16 },
        headerLeft: () => <Pressable onPress={() => router.back()} style={{ paddingHorizontal: 20 }} hitSlop={12}><Icon name="chevron-left" size={22} color={theme.text} /></Pressable>,
      }}
    >
      {tabItems.map(([name, title, icon]) => (
        <Tabs.Screen key={name} name={name} options={{ title, tabBarIcon: ({ focused, color }) => <Icon name={icon} size={focused ? 24 : 21} color={color} /> }} />
      ))}
    </Tabs>
  );
}
