import { useCallback, useState } from 'react';
import { Tabs, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, View } from 'react-native';
import { Icon, type IconName } from '@tripline/ui';
import { deriveJourneyStatus, toLocalDateString, type Journey, type JourneyStatus } from '@tripline/shared';
import { chineseFont, useTriplineTheme } from '../../../src/theme';
import { getJourney, updateJourney } from '../../../src/data/database';
import { buildJourneyShareText } from '../../../src/data/share';
import { JourneyForm, type JourneyDraft } from '../../../src/components/JourneyForm';
import { JourneyTabBar } from '../../../src/components/JourneyTabBar';
import { ShareSheet } from '../../../src/components/ShareSheet';
import { TripText } from '../../../src/components/TripText';

const tabItems = [
  ['checklist', '清单', 'luggage'],
  ['itinerary', '行程', 'map'],
  ['ledger', '账本', 'wallet'],
  ['journal', '手账', 'notebook'],
  ['return', '返程', 'plane'],
] as const satisfies readonly [string, string, IconName][];

const STATUS_LABELS: Record<JourneyStatus, string> = {
  preparing: '准备中',
  traveling: '游玩中',
  finished: '已结束',
};

function StatusPill({ status }: { status: JourneyStatus }) {
  const { theme } = useTriplineTheme();
  const color = status === 'preparing' ? theme.primary : status === 'traveling' ? theme.accent : theme.success;
  return (
    <View style={{ backgroundColor: color, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 3 }}>
      <TripText size={10} weight="bold" style={{ color: status === 'preparing' ? theme.onPrimary : theme.onAccent, lineHeight: 14 }}>{STATUS_LABELS[status]}</TripText>
    </View>
  );
}

export default function JourneyLayout() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [journey, setJourney] = useState<Journey | null>(null);
  const [editing, setEditing] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [shareText, setShareText] = useState<string | null>(null);
  const { theme } = useTriplineTheme();

  const refresh = useCallback(async () => {
    if (!id) return;
    setJourney(await getJourney(id));
  }, [id]);
  useFocusEffect(useCallback(() => { void refresh(); }, [refresh]));

  function openShare() {
    setShareText(null);
    setSharing(true);
    if (!id) return;
    void buildJourneyShareText(id).then((share) => setShareText(share?.text ?? ''));
  }

  async function saveJourney(draft: JourneyDraft) {
    if (!journey) return;
    await updateJourney({ ...journey, ...draft, updatedAt: Date.now() });
    await refresh();
  }

  const status = journey ? deriveJourneyStatus(toLocalDateString(new Date()), journey.startDate, journey.endDate) : null;

  return (
    <>
      <Tabs
        tabBar={(props) => <JourneyTabBar {...props} journeyId={id} />}
        screenOptions={{
          headerShown: true,
          headerTitle: () => (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, maxWidth: 230 }}>
              <TripText size={16} weight="bold" numberOfLines={1} style={{ flexShrink: 1 }}>{journey?.name ?? '我的旅程'}</TripText>
              {status ? <StatusPill status={status} /> : null}
            </View>
          ),
          headerStyle: { backgroundColor: theme.bg },
          headerShadowVisible: false,
          headerTitleStyle: { color: theme.text, fontFamily: chineseFont, fontWeight: '700', fontSize: 16 },
          headerLeft: () => <Pressable onPress={() => router.back()} style={{ paddingHorizontal: 20 }} hitSlop={12}><Icon name="chevron-left" size={22} color={theme.text} /></Pressable>,
          headerRight: () => journey ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', paddingRight: 20, gap: 2 }}>
              <Pressable onPress={openShare} accessibilityRole="button" accessibilityLabel="分享旅程" style={{ padding: 10 }} hitSlop={8}>
                <Icon name="share" size={20} color={theme.text} />
              </Pressable>
              <Pressable onPress={() => setEditing(true)} accessibilityRole="button" accessibilityLabel="编辑旅程" style={{ padding: 10 }} hitSlop={8}>
                <Icon name="pencil" size={20} color={theme.text} />
              </Pressable>
            </View>
          ) : null,
        }}
      >
        {tabItems.map(([name, title, icon]) => (
          <Tabs.Screen key={name} name={name} options={{ title, tabBarIcon: ({ focused, color }) => <Icon name={icon} size={focused ? 24 : 21} color={color} /> }} />
        ))}
      </Tabs>
      <JourneyForm visible={editing} initial={journey} onClose={() => setEditing(false)} onSave={saveJourney} />
      <ShareSheet visible={sharing} text={shareText} journeyName={journey?.name ?? ''} onClose={() => setSharing(false)} />
    </>
  );
}
