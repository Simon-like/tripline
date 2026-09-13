import { useRouter } from 'expo-router';
import { View } from 'react-native';
import { BouncyButton } from '../src/components/BouncyButton';
import { Page } from '../src/components/Page';
import { TripText } from '../src/components/TripText';
import { useTriplineTheme } from '../src/theme';
import { settings } from '../src/settings/storage';

export default function Home() {
  const router = useRouter();
  const { theme } = useTriplineTheme();

  return (
    <Page>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <TripText size={18} weight="bold">✦ 旅迹</TripText>
        <View style={{ backgroundColor: theme.primarySoft, borderRadius: 999, paddingHorizontal: 13, paddingVertical: 7 }}>
          <TripText size={12} weight="semibold" style={{ color: theme.primary }}>离线也安心</TripText>
        </View>
      </View>

      <View style={{ marginTop: 8, gap: 6 }}>
        <TripText size={39} weight="bold" style={{ lineHeight: 53 }}>把每一程，{`\n`}过成好故事。</TripText>
        <TripText size={15} muted>从收拾行李，到安全回家。</TripText>
      </View>

      <BouncyButton
        onPress={() => {
          settings.setLastOpenedJourneyId('demo');
          router.push({ pathname: '/journey/[id]/checklist', params: { id: 'demo' } });
        }}
        style={{ backgroundColor: theme.primary, borderRadius: 30, padding: 24, minHeight: 250, justifyContent: 'space-between', overflow: 'hidden' }}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <View style={{ backgroundColor: theme.onPrimary, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 7 }}>
            <TripText size={12} weight="bold" style={{ color: theme.primary }}>⏳ 准备中</TripText>
          </View>
          <TripText size={35}>🏔️</TripText>
        </View>
        <View>
          <TripText size={29} weight="bold" style={{ color: theme.onPrimary }}>香格里拉</TripText>
          <TripText size={16} style={{ color: theme.onPrimary }}>5天4晚 · 10月2日出发</TripText>
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <TripText size={12} style={{ color: theme.onPrimary }}>演示旅程 · 点击看看</TripText>
          <TripText size={22} style={{ color: theme.onPrimary }}>→</TripText>
        </View>
      </BouncyButton>

      <View style={{ flexDirection: 'row', gap: 12 }}>
        <View style={{ flex: 1, backgroundColor: theme.surface, borderRadius: 25, padding: 18, minHeight: 132, justifyContent: 'space-between' }}>
          <TripText size={26}>🧳</TripText>
          <View><TripText size={16} weight="bold">行前清单</TripText><TripText size={12} muted>少带一件都不慌</TripText></View>
        </View>
        <View style={{ flex: 1, backgroundColor: theme.accentSoft, borderRadius: 25, padding: 18, minHeight: 132, justifyContent: 'space-between' }}>
          <TripText size={26}>💰</TripText>
          <View><TripText size={16} weight="bold">轻松记账</TripText><TripText size={12} muted>花多少心里有数</TripText></View>
        </View>
      </View>

      <View style={{ backgroundColor: theme.surfaceAlt, borderRadius: 22, padding: 18 }}>
        <TripText size={14} weight="semibold">新建与导入旅程</TripText>
        <TripText size={12} muted>完成工程基座后，将在下一阶段开启真实旅程管理。</TripText>
      </View>
    </Page>
  );
}
