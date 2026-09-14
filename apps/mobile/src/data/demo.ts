import { SCHEMA_VERSION, makeDemoExpenses, makeDemoItinerary } from '@tripline/shared';
import { addExpenses, addItineraryItems, createJourney, getJourney, listChecklistItems, listExpenses, listItineraryItems, listJourneys, setChecklistChecked } from './database';
import { settings } from '../settings/storage';

export const DEMO_JOURNEY_ID = '426ca609-e737-4b7c-94d1-31d8e7d20c15';

export async function ensureDemoJourney(): Promise<void> {
  if (settings.getDemoSeeded()) return;
  const existing = await listJourneys();
  if (existing.length > 0) {
    settings.setDemoSeeded();
    return;
  }

  const now = Date.now();
  await createJourney({
    id: DEMO_JOURNEY_ID,
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
  });
  const items = await listChecklistItems(DEMO_JOURNEY_ID);
  for (const item of items.slice(0, 3)) {
    await setChecklistChecked(item.id, true, now);
  }
  settings.setDemoSeeded();
}

/** M03：演示旅程 Day 1 四条行程，幂等（独立 seeded 标记 + 存在性双保险） */
export async function ensureDemoItinerary(): Promise<void> {
  if (settings.getDemoItinerarySeeded()) return;
  const journey = await getJourney(DEMO_JOURNEY_ID);
  if (!journey) return; // 演示旅程不在（被删或未种入）时静默跳过，不置标记
  const existing = await listItineraryItems(DEMO_JOURNEY_ID);
  if (existing.length === 0) {
    await addItineraryItems(makeDemoItinerary(DEMO_JOURNEY_ID, journey.startDate, Date.now()));
  }
  settings.setDemoItinerarySeeded();
}

/** M04：演示旅程三笔账目，幂等（独立 seeded 标记 + 存在性双保险） */
export async function ensureDemoExpenses(): Promise<void> {
  if (settings.getDemoExpensesSeeded()) return;
  const journey = await getJourney(DEMO_JOURNEY_ID);
  if (!journey) return;
  const existing = await listExpenses(DEMO_JOURNEY_ID);
  if (existing.length === 0) {
    await addExpenses(makeDemoExpenses(DEMO_JOURNEY_ID, Date.now()));
  }
  settings.setDemoExpensesSeeded();
}
