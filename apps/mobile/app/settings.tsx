import { useRouter } from 'expo-router';
import { Pressable, View } from 'react-native';
import { Icon, type IconName } from '@tripline/ui';
import { Page } from '../src/components/Page';
import { TripText } from '../src/components/TripText';
import { useTriplineTheme } from '../src/theme';
import type { ThemeMode } from '../src/settings/storage';

const choices: { mode: ThemeMode; label: string; hint: string; icon: IconName }[] = [
  { mode: 'system', label: '自动', hint: '跟随手机', icon: 'sparkle' },
  { mode: 'light', label: '白天', hint: '明亮清爽', icon: 'sun' },
  { mode: 'dark', label: '夜间', hint: '柔和安静', icon: 'moon' },
];

export default function SettingsPage() {
  const router = useRouter();
  const { theme, mode, setMode } = useTriplineTheme();
  return (
    <Page>
      <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="返回旅程首页"
        style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: theme.surface, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name="chevron-left" size={22} color={theme.text} />
      </Pressable>

      <View style={{ gap: 5, paddingTop: 8 }}>
        <TripText size={34} weight="bold">偏爱哪一种光？</TripText>
        <TripText size={14} muted>旅迹会按你的选择，照亮每一程。</TripText>
      </View>

      <View style={{ backgroundColor: theme.surface, borderRadius: 28, padding: 18, gap: 16 }}>
        <View style={{ gap: 2 }}>
          <TripText size={18} weight="bold">外观</TripText>
          <TripText size={12} muted>随时切换，旅程内容不会改变。</TripText>
        </View>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {choices.map((choice) => {
            const selected = choice.mode === mode;
            return (
              <Pressable key={choice.mode} onPress={() => setMode(choice.mode)} accessibilityRole="radio"
                accessibilityState={{ checked: selected }} accessibilityLabel={`${choice.label}主题，${choice.hint}`}
                style={{ flex: 1, minWidth: 0, alignItems: 'center', gap: 5, paddingVertical: 15, borderRadius: 20,
                  backgroundColor: selected ? theme.primarySoft : theme.bg, borderWidth: 1.5,
                  borderColor: selected ? theme.primary : theme.border }}>
                <Icon name={choice.icon} size={22} color={selected ? theme.primary : theme.textSecondary} />
                <TripText size={14} weight="bold" style={{ color: selected ? theme.primary : theme.text }}>{choice.label}</TripText>
                <TripText size={11} muted style={{ textAlign: 'center' }}>{choice.hint}</TripText>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={{ backgroundColor: theme.primarySoft, borderRadius: 24, padding: 19, gap: 5 }}>
        <TripText size={15} weight="bold" style={{ color: theme.primary }}>离线也安心</TripText>
        <TripText size={13} muted>现在的旅程、清单与账本保存在这台设备上。</TripText>
      </View>
    </Page>
  );
}
