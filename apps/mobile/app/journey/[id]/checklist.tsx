import { useCallback, useEffect, useState } from 'react';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, TextInput, View } from 'react-native';
import * as Crypto from 'expo-crypto';
import * as Haptics from 'expo-haptics';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withSpring } from 'react-native-reanimated';
import { Icon, motion, type IconName } from '@tripline/ui';
import { ChecklistItemSchema, checklistProgress, SCHEMA_VERSION, type ChecklistItem, type Journey } from '@tripline/shared';
import { BouncyButton } from '../../../src/components/BouncyButton';
import { Page } from '../../../src/components/Page';
import { ProgressRing } from '../../../src/components/ProgressRing';
import { TripText } from '../../../src/components/TripText';
import { addChecklistItem, deleteChecklistItem, getJourney, listChecklistItems, setChecklistChecked } from '../../../src/data/database';
import { chineseFont, useTriplineTheme } from '../../../src/theme';

const categories = ['证件', '交通', '住宿', '电子', '药品', '衣物', '财务', '其他'] as const;
const icons: Record<string, IconName> = { 证件: 'id-card', 交通: 'train', 住宿: 'home', 电子: 'plug', 药品: 'pill', 衣物: 'shirt', 财务: 'bankcard', 其他: 'sparkle' };

function ConfettiPiece({ index }: { index: number }) {
  const { theme } = useTriplineTheme();
  const reduceMotion = useReducedMotion();
  const travel = useSharedValue(0);
  const x = [-68, -44, -21, 25, 51, 75][index];
  const y = [-28, -53, -18, -44, -20, -55][index];
  useEffect(() => {
    travel.value = reduceMotion ? 1 : withSpring(1, { duration: motion.celebrate, dampingRatio: motion.dampingRatio });
  }, [reduceMotion, travel]);
  const style = useAnimatedStyle(() => ({
    opacity: reduceMotion ? 1 : travel.value,
    transform: [{ translateX: x * travel.value }, { translateY: y * travel.value }, { rotate: index % 2 ? '-28deg' : '28deg' }],
  }));
  return <Animated.View style={[{ position: 'absolute', right: 40, bottom: 12, width: 9, height: 17, borderRadius: 3, backgroundColor: index % 2 ? theme.primary : theme.accent }, style]} />;
}

