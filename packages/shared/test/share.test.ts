import { describe, expect, it } from 'vitest';
import { decodeExportCode, encodeExportCode } from '../src/export-code';
import { JourneyBundleSchema, SCHEMA_VERSION, type JourneyBundle } from '../src/schema';
import { SHARE_COPY_HINT, SHARE_KEYWORD, buildShareText } from '../src/share';

const now = new Date(2026, 8, 15, 12, 0, 0).getTime();

function makeBundle(): JourneyBundle {
  const journeyId = '3f34e0d6-443f-48f1-833f-2b8c52398a21';
  const base = { journeyId, createdAt: now, updatedAt: now, deletedAt: null, schemaVersion: SCHEMA_VERSION } as const;
  return JourneyBundleSchema.parse({
    journey: {
      id: journeyId,
      name: '香格里拉 · 5天4晚',
      startDate: '2026-10-02',
      endDate: '2026-10-06',
      budget: 450_000,
      companions: ['阿 May'],
      tags: ['秋游'],
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      schemaVersion: SCHEMA_VERSION,
    },
    checklistItems: [
      { ...base, id: '00000000-0000-4000-8000-0000000000b1', phase: 'preparation', category: '证件', title: '身份证', checked: true, sortOrder: 0 },
      { ...base, id: '00000000-0000-4000-8000-0000000000b2', phase: 'return', category: '到家待办', title: '导照片', checked: false, sortOrder: 0 },
    ],
    itineraryItems: [
      { ...base, id: '00000000-0000-4000-8000-0000000000c1', date: '2026-10-02', time: '09:30', content: '飞昆明转机', note: '', state: 'planned' },
    ],
    expenses: [
      { ...base, id: '00000000-0000-4000-8000-0000000000d1', amount: 86_000, category: '交通', note: '机票预付', payer: null },
    ],
    journalEntries: [
      { ...base, id: '00000000-0000-4000-8000-0000000000e1', text: '转经筒下许了个愿 ✨', photoPaths: ['journal/00000000-0000-4000-8000-0000000000e1/0.jpg'], tags: ['推荐'], mood: null, timestamp: now },
    ],
  });
}

describe('分享文案', () => {
  it('文案含关键词「旅迹」「复制这段文字」与旅程名、起止日期', () => {
    const bundle = makeBundle();
    const text = buildShareText(bundle.journey, encodeExportCode(bundle));
    expect(text).toContain(SHARE_KEYWORD);
    expect(text).toContain(SHARE_COPY_HINT);
    expect(text).toContain('香格里拉 · 5天4晚');
    expect(text).toContain('2026-10-02');
    expect(text).toContain('2026-10-06');
  });

  it('导出码独占一行（末行），可直接被 decodeExportCode 从整段文案识别', () => {
    const bundle = makeBundle();
    const code = encodeExportCode(bundle);
    const text = buildShareText(bundle.journey, code);
    const lines = text.split('\n');
    expect(lines[lines.length - 1]).toBe(code);
    expect(code.startsWith('TL1.')).toBe(true);
  });

  it('分享文案 → decodeExportCode → bundle 往返等价', () => {
    const bundle = makeBundle();
    const text = buildShareText(bundle.journey, encodeExportCode(bundle));
    expect(decodeExportCode(text)).toEqual(bundle);
  });

  it('篡改文案中的码：往返即报可读错误', () => {
    const bundle = makeBundle();
    const text = buildShareText(bundle.journey, encodeExportCode(bundle));
    const tampered = text.replace(/TL1\./, 'TL1.A');
    expect(() => decodeExportCode(tampered)).toThrowError(/导出码/);
  });
});
