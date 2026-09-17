import { useCallback, useEffect, useRef, useState } from 'react';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Modal, Platform, Pressable, ScrollView, TextInput, View } from 'react-native';
import * as Crypto from 'expo-crypto';
import * as Haptics from 'expo-haptics';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withSpring } from 'react-native-reanimated';
import { Icon, motion } from '@tripline/ui';
import {
  ITINERARY_STATE_LABELS, ItineraryItemSchema, SCHEMA_VERSION, journeyDays, nextItineraryState,
  type ItineraryItem, type Journey,
} from '@tripline/shared';
import { BouncyButton } from '../../../src/components/BouncyButton';
import { BottomSheet } from '../../../src/components/BottomSheet';
import { CascadeIn } from '../../../src/components/CascadeIn';
import { ConfettiCelebration } from '../../../src/components/ConfettiCelebration';
import { Page } from '../../../src/components/Page';
import { TripText } from '../../../src/components/TripText';
import { TimePickerSheet } from '../../../src/components/TimePickerSheet';
import { addItineraryItem, deleteItineraryItem, getJourney, listItineraryItems, setItineraryState } from '../../../src/data/database';
import { ensureDemoItinerary } from '../../../src/data/demo';
import { chineseFont, useTriplineTheme } from '../../../src/theme';

const nodeColors = ['primary', 'accent', 'celebrate', 'success'] as const;
const feedbackDuration = 600;

function StateBadge({ item, onPress }: { item: ItineraryItem; onPress: () => void }) {
  const { theme } = useTriplineTheme();
  const reduceMotion = useReducedMotion();
  const scale = useSharedValue(1);
  useEffect(() => {
    if (reduceMotion) return;
    scale.value = 0.82;
    scale.value = withSpring(1, { duration: motion.standard, dampingRatio: motion.dampingRatio });
  }, [item.state, reduceMotion, scale]);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const palette = item.state === 'visited'
    ? { bg: theme.success, fg: theme.onPrimary }
    : item.state === 'cancelled'
      ? { bg: theme.surfaceAlt, fg: theme.textSecondary }
      : { bg: theme.primarySoft, fg: theme.primary };
  return (
    <Animated.View style={style}>
      <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={'打卡：' + ITINERARY_STATE_LABELS[item.state]} hitSlop={6}
        style={{ backgroundColor: palette.bg, borderRadius: 999, paddingHorizontal: 13, paddingVertical: 7 }}>
        <TripText size={12} weight="bold" style={{ color: palette.fg }}>{ITINERARY_STATE_LABELS[item.state]}</TripText>
      </Pressable>
    </Animated.View>
  );
}

