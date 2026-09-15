import { initializeDatabase, importJourneyBundle, getJourney, listExpenses, listJournalEntries } from './database';
import { spawn } from 'node:child_process';
import { createInterface } from 'node:readline';
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { JourneyBundleSchema } from '@tripline/shared';

const bridge = vi.hoisted(() => ({ db: null as unknown, fail: false }));
vi.mock('expo-sqlite', () => ({ openDatabaseAsync: async () => bridge.db }));
vi.mock('expo-crypto', () => ({ randomUUID: () => crypto.randomUUID() }));
const process = spawn('python3', ['test/sqlite-driver.py'], { stdio: ['pipe', 'pipe', 'inherit'] });
let sequence = 0;
const pending = new Map<number, { resolve: (value: any) => void; reject: (error: Error) => void }>();
createInterface({ input: process.stdout }).on('line', (line) => {
  const response = JSON.parse(line); const task = pending.get(response.id); pending.delete(response.id);
  if (response.error) task?.reject(new Error(response.error)); else task?.resolve(response.value);
});
function call(mode: string, sql: string, params: unknown[] = []): Promise<any> {
  return new Promise((resolve, reject) => { const id = ++sequence; pending.set(id, { resolve, reject }); process.stdin.write(JSON.stringify({ id, mode, sql, params }) + '\n'); });
}
type TestDb = { execAsync: (sql: string) => Promise<any>; getAllAsync: (sql: string, params?: unknown[]) => Promise<any>; getFirstAsync: (sql: string, params?: unknown[]) => Promise<any>; runAsync: (sql: string, params?: unknown[]) => Promise<any>; withExclusiveTransactionAsync: (task: (tx: TestDb) => Promise<void>) => Promise<void> };
const db: TestDb = {
  execAsync: (sql: string) => call('script', sql),
  getAllAsync: (sql: string, params: unknown[] = []) => call('query', sql, params),
  getFirstAsync: async (sql: string, params: unknown[] = []) => (await call('query', sql, params))[0] ?? null,
  runAsync: (sql: string, params: unknown[] = []) => {
    if (bridge.fail && sql.startsWith('INSERT INTO sync_queue')) throw new Error('injected queue failure');
    return call('run', sql, params);
  },
  withExclusiveTransactionAsync: async (task: (tx: TestDb) => Promise<void>) => {
    await call('run', 'BEGIN IMMEDIATE');
    try { await task(db); await call('run', 'COMMIT'); }
    catch (error) { await call('run', 'ROLLBACK'); throw error; }
  },
};
bridge.db = db;
const id = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
function fixture(n = 1) {
  const base = { createdAt: 1, updatedAt: 1, deletedAt: null, schemaVersion: 1 };
  return JourneyBundleSchema.parse({
    journey: { ...base, id: id(n), name: '本地事务', startDate: '2099-10-01', endDate: '2099-10-03', budget: 100, companions: [], tags: [] },
    checklistItems: [], itineraryItems: [],
    expenses: [{ ...base, id: id(n + 100), journeyId: id(n), amount: 125, category: '餐饮', note: '早餐', payer: null }],
    journalEntries: [{ ...base, id: id(n + 200), journeyId: id(n), text: '落日', tags: [], photoPaths: ['missing.jpg'], mood: null, timestamp: 1 }],
  });
}
beforeEach(async () => {
  bridge.fail = false; await initializeDatabase();
  await db.execAsync('DELETE FROM sync_queue; DELETE FROM checklist_item; DELETE FROM itinerary_item; DELETE FROM expense; DELETE FROM journal_entry; DELETE FROM journey;');
});
afterAll(() => { process.stdin.end(); });
describe('native repository SQL against host SQLite', () => {
  it('round trips and repeats without duplicate entities', async () => {
    const bundle = fixture(); await importJourneyBundle(bundle); await importJourneyBundle(bundle);
    expect(await getJourney(bundle.journey.id)).toEqual(bundle.journey);
    expect(await listExpenses(bundle.journey.id)).toEqual(bundle.expenses);
    expect(await listJournalEntries(bundle.journey.id)).toEqual(bundle.journalEntries);
  });
  it('rolls back replacement and queue entries when a later write fails', async () => {
    const bundle = fixture(); await importJourneyBundle(bundle);
    const beforeQueue = await db.getAllAsync('SELECT * FROM sync_queue'); bridge.fail = true;
    await expect(importJourneyBundle({ ...bundle, journey: { ...bundle.journey, name: '未提交' }, expenses: [] })).rejects.toThrow('injected');
    expect(await getJourney(bundle.journey.id)).toEqual(bundle.journey);
    expect(await listExpenses(bundle.journey.id)).toEqual(bundle.expenses);
    expect(await db.getAllAsync('SELECT * FROM sync_queue')).toEqual(beforeQueue);
  });
  it('rejects collision before touching any journey or child', async () => {
    const first = fixture(); await importJourneyBundle(first);
    const second = fixture(2); second.expenses[0].id = first.expenses[0].id;
    await expect(importJourneyBundle(second)).rejects.toThrow('冲突');
    expect(await getJourney(second.journey.id)).toBeNull(); expect(await listExpenses(first.journey.id)).toEqual(first.expenses);
  });
  it('enforces capacity in the transaction and keeps historical imports', async () => {
    for (let n = 1; n <= 4; n++) await importJourneyBundle(fixture(n));
    await expect(importJourneyBundle(fixture(5))).rejects.toThrow('四趟');
    const past = fixture(5); past.journey.startDate = '2025-01-01'; past.journey.endDate = '2025-01-02';
    await importJourneyBundle(past); expect(await getJourney(past.journey.id)).toEqual(past.journey);
  });
});
