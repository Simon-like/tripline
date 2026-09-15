import { JournalEntrySchema, SCHEMA_VERSION, type JournalEntry } from './schema';

export const JOURNAL_TAG_PRESETS = ['推荐', '避雷', '美食', '风景', '心情'] as const;

/** 演示旅程的一条见闻；确定性 UUID，配合存在性检查实现幂等（参照 makeDemoItinerary） */
export function makeDemoJournalEntry(journeyId: string, now: number): JournalEntry {
  return JournalEntrySchema.parse({
    id: '00000000-0000-4000-8000-0000000000a5',
    journeyId,
    text: '转经筒下许了个愿 ✨',
    photoPaths: [],
    tags: ['推荐'],
    mood: null,
    timestamp: now,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
    schemaVersion: SCHEMA_VERSION,
  });
}

export type JournalDayGroup = {
  /** 本机日期键 YYYY-MM-DD */
  key: string;
  /** 今天 / 昨天 / MM-DD */
  label: string;
  /** 组内按 timestamp 倒序 */
  entries: JournalEntry[];
};

function localDayKey(timestamp: number): string {
  const date = new Date(timestamp);
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** 按本机日期分组（新日期在前），组内按 timestamp 倒序；标签为 今天/昨天/MM-DD */
export function groupJournalEntriesByDay(entries: readonly JournalEntry[], now: number): JournalDayGroup[] {
  const todayKey = localDayKey(now);
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayKey = localDayKey(yesterday.getTime());

  const byDay = new Map<string, JournalEntry[]>();
  for (const entry of entries) {
    const key = localDayKey(entry.timestamp);
    const group = byDay.get(key);
    if (group) group.push(entry);
    else byDay.set(key, [entry]);
  }
  return [...byDay.entries()]
    .sort(([a], [b]) => (a < b ? 1 : a > b ? -1 : 0))
    .map(([key, group]) => ({
      key,
      label: key === todayKey ? '今天' : key === yesterdayKey ? '昨天' : key.slice(5),
      entries: group.sort((a, b) => b.timestamp - a.timestamp),
    }));
}
