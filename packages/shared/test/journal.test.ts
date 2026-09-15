import { describe, expect, it } from 'vitest';
import { JOURNAL_TAG_PRESETS, groupJournalEntriesByDay, makeDemoJournalEntry } from '../src/journal';
import { JournalEntrySchema, SCHEMA_VERSION, type JournalEntry } from '../src/schema';

const journeyId = '3f34e0d6-443f-48f1-833f-2b8c52398a21';

function entry(id: string, timestamp: number, text = '一条见闻'): JournalEntry {
  return JournalEntrySchema.parse({
    id,
    journeyId,
    text,
    photoPaths: [],
    tags: [],
    mood: null,
    timestamp,
    createdAt: timestamp,
    updatedAt: timestamp,
    deletedAt: null,
    schemaVersion: SCHEMA_VERSION,
  });
}

// 本机时间 2026-09-15 12:00
const now = new Date(2026, 8, 15, 12, 0, 0).getTime();
const at = (offsetDays: number, hour: number, minute = 0) => {
  const date = new Date(2026, 8, 15, hour, minute, 0);
  date.setDate(date.getDate() + offsetDays);
  return date.getTime();
};

describe('手账', () => {
  it('预设标签为 推荐/避雷/美食/风景/心情 五项', () => {
    expect(JOURNAL_TAG_PRESETS).toEqual(['推荐', '避雷', '美食', '风景', '心情']);
  });

  it('演示条目确定性生成：同参同果，固定 UUID，文字与标签符合演示约定', () => {
    const first = makeDemoJournalEntry(journeyId, now);
    const second = makeDemoJournalEntry(journeyId, now);
    expect(first).toEqual(second);
    expect(first.id).toBe('00000000-0000-4000-8000-0000000000a5');
    expect(first.text).toBe('转经筒下许了个愿 ✨');
    expect(first.tags).toEqual(['推荐']);
    expect(first.photoPaths).toEqual([]);
    expect(first.journeyId).toBe(journeyId);
  });

  it('空数组分组为空', () => {
    expect(groupJournalEntriesByDay([], now)).toEqual([]);
  });

  it('按本机日期分组为 今天/昨天/MM-DD，新日期在前', () => {
    const groups = groupJournalEntriesByDay([
      entry('00000000-0000-4000-8000-000000000001', at(0, 9)),
      entry('00000000-0000-4000-8000-000000000002', at(-1, 20)),
      entry('00000000-0000-4000-8000-000000000003', at(-5, 8)),
    ], now);
    expect(groups.map((group) => group.label)).toEqual(['今天', '昨天', '09-10']);
    expect(groups.map((group) => group.key)).toEqual(['2026-09-15', '2026-09-14', '2026-09-10']);
  });

  it('组内按 timestamp 倒序', () => {
    const groups = groupJournalEntriesByDay([
      entry('00000000-0000-4000-8000-000000000001', at(0, 9), '早上'),
      entry('00000000-0000-4000-8000-000000000002', at(0, 18), '傍晚'),
      entry('00000000-0000-4000-8000-000000000003', at(0, 12), '中午'),
    ], now);
    expect(groups).toHaveLength(1);
    expect(groups[0].entries.map((item) => item.text)).toEqual(['傍晚', '中午', '早上']);
  });
});
