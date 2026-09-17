import { useCallback, useMemo, useRef, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { Modal, Pressable, ScrollView, View } from 'react-native';
import { interpolateColor, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import * as Crypto from 'expo-crypto';
import { checklistProgress, deriveJourneyStatus, SCHEMA_VERSION, toLocalDateString, type Journey } from '@tripline/shared';
import { darkJourneyPalettes, Icon, lightJourneyPalettes } from '@tripline/ui';
import { BouncyButton } from '../src/components/BouncyButton';
import { BottomSheet } from '../src/components/BottomSheet';
import { ImportSheet } from '../src/components/ImportSheet';
import { JourneyCarousel } from '../src/components/JourneyCarousel';
import { JourneyForm, type JourneyDraft } from '../src/components/JourneyForm';
import { Page } from '../src/components/Page';
import { ProgressRing } from '../src/components/ProgressRing';
import { TripText } from '../src/components/TripText';
import { createJourney, deleteJourney, listChecklistItems, listJourneys, updateJourney } from '../src/data/database';
import { ensureDemoJourney } from '../src/data/demo';
import { canCreateOpenJourney, MAX_OPEN_JOURNEYS, selectFeaturedJourney, selectHomeJourneys } from '../src/data/journeySelection';
import { settings } from '../src/settings/storage';
import { useTriplineTheme } from '../src/theme';

function daysUntil(date: string): number {
  const today = toLocalDateString(new Date());
  return Math.round((Date.parse(date + 'T00:00:00') - Date.parse(today + 'T00:00:00')) / 86_400_000);
}

export default function Home() {
  const router = useRouter();
  const { theme, dark } = useTriplineTheme();
  const [journeys, setJourneys] = useState<Journey[]>([]);
  const [selectedId, setSelectedId] = useState<string>();
  const [progress, setProgress] = useState({ done: 0, total: 0, remaining: 0, percent: 0, complete: false });
  const [formVisible, setFormVisible] = useState(false);
  const [editing, setEditing] = useState<Journey | null>(null);
  const [deleting, setDeleting] = useState<Journey | null>(null);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [limitVisible, setLimitVisible] = useState(false);
  const [importVisible, setImportVisible] = useState(false);
  const [error, setError] = useState('');
  const progressRequest = useRef(0);
  const carouselProgress = useSharedValue(0);

  const loadProgress = useCallback(async (journeyId?: string) => {
    const request = ++progressRequest.current;
    const next = journeyId ? checklistProgress(await listChecklistItems(journeyId)) : checklistProgress([]);
    if (request === progressRequest.current) setProgress(next);
  }, []);

  const refresh = useCallback(async () => {
    try {
      await ensureDemoJourney();
      const all = await listJourneys();
      setJourneys(all);
      const today = toLocalDateString(new Date());
      const current = selectFeaturedJourney(selectHomeJourneys(all, today), today, settings.getLastOpenedJourneyId());
      setSelectedId(current?.id);
      if (current) settings.setLastOpenedJourneyId(current.id);
      await loadProgress(current?.id);
      setError('');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '旅程加载失败');
    }
  }, [loadProgress]);

  useFocusEffect(useCallback(() => { void refresh(); }, [refresh]));

  const today = toLocalDateString(new Date());
  const homeJourneys = selectHomeJourneys(journeys, today);
  const current = homeJourneys.find((journey) => journey.id === selectedId) ?? homeJourneys[0];
  const status = current ? deriveJourneyStatus(today, current.startDate, current.endDate) : 'preparing';
  const countdown = current ? daysUntil(current.startDate) : 0;
  const groups = [
    { title: '正在路上', items: journeys.filter((journey) => journey.startDate <= today && journey.endDate >= today) },
    { title: '即将出发', items: journeys.filter((journey) => journey.startDate > today).sort((a, b) => a.startDate.localeCompare(b.startDate)) },
    { title: '走过的路', items: journeys.filter((journey) => journey.endDate < today) },
  ];
  const palettes = useMemo(() => dark ? darkJourneyPalettes : lightJourneyPalettes, [dark]);
  const pageStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(carouselProgress.value, [0, 1, 2, 3], palettes.map((palette) => palette.backdrop)),
  }), [palettes]);

  function selectJourney(journey: Journey) {
    setSelectedId(journey.id);
    settings.setLastOpenedJourneyId(journey.id);
    void loadProgress(journey.id);
  }

  function openJourney(journey: Journey) {
    selectJourney(journey);
    setPickerVisible(false);
    router.push({ pathname: '/journey/[id]/checklist', params: { id: journey.id } });
  }

  async function saveJourney(draft: JourneyDraft) {
    const now = Date.now();
    if (editing) {
      const opensNewSlot = editing.endDate < today && draft.endDate >= today;
      if (opensNewSlot && !canCreateOpenJourney(journeys, today)) {
        throw new Error('已经有四趟旅程在等你，先收好一程再继续吧');
      }
      await updateJourney({ ...editing, ...draft, updatedAt: now });
    } else {
      if (draft.endDate >= today && !canCreateOpenJourney(journeys, today)) {
        throw new Error('已经有四趟旅程在等你，先收好一程再继续吧');
      }
      const id = Crypto.randomUUID();
      await createJourney({
        ...draft, id, createdAt: now, updatedAt: now,
        deletedAt: null, schemaVersion: SCHEMA_VERSION,
      });
      settings.setLastOpenedJourneyId(id);
    }
    setEditing(null);
    await refresh();
  }

  function startCreatingJourney() {
    if (!canCreateOpenJourney(journeys, today)) {
      setLimitVisible(true);
      return;
    }
    setEditing(null);
    setFormVisible(true);
  }

  async function confirmDelete() {
    if (!deleting) return;
    try {
      await deleteJourney(deleting.id, Date.now());
      setDeleting(null);
      await refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '删除失败');
    }
  }

  return (
    <Page style={pageStyle}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 18 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
          <Icon name="sparkle" size={17} color={theme.accent} />
          <TripText size={19} weight="bold">旅迹</TripText>
        </View>
        <Pressable onPress={() => router.push('/settings')} accessibilityRole="button" accessibilityLabel="打开设置"
          style={{ minHeight: 40, borderRadius: 20, paddingHorizontal: 12, backgroundColor: theme.surface, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 5 }}>
          <Icon name="settings" size={17} color={theme.textSecondary} />
          <TripText size={12} muted>设置</TripText>
        </Pressable>
        <Pressable onPress={() => setImportVisible(true)} accessibilityRole="button" accessibilityLabel="导入旅程"
          style={{ minHeight: 40, borderRadius: 20, paddingHorizontal: 12, backgroundColor: theme.surface, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 5 }}>
          <Icon name="share" size={17} color={theme.textSecondary} />
          <TripText size={12} muted>导入</TripText>
        </Pressable>
      </View>

      <View style={{ gap: 3 }}>
        <TripText size={36} weight="bold" style={{ lineHeight: 49 }}>把每一程，{'\n'}过成好故事。</TripText>
        <TripText size={14} muted>从收拾行李，到安全回家。</TripText>
      </View>

      {current ? (
        <>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8 }}>
              <TripText size={18} weight="bold">我的旅程</TripText>
              <TripText size={12} numbers muted>{homeJourneys.length} / {MAX_OPEN_JOURNEYS}</TripText>
            </View>
            <Pressable onPress={() => setPickerVisible(true)} accessibilityRole="button" accessibilityLabel={`查看全部${journeys.length}趟旅程`}
              style={{ backgroundColor: theme.primarySoft, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8 }}>
              <TripText size={12} weight="bold" style={{ color: theme.primary }}>全部 {journeys.length}  ›</TripText>
            </Pressable>
          </View>
          <JourneyCarousel journeys={homeJourneys} selectedId={current.id} today={today} dark={dark}
            progress={carouselProgress} onSelect={selectJourney} onOpen={openJourney} />

          <View style={{ flexDirection: 'row', gap: 12, maxWidth: '100%' }}>
            <View style={{ flex: 1, flexShrink: 1, minWidth: 0, minHeight: 169, backgroundColor: theme.celebrate, borderRadius: 27, padding: 18, justifyContent: 'space-between', overflow: 'hidden' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <TripText size={13} weight="semibold" style={{ color: theme.text }}>出发倒计时</TripText>
                <Icon name="sun" size={15} color={theme.sun} />
              </View>
              <View>
                <TripText size={38} numbers style={{ color: theme.text }}>{status === 'preparing' ? countdown : status === 'traveling' ? 'GO' : '✓'}</TripText>
                <TripText size={12} weight="semibold" style={{ color: theme.text }}>{status === 'preparing' ? '天后，故事开始' : status === 'traveling' ? '正在路上' : '把回忆收好'}</TripText>
              </View>
            </View>
            <BouncyButton onPress={() => openJourney(current)} style={{ flex: 1, flexShrink: 1, minWidth: 0, minHeight: 169, backgroundColor: theme.surface, borderRadius: 27, padding: 18, justifyContent: 'space-between', overflow: 'hidden' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <TripText size={13} weight="semibold">行前清单</TripText>
                <Icon name="luggage" size={15} color={theme.textSecondary} />
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                <View><TripText size={21} numbers>{progress.done}/{progress.total}</TripText><TripText size={11} muted>已准备</TripText></View>
                <ProgressRing percent={progress.percent} size={70} compact />
              </View>
            </BouncyButton>
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 18 }}>
            <Pressable onPress={() => { setEditing(current); setFormVisible(true); }}><TripText size={13} style={{ color: theme.primary }}>编辑旅程</TripText></Pressable>
            <Pressable onPress={() => setDeleting(current)}><TripText size={13} muted>删除旅程</TripText></Pressable>
          </View>
        </>
      ) : (
        <View style={{ backgroundColor: theme.primary, borderRadius: 32, padding: 26, minHeight: 235, justifyContent: 'space-between' }}>
          <Icon name="mountain" size={72} color={theme.onPrimary} />
          <View><TripText size={25} weight="bold" style={{ color: theme.onPrimary }}>下一程，从这里开始</TripText><TripText size={14} style={{ color: theme.onPrimary }}>装好期待，出发吧。</TripText></View>
        </View>
      )}

      <BouncyButton onPress={startCreatingJourney} style={{ backgroundColor: theme.accent, borderRadius: 999, paddingVertical: 17, alignItems: 'center' }}>
        <TripText size={16} weight="bold" style={{ color: theme.onAccent }}>＋ 开启新旅程</TripText>
      </BouncyButton>
      {homeJourneys.length >= MAX_OPEN_JOURNEYS ? (
        <TripText size={12} muted style={{ textAlign: 'center', marginTop: -8 }}>旅程不是排期，生活不用赶集。</TripText>
      ) : null}
      {error ? <TripText size={13} style={{ color: theme.accent }}>{error}</TripText> : null}

      <JourneyForm visible={formVisible} initial={editing} onClose={() => { setFormVisible(false); setEditing(null); }} onSave={saveJourney} />
      <ImportSheet visible={importVisible} onClose={() => setImportVisible(false)}
        onImported={(journeyId) => { settings.setLastOpenedJourneyId(journeyId); void refresh(); }} />
      <Modal visible={limitVisible} transparent animationType="fade" onRequestClose={() => setLimitVisible(false)}>
        <View style={{ flex: 1, justifyContent: 'center', padding: 28 }}>
          <Pressable onPress={() => setLimitVisible(false)} style={{ position: 'absolute', inset: 0, backgroundColor: theme.shadow, opacity: 0.45 }} />
          <View style={{ backgroundColor: theme.surface, borderRadius: 28, padding: 24, gap: 14 }}>
            <Icon name="sparkle" size={25} color={theme.accent} />
            <TripText size={22} weight="bold">旅程不是排期</TripText>
            <TripText size={14} muted>生活不用赶集。首页最多留四趟正在路上或即将出发的旅程；走过的路会一直替你收好。</TripText>
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 20, alignItems: 'center' }}>
              <Pressable onPress={() => setLimitVisible(false)}><TripText size={14} muted>知道了</TripText></Pressable>
              <Pressable onPress={() => { setLimitVisible(false); setPickerVisible(true); }}
                style={{ backgroundColor: theme.primary, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 999 }}>
                <TripText size={14} weight="bold" style={{ color: theme.onPrimary }}>看看已有旅程</TripText>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
      <BottomSheet visible={pickerVisible} onClose={() => setPickerVisible(false)} backgroundColor={theme.bg} maxHeight="76%">
            <ScrollView contentContainerStyle={{ padding: 22, gap: 18 }} showsVerticalScrollIndicator={false}>
              <View style={{ gap: 2 }}>
                <TripText size={25} weight="bold">全部旅程</TripText>
                <TripText size={13} muted>选一趟，继续往前走。</TripText>
              </View>
              {groups.filter((group) => group.items.length > 0).map((group) => (
                <View key={group.title} style={{ gap: 9 }}>
                  <TripText size={14} weight="bold" style={{ color: theme.textSecondary }}>{group.title} · {group.items.length}</TripText>
                  {group.items.map((journey) => (
                    <Pressable key={journey.id} onPress={() => openJourney(journey)} accessibilityRole="button"
                      accessibilityLabel={`进入旅程${journey.name}`}
                      style={{ backgroundColor: journey.id === current?.id ? theme.primarySoft : theme.surface,
                        borderRadius: 21, padding: 17, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                      <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
                        <TripText size={16} weight="bold">{journey.name}</TripText>
                        <TripText size={12} muted>{journey.startDate} — {journey.endDate}</TripText>
                      </View>
                      <TripText size={18} style={{ color: theme.primary }}>›</TripText>
                    </Pressable>
                  ))}
                </View>
              ))}
            </ScrollView>
      </BottomSheet>
      <Modal visible={!!deleting} transparent animationType="fade" onRequestClose={() => setDeleting(null)}>
        <View style={{ flex: 1, justifyContent: 'center', padding: 28 }}>
          <Pressable onPress={() => setDeleting(null)} style={{ position: 'absolute', inset: 0, backgroundColor: theme.shadow, opacity: 0.45 }} />
          <View style={{ backgroundColor: theme.surface, borderRadius: 28, padding: 24, gap: 14 }}>
            <TripText size={22} weight="bold">删除这趟旅程？</TripText>
            <TripText size={14} muted>「{deleting?.name}」及其中的所有记录会从旅程列表移除。</TripText>
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 22 }}>
              <Pressable onPress={() => setDeleting(null)}><TripText size={15}>取消</TripText></Pressable>
              <Pressable onPress={() => { void confirmDelete(); }}><TripText size={15} weight="bold" style={{ color: theme.accent }}>确认删除</TripText></Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </Page>
  );
}
