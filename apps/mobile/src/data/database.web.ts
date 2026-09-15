import type { ChecklistItem, Expense, ItineraryItem, Journey } from '@tripline/shared';
import { ChecklistItemSchema, ExpenseSchema, ItineraryItemSchema, JourneySchema, makeChecklistTemplate } from '@tripline/shared';
import * as Crypto from 'expo-crypto';

const STORAGE_KEY = 'tripline.preview.v1';

type PreviewStore = {
  journeys: Journey[];
  checklistItems: ChecklistItem[];
  itineraryItems: ItineraryItem[];
  expenses: Expense[];
  syncQueue: { entityType: string; entityId: string; operation: string; payload: unknown; updatedAt: number }[];
};

function emptyStore(): PreviewStore {
  return { journeys: [], checklistItems: [], itineraryItems: [], expenses: [], syncQueue: [] };
}

function readStore(): PreviewStore {
  if (typeof localStorage === 'undefined') return emptyStore();
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    // 与旧版本存档兼容：缺省字段回填默认值
    return saved ? { ...emptyStore(), ...(JSON.parse(saved) as Partial<PreviewStore>) } : emptyStore();
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
  for (const [entityType, items] of [
    ['checklist_item', store.checklistItems],
    ['itinerary_item', store.itineraryItems],
    ['expense', store.expenses],
  ] as const) {
    for (const item of items) {
      if (item.journeyId === id && item.deletedAt === null) {
        item.deletedAt = now;
        item.updatedAt = now;
        log(store, entityType, item.id, 'delete', { id: item.id, deletedAt: now }, now);
      }
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

// ---- M03 行程规划 ----

export async function listItineraryItems(journeyId: string): Promise<ItineraryItem[]> {
  return readStore().itineraryItems
    .filter((item) => item.journeyId === journeyId && item.deletedAt === null)
    .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time) || a.createdAt - b.createdAt);
}

export async function addItineraryItem(input: ItineraryItem): Promise<void> {
  await addItineraryItems([input]);
}

export async function addItineraryItems(inputs: ItineraryItem[]): Promise<void> {
  const items = inputs.map((input) => ItineraryItemSchema.parse(input));
  const store = readStore();
  for (const item of items) {
    store.itineraryItems.push(item);
    log(store, 'itinerary_item', item.id, 'create', item, item.updatedAt);
  }
  writeStore(store);
}

export async function setItineraryState(id: string, state: ItineraryItem['state'], now: number): Promise<void> {
  const store = readStore();
  const item = store.itineraryItems.find((entry) => entry.id === id && entry.deletedAt === null);
  if (!item) throw new Error('行程条目不存在或已删除');
  item.state = state;
  item.updatedAt = now;
  log(store, 'itinerary_item', id, 'update', item, now);
  writeStore(store);
}

export async function deleteItineraryItem(id: string, now: number): Promise<void> {
  const store = readStore();
  const item = store.itineraryItems.find((entry) => entry.id === id && entry.deletedAt === null);
  if (!item) throw new Error('行程条目不存在或已删除');
  item.deletedAt = now;
  item.updatedAt = now;
  log(store, 'itinerary_item', id, 'delete', { id, deletedAt: now }, now);
  writeStore(store);
}

// ---- M04 旅行账本 ----

export async function listExpenses(journeyId: string): Promise<Expense[]> {
  return readStore().expenses
    .filter((item) => item.journeyId === journeyId && item.deletedAt === null)
    .sort((a, b) => b.createdAt - a.createdAt);
}

export async function addExpense(input: Expense): Promise<void> {
  await addExpenses([input]);
}

export async function addExpenses(inputs: Expense[]): Promise<void> {
  const expenses = inputs.map((input) => ExpenseSchema.parse(input));
  const store = readStore();
  for (const expense of expenses) {
    store.expenses.push(expense);
    log(store, 'expense', expense.id, 'create', expense, expense.updatedAt);
  }
  writeStore(store);
}

export async function deleteExpense(id: string, now: number): Promise<void> {
  const store = readStore();
  const expense = store.expenses.find((entry) => entry.id === id && entry.deletedAt === null);
  if (!expense) throw new Error('账目不存在或已删除');
  expense.deletedAt = now;
  expense.updatedAt = now;
  log(store, 'expense', id, 'delete', { id, deletedAt: now }, now);
  writeStore(store);
}
