import { useEffect, useRef, useState } from 'react';
import { Platform, ScrollView, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { Icon } from '@tripline/ui';
import { BouncyButton } from './BouncyButton';
import { BottomSheet } from './BottomSheet';
import { ConfettiCelebration } from './ConfettiCelebration';
import { TripText } from './TripText';
import { useTriplineTheme } from '../theme';

type Props = {
  visible: boolean;
  /** 分享文案；null 表示加载中或旅程缺失 */
  text: string | null;
  journeyName: string;
  onClose: () => void;
};

async function copyText(text: string): Promise<void> {
  if (Platform.OS === 'web') {
    await navigator.clipboard.writeText(text);
    return;
  }
  await Clipboard.setStringAsync(text);
}

/**
 * M08 导出：分享文案全文 + 「复制分享文案」主按钮。
 * 复制成功 600ms 内彩带反馈（减弱动效时退化为按钮文案切换）。
 */
export function ShareSheet({ visible, text, journeyName, onClose }: Props) {
  const { theme } = useTriplineTheme();
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!visible) {
      setCopied(false);
      setError('');
    }
  }, [visible]);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  async function copy() {
    if (!text) return;
    try {
      await copyText(text);
      if (Platform.OS !== 'web') void Haptics.selectionAsync();
      setCopied(true);
      setError('');
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 1600);
    } catch {
      setError('复制被系统拦下了，长按文案手动选择复制');
    }
  }

  return (
    <BottomSheet visible={visible} onClose={onClose} backgroundColor={theme.bg} maxHeight="82%">
          <View style={{ padding: 24, gap: 14 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9 }}>
              <TripText size={24} weight="bold">把旅程分享出去</TripText>
              <Icon name="share" size={21} color={theme.primary} />
              {copied ? <ConfettiCelebration top={2} right={4} /> : null}
            </View>
            <TripText size={13} muted>「{journeyName}」的清单、行程、账本、手账都在这段文字里，粘贴给同行的人即可。</TripText>
            <TripText size={12} muted>照片保存在本机；原生端的照片不会随分享码传送。</TripText>
            <View style={{ backgroundColor: theme.surface, borderRadius: 20, borderWidth: 1, borderColor: theme.border, maxHeight: 260 }}>
              <ScrollView contentContainerStyle={{ padding: 16 }} showsVerticalScrollIndicator>
                {text === null ? (
                  <TripText size={14} muted>正在打包旅程…</TripText>
                ) : (
                  <TripText size={13} selectable style={{ lineHeight: 21 }}>{text}</TripText>
                )}
              </ScrollView>
            </View>
            {error ? <TripText size={13} style={{ color: theme.accent }}>{error}</TripText> : null}
            <BouncyButton onPress={() => { void copy(); }} disabled={!text} accessibilityRole="button" accessibilityLabel="复制分享文案"
              style={{ backgroundColor: copied ? theme.success : theme.accent, borderRadius: 999, paddingVertical: 15, alignItems: 'center', opacity: text ? 1 : 0.5 }}>
              <TripText size={16} weight="bold" style={{ color: theme.onAccent }}>{copied ? '已复制，去粘贴吧 ✓' : '复制分享文案'}</TripText>
            </BouncyButton>
          </View>
    </BottomSheet>
  );
}
