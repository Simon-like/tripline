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
  return (
    <Page tabbed>
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
  );
}
