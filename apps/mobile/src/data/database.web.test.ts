import { importJourneyBundle, getJourney, listExpenses, listJournalEntries, updateJourney } from './database.web';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { JourneyBundleSchema, type JourneyBundle } from '@tripline/shared';
vi.mock('expo-crypto', () => ({ randomUUID: () => crypto.randomUUID() }));

const id = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
export function fixture(n = 1): JourneyBundle {
  const base = { createdAt: 1, updatedAt: 1, deletedAt: null, schemaVersion: 1 };
  return JourneyBundleSchema.parse({
    journey: { ...base, id: id(n), name: '测试旅程', startDate: '2026-10-01', endDate: '2026-10-03', budget: 10000, tags: [], companions: [] },
    checklistItems: [], itineraryItems: [],
    expenses: [{ ...base, id: id(n + 100), journeyId: id(n), amount: 125, category: '餐饮', note: '', payer: null }],
    journalEntries: [{ ...base, id: id(n + 200), journeyId: id(n), text: '记住这一刻', photoPaths: [], tags: [], mood: null, timestamp: 1 }],
  });
}
let saved: string | null;
let failWrite: boolean;
beforeEach(() => {
  saved = null; failWrite = false;
  vi.useFakeTimers(); vi.setSystemTime(new Date('2026-09-15T12:00:00'));
  vi.stubGlobal('localStorage', { getItem: () => saved, setItem: (_key: string, value: string) => { if (failWrite) throw new Error('QuotaExceeded'); saved = value; } });
});
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });

describe('web import repository', () => {
  it('preserves all fields and repeat import creates no duplicate live entities', async () => {
    const bundle = fixture(); await importJourneyBundle(bundle); await importJourneyBundle(bundle);
    expect(await getJourney(bundle.journey.id)).toEqual(bundle.journey);
    expect(await listExpenses(bundle.journey.id)).toEqual(bundle.expenses);
    expect(await listJournalEntries(bundle.journey.id)).toEqual(bundle.journalEntries);
  });
  it('replaces removed children with tombstones', async () => {
    const bundle = fixture(); await importJourneyBundle(bundle);
    await importJourneyBundle({ ...bundle, expenses: [] });
    expect(await listExpenses(bundle.journey.id)).toEqual([]);
    expect(JSON.parse(saved!).expenses[0].deletedAt).not.toBeNull();
  });
  it('rejects cross-journey record collisions without any write', async () => {
    await importJourneyBundle(fixture()); const before = saved;
    const bundle = fixture(2); bundle.expenses[0].id = fixture().expenses[0].id;
    await expect(importJourneyBundle(bundle)).rejects.toThrow('冲突'); expect(saved).toBe(before);
  });
  it('rejects duplicate children and invalid schema without dirtying data', async () => {
    const bundle = fixture(); await importJourneyBundle(bundle); const before = saved;
    await expect(importJourneyBundle({ ...bundle, expenses: [...bundle.expenses, ...bundle.expenses] })).rejects.toThrow('重复');
    await expect(importJourneyBundle({ ...bundle, journey: { ...bundle.journey, endDate: 'bad' } })).rejects.toThrow();
    expect(saved).toBe(before);
  });
  it('failed final write preserves the original complete store', async () => {
    await importJourneyBundle(fixture()); const before = saved; failWrite = true;
    await expect(importJourneyBundle(fixture(2))).rejects.toThrow('旧记录已保留'); expect(saved).toBe(before);
  });
  it('rejects a fifth open journey but allows replacement and historical import', async () => {
    for (let n = 1; n <= 4; n++) await importJourneyBundle(fixture(n));
    const before = saved; await expect(importJourneyBundle(fixture(5))).rejects.toThrow('四趟'); expect(saved).toBe(before);
    await importJourneyBundle(fixture());
    const past = fixture(5); past.journey.startDate = '2025-01-01'; past.journey.endDate = '2025-01-02';
    await importJourneyBundle(past);
    await expect(updateJourney({ ...past.journey, startDate: '2026-10-01', endDate: '2026-10-02' })).rejects.toThrow('四趟');
  });
});
