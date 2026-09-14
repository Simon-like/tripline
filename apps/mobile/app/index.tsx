import { useCallback, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { Modal, Pressable, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import * as Crypto from 'expo-crypto';
import { checklistProgress, deriveJourneyStatus, SCHEMA_VERSION, toLocalDateString, type Journey } from '@tripline/shared';
import { Icon } from '@tripline/ui';
import { BouncyButton } from '../src/components/BouncyButton';
import { JourneyForm, type JourneyDraft } from '../src/components/JourneyForm';
import { Page } from '../src/components/Page';
import { ProgressRing } from '../src/components/ProgressRing';
import { TripText } from '../src/components/TripText';
import { createJourney, deleteJourney, listChecklistItems, listJourneys, updateJourney } from '../src/data/database';
import { ensureDemoJourney } from '../src/data/demo';
import { settings } from '../src/settings/storage';
import { useTriplineTheme } from '../src/theme';

function MountainScene() {
  const { theme } = useTriplineTheme();
  return (
    <Svg width="100%" height="170" viewBox="0 0 340 170" preserveAspectRatio="xMidYMid slice" style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}>
      <Circle cx="260" cy="38" r="26" fill={theme.celebrate} />
      <Path d="M0 142L62 72L92 103L159 24L240 132L282 82L340 143V170H0Z" fill={theme.primarySoft} opacity={0.58} />
      <Path d="M0 161L76 103L122 145L200 68L292 157L340 118V170H0Z" fill={theme.onPrimary} opacity={0.34} />
      <Path d="M0 170L59 140L115 163L183 121L258 170Z" fill={theme.primarySoft} opacity={0.45} />
    </Svg>
  );
}

function daysUntil(date: string): number {
  const today = toLocalDateString(new Date());
  return Math.round((Date.parse(date + 'T00:00:00') - Date.parse(today + 'T00:00:00')) / 86_400_000);
}

export default function Home() {
  const router = useRouter();
  const { theme } = useTriplineTheme();
  const [journeys, setJourneys] = useState<Journey[]>([]);
  const [progress, setProgress] = useState({ done: 0, total: 0, remaining: 0, percent: 0, complete: false });
  const [formVisible, setFormVisible] = useState(false);
  const [editing, setEditing] = useState<Journey | null>(null);
  const [deleting, setDeleting] = useState<Journey | null>(null);
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    try {
      await ensureDemoJourney();
      const all = await listJourneys();
      setJourneys(all);
      const current = all[0];
      setProgress(current ? checklistProgress(await listChecklistItems(current.id)) : checklistProgress([]));
      setError('');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '旅程加载失败');
    }
  }, []);

  useFocusEffect(useCallback(() => { void refresh(); }, [refresh]));

  const current = journeys[0];
  const status = current ? deriveJourneyStatus(toLocalDateString(new Date()), current.startDate, current.endDate) : 'preparing';
  const statusLabel = status === 'preparing' ? '出发准备中' : status === 'traveling' ? '正在旅途中' : '已完成的旅程';
  const countdown = current ? daysUntil(current.startDate) : 0;

  function openJourney(journey: Journey) {
    settings.setLastOpenedJourneyId(journey.id);
    router.push({ pathname: '/journey/[id]/checklist', params: { id: journey.id } });
  }

  async function saveJourney(draft: JourneyDraft) {
    const now = Date.now();
    if (editing) {
      await updateJourney({ ...editing, ...draft, updatedAt: now });
    } else {
      await createJourney({
        ...draft, id: Crypto.randomUUID(), createdAt: now, updatedAt: now,
        deletedAt: null, schemaVersion: SCHEMA_VERSION,
      });
    }
    setEditing(null);
    await refresh();
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
    <Page>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
          <Icon name="sparkle" size={17} color={theme.accent} />
          <TripText size={19} weight="bold">旅迹</TripText>
        </View>
        <View style={{ backgroundColor: theme.primarySoft, borderRadius: 999, paddingHorizontal: 13, paddingVertical: 7 }}>
          <TripText size={12} weight="semibold" style={{ color: theme.primary }}>离线也安心</TripText>
        </View>
      </View>

      <View style={{ gap: 3 }}>
        <TripText size={36} weight="bold" style={{ lineHeight: 49 }}>把每一程，{'\n'}过成好故事。</TripText>
        <TripText size={14} muted>从收拾行李，到安全回家。</TripText>
      </View>

      {current ? (
        <>
          <BouncyButton onPress={() => openJourney(current)} style={{ backgroundColor: theme.primary, borderRadius: 32, minHeight: 276, padding: 24, overflow: 'hidden', justifyContent: 'space-between', shadowColor: theme.shadow, shadowOpacity: 0.16, shadowRadius: 20, shadowOffset: { width: 0, height: 12 }, elevation: 7 }}>
            <MountainScene />
            <View style={{ zIndex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <View style={{ backgroundColor: theme.onPrimary, borderRadius: 999, paddingHorizontal: 13, paddingVertical: 7 }}>
                <TripText size={12} weight="bold" style={{ color: theme.primary }}>● {statusLabel}</TripText>
              </View>
              <TripText size={23} style={{ color: theme.onPrimary }}>↗</TripText>
            </View>
            <View style={{ zIndex: 1, gap: 3 }}>
              <TripText size={29} weight="bold" style={{ color: theme.onPrimary }}>{current.name}</TripText>
              <TripText size={14} style={{ color: theme.onPrimary }}>{current.startDate.slice(5).replace('-', '月')}日 — {current.endDate.slice(5).replace('-', '月')}日</TripText>
            </View>
            <View style={{ zIndex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <TripText size={12} style={{ color: theme.onPrimary }}>{current.companions.length ? '和 ' + current.companions.join('、') + ' 一起' : '一个人的好旅程'}</TripText>
              <TripText size={12} weight="semibold" style={{ color: theme.onPrimary }}>进入旅程  →</TripText>
            </View>
          </BouncyButton>

          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ flex: 1, minHeight: 169, backgroundColor: theme.celebrate, borderRadius: 27, padding: 18, justifyContent: 'space-between' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <TripText size={13} weight="semibold" style={{ color: theme.text }}>出发倒计时</TripText>
                <Icon name="sun" size={15} color={theme.text} />
              </View>
              <View>
                <TripText size={38} numbers style={{ color: theme.text }}>{status === 'preparing' ? countdown : status === 'traveling' ? 'GO' : '✓'}</TripText>
                <TripText size={12} weight="semibold" style={{ color: theme.text }}>{status === 'preparing' ? '天后，故事开始' : status === 'traveling' ? '正在路上' : '把回忆收好'}</TripText>
              </View>
            </View>
            <BouncyButton onPress={() => openJourney(current)} style={{ flex: 1, minHeight: 169, backgroundColor: theme.surface, borderRadius: 27, padding: 18, justifyContent: 'space-between' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <TripText size={13} weight="semibold">行前清单</TripText>
                <Icon name="luggage" size={15} color={theme.textSecondary} />
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                <View><TripText size={25} numbers>{progress.done}/{progress.total}</TripText><TripText size={11} muted>已准备</TripText></View>
                <ProgressRing percent={progress.percent} size={70} />
              </View>
            </BouncyButton>
          </View>

          <View style={{ backgroundColor: theme.surface, borderRadius: 25, padding: 18, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ gap: 2 }}><TripText size={14} weight="semibold">这趟旅程的预算</TripText><TripText size={12} muted>心里有数，玩得更自在</TripText></View>
            <TripText size={20} numbers style={{ color: theme.primary }}>¥{(current.budget / 100).toLocaleString()}</TripText>
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

      {journeys.length > 1 ? (
        <View style={{ gap: 10 }}>
          <TripText size={19} weight="bold">更多旅程</TripText>
          {journeys.slice(1).map((journey) => (
            <View key={journey.id} style={{ backgroundColor: theme.surface, borderRadius: 22, padding: 17, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Pressable onPress={() => openJourney(journey)} style={{ flex: 1 }}>
                <TripText size={16} weight="bold">{journey.name}</TripText>
                <TripText size={12} muted>{journey.startDate} — {journey.endDate}</TripText>
              </Pressable>
              <Pressable onPress={() => { setEditing(journey); setFormVisible(true); }} accessibilityLabel={'编辑' + journey.name}><TripText size={13} style={{ color: theme.primary }}>编辑</TripText></Pressable>
              <Pressable onPress={() => setDeleting(journey)} accessibilityLabel={'删除' + journey.name}><TripText size={19} muted>×</TripText></Pressable>
            </View>
          ))}
        </View>
      ) : null}

      <BouncyButton onPress={() => { setEditing(null); setFormVisible(true); }} style={{ backgroundColor: theme.accent, borderRadius: 999, paddingVertical: 17, alignItems: 'center' }}>
        <TripText size={16} weight="bold" style={{ color: theme.onAccent }}>＋ 开启新旅程</TripText>
      </BouncyButton>
      {error ? <TripText size={13} style={{ color: theme.accent }}>{error}</TripText> : null}

      <JourneyForm visible={formVisible} initial={editing} onClose={() => { setFormVisible(false); setEditing(null); }} onSave={saveJourney} />
      <Modal visible={!!deleting} transparent animationType="fade" onRequestClose={() => setDeleting(null)}>
        <View style={{ flex: 1, justifyContent: 'center', padding: 28 }}>
          <Pressable onPress={() => setDeleting(null)} style={{ position: 'absolute', inset: 0, backgroundColor: theme.shadow, opacity: 0.45 }} />
          <View style={{ backgroundColor: theme.surface, borderRadius: 28, padding: 24, gap: 14 }}>
            <TripText size={22} weight="bold">删除这趟旅程？</TripText>
            <TripText size={14} muted>「{deleting?.name}」及其中的清单会从旅程列表移除。</TripText>
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
