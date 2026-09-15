import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { TripText } from '../../../src/components/TripText';
import { JourneySummarySheet } from '../../../src/components/JourneySummarySheet';
import { useTriplineTheme } from '../../../src/theme';
import { useLocalSearchParams } from 'expo-router';
import { ChecklistPanel, type ChecklistCategory } from '../../../src/components/ChecklistPanel';
import { Page } from '../../../src/components/Page';
import { ensureDemoReturnChecklist } from '../../../src/data/demo';

const categories: readonly ChecklistCategory[] = [
  { name: '行李清点', icon: 'luggage' },
  { name: '退房检查', icon: 'home' },
  { name: '票据报销', icon: 'bankcard' },
  { name: '到家待办', icon: 'check' },
] as const;

export default function Return() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [summarizing, setSummarizing] = useState(false);
  const { theme } = useTriplineTheme();
  return (
    <>
    <Page tabbed>
      <Pressable onPress={() => setSummarizing(true)} accessibilityRole="button" accessibilityLabel="查看旅行总结" style={{ backgroundColor: theme.primarySoft, padding: 20, borderRadius: 24 }}>
        <View style={{ gap: 6 }}><TripText size={18} weight="bold">这一程，值得回味</TripText><TripText size={13} muted>查看旅行小结，留住走过的路与故事 →</TripText></View>
      </Pressable>
      <ChecklistPanel journeyId={id} phase="return" categories={categories} beforeLoad={ensureDemoReturnChecklist} copy={{
        heading: '最后一程，也照顾周全',
        headingIcon: 'plane',
        subheading: '退房、行李、发票和到家待办，逐项安心核对。',
        heroBadge: '返程进度',
        completeTitle: '返程无忧！',
        completeBody: '行李、票据和家里的事都安排好了，欢迎回家。',
        listTitle: '返程检查清单',
        listHint: '点一下，勾掉一件',
        addCta: '＋ 添加要核对的事',
        addTitle: '再记一件返程小事',
        addPlaceholder: '比如：退回租借的相机',
        emptyTitle: '返程清单还空着',
        emptyBody: '添上第一件要核对的事，回家时一件不落。',
        emptyIcon: 'plane',
      }} />

    </Page>
    <JourneySummarySheet journeyId={id} visible={summarizing} onClose={() => setSummarizing(false)} />
    </>
  );
}
