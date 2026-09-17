import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import { toLocalDateString } from '@tripline/shared';
import { getJourney, listExpenses, listItineraryItems, listJournalEntries } from '../data/database';
import { summarizeJourney } from '../data/journeySummary';
import { useTriplineTheme } from '../theme';
import { TripText } from './TripText';
import { BouncyButton } from './BouncyButton';
import { BottomSheet } from './BottomSheet';

type Props = { journeyId: string; visible: boolean; onClose: () => void };
export function JourneySummarySheet({ journeyId, visible, onClose }: Props) {
  const { theme } = useTriplineTheme();
  const insets = useSafeAreaInsets();
  const [summary, setSummary] = useState<ReturnType<typeof summarizeJourney> | null>(null);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    let cancelled = false;
    if (timer.current) clearTimeout(timer.current);
    setCopied(false); setError(''); setSummary(null);
    if (visible) void (async () => {
      try {
        const [journey, itinerary, expenses, entries] = await Promise.all([getJourney(journeyId), listItineraryItems(journeyId), listExpenses(journeyId), listJournalEntries(journeyId)]);
        if (cancelled) return;
        if (!journey) { setError('这趟旅程不存在或已删除'); return; }
        setSummary(summarizeJourney(journey, itinerary, expenses, entries, toLocalDateString(new Date())));
      } catch { if (!cancelled) setError('暂时没能读取旅程，点一下再试'); }
    })();
    return () => { cancelled = true; if (timer.current) clearTimeout(timer.current); };
  }, [journeyId, visible, retry]);
  async function copy() {
    if (!summary) return;
    try {
      const success = await Clipboard.setStringAsync(summary.text);
      if (!success) throw new Error('clipboard');
      setError(''); setCopied(true);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 600);
    } catch { setError('复制失败，请再点一次复制'); }
  }
  return (
    <BottomSheet visible={visible} onClose={onClose} backgroundColor={theme.bg} accessibilityLabel="关闭旅行总结">
          <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: Math.max(insets.bottom, 20) + 12, gap: 18 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <TripText size={24} weight="bold">把这一程，收进回忆</TripText>
              <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="关闭总结" style={{ padding: 8 }}><TripText size={22} muted>×</TripText></Pressable>
            </View>
            {summary ? <>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
                {[[`${summary.completed}/${summary.total}`, '已去行程'], [`${summary.entries}`, '见闻'], [`${summary.photos}`, '照片记录']].map(([value, label]) => (
                  <View key={label} style={{ flex: 1, minWidth: 85, backgroundColor: theme.primarySoft, borderRadius: 22, padding: 16, gap: 5 }}>
                    <TripText size={24} numbers weight="bold" style={{ color: theme.primary }}>{value}</TripText><TripText size={12} muted>{label}</TripText>
                  </View>
                ))}
              </View>
              <TripText size={14} weight="semibold">{summary.budgetLine}</TripText>
              <View style={{ backgroundColor: theme.surface, borderRadius: 24, padding: 18 }}><TripText size={14} selectable style={{ lineHeight: 24 }}>{summary.text}</TripText></View>
              {summary.total + summary.entries === 0 ? <TripText size={13} muted>还没留下记录也没关系，回忆可以慢慢补。</TripText> : null}
            </> : !error ? <TripText muted>正在整理这一程…</TripText> : null}
            {error ? <><TripText style={{ color: theme.accent }}>{error}</TripText>{!summary ? <Pressable onPress={() => setRetry((n) => n + 1)} accessibilityRole="button"><TripText>重新读取</TripText></Pressable> : null}</> : null}
            <BouncyButton disabled={!summary} onPress={() => { void copy(); }} accessibilityLabel="复制旅行总结" style={{ backgroundColor: theme.accent, opacity: summary ? 1 : 0.5, borderRadius: 999, padding: 16, alignItems: 'center' }}>
              <TripText weight="bold" style={{ color: theme.onAccent }}>{copied ? '已复制，留住这一程' : '复制文字总结'}</TripText>
            </BouncyButton>
          </ScrollView>
    </BottomSheet>
  );
}
