import { SCHEMA_VERSION } from '@tripline/shared';
import { createJourney, listChecklistItems, listJourneys, setChecklistChecked } from './database';
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