function ConfettiBurst() {
  return <ConfettiCelebration top={10} right={16} />;
}
export default function Itinerary() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { theme } = useTriplineTheme();
  const [journey, setJourney] = useState<Journey | null>(null);
  const [items, setItems] = useState<ItineraryItem[]>([]);
  const [dayIndex, setDayIndex] = useState(0);
  const [adding, setAdding] = useState(false);
  const [time, setTime] = useState('');
  const [timePickerVisible, setTimePickerVisible] = useState(false);
  const [content, setContent] = useState('');
  const [note, setNote] = useState('');
  const [removing, setRemoving] = useState<ItineraryItem | null>(null);
  const [celebratingId, setCelebratingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const pendingStates = useRef(new Set<string>());
  const addingItem = useRef(false);

  const refresh = useCallback(async () => {
    if (!id) return;
    try {
      await ensureDemoItinerary();
      const [loadedJourney, loadedItems] = await Promise.all([getJourney(id), listItineraryItems(id)]);
      setJourney(loadedJourney);
      setItems(loadedItems);
      setError('');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '行程加载失败');
    }
  }, [id]);
  useFocusEffect(useCallback(() => { void refresh(); }, [refresh]));

  const days = journey ? journeyDays(journey.startDate, journey.endDate) : [];
  const selectedDate = days[Math.min(dayIndex, Math.max(days.length - 1, 0))];
  const dayItems = items.filter((item) => item.date === selectedDate);

  async function cycle(item: ItineraryItem) {
    if (pendingStates.current.has(item.id)) return;
    pendingStates.current.add(item.id);
    const next = nextItineraryState(item.state);
    setItems((current) => current.map((entry) => entry.id === item.id ? { ...entry, state: next } : entry));
    try {
      await setItineraryState(item.id, next, Date.now());
      if (Platform.OS !== 'web') void Haptics.selectionAsync();
      if (next === 'visited') {
        setCelebratingId(item.id);
        setTimeout(() => setCelebratingId((current) => current === item.id ? null : current), feedbackDuration);
      }
      await refresh();
    } catch (cause) {
      setItems((current) => current.map((entry) => entry.id === item.id ? item : entry));
      setError(cause instanceof Error ? cause.message : '打卡失败');
    } finally {
      pendingStates.current.delete(item.id);
    }
  }

  async function add() {
    if (!id || !selectedDate || addingItem.current) return;
    const now = Date.now();
    const parsed = ItineraryItemSchema.safeParse({
      id: Crypto.randomUUID(), journeyId: id, date: selectedDate,
      time: time.trim(), content: content.trim(), note: note.trim(), state: 'planned',
      createdAt: now, updatedAt: now, deletedAt: null, schemaVersion: SCHEMA_VERSION,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? '请检查时间与内容');
      return;
    }
    addingItem.current = true;
    try {
      await addItineraryItem(parsed.data);
      setTime('');
      setContent('');
      setNote('');
      setAdding(false);
      await refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '添加失败');
    } finally {
      addingItem.current = false;
    }
  }

  async function confirmRemove() {
    if (!removing) return;
    try {
      await deleteItineraryItem(removing.id, Date.now());
      setRemoving(null);
      await refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '删除失败');
    }
  }

  return (
    <Page tabbed>
      <View style={{ gap: 4 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9 }}>
          <TripText size={29} weight="bold">每天去哪，一眼就知道</TripText>
          <Icon name="map" size={26} color={theme.primary} />
        </View>
        <TripText size={14} muted>{journey ? journey.name + ' · ' : ''}去过了就点一下，留下印记。</TripText>
      </View>

      {days.length ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 2 }}>
          {days.map((date, index) => {
            const active = date === selectedDate;
            return (
              <Pressable key={date} onPress={() => setDayIndex(index)} accessibilityRole="button" accessibilityLabel={'Day ' + (index + 1)}
                style={{ borderRadius: 999, paddingHorizontal: 17, paddingVertical: 10, backgroundColor: active ? theme.primary : theme.surface, borderWidth: 1, borderColor: active ? theme.primary : theme.border }}>
                <TripText size={13} weight="bold" style={{ color: active ? theme.onPrimary : theme.text }}>
                  Day {index + 1} · {date.slice(5).replace('-', '/')}
                </TripText>
              </Pressable>
            );
          })}
        </ScrollView>
      ) : null}

      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <TripText size={21} weight="bold">Day {dayIndex + 1} 的时间轴</TripText>
        <TripText size={12} muted>{dayItems.length ? dayItems.filter((item) => item.state === 'visited').length + '/' + dayItems.length + ' 已去' : '还没有安排'}</TripText>
      </View>

      {dayItems.length === 0 ? (
        <View style={{ backgroundColor: theme.surface, borderRadius: 24, padding: 26, gap: 8, alignItems: 'flex-start' }}>
          <Icon name="sun" size={30} color={theme.celebrate} />
          <TripText size={17} weight="bold">这一天还空着</TripText>
          <TripText size={13} muted>添加上第一笔安排，让好日子有迹可循。</TripText>
        </View>
      ) : (
        <View>
          {dayItems.map((item, index) => {
            const nodeColor = theme[nodeColors[index % nodeColors.length]];
            return (
              <CascadeIn key={item.id} index={index} total={dayItems.length}>
                <View style={{ flexDirection: 'row', gap: 14 }}>
                  <View style={{ alignItems: 'center', width: 26 }}>
                    <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: nodeColor, marginTop: 14, shadowColor: theme.shadow, shadowOpacity: 0.18, shadowRadius: 6, shadowOffset: { width: 0, height: 3 } }} />
                    {index < dayItems.length - 1 ? <View style={{ flex: 1, width: 3, borderRadius: 2, backgroundColor: theme.border, marginTop: 6 }} /> : null}
                  </View>
                  <View style={{ flex: 1, minWidth: 0, marginBottom: 12, backgroundColor: theme.surface, borderRadius: 24, padding: 16, gap: 6, overflow: 'hidden' }}>
                    {celebratingId === item.id ? <ConfettiBurst /> : null}
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                      <TripText size={20} numbers style={{ color: nodeColor }}>{item.time}</TripText>
                      <StateBadge item={item} onPress={() => { void cycle(item); }} />
                    </View>
                    <TripText size={16} weight="bold" style={item.state === 'cancelled' ? { textDecorationLine: 'line-through', color: theme.textSecondary } : undefined}>{item.content}</TripText>
                    {item.note ? <TripText size={13} muted>{item.note}</TripText> : null}
                    <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
                      <Pressable onPress={() => setRemoving(item)} accessibilityLabel={'删除' + item.content} hitSlop={8} style={{ padding: 4 }}>
                        <TripText size={13} muted>删除</TripText>
                      </Pressable>
                    </View>
                  </View>
                </View>
              </CascadeIn>
            );
          })}
        </View>
      )}

      <BouncyButton onPress={() => { setError(''); setAdding(true); }} style={{ backgroundColor: theme.accent, borderRadius: 999, paddingVertical: 16, alignItems: 'center' }}>
        <TripText size={15} weight="bold" style={{ color: theme.onAccent }}>＋ 给 Day {dayIndex + 1} 加一笔安排</TripText>
      </BouncyButton>
      {error ? <TripText size={13} style={{ color: theme.accent }}>{error}</TripText> : null}

      <BottomSheet visible={adding} onClose={() => setAdding(false)} maxHeight="80%">
            <ScrollView contentContainerStyle={{ padding: 24, gap: 14 }} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" automaticallyAdjustKeyboardInsets>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9 }}>
                <TripText size={24} weight="bold">安排 Day {dayIndex + 1}</TripText>
                <Icon name="sparkle" size={21} color={theme.accent} />
              </View>
              <TripText size={13} muted>{selectedDate}，想去哪？</TripText>
              <View style={{ gap: 7 }}>
                <TripText size={13} weight="semibold">时间</TripText>
                <Pressable onPress={() => setTimePickerVisible(true)} accessibilityRole="button" accessibilityLabel={`选择时间，当前${time || '未选择'}`}
                  style={{ backgroundColor: theme.bg, borderColor: theme.border, borderWidth: 1, borderRadius: 17, paddingHorizontal: 16, paddingVertical: 13, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <TripText size={16} numbers style={{ color: time ? theme.text : theme.textSecondary }}>{time || '选择时间'}</TripText>
                  <View style={{ transform: [{ rotate: '-90deg' }] }}><Icon name="chevron-left" size={17} color={theme.textSecondary} /></View>
                </Pressable>
              </View>
              <View style={{ gap: 7 }}>
                <TripText size={13} weight="semibold">去做什么</TripText>
                <TextInput value={content} onChangeText={setContent} placeholder="比如：独克宗古城" placeholderTextColor={theme.textSecondary}
                  style={{ backgroundColor: theme.bg, borderColor: theme.border, borderWidth: 1, borderRadius: 17, paddingHorizontal: 16, paddingVertical: 13, fontFamily: chineseFont, color: theme.text, fontSize: 16 }} />
              </View>
              <View style={{ gap: 7 }}>
                <TripText size={13} weight="semibold">备注（可空）</TripText>
                <TextInput value={note} onChangeText={setNote} placeholder="比如：先适应海拔，慢慢逛" placeholderTextColor={theme.textSecondary}
                  style={{ backgroundColor: theme.bg, borderColor: theme.border, borderWidth: 1, borderRadius: 17, paddingHorizontal: 16, paddingVertical: 13, fontFamily: chineseFont, color: theme.text, fontSize: 16 }} />
              </View>
              {error ? <TripText size={13} style={{ color: theme.accent }}>{error}</TripText> : null}
              <BouncyButton onPress={() => { void add(); }} style={{ backgroundColor: theme.accent, borderRadius: 999, paddingVertical: 15, alignItems: 'center' }}>
                <TripText size={16} weight="bold" style={{ color: theme.onAccent }}>加入时间轴</TripText>
              </BouncyButton>
            </ScrollView>
            <TimePickerSheet visible={timePickerVisible} value={time} onClose={() => setTimePickerVisible(false)}
              onConfirm={(next) => { setTime(next); setTimePickerVisible(false); }} />
      </BottomSheet>

      <Modal visible={!!removing} transparent animationType="fade" onRequestClose={() => setRemoving(null)}>
        <View style={{ flex: 1, justifyContent: 'center', padding: 28 }}>
          <Pressable onPress={() => setRemoving(null)} style={{ position: 'absolute', inset: 0, backgroundColor: theme.shadow, opacity: 0.45 }} />
          <View style={{ backgroundColor: theme.surface, borderRadius: 28, padding: 24, gap: 14 }}>
            <TripText size={22} weight="bold">删除这条安排？</TripText>
            <TripText size={14} muted>「{removing?.time} {removing?.content}」会从时间轴移除。</TripText>
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 22 }}>
              <Pressable onPress={() => setRemoving(null)}><TripText size={15}>取消</TripText></Pressable>
              <Pressable onPress={() => { void confirmRemove(); }}><TripText size={15} weight="bold" style={{ color: theme.accent }}>确认删除</TripText></Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </Page>
  );
}
