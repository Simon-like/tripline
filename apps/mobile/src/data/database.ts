import type { ChecklistItem, Journey } from '@tripline/shared';
import { ChecklistItemSchema, JourneySchema, makeChecklistTemplate } from '@tripline/shared';
import * as Crypto from 'expo-crypto';
import * as SQLite from 'expo-sqlite';

let databasePromise: Promise<SQLite.SQLiteDatabase> | undefined;

export function initializeDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!databasePromise) databasePromise = openAndMigrate().catch((error) => {
    databasePromise = undefined;
    throw error;
  });
  return databasePromise;
}

async function openAndMigrate(): Promise<SQLite.SQLiteDatabase> {
  const db = await SQLite.openDatabaseAsync('tripline.db');
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
    CREATE TABLE IF NOT EXISTS journey (
      id TEXT PRIMARY KEY, name TEXT NOT NULL,
      startDate TEXT NOT NULL, endDate TEXT NOT NULL,
      budget INTEGER NOT NULL, companions TEXT NOT NULL, tags TEXT NOT NULL,
      createdAt INTEGER NOT NULL, updatedAt INTEGER NOT NULL,
      deletedAt INTEGER, schemaVersion INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS checklist_item (
      id TEXT PRIMARY KEY, journeyId TEXT NOT NULL REFERENCES journey(id),
      phase TEXT NOT NULL, category TEXT NOT NULL, title TEXT NOT NULL,
      checked INTEGER NOT NULL, sortOrder INTEGER NOT NULL,
      createdAt INTEGER NOT NULL, updatedAt INTEGER NOT NULL,
      deletedAt INTEGER, schemaVersion INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS itinerary_item (
      id TEXT PRIMARY KEY, journeyId TEXT NOT NULL REFERENCES journey(id),
      date TEXT NOT NULL, time TEXT NOT NULL, content TEXT NOT NULL,
      note TEXT NOT NULL, state TEXT NOT NULL,
      createdAt INTEGER NOT NULL, updatedAt INTEGER NOT NULL,
      deletedAt INTEGER, schemaVersion INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS expense (
      id TEXT PRIMARY KEY, journeyId TEXT NOT NULL REFERENCES journey(id),
      amount INTEGER NOT NULL, category TEXT NOT NULL, note TEXT NOT NULL,
      payer TEXT, createdAt INTEGER NOT NULL, updatedAt INTEGER NOT NULL,
      deletedAt INTEGER, schemaVersion INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS journal_entry (
      id TEXT PRIMARY KEY, journeyId TEXT NOT NULL REFERENCES journey(id),
      text TEXT NOT NULL, photoPaths TEXT NOT NULL, tags TEXT NOT NULL,
      mood TEXT, timestamp INTEGER NOT NULL,
      createdAt INTEGER NOT NULL, updatedAt INTEGER NOT NULL,
      deletedAt INTEGER, schemaVersion INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS sync_queue (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      entityType TEXT NOT NULL, entityId TEXT NOT NULL,
      operation TEXT NOT NULL, payload TEXT NOT NULL,
      createdAt INTEGER NOT NULL, updatedAt INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_journey_active ON journey(deletedAt, startDate);
    CREATE INDEX IF NOT EXISTS idx_checklist_journey ON checklist_item(journeyId, phase, sortOrder);
    CREATE INDEX IF NOT EXISTS idx_itinerary_journey ON itinerary_item(journeyId, date, time);
    CREATE INDEX IF NOT EXISTS idx_expense_journey ON expense(journeyId, createdAt);
    CREATE INDEX IF NOT EXISTS idx_journal_journey ON journal_entry(journeyId, timestamp);
  `);
  return db;
}

export async function createJourney(input: Journey): Promise<void> {
  const journey = JourneySchema.parse(input);
  const template = makeChecklistTemplate(journey.id, journey.createdAt, Crypto.randomUUID);
  const db = await initializeDatabase();
  await db.withExclusiveTransactionAsync(async (tx) => {
    await tx.runAsync(
      `INSERT INTO journey (id, name, startDate, endDate, budget, companions, tags, createdAt, updatedAt, deletedAt, schemaVersion)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [journey.id, journey.name, journey.startDate, journey.endDate, journey.budget,
        JSON.stringify(journey.companions), JSON.stringify(journey.tags),
        journey.createdAt, journey.updatedAt, journey.deletedAt, journey.schemaVersion],
    );
    await enqueue(tx, 'journey', journey.id, 'create', journey, journey.updatedAt);
    for (const item of template) {
      await insertChecklistItem(tx, item);
      await enqueue(tx, 'checklist_item', item.id, 'create', item, item.updatedAt);
    }
  });
}

type JourneyRow = {
  id: string; name: string; startDate: string; endDate: string; budget: number;
  companions: string; tags: string; createdAt: number; updatedAt: number;
  deletedAt: number | null; schemaVersion: number;
};

function readJourney(row: JourneyRow): Journey {
  return JourneySchema.parse({ ...row, companions: JSON.parse(row.companions), tags: JSON.parse(row.tags) });
}

export async function listJourneys(): Promise<Journey[]> {
  const db = await initializeDatabase();
  const rows = await db.getAllAsync<JourneyRow>('SELECT * FROM journey WHERE deletedAt IS NULL ORDER BY startDate DESC');
  return rows.map(readJourney);
}

export async function getJourney(id: string): Promise<Journey | null> {
  const db = await initializeDatabase();
  const row = await db.getFirstAsync<JourneyRow>('SELECT * FROM journey WHERE id = ? AND deletedAt IS NULL', [id]);
  return row ? readJourney(row) : null;
}

export async function updateJourney(input: Journey): Promise<void> {
  const journey = JourneySchema.parse(input);
  const db = await initializeDatabase();
  await db.withExclusiveTransactionAsync(async (tx) => {
    const result = await tx.runAsync(
      `UPDATE journey SET name = ?, startDate = ?, endDate = ?, budget = ?, companions = ?, tags = ?, updatedAt = ?
       WHERE id = ? AND deletedAt IS NULL`,
      [journey.name, journey.startDate, journey.endDate, journey.budget,
        JSON.stringify(journey.companions), JSON.stringify(journey.tags), journey.updatedAt, journey.id],
    );
    if (result.changes !== 1) throw new Error('旅程不存在或已删除');
    await enqueue(tx, 'journey', journey.id, 'update', journey, journey.updatedAt);
  });
}

export async function deleteJourney(id: string, now: number): Promise<void> {
  const db = await initializeDatabase();
  await db.withExclusiveTransactionAsync(async (tx) => {
    const result = await tx.runAsync('UPDATE journey SET deletedAt = ?, updatedAt = ? WHERE id = ? AND deletedAt IS NULL', [now, now, id]);
    if (result.changes !== 1) throw new Error('旅程不存在或已删除');
    await enqueue(tx, 'journey', id, 'delete', { id, deletedAt: now }, now);
    for (const table of ['checklist_item', 'itinerary_item', 'expense', 'journal_entry'] as const) {
      const rows = await tx.getAllAsync<{ id: string }>(`SELECT id FROM ${table} WHERE journeyId = ? AND deletedAt IS NULL`, [id]);
      await tx.runAsync(`UPDATE ${table} SET deletedAt = ?, updatedAt = ? WHERE journeyId = ? AND deletedAt IS NULL`, [now, now, id]);
      for (const row of rows) await enqueue(tx, table, row.id, 'delete', { id: row.id, deletedAt: now }, now);
    }
  });
}

type ChecklistRow = Omit<ChecklistItem, 'checked'> & { checked: number };

function readChecklistItem(row: ChecklistRow): ChecklistItem {
  return ChecklistItemSchema.parse({ ...row, checked: row.checked === 1 });
}

export async function listChecklistItems(journeyId: string): Promise<ChecklistItem[]> {
  const db = await initializeDatabase();
  const rows = await db.getAllAsync<ChecklistRow>(
    `SELECT * FROM checklist_item WHERE journeyId = ? AND phase = 'preparation' AND deletedAt IS NULL ORDER BY sortOrder, createdAt`,
    [journeyId],
  );
  return rows.map(readChecklistItem);
}

export async function addChecklistItem(input: ChecklistItem): Promise<void> {
  const item = ChecklistItemSchema.parse(input);
  const db = await initializeDatabase();
  await db.withExclusiveTransactionAsync(async (tx) => {
    await insertChecklistItem(tx, item);
    await enqueue(tx, 'checklist_item', item.id, 'create', item, item.updatedAt);
  });
}

export async function setChecklistChecked(id: string, checked: boolean, now: number): Promise<void> {
  const db = await initializeDatabase();
  await db.withExclusiveTransactionAsync(async (tx) => {
    const row = await tx.getFirstAsync<ChecklistRow>('SELECT * FROM checklist_item WHERE id = ? AND deletedAt IS NULL', [id]);
    if (!row) throw new Error('清单条目不存在或已删除');
    const item = ChecklistItemSchema.parse({ ...row, checked, updatedAt: now });
    await tx.runAsync('UPDATE checklist_item SET checked = ?, updatedAt = ? WHERE id = ?', [checked ? 1 : 0, now, id]);
    await enqueue(tx, 'checklist_item', id, 'update', item, now);
  });
}

export async function deleteChecklistItem(id: string, now: number): Promise<void> {
  const db = await initializeDatabase();
  await db.withExclusiveTransactionAsync(async (tx) => {
    const result = await tx.runAsync('UPDATE checklist_item SET deletedAt = ?, updatedAt = ? WHERE id = ? AND deletedAt IS NULL', [now, now, id]);
    if (result.changes !== 1) throw new Error('清单条目不存在或已删除');
    await enqueue(tx, 'checklist_item', id, 'delete', { id, deletedAt: now }, now);
  });
}

async function insertChecklistItem(tx: SQLite.SQLiteDatabase, item: ChecklistItem): Promise<void> {
  await tx.runAsync(
    `INSERT INTO checklist_item (id, journeyId, phase, category, title, checked, sortOrder, createdAt, updatedAt, deletedAt, schemaVersion)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [item.id, item.journeyId, item.phase, item.category, item.title, item.checked ? 1 : 0,
      item.sortOrder, item.createdAt, item.updatedAt, item.deletedAt, item.schemaVersion],
  );
}

async function enqueue(tx: SQLite.SQLiteDatabase, entityType: string, entityId: string, operation: string, payload: unknown, now: number): Promise<void> {
  await tx.runAsync(
    'INSERT INTO sync_queue (entityType, entityId, operation, payload, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)',
    [entityType, entityId, operation, JSON.stringify(payload), now, now],
  );
}
