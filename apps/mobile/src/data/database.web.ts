import type { ChecklistItem, Journey } from '@tripline/shared';
import { ChecklistItemSchema, JourneySchema, makeChecklistTemplate } from '@tripline/shared';
import * as Crypto from 'expo-crypto';

const STORAGE_KEY = 'tripline.preview.v1';

type PreviewStore = {
  journeys: Journey[];
  checklistItems: ChecklistItem[];
  syncQueue: { entityType: string; entityId: string; operation: string; payload: unknown; updatedAt: number }[];
};

function emptyStore(): PreviewStore {
  return { journeys: [], checklistItems: [], syncQueue: [] };
}

function readStore(): PreviewStore {
  if (typeof localStorage === 'undefined') return emptyStore();
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) as PreviewStore : emptyStore();
  } catch {
    return emptyStore();
  }
}

function writeStore(store: PreviewStore): void {
  if (typeof localStorage !== 'undefined') localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

function log(store: PreviewStore, entityType: string, entityId: string, operation: string, payload: unknown, now: number): void {
  store.syncQueue.push({ entityType, entityId, operation, payload, updatedAt: now });
}

export async function initializeDatabase(): Promise<void> {
  readStore();
}

export async function createJourney(input: Journey): Promise<void> {
  const journey = JourneySchema.parse(input);
  const store = readStore();
  if (store.journeys.some((item) => item.id === journey.id)) throw new Error('旅程已存在');
  store.journeys.push(journey);
  log(store, 'journey', journey.id, 'create', journey, journey.updatedAt);
  const template = makeChecklistTemplate(journey.id, journey.createdAt, Crypto.randomUUID);
  for (const item of template) {
    store.checklistItems.push(item);
    log(store, 'checklist_item', item.id, 'create', item, item.updatedAt);
  }
  writeStore(store);
}

export async function listJourneys(): Promise<Journey[]> {
  return readStore().journeys.filter((item) => item.deletedAt === null).sort((a, b) => b.startDate.localeCompare(a.startDate));
}

export async function getJourney(id: string): Promise<Journey | null> {
  return (await listJourneys()).find((journey) => journey.id === id) ?? null;
}

export async function updateJourney(input: Journey): Promise<void> {
  const journey = JourneySchema.parse(input);
  const store = readStore();
  const index = store.journeys.findIndex((item) => item.id === journey.id && item.deletedAt === null);
  if (index < 0) throw new Error('旅程不存在或已删除');
  store.journeys[index] = journey;
  log(store, 'journey', journey.id, 'update', journey, journey.updatedAt);
  writeStore(store);
}

export async function deleteJourney(id: string, now: number): Promise<void> {
  const store = readStore();
  const journey = store.journeys.find((item) => item.id === id && item.deletedAt === null);
  if (!journey) throw new Error('旅程不存在或已删除');
  journey.deletedAt = now;
  journey.updatedAt = now;
  log(store, 'journey', id, 'delete', { id, deletedAt: now }, now);
  for (const item of store.checklistItems) {
    if (item.journeyId === id && item.deletedAt === null) {
      item.deletedAt = now;
      item.updatedAt = now;
      log(store, 'checklist_item', item.id, 'delete', { id: item.id, deletedAt: now }, now);
    }
  }
  writeStore(store);
}

export async function listChecklistItems(journeyId: string): Promise<ChecklistItem[]> {
  return readStore().checklistItems
    .filter((item) => item.journeyId === journeyId && item.phase === 'preparation' && item.deletedAt === null)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.createdAt - b.createdAt);
}

export async function addChecklistItem(input: ChecklistItem): Promise<void> {
  const item = ChecklistItemSchema.parse(input);
  const store = readStore();
  store.checklistItems.push(item);
  log(store, 'checklist_item', item.id, 'create', item, item.updatedAt);
  writeStore(store);
}

export async function setChecklistChecked(id: string, checked: boolean, now: number): Promise<void> {
  const store = readStore();
  const item = store.checklistItems.find((entry) => entry.id === id && entry.deletedAt === null);
  if (!item) throw new Error('清单条目不存在或已删除');
  item.checked = checked;
  item.updatedAt = now;
  log(store, 'checklist_item', id, 'update', item, now);
  writeStore(store);
}

export async function deleteChecklistItem(id: string, now: number): Promise<void> {
  const store = readStore();
  const item = store.checklistItems.find((entry) => entry.id === id && entry.deletedAt === null);
  if (!item) throw new Error('清单条目不存在或已删除');
  item.deletedAt = now;
  item.updatedAt = now;
  log(store, 'checklist_item', id, 'delete', { id, deletedAt: now }, now);
  writeStore(store);
}
