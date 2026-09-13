import type { Journey } from '@tripline/shared';
import { JourneySchema } from '@tripline/shared';
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
  const db = await initializeDatabase();
  await db.withExclusiveTransactionAsync(async (tx) => {
    await tx.runAsync(
      `INSERT INTO journey (id, name, startDate, endDate, budget, companions, tags, createdAt, updatedAt, deletedAt, schemaVersion)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [journey.id, journey.name, journey.startDate, journey.endDate, journey.budget,
        JSON.stringify(journey.companions), JSON.stringify(journey.tags),
        journey.createdAt, journey.updatedAt, journey.deletedAt, journey.schemaVersion],
    );
    await tx.runAsync(
      `INSERT INTO sync_queue (entityType, entityId, operation, payload, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)`,
      ['journey', journey.id, 'create', JSON.stringify(journey), journey.createdAt, journey.updatedAt],
    );
  });
}

export async function listJourneys(): Promise<Journey[]> {
  const db = await initializeDatabase();
  const rows = await db.getAllAsync<{
    id: string; name: string; startDate: string; endDate: string; budget: number;
    companions: string; tags: string; createdAt: number; updatedAt: number;
    deletedAt: number | null; schemaVersion: number;
  }>('SELECT * FROM journey WHERE deletedAt IS NULL ORDER BY startDate DESC');
  return rows.map((row) => JourneySchema.parse({ ...row, companions: JSON.parse(row.companions), tags: JSON.parse(row.tags) }));
}