export default function Checklist() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { theme } = useTriplineTheme();
  const [journey, setJourney] = useState<Journey | null>(null);
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<string>('其他');
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    if (!id) return;
    try {
      const [loadedJourney, loadedItems] = await Promise.all([getJourney(id), listChecklistItems(id)]);
      setJourney(loadedJourney);
      setItems(loadedItems);
      setError('');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '清单加载失败');
    }
  }, [id]);
  useFocusEffect(useCallback(() => { void refresh(); }, [refresh]));

  const progress = checklistProgress(items);
  const grouped = categories.map((name) => ({ name, items: items.filter((item) => item.category === name) })).filter((group) => group.items.length);
  const otherItems = items.filter((item) => !categories.includes(item.category as typeof categories[number]));
  if (otherItems.length) grouped.push({ name: '其他', items: otherItems });

  async function toggle(item: ChecklistItem) {
    const next = !item.checked;
    setItems((current) => current.map((entry) => entry.id === item.id ? { ...entry, checked: next } : entry));
    try {
      await setChecklistChecked(item.id, next, Date.now());
      if (Platform.OS !== 'web' && next) void Haptics.selectionAsync();
      await refresh();
    } catch (cause) {
      setItems((current) => current.map((entry) => entry.id === item.id ? item : entry));
      setError(cause instanceof Error ? cause.message : '更新失败');
    }
  }

  async function add() {
    if (!id) return;
    const now = Date.now();
    const parsed = ChecklistItemSchema.safeParse({
      id: Crypto.randomUUID(), journeyId: id, phase: 'preparation',
      category, title: title.trim(), checked: false,
      sortOrder: Math.max(0, ...items.map((item) => item.sortOrder + 1)),
      createdAt: now, updatedAt: now, deletedAt: null, schemaVersion: SCHEMA_VERSION,
    });
    if (!parsed.success) { setError('请先写下要准备的物品'); return; }
    try {
      await addChecklistItem(parsed.data);
      setTitle('');
      setCategory('其他');
      setAdding(false);
      await refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '添加失败');
    }
  }

  async function remove(item: ChecklistItem) {
    try {
      await deleteChecklistItem(item.id, Date.now());
      await refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '删除失败');
    }
  }

  return (
    <Page tabbed>
      <View style={{ gap: 4 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9 }}>
          <TripText size={29} weight="bold">出发前，轻松打包</TripText>
          <Icon name="luggage" size={26} color={theme.primary} />
        </View>
        <TripText size={14} muted>{journey ? journey.name + ' · ' : ''}一件件来，准备好就出发。</TripText>
      </View>

      <View style={{ backgroundColor: theme.primary, borderRadius: 30, minHeight: 188, padding: 22, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', overflow: 'hidden' }}>
        <View style={{ gap: 6, flex: 1 }}>
          <View style={{ backgroundColor: theme.onPrimary, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6, alignSelf: 'flex-start' }}>
            <TripText size={11} weight="bold" style={{ color: theme.primary }}>准备进度</TripText>
          </View>
          <TripText size={32} numbers style={{ color: theme.onPrimary }}>{progress.done}<TripText size={18} style={{ color: theme.onPrimary }}> / {progress.total}</TripText></TripText>
          <TripText size={13} style={{ color: theme.onPrimary }}>{progress.complete ? '全部准备好了，出发吧！' : '还差 ' + progress.remaining + ' 件小事'}</TripText>
        </View>
        <View style={{ backgroundColor: theme.surface, borderRadius: 999, padding: 8 }}><ProgressRing percent={progress.percent} size={104} /></View>
      </View>

      {progress.complete ? (
        <View style={{ backgroundColor: theme.celebrate, borderRadius: 23, padding: 18, overflow: 'hidden' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Icon name="party" size={21} color={theme.text} />
            <TripText size={19} weight="bold">清单完成！</TripText>
          </View>
          <TripText size={13}>行李和期待都打包好了，祝你一路精彩。</TripText>
          {Array.from({ length: 6 }, (_, index) => <ConfettiPiece key={index} index={index} />)}
        </View>
      ) : null}

      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <TripText size={21} weight="bold">我的准备清单</TripText>
        <TripText size={12} muted>点一下，勾掉一件</TripText>
      </View>

      {grouped.map((group) => (
        <View key={group.name} style={{ gap: 9 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 }}>
            <Icon name={icons[group.name] ?? 'sparkle'} size={19} color={theme.primary} />
            <TripText size={16} weight="bold">{group.name}</TripText>
            <TripText size={12} muted>{group.items.filter((item) => item.checked).length}/{group.items.length}</TripText>
          </View>
          {group.items.map((item) => (
            <View key={item.id} style={{ backgroundColor: theme.surface, borderRadius: 21, minHeight: 60, flexDirection: 'row', alignItems: 'center', paddingLeft: 16, paddingRight: 9 }}>
              <Pressable onPress={() => { void toggle(item); }} accessibilityRole="checkbox" accessibilityState={{ checked: item.checked }} accessibilityLabel={item.title} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 13, paddingVertical: 12 }}>
                <View style={{ width: 27, height: 27, borderRadius: 10, borderWidth: 2, borderColor: item.checked ? theme.primary : theme.border, backgroundColor: item.checked ? theme.primary : theme.surface, alignItems: 'center', justifyContent: 'center' }}>
                  {item.checked ? <TripText size={16} weight="bold" style={{ color: theme.onPrimary, lineHeight: 19 }}>✓</TripText> : null}
                </View>
                <TripText size={15} weight="semibold" style={{ color: item.checked ? theme.textSecondary : theme.text, textDecorationLine: item.checked ? 'line-through' : 'none', flex: 1 }}>{item.title}</TripText>
              </Pressable>
              <Pressable onPress={() => { void remove(item); }} accessibilityLabel={'删除' + item.title} style={{ padding: 10 }}><TripText size={20} muted>×</TripText></Pressable>
            </View>
          ))}
        </View>
      ))}

      <BouncyButton onPress={() => setAdding(true)} style={{ backgroundColor: theme.accent, borderRadius: 999, paddingVertical: 16, alignItems: 'center' }}>
        <TripText size={15} weight="bold" style={{ color: theme.onAccent }}>＋ 添加要准备的事</TripText>
      </BouncyButton>
      {error ? <TripText size={13} style={{ color: theme.accent }}>{error}</TripText> : null}

      <Modal visible={adding} transparent animationType="slide" onRequestClose={() => setAdding(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, justifyContent: 'flex-end' }}>
          <Pressable onPress={() => setAdding(false)} style={{ position: 'absolute', inset: 0, backgroundColor: theme.shadow, opacity: 0.45 }} />
          <View style={{ backgroundColor: theme.surface, borderTopLeftRadius: 32, borderTopRightRadius: 32, maxHeight: '80%', paddingTop: 15 }}>
            <View style={{ width: 48, height: 5, borderRadius: 9, backgroundColor: theme.border, alignSelf: 'center' }} />
            <ScrollView contentContainerStyle={{ padding: 24, gap: 16 }} keyboardShouldPersistTaps="handled">
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9 }}>
                <TripText size={24} weight="bold">再加一件小事</TripText>
                <Icon name="sparkle" size={21} color={theme.accent} />
              </View>
              <TextInput value={title} onChangeText={setTitle} autoFocus placeholder="比如：带上拍立得" placeholderTextColor={theme.textSecondary} style={{ backgroundColor: theme.bg, borderColor: theme.border, borderWidth: 1, borderRadius: 17, paddingHorizontal: 16, paddingVertical: 13, fontFamily: chineseFont, color: theme.text, fontSize: 16 }} />
              <TripText size={13} weight="semibold">放在哪一类？</TripText>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {categories.map((name) => (
                  <Pressable key={name} onPress={() => setCategory(name)} style={{ paddingHorizontal: 15, paddingVertical: 9, borderRadius: 999, backgroundColor: category === name ? theme.primary : theme.surfaceAlt }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Icon name={icons[name]} size={14} color={category === name ? theme.onPrimary : theme.textSecondary} />
                      <TripText size={13} weight="semibold" style={{ color: category === name ? theme.onPrimary : theme.text }}>{name}</TripText>
                    </View>
                  </Pressable>
                ))}
              </View>
              <BouncyButton onPress={() => { void add(); }} style={{ backgroundColor: theme.accent, borderRadius: 999, paddingVertical: 15, alignItems: 'center' }}>
                <TripText size={16} weight="bold" style={{ color: theme.onAccent }}>加入清单</TripText>
              </BouncyButton>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </Page>
  );
}
