import { useCallback, useRef, useState } from 'react';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, TextInput, View } from 'react-native';
import * as Crypto from 'expo-crypto';
import * as Haptics from 'expo-haptics';
import { Icon } from '@tripline/ui';
import {
  JOURNAL_TAG_PRESETS, JournalEntrySchema, SCHEMA_VERSION, groupJournalEntriesByDay,
  type JournalEntry, type Journey,
} from '@tripline/shared';
import { BouncyButton } from '../../../src/components/BouncyButton';
import { CascadeIn } from '../../../src/components/CascadeIn';
import { ConfettiCelebration } from '../../../src/components/ConfettiCelebration';
import { Page } from '../../../src/components/Page';
import { TripText } from '../../../src/components/TripText';
import { addJournalEntry, deleteJournalEntry, getJourney, listJournalEntries } from '../../../src/data/database';
import { ensureDemoJournal } from '../../../src/data/demo';
import { chineseFont, useTriplineTheme } from '../../../src/theme';

const TEXT_LIMIT = 500;
const feedbackDuration = 600;

function timeOf(timestamp: number): string {
  const date = new Date(timestamp);
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default function Journal() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { theme } = useTriplineTheme();
  const [journey, setJourney] = useState<Journey | null>(null);
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [adding, setAdding] = useState(false);
  const [text, setText] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [customTag, setCustomTag] = useState('');
  const [mood, setMood] = useState('');
  const [removing, setRemoving] = useState<JournalEntry | null>(null);
  const [celebrating, setCelebrating] = useState(false);
  const [error, setError] = useState('');
  const saving = useRef(false);

  const refresh = useCallback(async () => {
    if (!id) return;
    try {
      await ensureDemoJournal();
      const [loadedJourney, loadedEntries] = await Promise.all([getJourney(id), listJournalEntries(id)]);
      setJourney(loadedJourney);
      setEntries(loadedEntries);
      setError('');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '手账加载失败');
    }
  }, [id]);
  useFocusEffect(useCallback(() => { void refresh(); }, [refresh]));

  const groups = groupJournalEntriesByDay(entries, Date.now());

  function toggleTag(tag: string) {
    setSelectedTags((current) => current.includes(tag) ? current.filter((item) => item !== tag) : [...current, tag]);
  }

  async function save() {
    if (!id || saving.current) return;
    const trimmed = text.trim();
    if (!trimmed) { setError('先写点什么吧，美景不等人'); return; }
    if (trimmed.length > TEXT_LIMIT) { setError(`最多写 ${TEXT_LIMIT} 字，把最心动的留下`); return; }
    const now = Date.now();
    const custom = customTag.trim();
    const parsed = JournalEntrySchema.safeParse({
      id: Crypto.randomUUID(), journeyId: id,
      text: trimmed, photoPaths: [],
      tags: [...selectedTags, ...(custom ? [custom] : [])],
      mood: mood.trim() || null, timestamp: now,
      createdAt: now, updatedAt: now, deletedAt: null, schemaVersion: SCHEMA_VERSION,
    });
    if (!parsed.success) { setError(parsed.error.issues[0]?.message ?? '请检查内容'); return; }
    saving.current = true;
    try {
      await addJournalEntry(parsed.data);
      setText('');
      setSelectedTags([]);
      setCustomTag('');
      setMood('');
      setAdding(false);
      if (Platform.OS !== 'web') void Haptics.selectionAsync();
      setCelebrating(true);
      setTimeout(() => setCelebrating(false), feedbackDuration);
      await refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '保存失败');
    } finally {
      saving.current = false;
    }
  }

  async function confirmRemove() {
    if (!removing) return;
    try {
      await deleteJournalEntry(removing.id, Date.now());
      setRemoving(null);
      await refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '删除失败');
    }
  }

  let cascadeIndex = 0;

  return (
    <Page tabbed>
      <View style={{ gap: 4 }}>
        {celebrating ? <ConfettiCelebration top={10} right={4} /> : null}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9 }}>
          <TripText size={29} weight="bold">记录此刻，留住见闻</TripText>
          <Icon name="notebook" size={26} color={theme.primary} />
        </View>
        <TripText size={14} muted>{journey ? journey.name + ' · ' : ''}30 秒一条，回来慢慢回味。</TripText>
      </View>

      {entries.length === 0 ? (
        <View style={{ backgroundColor: theme.surface, borderRadius: 24, padding: 26, gap: 8, alignItems: 'flex-start' }}>
          <Icon name="notebook" size={30} color={theme.celebrate} />
          <TripText size={17} weight="bold">还没有见闻</TripText>
          <TripText size={13} muted>一句话加个小标签，就把当下收进了口袋。</TripText>
        </View>
      ) : (
        groups.map((group) => (
          <View key={group.key} style={{ gap: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <TripText size={16} weight="bold">{group.label}</TripText>
              <TripText size={12} muted>{group.entries.length} 条</TripText>
            </View>
            {group.entries.map((entry) => {
              const index = cascadeIndex++;
              return (
                <CascadeIn key={entry.id} index={index} total={entries.length}>
                  <View style={{ backgroundColor: theme.surface, borderRadius: 24, padding: 18, gap: 8 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                      <TripText size={13} numbers muted>{timeOf(entry.timestamp)}</TripText>
                      <Pressable onPress={() => setRemoving(entry)} accessibilityLabel={'删除这条见闻'} hitSlop={8} style={{ padding: 4 }}>
                        <TripText size={13} muted>删除</TripText>
                      </Pressable>
                    </View>
                    <TripText size={16} weight="semibold" style={{ lineHeight: 24 }}>{entry.text}</TripText>
                    {entry.tags.length || entry.mood ? (
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7, alignItems: 'center' }}>
                        {entry.tags.map((tag) => (
                          <View key={tag} style={{ backgroundColor: theme.primarySoft, borderRadius: 999, paddingHorizontal: 11, paddingVertical: 5 }}>
                            <TripText size={12} weight="semibold" style={{ color: theme.primary }}># {tag}</TripText>
                          </View>
                        ))}
                        {entry.mood ? <TripText size={12} muted>心情：{entry.mood}</TripText> : null}
                      </View>
                    ) : null}
                  </View>
                </CascadeIn>
              );
            })}
          </View>
        ))
      )}

      <BouncyButton onPress={() => { setError(''); setAdding(true); }} style={{ backgroundColor: theme.accent, borderRadius: 999, paddingVertical: 16, alignItems: 'center' }}>
        <TripText size={15} weight="bold" style={{ color: theme.onAccent }}>＋ 记一条见闻</TripText>
      </BouncyButton>
      {error ? <TripText size={13} style={{ color: theme.accent }}>{error}</TripText> : null}

      <Modal visible={adding} transparent animationType="slide" onRequestClose={() => setAdding(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, justifyContent: 'flex-end' }}>
          <Pressable onPress={() => setAdding(false)} style={{ position: 'absolute', inset: 0, backgroundColor: theme.shadow, opacity: 0.45 }} />
          <View style={{ backgroundColor: theme.surface, borderTopLeftRadius: 32, borderTopRightRadius: 32, maxHeight: '86%', paddingTop: 15 }}>
            <View style={{ width: 48, height: 5, borderRadius: 9, backgroundColor: theme.border, alignSelf: 'center' }} />
            <ScrollView contentContainerStyle={{ padding: 24, gap: 14 }} keyboardShouldPersistTaps="handled">
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9 }}>
                <TripText size={24} weight="bold">记下这一刻</TripText>
                <Icon name="sparkle" size={21} color={theme.accent} />
              </View>
              <View style={{ gap: 7 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <TripText size={13} weight="semibold">见闻</TripText>
                  <TripText size={11} numbers muted>{text.length} / {TEXT_LIMIT}</TripText>
                </View>
                <TextInput value={text} onChangeText={setText} autoFocus multiline maxLength={TEXT_LIMIT}
                  placeholder="比如：转经筒下许了个愿" placeholderTextColor={theme.textSecondary}
                  style={{ backgroundColor: theme.bg, borderColor: theme.border, borderWidth: 1, borderRadius: 17, paddingHorizontal: 16, paddingVertical: 13, minHeight: 96, textAlignVertical: 'top', fontFamily: chineseFont, color: theme.text, fontSize: 16, lineHeight: 24 }} />
              </View>
              <TripText size={13} weight="semibold">加个小标签（可多选）</TripText>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {JOURNAL_TAG_PRESETS.map((tag) => {
                  const active = selectedTags.includes(tag);
                  return (
                    <Pressable key={tag} onPress={() => toggleTag(tag)} style={{ paddingHorizontal: 15, paddingVertical: 9, borderRadius: 999, backgroundColor: active ? theme.primary : theme.surfaceAlt }}>
                      <TripText size={13} weight="semibold" style={{ color: active ? theme.onPrimary : theme.text }}># {tag}</TripText>
                    </Pressable>
                  );
                })}
              </View>
              <View style={{ gap: 7 }}>
                <TripText size={13} weight="semibold">自定义标签（至多一个，可空）</TripText>
                <TextInput value={customTag} onChangeText={setCustomTag} maxLength={12} placeholder="比如：阿 May 最爱" placeholderTextColor={theme.textSecondary}
                  style={{ backgroundColor: theme.bg, borderColor: theme.border, borderWidth: 1, borderRadius: 17, paddingHorizontal: 16, paddingVertical: 13, fontFamily: chineseFont, color: theme.text, fontSize: 16 }} />
              </View>
              <View style={{ gap: 7 }}>
                <TripText size={13} weight="semibold">心情（可空）</TripText>
                <TextInput value={mood} onChangeText={setMood} maxLength={20} placeholder="比如：松了口气" placeholderTextColor={theme.textSecondary}
                  style={{ backgroundColor: theme.bg, borderColor: theme.border, borderWidth: 1, borderRadius: 17, paddingHorizontal: 16, paddingVertical: 13, fontFamily: chineseFont, color: theme.text, fontSize: 16 }} />
              </View>
              {error ? <TripText size={13} style={{ color: theme.accent }}>{error}</TripText> : null}
              <BouncyButton onPress={() => { void save(); }} style={{ backgroundColor: theme.accent, borderRadius: 999, paddingVertical: 15, alignItems: 'center' }}>
                <TripText size={16} weight="bold" style={{ color: theme.onAccent }}>收进手账</TripText>
              </BouncyButton>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal visible={!!removing} transparent animationType="fade" onRequestClose={() => setRemoving(null)}>
        <View style={{ flex: 1, justifyContent: 'center', padding: 28 }}>
          <Pressable onPress={() => setRemoving(null)} style={{ position: 'absolute', inset: 0, backgroundColor: theme.shadow, opacity: 0.45 }} />
          <View style={{ backgroundColor: theme.surface, borderRadius: 28, padding: 24, gap: 14 }}>
            <TripText size={22} weight="bold">删除这条见闻？</TripText>
            <TripText size={14} muted numberOfLines={2}>「{removing?.text}」会从见闻流移除。</TripText>
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
