import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema.js';

let _db: BetterSQLite3Database<typeof schema> | null = null;

export function setDb(instance: BetterSQLite3Database<typeof schema>): void {
  _db = instance;
}

export function getDb(): BetterSQLite3Database<typeof schema> {
  if (!_db) {
    throw new Error('Database not initialized');
  }
  return _db;
}
