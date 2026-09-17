import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useReducedMotion } from 'react-native-reanimated';
import { JournalPhoto } from '../../../src/components/JournalPhoto';
import { MAX_JOURNAL_PHOTOS } from '../../../src/data/photoPolicy';
import { useCallback, useRef, useState } from 'react';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Image, Modal, Platform, Pressable, ScrollView, TextInput, View } from 'react-native';
import * as Crypto from 'expo-crypto';
import * as Haptics from 'expo-haptics';
import { Icon } from '@tripline/ui';
import {
  JOURNAL_TAG_PRESETS, JournalEntrySchema, SCHEMA_VERSION, groupJournalEntriesByDay,
  type JournalEntry, type Journey,
} from '@tripline/shared';
import { BouncyButton } from '../../../src/components/BouncyButton';
import { BouncyChip } from '../../../src/components/BouncyChip';
import { BottomSheet } from '../../../src/components/BottomSheet';
import { CascadeIn } from '../../../src/components/CascadeIn';
import { ConfettiCelebration } from '../../../src/components/ConfettiCelebration';
import { Page } from '../../../src/components/Page';
import { TripText } from '../../../src/components/TripText';
import { useFocusField } from '../../../src/components/formStyles';
import { addJournalEntry, deleteJournalEntry, getJourney, listJournalEntries } from '../../../src/data/database';
import { ensureDemoJournal } from '../../../src/data/demo';
import { persistJournalPhotos, pickJournalPhotos, removeJournalPhotos, type PickedPhoto } from '../../../src/data/photos';
import { chineseFont, useTriplineTheme } from '../../../src/theme';

const TEXT_LIMIT = 500;
const feedbackDuration = 600;

