import { useLocalSearchParams } from 'expo-router';
import { ChecklistPanel, type ChecklistCategory } from '../../../src/components/ChecklistPanel';
import { Page } from '../../../src/components/Page';

const categories: readonly ChecklistCategory[] = [
  { name: '证件', icon: 'id-card' },
  { name: '交通', icon: 'train' },
  { name: '住宿', icon: 'home' },
  { name: '电子', icon: 'plug' },
  { name: '药品', icon: 'pill' },
  { name: '衣物', icon: 'shirt' },
  { name: '财务', icon: 'bankcard' },
  { name: '其他', icon: 'sparkle' },
] as const;

export default function Checklist() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <Page tabbed>
      <ChecklistPanel journeyId={id} phase="preparation" categories={categories} copy={{
        heading: '出发前，轻松打包',
        headingIcon: 'luggage',
        subheading: '一件件来，准备好就出发。',
        heroBadge: '准备进度',
        completeTitle: '清单完成！',
        completeBody: '行李和期待都打包好了，祝你一路精彩。',
        listTitle: '我的准备清单',
        listHint: '点一下，勾掉一件',
        addCta: '添加要准备的事',
        addTitle: '再加一件小事',
        addPlaceholder: '比如：带上拍立得',
        emptyTitle: '清单还空着',
        emptyBody: '添上第一件要准备的物品，安心感从此刻开始。',
        emptyIcon: 'luggage',
      }} />
    </Page>
  );
}
