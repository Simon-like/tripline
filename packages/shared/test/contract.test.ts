import { describe, expect, it } from 'vitest';
import {
  ChecklistItemSchema,
  ExpenseSchema,
  ItineraryItemSchema,
  JournalEntrySchema,
  JourneySchema,
  decodeExportCode,
  encodeExportCode,
  type JourneyBundle,
} from '../src/index';

const common = {
  id: '3f34e0d6-443f-48f1-833f-2b8c52398a21',
  createdAt: 1_000,
  updatedAt: 1_000,
  deletedAt: null,
  schemaVersion: 1,
} as const;

const journey = {
  ...common,
  name: '香格里拉 · 5天4晚',
  startDate: '2026-10-02',
  endDate: '2026-10-06',
  budget: 450_000,
  companions: ['阿 May'],
  tags: ['秋游'],
};

const checklistItem = {
  ...common,
  journeyId: common.id,
  phase: 'preparation' as const,
  category: '证件',
  title: '身份证',
  checked: false,
  sortOrder: 0,
};

const itineraryItem = {
  ...common,
  journeyId: common.id,
  date: '2026-10-02',
  time: '09:30',
  content: '飞昆明转机',
  note: '',
  state: 'planned' as const,
};

const expense = {
  ...common,
  journeyId: common.id,
  amount: 86_000,
  category: '交通',
  note: '机票预付',
  payer: null,
};

const journalEntry = {
  ...common,
  journeyId: common.id,
  text: '转经筒下许了个愿 ✨',
  photoPaths: ['photos/a.jpg'],
  tags: ['推荐'],
  mood: null,
  timestamp: 1_000,
};

describe('五实体契约', () => {
  it.each([
    [JourneySchema, journey],
    [ChecklistItemSchema, checklistItem],
    [ItineraryItemSchema, itineraryItem],
    [ExpenseSchema, expense],
    [JournalEntrySchema, journalEntry],
  ])('接受合法样本并拒绝缺字段或错类型', (schema, valid) => {
    expect(schema.safeParse(valid).success).toBe(true);
    const { id: _id, ...missingId } = valid;
    expect(schema.safeParse(missingId).success).toBe(false);
    expect(schema.safeParse({ ...valid, updatedAt: 'now' }).success).toBe(false);
  });

  it('拒绝倒置的旅程日期', () => {
    expect(JourneySchema.safeParse({ ...journey, endDate: '2026-10-01' }).success).toBe(false);
  });
});

describe('导出码', () => {
  const bundle: JourneyBundle = {
    journey,
    checklistItems: [checklistItem],
    itineraryItems: [itineraryItem],
    expenses: [expense],
    journalEntries: [journalEntry],
  };

  it('完整往返', () => {
    expect(decodeExportCode(encodeExportCode(bundle))).toEqual(bundle);
  });

  it('识别分享文案中的导出码', () => {
    const message = `【旅迹 TripLine】复制整段导入\n${encodeExportCode(bundle)}`;
    expect(decodeExportCode(message)).toEqual(bundle);
  });

  it('拒绝被篡改的校验和', () => {
    const code = encodeExportCode(bundle);
    const last = code.at(-1);
    expect(() => decodeExportCode(code.slice(0, -1) + (last === 'A' ? 'B' : 'A'))).toThrow();
  });

  it('拒绝未来版本并返回可读错误', () => {
    const code = encodeExportCode(bundle).replace('TL1.', 'TL2.');
    expect(() => decodeExportCode(code)).toThrow(/版本/);
  });
});