function timeOf(timestamp: number): string {
  const date = new Date(timestamp);
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default function Journal() {
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { theme } = useTriplineTheme();
  const [journey, setJourney] = useState<Journey | null>(null);
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [adding, setAdding] = useState(false);
  const [text, setText] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [customTag, setCustomTag] = useState('');
  const [mood, setMood] = useState('');
  const [photos, setPhotos] = useState<PickedPhoto[]>([]);
  const [picking, setPicking] = useState(false);
  const [viewing, setViewing] = useState<{ paths: string[]; index: number } | null>(null);
  const [removing, setRemoving] = useState<JournalEntry | null>(null);
  const [celebrating, setCelebrating] = useState(false);
  const [error, setError] = useState('');
  const saving = useRef(false);
  const customTagField = useFocusField();

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

  async function pickPhotos() {
    if (picking) return;
    setPicking(true);
    try {
      const picked = await pickJournalPhotos();
      if (photos.length + picked.length > MAX_JOURNAL_PHOTOS) throw new Error(`每条见闻最多 ${MAX_JOURNAL_PHOTOS} 张照片，慢慢挑最喜欢的吧`);
      if (picked.length > 0) setPhotos((current) => [...current, ...picked]);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '选照片失败，再试一次');
    } finally {
      setPicking(false);
    }
  }

  function removePickedPhoto(index: number) {
    setPhotos((current) => current.filter((_, itemIndex) => itemIndex !== index));
  }

  async function save() {
    if (!id || saving.current) return;
    const trimmed = text.trim();
    if (!trimmed) { setError('先写点什么吧，美景不等人'); return; }
    if (trimmed.length > TEXT_LIMIT) { setError(`最多写 ${TEXT_LIMIT} 字，把最心动的留下`); return; }
    const now = Date.now();
    const custom = customTag.trim();
    const entryId = Crypto.randomUUID();
    saving.current = true;
    let committed = false;
    try {
      // 先把照片拷入沙盒持久路径（Web 端为压缩后的 data URL），DB 只存相对路径
      const photoPaths = await persistJournalPhotos(entryId, photos);
      const parsed = JournalEntrySchema.safeParse({
        id: entryId, journeyId: id,
        text: trimmed, photoPaths,
        tags: [...selectedTags, ...(custom ? [custom] : [])],
        mood: mood.trim() || null, timestamp: now,
        createdAt: now, updatedAt: now, deletedAt: null, schemaVersion: SCHEMA_VERSION,
      });
      if (!parsed.success) {
        void removeJournalPhotos(entryId).catch(() => {}); // 校验不过，清掉已拷入的孤儿照片
        setError(parsed.error.issues[0]?.message ?? '请检查内容');
        return;
      }
      await addJournalEntry(parsed.data);
      committed = true;
      setText('');
      setSelectedTags([]);
      setCustomTag('');
      setMood('');
      setPhotos([]);
      setAdding(false);
      if (Platform.OS !== 'web') void Haptics.selectionAsync();
      setCelebrating(true);
      setTimeout(() => setCelebrating(false), feedbackDuration);
      await refresh();
    } catch (cause) {
      if (!committed) await removeJournalPhotos(entryId).catch(() => {});
      setError(cause instanceof Error ? cause.message : '保存失败');
    } finally {
      saving.current = false;
    }
  }

  async function confirmRemove() {
    if (!removing) return;
    try {
      await deleteJournalEntry(removing.id, Date.now());
      void removeJournalPhotos(removing.id).catch(() => {}); // best-effort 清理沙盒照片目录
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
                      <Pressable onPress={() => setRemoving(entry)} accessibilityRole="button" accessibilityLabel={'删除这条见闻'}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center', marginRight: -10, marginVertical: -10 }}>
                        <Icon name="trash" size={17} color={theme.textSecondary} />
                      </Pressable>
                    </View>
                    <TripText size={16} weight="semibold" style={{ lineHeight: 24 }}>{entry.text}</TripText>
                    {entry.photoPaths.length > 0 ? (
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                        {entry.photoPaths.map((path, photoIndex) => (
                          <Pressable key={path} onPress={() => setViewing({ paths: entry.photoPaths, index: photoIndex })}
                            accessibilityRole="imagebutton" accessibilityLabel={`放大第 ${photoIndex + 1} 张照片`}>
                            <JournalPhoto path={path}
                              style={{ width: 72, height: 72, borderRadius: 14, backgroundColor: theme.surfaceAlt }} />
                          </Pressable>
                        ))}
                      </View>
                    ) : null}
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

      <BouncyButton onPress={() => { setError(''); setPhotos([]); setAdding(true); }} style={{ backgroundColor: theme.accent, borderRadius: 999, paddingVertical: 16, alignItems: 'center' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
          <Icon name="plus" size={17} color={theme.onAccent} />
          <TripText size={15} weight="bold" style={{ color: theme.onAccent }}>记一条见闻</TripText>
        </View>
      </BouncyButton>
      {error ? <TripText size={13} style={{ color: theme.accent }}>{error}</TripText> : null}

      <BottomSheet visible={adding} onClose={() => setAdding(false)}>
            <ScrollView contentContainerStyle={{ padding: 24, gap: 14 }} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" automaticallyAdjustKeyboardInsets>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9 }}>
                <TripText size={24} weight="bold">记下这一刻</TripText>
                <Icon name="sparkle" size={21} color={theme.accent} />
              </View>
              <View style={{ gap: 7 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <TripText size={13} weight="semibold">见闻</TripText>
                  <TripText size={11} numbers muted>{text.length} / {TEXT_LIMIT}</TripText>
                </View>
                <TextInput value={text} onChangeText={setText} multiline maxLength={TEXT_LIMIT}
                  placeholder="比如：转经筒下许了个愿" placeholderTextColor={theme.textSecondary}
                  style={{ backgroundColor: theme.bg, borderColor: theme.border, borderWidth: 1, borderRadius: 17, paddingHorizontal: 16, paddingVertical: 13, minHeight: 96, textAlignVertical: 'top', fontFamily: chineseFont, color: theme.text, fontSize: 16, lineHeight: 24 }} />
              </View>
              <TripText size={13} weight="semibold">加个小标签（可多选）</TripText>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {JOURNAL_TAG_PRESETS.map((tag) => (
                  <BouncyChip key={tag} label={'# ' + tag} selected={selectedTags.includes(tag)} onPress={() => toggleTag(tag)} />
                ))}
              </View>
              <View style={{ gap: 7 }}>
                <TripText size={13} weight="semibold">自定义标签（至多一个，可空）</TripText>
                <TextInput value={customTag} onChangeText={setCustomTag} maxLength={12} placeholder="比如：阿 May 最爱" placeholderTextColor={theme.textSecondary}
                  returnKeyType="done" {...customTagField.focusProps}
                  style={[{ backgroundColor: theme.bg, borderRadius: 17, paddingHorizontal: 16, paddingVertical: 13, fontFamily: chineseFont, color: theme.text, fontSize: 16 }, customTagField.borderStyle]} />
              </View>
              <View style={{ gap: 7 }}>
                <TripText size={13} weight="semibold">心情（可空）</TripText>
                <TextInput value={mood} onChangeText={setMood} maxLength={20} placeholder="比如：松了口气" placeholderTextColor={theme.textSecondary}
                  style={{ backgroundColor: theme.bg, borderColor: theme.border, borderWidth: 1, borderRadius: 17, paddingHorizontal: 16, paddingVertical: 13, fontFamily: chineseFont, color: theme.text, fontSize: 16 }} />
              </View>
              <View style={{ gap: 8 }}>
                <TripText size={13} weight="semibold">照片（最多9张，只存本机）</TripText>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                  {photos.map((photo, index) => (
                    <View key={photo.uri}>
                      <Image source={{ uri: photo.uri }} resizeMode="cover"
                        style={{ width: 68, height: 68, borderRadius: 14, backgroundColor: theme.surfaceAlt }} />
                      <Pressable onPress={() => removePickedPhoto(index)} accessibilityRole="button" accessibilityLabel={`移除第 ${index + 1} 张照片`}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        style={{ position: 'absolute', top: -7, right: -7, width: 24, height: 24, borderRadius: 12, backgroundColor: theme.accent, alignItems: 'center', justifyContent: 'center' }}>
                        <Icon name="close" size={11} color={theme.onAccent} />
                      </Pressable>
                    </View>
                  ))}
                  <Pressable onPress={() => { void pickPhotos(); }} accessibilityRole="button" accessibilityLabel="从相册添加照片"
                    style={{ width: 68, height: 68, borderRadius: 14, backgroundColor: theme.surfaceAlt, borderWidth: 1, borderColor: theme.border, alignItems: 'center', justifyContent: 'center' }}>
                    <Icon name="plus" size={22} color={theme.textSecondary} />
                  </Pressable>
                </View>
                {picking ? <TripText size={12} muted>正在读取相册…</TripText> : null}
              </View>
              {error ? <TripText size={13} style={{ color: theme.accent }}>{error}</TripText> : null}
              <BouncyButton onPress={() => { void save(); }} style={{ backgroundColor: theme.accent, borderRadius: 999, paddingVertical: 15, alignItems: 'center' }}>
                <TripText size={16} weight="bold" style={{ color: theme.onAccent }}>收进手账</TripText>
              </BouncyButton>
            </ScrollView>
      </BottomSheet>

      <Modal visible={!!viewing} animationType={reducedMotion ? 'none' : 'fade'} onRequestClose={() => setViewing(null)}>
        <View style={{ flex: 1, backgroundColor: theme.bg, paddingTop: insets.top, paddingBottom: Math.max(insets.bottom, 16) }}>
          <Pressable onPress={() => setViewing(null)} accessibilityRole="button" accessibilityLabel="关闭照片查看"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={{ margin: 4, width: 44, height: 44, alignItems: 'center', justifyContent: 'center', alignSelf: 'flex-end' }}>
            <Icon name="close" size={24} color={theme.textSecondary} />
          </Pressable>
          {viewing ? <>
            <JournalPhoto path={viewing.paths[viewing.index]} full style={{ width: '100%', flex: 1 }} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', padding: 12 }}>
              <Pressable disabled={viewing.index === 0} onPress={() => setViewing({ ...viewing, index: viewing.index - 1 })} accessibilityRole="button" accessibilityLabel="上一张照片"
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={{ width: 48, height: 48, borderRadius: 999, backgroundColor: theme.surfaceAlt, alignItems: 'center', justifyContent: 'center', opacity: viewing.index === 0 ? 0.3 : 1 }}>
                <Icon name="chevron-left" size={24} color={theme.text} />
              </Pressable>
              <TripText numbers muted>{viewing.index + 1} / {viewing.paths.length}</TripText>
              <Pressable disabled={viewing.index === viewing.paths.length - 1} onPress={() => setViewing({ ...viewing, index: viewing.index + 1 })} accessibilityRole="button" accessibilityLabel="下一张照片"
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={{ width: 48, height: 48, borderRadius: 999, backgroundColor: theme.surfaceAlt, alignItems: 'center', justifyContent: 'center', opacity: viewing.index === viewing.paths.length - 1 ? 0.3 : 1 }}>
                <Icon name="chevron-right" size={24} color={theme.text} />
              </Pressable>
            </View>
          </> : null}
        </View>
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
