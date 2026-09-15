import { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, TextInput, View } from 'react-native';
import { decodeExportCode, ExportCodeError, type JourneyBundle } from '@tripline/shared';
import { Icon } from '@tripline/ui';
import { BouncyButton } from './BouncyButton';
import { TripText } from './TripText';
import { importJourneyBundle } from '../data/database';
import { chineseFont, useTriplineTheme } from '../theme';

type Props = {
  visible: boolean;
  onClose: () => void;
  /** 导入成功后回调（首页刷新） */
  onImported: (journeyId: string) => void;
};

function bundleCounts(bundle: JourneyBundle): string {
  const parts = [
    `清单 ${bundle.checklistItems.length} 项`,
    `行程 ${bundle.itineraryItems.length} 条`,
    `账目 ${bundle.expenses.length} 笔`,
    `见闻 ${bundle.journalEntries.length} 条`,
  ];
  return parts.join(' · ');
}

/**
 * M08 导入：多行粘贴框，输入变化即尝试 decodeExportCode 自动识别；
 * 识别成功展示预览卡，确认后 importJourneyBundle 落库；失败给中文可读错误。
 */
export function ImportSheet({ visible, onClose, onImported }: Props) {
  const { theme } = useTriplineTheme();
  const [text, setText] = useState('');
  const [preview, setPreview] = useState<JourneyBundle | null>(null);
  const [error, setError] = useState('');
  const importing = useRef(false);

  useEffect(() => {
    if (!visible) {
      setText('');
      setPreview(null);
      setError('');
    }
  }, [visible]);

  function handleChange(next: string) {
    setText(next);
    setPreview(null);
    setError('');
    if (!next.trim()) return;
    try {
      setPreview(decodeExportCode(next));
    } catch (cause) {
      // 识别失败不打扰逐字输入；粘贴（一次性长文本）或含 TL 前缀的坏码才提示中文可读错误
      if (cause instanceof ExportCodeError && (/TL\d+\./.test(next) || next.trim().length >= 8)) setError(cause.message);
    }
  }

  async function confirmImport() {
    if (!preview || importing.current) return;
    importing.current = true;
    try {
      await importJourneyBundle(preview);
      onImported(preview.journey.id);
      onClose();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '导入失败，请稍后再试');
    } finally {
      importing.current = false;
    }
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, justifyContent: 'flex-end' }}>
        <Pressable onPress={onClose} style={{ position: 'absolute', inset: 0, backgroundColor: theme.shadow, opacity: 0.45 }} />
        <View style={{ backgroundColor: theme.bg, borderTopLeftRadius: 32, borderTopRightRadius: 32, maxHeight: '86%', paddingTop: 15 }}>
          <View style={{ width: 48, height: 5, borderRadius: 9, backgroundColor: theme.border, alignSelf: 'center' }} />
          <ScrollView contentContainerStyle={{ padding: 24, gap: 14 }} keyboardShouldPersistTaps="handled">
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9 }}>
              <TripText size={24} weight="bold">导入朋友的旅程</TripText>
              <Icon name="sparkle" size={21} color={theme.primary} />
            </View>
            <TripText size={13} muted>把朋友发来的旅迹分享文案整段粘贴进来，自动识别。</TripText>
            <TextInput value={text} onChangeText={handleChange} multiline autoFocus
              placeholder="粘贴分享文案（含 TL1. 开头的那一行码）" placeholderTextColor={theme.textSecondary}
              style={{ backgroundColor: theme.surface, borderColor: theme.border, borderWidth: 1, borderRadius: 17, paddingHorizontal: 16, paddingVertical: 13, minHeight: 110, maxHeight: 180, textAlignVertical: 'top', fontFamily: chineseFont, color: theme.text, fontSize: 15, lineHeight: 22 }} />
            {preview ? (
              <View style={{ backgroundColor: theme.primarySoft, borderRadius: 20, padding: 18, gap: 6 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
                  <Icon name="check" size={16} color={theme.success} />
                  <TripText size={13} weight="semibold" style={{ color: theme.success }}>识别成功</TripText>
                </View>
                <TripText size={18} weight="bold">{preview.journey.name}</TripText>
                <TripText size={13} numbers muted>{preview.journey.startDate} — {preview.journey.endDate}</TripText>
                <TripText size={12} muted>{bundleCounts(preview)}</TripText>
              </View>
            ) : null}
            {error ? <TripText size={13} style={{ color: theme.accent }}>{error}</TripText> : null}
            <BouncyButton onPress={() => { void confirmImport(); }} disabled={!preview} accessibilityRole="button" accessibilityLabel="确认导入"
              style={{ backgroundColor: theme.accent, borderRadius: 999, paddingVertical: 15, alignItems: 'center', opacity: preview ? 1 : 0.5 }}>
              <TripText size={16} weight="bold" style={{ color: theme.onAccent }}>确认导入</TripText>
            </BouncyButton>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
