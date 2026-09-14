import { ItineraryItemSchema, SCHEMA_VERSION, type ItineraryItem } from './schema';

export const ITINERARY_STATES = ['planned', 'visited', 'cancelled'] as const;
export type ItineraryState = (typeof ITINERARY_STATES)[number];

export const ITINERARY_STATE_LABELS: Record<ItineraryState, string> = {
  planned: '计划',
  visited: '✓ 已去',
  cancelled: '已取消',
};

/** 三态循环：计划 → ✓已去 → 已取消 → 计划 */
export function nextItineraryState(state: ItineraryState): ItineraryState {
  const index = ITINERARY_STATES.indexOf(state);
  if (index < 0) throw new Error(`未知行程状态：${state}`);
  return ITINERARY_STATES[(index + 1) % ITINERARY_STATES.length];
}

/** 由旅程起止日期生成连续日期数组（Day 1..N，均为本地 ISO 日期） */
export function journeyDays(startDate: string, endDate: string): string[] {
  if (startDate > endDate) return [];
  const days: string[] = [];
  const cursor = new Date(startDate + 'T00:00:00');
  const last = new Date(endDate + 'T00:00:00');
  while (cursor <= last) {
    const year = cursor.getFullYear();
    const month = String(cursor.getMonth() + 1).padStart(2, '0');
    const day = String(cursor.getDate()).padStart(2, '0');
    days.push(`${year}-${month}-${day}`);
    cursor.setDate(cursor.getDate() + 1);
  }
  return days;
}

const DEMO_DAY1: readonly [string, string, string][] = [
  ['09:30', '飞昆明转机', '预留 2 小时中转'],
  ['14:00', '抵达香格里拉', '机场到古城约 20 分钟'],
  ['16:00', '独克宗古城', '先适应海拔，慢慢逛'],
  ['19:00', '藏餐·牦牛火锅', '古城北门那家'],
];

/** 演示旅程 Day 1 四条目；确定性 UUID，重复生成结果一致，配合存在性检查实现幂等 */
export function makeDemoItinerary(journeyId: string, startDate: string, now: number): ItineraryItem[] {
  return DEMO_DAY1.map(([time, content, note], index) => ItineraryItemSchema.parse({
    id: `00000000-0000-4000-8000-${String(index + 1).padStart(12, '0')}`,
    journeyId,
    date: startDate,
    time,
    content,
    note,
    state: 'planned',
    createdAt: now + index,
    updatedAt: now + index,
    deletedAt: null,
    schemaVersion: SCHEMA_VERSION,
  }));
}
