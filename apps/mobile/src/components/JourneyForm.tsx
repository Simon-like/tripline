import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, TextInput, View } from 'react-native';
import type { Journey } from '@tripline/shared';
import { JourneySchema, toLocalDateString } from '@tripline/shared';
import { Icon } from '@tripline/ui';
import { BouncyButton } from './BouncyButton';
import { TripText } from './TripText';
import { chineseFont, useTriplineTheme } from '../theme';

export type JourneyDraft = Pick<Journey, 'name' | 'startDate' | 'endDate' | 'budget' | 'companions' | 'tags'>;

function splitTags(value: string): string[] {
  return value.split(/[,，]/).map((item) => item.trim()).filter(Boolean);
}

export function JourneyForm({ visible, initial, onClose, onSave }: {
  visible: boolean;
  initial: Journey | null;
  onClose: () => void;
  onSave: (draft: JourneyDraft) => Promise<void>;
}) {
  const { theme } = useTriplineTheme();
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [budget, setBudget] = useState('');
  const [companions, setCompanions] = useState('');
  const [tags, setTags] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible) return;
    const today = new Date();
    const later = new Date(today);
    later.setDate(today.getDate() + 4);
    setName(initial?.name ?? '');
    setStartDate(initial?.startDate ?? toLocalDateString(today));
    setEndDate(initial?.endDate ?? toLocalDateString(later));
    setBudget(initial ? String(initial.budget / 100) : '');
    setCompanions(initial?.companions.join('，') ?? '');
    setTags(initial?.tags.join('，') ?? '');
    setError('');
  }, [visible, initial]);

  const fields = [
    { label: '旅程名称', value: name, onChangeText: setName, placeholder: '比如：香格里拉 · 5天4晚', keyboardType: 'default' as const },
    { label: '出发日期', value: startDate, onChangeText: setStartDate, placeholder: 'YYYY-MM-DD', keyboardType: 'numbers-and-punctuation' as const },
    { label: '返程日期', value: endDate, onChangeText: setEndDate, placeholder: 'YYYY-MM-DD', keyboardType: 'numbers-and-punctuation' as const },
    { label: '总预算（元）', value: budget, onChangeText: setBudget, placeholder: '例如 4500', keyboardType: 'decimal-pad' as const },
    { label: '同行人', value: companions, onChangeText: setCompanions, placeholder: '多人用逗号隔开', keyboardType: 'default' as const },
    { label: '标签', value: tags, onChangeText: setTags, placeholder: '如：秋游，美食', keyboardType: 'default' as const },
  ];

  async function submit() {
    if (!/^\d+(\.\d{1,2})?$/.test(budget.trim())) {
      setError('预算请填写数字，最多两位小数');
      return;
    }
    const draft: JourneyDraft = {
      name: name.trim(), startDate: startDate.trim(), endDate: endDate.trim(),
      budget: Math.round(Number(budget) * 100),
      companions: splitTags(companions), tags: splitTags(tags),
    };
    const checked = JourneySchema.safeParse({
      ...draft,
      id: initial?.id ?? '426ca609-e737-4b7c-94d1-31d8e7d20c15',
      createdAt: initial?.createdAt ?? Date.now(), updatedAt: Date.now(),
      deletedAt: null, schemaVersion: 1,
    });
    if (!checked.success) {
      setError(checked.error.issues[0]?.message ?? '请检查旅程信息');
      return;
    }
    setSaving(true);
    try {
      await onSave(draft);
      onClose();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '保存失败，请重试');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, justifyContent: 'flex-end' }}>
        <Pressable onPress={onClose} style={{ position: 'absolute', inset: 0, backgroundColor: theme.shadow, opacity: 0.45 }} />
        <View style={{ backgroundColor: theme.surface, borderTopLeftRadius: 32, borderTopRightRadius: 32, paddingTop: 16, maxHeight: '88%', width: '100%', maxWidth: 560, alignSelf: 'center' }}>
          <View style={{ width: 48, height: 5, borderRadius: 9, backgroundColor: theme.border, alignSelf: 'center', marginBottom: 18 }} />
          <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 32, gap: 14 }} keyboardShouldPersistTaps="handled">
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9 }}>
                <TripText size={27} weight="bold">{initial ? '编辑旅程' : '新建旅程'}</TripText>
                <Icon name="sparkle" size={21} color={theme.accent} />
              </View>
              <Pressable onPress={onClose}><TripText size={22} muted>×</TripText></Pressable>
            </View>
            <TripText size={13} muted>先定个方向，其他精彩可以路上慢慢补。</TripText>
            {fields.map((field) => (
              <View key={field.label} style={{ gap: 7 }}>
                <TripText size={13} weight="semibold">{field.label}</TripText>
                <TextInput
                  value={field.value} onChangeText={field.onChangeText} placeholder={field.placeholder}
                  placeholderTextColor={theme.textSecondary} keyboardType={field.keyboardType}
                  style={{ borderWidth: 1, borderColor: theme.border, backgroundColor: theme.bg, borderRadius: 16, paddingHorizontal: 15, paddingVertical: 12, color: theme.text, fontFamily: chineseFont, fontSize: 15, lineHeight: 22 }}
                />
              </View>
            ))}
            {error ? <TripText size={13} style={{ color: theme.accent }}>{error}</TripText> : null}
            <BouncyButton onPress={submit} disabled={saving} style={{ backgroundColor: theme.accent, paddingVertical: 15, borderRadius: 999, alignItems: 'center', marginTop: 4 }}>
              <TripText size={16} weight="bold" style={{ color: theme.onAccent }}>{saving ? '保存中…' : initial ? '保存修改' : '创建旅程'}</TripText>
            </BouncyButton>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
