import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, TextInput, View } from 'react-native';
import * as Crypto from 'expo-crypto';
import * as Haptics from 'expo-haptics';
import { Icon, type IconName } from '@tripline/ui';
import { ChecklistItemSchema, SCHEMA_VERSION, checklistProgress, type ChecklistItem, type Journey } from '@tripline/shared';
import { BouncyButton } from './BouncyButton';
import { CascadeIn } from './CascadeIn';
import { ConfettiCelebration } from './ConfettiCelebration';
import { ProgressRing } from './ProgressRing';
import { TripText } from './TripText';
import { addChecklistItem, deleteChecklistItem, getJourney, listChecklistItems, setChecklistChecked } from '../data/database';
import { chineseFont, useTriplineTheme } from '../theme';

export type ChecklistCategory = { name: string; icon: IconName };

export type ChecklistPanelCopy = {
  heading: string;
  headingIcon: IconName;
  subheading: string;
  heroBadge: string;
  completeTitle: string;
  completeBody: string;
  listTitle: string;
  listHint: string;
  addCta: string;
  addTitle: string;
  addPlaceholder: string;
  emptyTitle: string;
  emptyBody: string;
  emptyIcon: IconName;
};

/** M02/M06 共用：进度英雄卡 + 分组勾选列表 + 添加弹层 + 删除二次确认（P2 已批准对齐） */
export function ChecklistPanel({ journeyId, phase, categories, copy, beforeLoad }: {
  journeyId: string;
  phase: ChecklistItem['phase'];
  categories: readonly ChecklistCategory[];
  copy: ChecklistPanelCopy;
  /** 加载前钩子（如演示数据补种） */
  beforeLoad?: () => Promise<void>;
}) {
  const { theme } = useTriplineTheme();
  const [journey, setJourney] = useState<Journey | null>(null);
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<string>(categories[0]?.name ?? '其他');
  const [removing, setRemoving] = useState<ChecklistItem | null>(null);
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    if (!journeyId) return;
    try {
      await beforeLoad?.();
      const [loadedJourney, loadedItems] = await Promise.all([getJourney(journeyId), listChecklistItems(journeyId, phase)]);
      setJourney(loadedJourney);
      setItems(loadedItems);
      setError('');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '清单加载失败');
    }
  }, [journeyId, phase, beforeLoad]);
  useFocusEffect(useCallback(() => { void refresh(); }, [refresh]));

  const progress = checklistProgress(items);
  const iconOf = (name: string): IconName => categories.find((entry) => entry.name === name)?.icon ?? 'sparkle';
  const grouped = categories
    .map((entry) => ({ name: entry.name, items: items.filter((item) => item.category === entry.name) }))
    .filter((group) => group.items.length > 0);
  const knownNames = categories.map((entry) => entry.name);
  const otherItems = items.filter((item) => !knownNames.includes(item.category));
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
    if (!journeyId) return;
    const now = Date.now();
    const parsed = ChecklistItemSchema.safeParse({
      id: Crypto.randomUUID(), journeyId, phase,
      category, title: title.trim(), checked: false,
      sortOrder: Math.max(0, ...items.map((item) => item.sortOrder + 1)),
      createdAt: now, updatedAt: now, deletedAt: null, schemaVersion: SCHEMA_VERSION,
    });
    if (!parsed.success) { setError('请先写下要核对的事项'); return; }
    try {
      await addChecklistItem(parsed.data);
      setTitle('');
      setCategory(categories[0]?.name ?? '其他');
      setAdding(false);
      await refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '添加失败');
    }
  }

  async function confirmRemove() {
    if (!removing) return;
    try {
      await deleteChecklistItem(removing.id, Date.now());
      setRemoving(null);
      await refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '删除失败');
    }
  }

  let cascadeIndex = 0;

  return (
    <>
      <View style={{ gap: 4 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9 }}>
          <TripText size={29} weight="bold">{copy.heading}</TripText>
          <Icon name={copy.headingIcon} size={26} color={theme.primary} />
        </View>
        <TripText size={14} muted>{journey ? journey.name + ' · ' : ''}{copy.subheading}</TripText>
      </View>

      <View style={{ backgroundColor: theme.primary, borderRadius: 30, minHeight: 188, padding: 22, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', overflow: 'hidden' }}>
        <View style={{ gap: 6, flex: 1 }}>
          <View style={{ backgroundColor: theme.onPrimary, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6, alignSelf: 'flex-start' }}>
            <TripText size={11} weight="bold" style={{ color: theme.primary }}>{copy.heroBadge}</TripText>
          </View>
          <TripText size={32} numbers style={{ color: theme.onPrimary }}>{progress.done}<TripText size={18} style={{ color: theme.onPrimary }}> / {progress.total}</TripText></TripText>
          <TripText size={13} style={{ color: theme.onPrimary }}>{progress.complete ? copy.completeTitle : '还差 ' + progress.remaining + ' 件小事'}</TripText>
        </View>
        <View style={{ backgroundColor: theme.surface, borderRadius: 999, padding: 8 }}><ProgressRing percent={progress.percent} size={104} /></View>
      </View>

      {progress.complete ? (
        <View style={{ backgroundColor: theme.celebrate, borderRadius: 23, padding: 18, overflow: 'hidden' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Icon name="party" size={21} color={theme.text} />
            <TripText size={19} weight="bold">{copy.completeTitle}</TripText>
          </View>
          <TripText size={13}>{copy.completeBody}</TripText>
          <ConfettiCelebration bottom={12} right={40} pieceWidth={9} pieceHeight={17} fade={false}
            colors={[theme.primary, theme.accent, theme.primary]} />
        </View>
      ) : null}

      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <TripText size={21} weight="bold">{copy.listTitle}</TripText>
        <TripText size={12} muted>{copy.listHint}</TripText>
      </View>

      {grouped.length === 0 ? (
        <View style={{ backgroundColor: theme.surface, borderRadius: 24, padding: 26, gap: 8, alignItems: 'flex-start' }}>
          <Icon name={copy.emptyIcon} size={30} color={theme.celebrate} />
          <TripText size={17} weight="bold">{copy.emptyTitle}</TripText>
          <TripText size={13} muted>{copy.emptyBody}</TripText>
        </View>
      ) : (
        grouped.map((group) => (
          <View key={group.name} style={{ gap: 9 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 }}>
              <Icon name={iconOf(group.name)} size={19} color={theme.primary} />
              <TripText size={16} weight="bold">{group.name}</TripText>
              <TripText size={12} muted>{group.items.filter((item) => item.checked).length}/{group.items.length}</TripText>
            </View>
            {group.items.map((item) => {
              const index = cascadeIndex++;
              return (
                <CascadeIn key={item.id} index={index} total={items.length}>
                  <View style={{ backgroundColor: theme.surface, borderRadius: 21, minHeight: 60, flexDirection: 'row', alignItems: 'center', paddingLeft: 16, paddingRight: 9 }}>
                    <Pressable onPress={() => { void toggle(item); }} accessibilityRole="checkbox" accessibilityState={{ checked: item.checked }} accessibilityLabel={item.title} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 13, paddingVertical: 12 }}>
                      <View style={{ width: 27, height: 27, borderRadius: 10, borderWidth: 2, borderColor: item.checked ? theme.primary : theme.border, backgroundColor: item.checked ? theme.primary : theme.surface, alignItems: 'center', justifyContent: 'center' }}>
                        {item.checked ? <TripText size={16} weight="bold" style={{ color: theme.onPrimary, lineHeight: 19 }}>✓</TripText> : null}
                      </View>
                      <TripText size={15} weight="semibold" style={{ color: item.checked ? theme.textSecondary : theme.text, textDecorationLine: item.checked ? 'line-through' : 'none', flex: 1 }}>{item.title}</TripText>
                    </Pressable>
                    <Pressable onPress={() => setRemoving(item)} accessibilityLabel={'删除' + item.title} style={{ padding: 10 }}><TripText size={20} muted>×</TripText></Pressable>
                  </View>
                </CascadeIn>
              );
            })}
          </View>
        ))
      )}

      <BouncyButton onPress={() => { setError(''); setAdding(true); }} style={{ backgroundColor: theme.accent, borderRadius: 999, paddingVertical: 16, alignItems: 'center' }}>
        <TripText size={15} weight="bold" style={{ color: theme.onAccent }}>{copy.addCta}</TripText>
      </BouncyButton>
      {error ? <TripText size={13} style={{ color: theme.accent }}>{error}</TripText> : null}

      <Modal visible={adding} transparent animationType="slide" onRequestClose={() => setAdding(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, justifyContent: 'flex-end' }}>
          <Pressable onPress={() => setAdding(false)} style={{ position: 'absolute', inset: 0, backgroundColor: theme.shadow, opacity: 0.45 }} />
          <View style={{ backgroundColor: theme.surface, borderTopLeftRadius: 32, borderTopRightRadius: 32, maxHeight: '80%', paddingTop: 15 }}>
            <View style={{ width: 48, height: 5, borderRadius: 9, backgroundColor: theme.border, alignSelf: 'center' }} />
            <ScrollView contentContainerStyle={{ padding: 24, gap: 16 }} keyboardShouldPersistTaps="handled">
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9 }}>
                <TripText size={24} weight="bold">{copy.addTitle}</TripText>
                <Icon name="sparkle" size={21} color={theme.accent} />
              </View>
              <TextInput value={title} onChangeText={setTitle} autoFocus placeholder={copy.addPlaceholder} placeholderTextColor={theme.textSecondary} style={{ backgroundColor: theme.bg, borderColor: theme.border, borderWidth: 1, borderRadius: 17, paddingHorizontal: 16, paddingVertical: 13, fontFamily: chineseFont, color: theme.text, fontSize: 16 }} />
              <TripText size={13} weight="semibold">放在哪一类？</TripText>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {categories.map((entry) => (
                  <Pressable key={entry.name} onPress={() => setCategory(entry.name)} style={{ paddingHorizontal: 15, paddingVertical: 9, borderRadius: 999, backgroundColor: category === entry.name ? theme.primary : theme.surfaceAlt }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Icon name={entry.icon} size={14} color={category === entry.name ? theme.onPrimary : theme.textSecondary} />
                      <TripText size={13} weight="semibold" style={{ color: category === entry.name ? theme.onPrimary : theme.text }}>{entry.name}</TripText>
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

      <Modal visible={!!removing} transparent animationType="fade" onRequestClose={() => setRemoving(null)}>
        <View style={{ flex: 1, justifyContent: 'center', padding: 28 }}>
          <Pressable onPress={() => setRemoving(null)} style={{ position: 'absolute', inset: 0, backgroundColor: theme.shadow, opacity: 0.45 }} />
          <View style={{ backgroundColor: theme.surface, borderRadius: 28, padding: 24, gap: 14 }}>
            <TripText size={22} weight="bold">删除这条？</TripText>
            <TripText size={14} muted>「{removing?.title}」会从清单移除。</TripText>
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 22 }}>
              <Pressable onPress={() => setRemoving(null)}><TripText size={15}>取消</TripText></Pressable>
              <Pressable onPress={() => { void confirmRemove(); }}><TripText size={15} weight="bold" style={{ color: theme.accent }}>确认删除</TripText></Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}
